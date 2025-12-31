const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
const ensureDirectories = async () => {
    const dirs = [
        path.join(__dirname, '../../public/uploads/originals'),
        path.join(__dirname, '../../public/uploads/optimized'),
        path.join(__dirname, '../../public/uploads/thumbnails'),
        path.join(__dirname, '../../public/uploads/videos')
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
 * Process uploaded image - create optimized version and thumbnail
 */
const processImage = async (buffer, filename) => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const baseName = `${filename.split('.')[0]}-${timestamp}-${randomNum}`;

    const paths = {
        original: path.join(__dirname, '../../public/uploads/originals', `${baseName}.jpg`),
        optimized: path.join(__dirname, '../../public/uploads/optimized', `${baseName}.jpg`),
        thumbnail: path.join(__dirname, '../../public/uploads/thumbnails', `thumb-${baseName}.jpg`)
    };

    const urls = {
        original: `/uploads/originals/${baseName}.jpg`,
        optimized: `/uploads/optimized/${baseName}.jpg`,
        thumbnail: `/uploads/thumbnails/thumb-${baseName}.jpg`
    };

    try {
        // Get image metadata
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Save original
        await image
            .jpeg({ quality: 95 })
            .toFile(paths.original);

        // Create optimized version (max 2000px width, 85% quality)
        await sharp(buffer)
            .resize(2000, null, {
                width: 2000,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(paths.optimized);

        // Create thumbnail (300px width)
        await sharp(buffer)
            .resize(300, null, {
                width: 300,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(paths.thumbnail);

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
    processVideo,
    deleteMediaFiles
};
