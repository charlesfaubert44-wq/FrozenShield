const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

// Ensure upload directories exist
const uploadDirs = {
    images: path.join(__dirname, '../../public/uploads/images'),
    videos: path.join(__dirname, '../../public/uploads/videos'),
    thumbnails: path.join(__dirname, '../../public/uploads/thumbnails')
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
    fs.ensureDirSync(dir);
});

/**
 * Configure multer storage with custom filename generation
 * Saves files to appropriate subdirectories based on mimetype
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine destination based on file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, uploadDirs.images);
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, uploadDirs.videos);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'));
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars with hyphens
            .toLowerCase();
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

/**
 * File filter to validate file types
 * Accepts: jpg, jpeg, png, gif, webp, mp4, mov, avi
 */
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: jpg, png, gif, webp, mp4, mov, avi'));
    }
};

/**
 * Multer upload configuration
 * - Single file upload
 * - File size limits: 10MB for images, 100MB for videos
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max (will check specific limits in middleware)
    }
});

/**
 * Middleware to validate file size based on type
 * Images: 10MB max, Videos: 100MB max
 */
const validateFileSize = (req, res, next) => {
    if (!req.file && !req.files) {
        return next();
    }

    const files = req.files || [req.file];

    for (const file of files) {
        if (!file) continue;

        const maxSize = file.mimetype.startsWith('image/')
            ? 10 * 1024 * 1024  // 10MB for images
            : 100 * 1024 * 1024; // 100MB for videos

        if (file.size > maxSize) {
            // Delete uploaded file if it exceeds size limit
            fs.removeSync(file.path);
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size for ${file.mimetype.startsWith('image/') ? 'images' : 'videos'} is ${maxSize / (1024 * 1024)}MB`
            });
        }
    }

    next();
};

/**
 * Process and optimize uploaded images using sharp
 * - Resize large images to max 2000px width
 * - Compress to reduce file size
 * - Generate thumbnails
 *
 * @param {Object} file - Uploaded file object from multer
 * @returns {Promise<Object>} - Processed file info with thumbnail path
 */
const processImage = async (file) => {
    if (!file.mimetype.startsWith('image/')) {
        return { file, thumbnail: null };
    }

    try {
        const image = sharp(file.path);
        const metadata = await image.metadata();

        // Optimize main image if it's too large
        if (metadata.width > 2000) {
            await image
                .resize(2000, null, { // Resize to max 2000px width, maintain aspect ratio
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .jpeg({ quality: 85 }) // Compress
                .toFile(file.path + '.tmp');

            // Replace original with optimized version
            await fs.move(file.path + '.tmp', file.path, { overwrite: true });
        } else {
            // Just optimize without resizing
            await image
                .jpeg({ quality: 85 })
                .toFile(file.path + '.tmp');

            await fs.move(file.path + '.tmp', file.path, { overwrite: true });
        }

        // Generate thumbnail (300px width)
        const thumbnailFilename = 'thumb-' + file.filename;
        const thumbnailPath = path.join(uploadDirs.thumbnails, thumbnailFilename);

        await sharp(file.path)
            .resize(300, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        return {
            file,
            thumbnail: `/uploads/thumbnails/${thumbnailFilename}`
        };
    } catch (error) {
        console.error('Error processing image:', error);
        // Return original file if processing fails
        return { file, thumbnail: null };
    }
};

/**
 * Middleware to process uploaded images after multer
 * Attaches processed file info to req.processedFile or req.processedFiles
 */
const processUploadedImages = async (req, res, next) => {
    try {
        if (req.file) {
            // Single file upload
            const processed = await processImage(req.file);
            req.processedFile = processed;
        } else if (req.files && Array.isArray(req.files)) {
            // Multiple file upload
            const processed = await Promise.all(
                req.files.map(file => processImage(file))
            );
            req.processedFiles = processed;
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Delete file helper function
 * Removes file and its thumbnail if it exists
 *
 * @param {string} filename - Name of file to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (filename) => {
    try {
        // Determine file type and path
        const imagePath = path.join(uploadDirs.images, filename);
        const videoPath = path.join(uploadDirs.videos, filename);
        const thumbnailPath = path.join(uploadDirs.thumbnails, 'thumb-' + filename);

        // Check which path exists and delete
        if (await fs.pathExists(imagePath)) {
            await fs.remove(imagePath);
            // Also delete thumbnail if exists
            if (await fs.pathExists(thumbnailPath)) {
                await fs.remove(thumbnailPath);
            }
            return true;
        } else if (await fs.pathExists(videoPath)) {
            await fs.remove(videoPath);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

/**
 * List all uploaded files
 *
 * @returns {Promise<Array>} - Array of file objects with metadata
 */
const listFiles = async () => {
    try {
        const files = [];

        // List images
        const imageFiles = await fs.readdir(uploadDirs.images);
        for (const filename of imageFiles) {
            const filePath = path.join(uploadDirs.images, filename);
            const stats = await fs.stat(filePath);
            const thumbnailPath = path.join(uploadDirs.thumbnails, 'thumb-' + filename);
            const hasThumbnail = await fs.pathExists(thumbnailPath);

            files.push({
                filename,
                path: `/uploads/images/${filename}`,
                thumbnail: hasThumbnail ? `/uploads/thumbnails/thumb-${filename}` : null,
                type: 'image',
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            });
        }

        // List videos
        const videoFiles = await fs.readdir(uploadDirs.videos);
        for (const filename of videoFiles) {
            const filePath = path.join(uploadDirs.videos, filename);
            const stats = await fs.stat(filePath);

            files.push({
                filename,
                path: `/uploads/videos/${filename}`,
                thumbnail: null,
                type: 'video',
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            });
        }

        // Sort by created date, newest first
        return files.sort((a, b) => b.created - a.created);
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
};

module.exports = {
    upload,
    validateFileSize,
    processUploadedImages,
    deleteFile,
    listFiles
};
