const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Image size configurations
 */
const IMAGE_SIZES = {
    thumbnail: { width: 300, height: 300, fit: 'cover' },
    medium: { width: 800, height: 600, fit: 'inside' },
    full: { width: 1920, height: 1080, fit: 'inside' }
};

/**
 * Compression quality settings
 */
const QUALITY = {
    jpg: 85,
    webp: 85,
    png: 90
};

/**
 * Generate a unique filename
 */
function generateUniqueFilename(originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Process single image and generate multiple sizes
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalFilename - Original filename
 * @param {string} albumId - Album ID for organizing files
 * @returns {Promise<Object>} - File paths and metadata for all sizes
 */
async function processImage(buffer, originalFilename, albumId) {
    const uniqueFilename = generateUniqueFilename(originalFilename);
    const baseFilename = path.parse(uniqueFilename).name;

    // Create album-specific directory
    const albumDir = path.join('public', 'uploads', 'albums', albumId);
    await ensureDir(albumDir);

    // Get original image metadata
    const metadata = await sharp(buffer).metadata();

    const results = {
        original: null,
        thumbnail: null,
        medium: null,
        full: null,
        metadata: {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            hasAlpha: metadata.hasAlpha,
            orientation: metadata.orientation,
            exif: metadata.exif
        }
    };

    // Save original (with EXIF stripped for privacy, but preserve orientation)
    const originalPath = path.join(albumDir, `original-${uniqueFilename}`);
    const originalBuffer = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .toBuffer();

    await fs.writeFile(originalPath, originalBuffer);
    const originalStats = await fs.stat(originalPath);

    results.original = {
        path: originalPath.replace(/\\/g, '/').replace('public/', '/'),
        width: metadata.width,
        height: metadata.height,
        size: originalStats.size
    };

    // Generate thumbnail, medium, and full sizes
    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
        const outputPath = path.join(albumDir, `${sizeName}-${baseFilename}.jpg`);
        const webpPath = path.join(albumDir, `${sizeName}-${baseFilename}.webp`);

        // Generate JPG version
        const jpgBuffer = await sharp(buffer)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(dimensions.width, dimensions.height, {
                fit: dimensions.fit,
                withoutEnlargement: true
            })
            .jpeg({
                quality: QUALITY.jpg,
                progressive: true,
                mozjpeg: true
            })
            .toBuffer();

        await fs.writeFile(outputPath, jpgBuffer);

        // Generate WebP version (more efficient)
        const webpBuffer = await sharp(buffer)
            .rotate()
            .resize(dimensions.width, dimensions.height, {
                fit: dimensions.fit,
                withoutEnlargement: true
            })
            .webp({ quality: QUALITY.webp })
            .toBuffer();

        await fs.writeFile(webpPath, webpBuffer);

        // Get dimensions of processed image
        const processedMetadata = await sharp(jpgBuffer).metadata();
        const stats = await fs.stat(outputPath);

        results[sizeName] = {
            path: outputPath.replace(/\\/g, '/').replace('public/', '/'),
            webpPath: webpPath.replace(/\\/g, '/').replace('public/', '/'),
            width: processedMetadata.width,
            height: processedMetadata.height,
            size: stats.size
        };
    }

    return results;
}

/**
 * Delete all image files for a media item
 * @param {Object} fileSizes - File sizes object from Media model
 */
async function deleteImageFiles(fileSizes) {
    if (!fileSizes) return;

    const pathsToDelete = [];

    for (const size of ['original', 'thumbnail', 'medium', 'full']) {
        if (fileSizes[size]?.path) {
            pathsToDelete.push(fileSizes[size].path);
        }
        if (fileSizes[size]?.webpPath) {
            pathsToDelete.push(fileSizes[size].webpPath);
        }
    }

    // Delete all files
    await Promise.allSettled(
        pathsToDelete.map(filePath => fs.unlink(filePath))
    );
}

/**
 * Get total storage size for an album
 * @param {string} albumId - Album ID
 * @returns {Promise<number>} - Total size in bytes
 */
async function getAlbumStorageSize(albumId) {
    const albumDir = path.join('public', 'uploads', 'albums', albumId);

    try {
        const files = await fs.readdir(albumDir);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(albumDir, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }

        return totalSize;
    } catch (error) {
        return 0;
    }
}

/**
 * Delete album directory after all files are removed
 * @param {string} albumId - Album ID
 */
async function deleteAlbumDirectory(albumId) {
    if (!albumId) return;

    const albumDir = path.join('public', 'uploads', 'albums', albumId);

    try {
        // Check if directory exists and is empty before deleting
        const files = await fs.readdir(albumDir);

        if (files.length === 0) {
            await fs.rmdir(albumDir);
            console.log(`Deleted empty album directory: ${albumDir}`);
        } else {
            console.log(`Album directory ${albumDir} not empty, skipping deletion. Files remaining: ${files.length}`);
        }
    } catch (error) {
        // Directory might not exist or already deleted, which is fine
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting album directory ${albumDir}:`, error);
        }
    }
}

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
    processImage,
    deleteImageFiles,
    deleteAlbumDirectory,
    getAlbumStorageSize,
    formatBytes,
    IMAGE_SIZES,
    QUALITY
};
