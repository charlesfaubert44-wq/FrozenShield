const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { processImage: processImageUtil, deleteImageFiles } = require('../utils/imageProcessor');

// Ensure upload directories exist
const ensureDirectories = async () => {
    const dirs = [
        path.join(__dirname, '../../public/uploads/originals'),
        path.join(__dirname, '../../public/uploads/optimized'),
        path.join(__dirname, '../../public/uploads/thumbnails'),
        path.join(__dirname, '../../public/uploads/videos'),
        path.join(__dirname, '../../public/uploads/albums')
    ];

    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Error creating directory ${dir}:`, error);
        }
    }
};

// Initialize directories
ensureDirectories();

// Configure multer for memory storage (we'll process before saving)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Allowed image types
    const imageTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
    // Allowed video types
    const videoTypes = /mp4|mov|avi|webm|mkv/;

    const extname = path.extname(file.originalname).toLowerCase().substring(1);
    const mimetype = file.mimetype;

    const isImage = imageTypes.test(extname) && mimetype.startsWith('image/');
    const isVideo = videoTypes.test(extname) && mimetype.startsWith('video/');

    if (isImage || isVideo) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG, GIF, WEBP, HEIC) and videos (MP4, MOV, AVI, WEBM) are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: fileFilter
});

/**
 * Process uploaded image - create multiple optimized versions including WebP
 * Creates: original, optimized (JPEG & WebP), thumbnail, and responsive sizes
 */
const processImage = async (buffer, filename) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const baseName = `${filename.split('.')[0]}-${timestamp}-${randomNum}`;

    // Define multiple sizes for responsive images
    const sizes = {
        thumbnail: 300,
        small: 640,
        medium: 1024,
        large: 1920,
        xlarge: 2560
    };

    const paths = {
        original: path.join(__dirname, '../../public/uploads/originals', `${baseName}.jpg`),
        optimized: path.join(__dirname, '../../public/uploads/optimized', `${baseName}.jpg`),
        optimizedWebP: path.join(__dirname, '../../public/uploads/optimized', `${baseName}.webp`),
        thumbnail: path.join(__dirname, '../../public/uploads/thumbnails', `thumb-${baseName}.jpg`),
        thumbnailWebP: path.join(__dirname, '../../public/uploads/thumbnails', `thumb-${baseName}.webp`),
        small: path.join(__dirname, '../../public/uploads/optimized', `${baseName}-small.jpg`),
        smallWebP: path.join(__dirname, '../../public/uploads/optimized', `${baseName}-small.webp`),
        medium: path.join(__dirname, '../../public/uploads/optimized', `${baseName}-medium.jpg`),
        mediumWebP: path.join(__dirname, '../../public/uploads/optimized', `${baseName}-medium.webp`)
    };

    const urls = {
        original: `/uploads/originals/${baseName}.jpg`,
        optimized: `/uploads/optimized/${baseName}.jpg`,
        optimizedWebP: `/uploads/optimized/${baseName}.webp`,
        thumbnail: `/uploads/thumbnails/thumb-${baseName}.jpg`,
        thumbnailWebP: `/uploads/thumbnails/thumb-${baseName}.webp`,
        small: `/uploads/optimized/${baseName}-small.jpg`,
        smallWebP: `/uploads/optimized/${baseName}-small.webp`,
        medium: `/uploads/optimized/${baseName}-medium.jpg`,
        mediumWebP: `/uploads/optimized/${baseName}-medium.webp`,
        responsive: {
            srcset: '',
            srcsetWebP: '',
            sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
        }
    };

    try {
        // Get image metadata
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Save original (JPEG format)
        await sharp(buffer)
            .jpeg({ quality: 95, progressive: true })
            .toFile(paths.original);

        // Create optimized version - Large (JPEG)
        await sharp(buffer)
            .resize(sizes.large, null, {
                width: sizes.large,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(paths.optimized);

        // Create optimized version - Large (WebP)
        await sharp(buffer)
            .resize(sizes.large, null, {
                width: sizes.large,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(paths.optimizedWebP);

        // Create medium size (JPEG)
        await sharp(buffer)
            .resize(sizes.medium, null, {
                width: sizes.medium,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(paths.medium);

        // Create medium size (WebP)
        await sharp(buffer)
            .resize(sizes.medium, null, {
                width: sizes.medium,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(paths.mediumWebP);

        // Create small size (JPEG)
        await sharp(buffer)
            .resize(sizes.small, null, {
                width: sizes.small,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(paths.small);

        // Create small size (WebP)
        await sharp(buffer)
            .resize(sizes.small, null, {
                width: sizes.small,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(paths.smallWebP);

        // Create thumbnail (JPEG)
        await sharp(buffer)
            .resize(sizes.thumbnail, null, {
                width: sizes.thumbnail,
                fit: 'cover',
                position: 'attention'
            })
            .jpeg({ quality: 80 })
            .toFile(paths.thumbnail);

        // Create thumbnail (WebP)
        await sharp(buffer)
            .resize(sizes.thumbnail, null, {
                width: sizes.thumbnail,
                fit: 'cover',
                position: 'attention'
            })
            .webp({ quality: 75 })
            .toFile(paths.thumbnailWebP);

        // Build responsive srcset strings
        urls.responsive.srcset = `${urls.small} 640w, ${urls.medium} 1024w, ${urls.optimized} 1920w`;
        urls.responsive.srcsetWebP = `${urls.smallWebP} 640w, ${urls.mediumWebP} 1024w, ${urls.optimizedWebP} 1920w`;

        return {
            urls,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: buffer.length
            }
        };
    } catch (error) {
        // Clean up any created files on error
        for (const filePath of Object.values(paths)) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                // Ignore errors during cleanup
            }
        }
        throw error;
    }
};

/**
 * Process image for album with enhanced multi-size generation
 * Uses the new fileSizes structure for better organization
 */
const processImageForAlbum = async (buffer, filename, albumId) => {
    try {
        // Use the new imageProcessor utility
        const results = await processImageUtil(buffer, filename, albumId);

        // Convert to format compatible with Media model
        return {
            fileSizes: {
                thumbnail: results.thumbnail,
                medium: results.medium,
                full: results.full,
                original: results.original
            },
            metadata: results.metadata,
            // Also provide backward-compatible URLs
            urls: {
                original: results.original.path,
                optimized: results.full.path,
                thumbnail: results.thumbnail.path,
                medium: results.medium.path,
                webp: {
                    thumbnail: results.thumbnail.webpPath,
                    medium: results.medium.webpPath,
                    full: results.full.webpPath
                }
            }
        };
    } catch (error) {
        console.error('Error processing image for album:', error);
        throw error;
    }
};

/**
 * Process uploaded video - just save to videos directory
 */
const processVideo = async (buffer, filename) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const ext = path.extname(filename).toLowerCase();
    const baseName = `${filename.split('.')[0]}-${timestamp}-${randomNum}${ext}`;

    const videoPath = path.join(__dirname, '../../public/uploads/videos', baseName);
    const videoUrl = `/uploads/videos/${baseName}`;

    try {
        await fs.writeFile(videoPath, buffer);

        return {
            urls: {
                original: videoUrl,
                optimized: videoUrl,
                thumbnail: '' // TODO: Add video thumbnail generation
            },
            metadata: {
                size: buffer.length,
                format: ext.substring(1)
            }
        };
    } catch (error) {
        // Clean up on error
        try {
            await fs.unlink(videoPath);
        } catch (unlinkError) {
            // Ignore errors during cleanup
        }
        throw error;
    }
};

/**
 * Delete media files from filesystem
 */
const deleteMediaFiles = async (urls) => {
    const filePaths = [
        path.join(__dirname, '../../public', urls.original),
        path.join(__dirname, '../../public', urls.optimized),
        path.join(__dirname, '../../public', urls.thumbnail)
    ].filter(p => p); // Remove empty paths

    for (const filePath of filePaths) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error.message);
        }
    }
};

module.exports = {
    upload,
    processImage,
    processImageForAlbum,
    processVideo,
    deleteMediaFiles,
    deleteImageFiles
};
