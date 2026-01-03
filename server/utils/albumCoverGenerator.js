const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate a thumbnail cover image for an album from its first photo
 * @param {string} albumId - Album ID
 * @param {Object} Media - Media model
 * @returns {Promise<string|null>} - Path to generated cover image or null
 */
async function generateAlbumCover(albumId, Media) {
    try {
        console.log(`\n=== Generating cover for album ${albumId} ===`);

        // Find first media photo in the album
        const firstMedia = await Media.findOne({ albumId })
            .sort({ order: 1, uploadedAt: 1 })
            .lean();

        if (!firstMedia) {
            console.log('❌ No media found for album');
            return null;
        }

        console.log(`Found media: ${firstMedia._id}`);

        // Get the source image path
        let sourcePath = null;

        // Try to get the best quality source image
        if (firstMedia.fileSizes?.full?.path) {
            sourcePath = firstMedia.fileSizes.full.path;
        } else if (firstMedia.fileSizes?.medium?.path) {
            sourcePath = firstMedia.fileSizes.medium.path;
        } else if (firstMedia.fileSizes?.original?.path) {
            sourcePath = firstMedia.fileSizes.original.path;
        } else if (firstMedia.url) {
            sourcePath = firstMedia.url;
        } else if (firstMedia.optimized) {
            sourcePath = firstMedia.optimized;
        }

        if (!sourcePath) {
            console.log('❌ No valid source path found in media');
            return null;
        }

        console.log(`Source path: ${sourcePath}`);

        // Convert path to filesystem path
        let fsPath = sourcePath;
        if (fsPath.startsWith('/')) {
            fsPath = 'public' + fsPath;
        } else if (fsPath.startsWith('public/')) {
            // Already has public prefix
        } else {
            fsPath = 'public/' + fsPath;
        }

        // Normalize path for Windows
        fsPath = path.normalize(fsPath);

        console.log(`Filesystem path: ${fsPath}`);

        // Check if source file exists
        try {
            await fs.access(fsPath);
        } catch (err) {
            console.log(`❌ Source file not found: ${fsPath}`);
            return null;
        }

        // Create album-covers directory if it doesn't exist
        const coversDir = path.join('public', 'uploads', 'album-covers');
        try {
            await fs.mkdir(coversDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        // Output path for the cover thumbnail
        const coverFilename = `${albumId}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);
        const webPath = `/uploads/album-covers/${coverFilename}`;

        console.log(`Generating cover at: ${coverPath}`);

        // Generate 800x800 thumbnail using Sharp
        await sharp(fsPath)
            .resize(800, 800, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({
                quality: 85,
                progressive: true
            })
            .toFile(coverPath);

        console.log(`✅ Cover generated: ${webPath}`);

        return webPath;

    } catch (error) {
        console.error(`Error generating album cover for ${albumId}:`, error);
        return null;
    }
}

/**
 * Delete album cover image
 * @param {string} albumId - Album ID
 */
async function deleteAlbumCover(albumId) {
    try {
        const coverPath = path.join('public', 'uploads', 'album-covers', `${albumId}.jpg`);
        await fs.unlink(coverPath);
        console.log(`Deleted album cover: ${coverPath}`);
    } catch (error) {
        // File might not exist, which is fine
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting album cover:`, error);
        }
    }
}

module.exports = {
    generateAlbumCover,
    deleteAlbumCover
};
