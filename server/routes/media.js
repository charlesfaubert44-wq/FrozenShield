const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    upload,
    validateFileSize,
    processUploadedImages,
    deleteFile,
    listFiles
} = require('../middleware/upload');

/**
 * @route   POST /api/media/upload
 * @desc    Upload a single file (image or video)
 * @access  Private (Admin only)
 * @returns {Object} - Success status and file information
 *
 * @example
 * // Request: multipart/form-data with 'file' field
 * // Response:
 * {
 *   success: true,
 *   message: 'File uploaded successfully',
 *   file: {
 *     filename: 'project-image-1234567890-123456789.jpg',
 *     path: '/uploads/images/project-image-1234567890-123456789.jpg',
 *     thumbnail: '/uploads/thumbnails/thumb-project-image-1234567890-123456789.jpg',
 *     type: 'image',
 *     size: 1024000,
 *     originalName: 'project-image.jpg'
 *   }
 * }
 */
router.post('/upload',
    auth,
    upload.single('file'),
    validateFileSize,
    processUploadedImages,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            const { file, thumbnail } = req.processedFile;
            const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
            const filePath = fileType === 'image'
                ? `/uploads/images/${file.filename}`
                : `/uploads/videos/${file.filename}`;

            res.json({
                success: true,
                message: 'File uploaded successfully',
                file: {
                    filename: file.filename,
                    path: filePath,
                    thumbnail: thumbnail,
                    type: fileType,
                    size: file.size,
                    originalName: file.originalname
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading file',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   POST /api/media/upload-multiple
 * @desc    Upload multiple files (images or videos)
 * @access  Private (Admin only)
 * @returns {Object} - Success status and array of file information
 *
 * @example
 * // Request: multipart/form-data with 'files' field (multiple files)
 * // Response:
 * {
 *   success: true,
 *   message: '3 files uploaded successfully',
 *   files: [
 *     {
 *       filename: 'image1-1234567890-123456789.jpg',
 *       path: '/uploads/images/image1-1234567890-123456789.jpg',
 *       thumbnail: '/uploads/thumbnails/thumb-image1-1234567890-123456789.jpg',
 *       type: 'image',
 *       size: 1024000,
 *       originalName: 'image1.jpg'
 *     },
 *     // ... more files
 *   ]
 * }
 */
router.post('/upload-multiple',
    auth,
    upload.array('files', 10), // Max 10 files at once
    validateFileSize,
    processUploadedImages,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files provided'
                });
            }

            const uploadedFiles = req.processedFiles.map(({ file, thumbnail }) => {
                const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                const filePath = fileType === 'image'
                    ? `/uploads/images/${file.filename}`
                    : `/uploads/videos/${file.filename}`;

                return {
                    filename: file.filename,
                    path: filePath,
                    thumbnail: thumbnail,
                    type: fileType,
                    size: file.size,
                    originalName: file.originalname
                };
            });

            res.json({
                success: true,
                message: `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded successfully`,
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading files',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

/**
 * @route   DELETE /api/media/:filename
 * @desc    Delete a file by filename
 * @access  Private (Admin only)
 * @returns {Object} - Success status and deletion message
 *
 * @example
 * // Request: DELETE /api/media/project-image-1234567890-123456789.jpg
 * // Response:
 * {
 *   success: true,
 *   message: 'File deleted successfully',
 *   filename: 'project-image-1234567890-123456789.jpg'
 * }
 */
router.delete('/:filename', auth, async (req, res) => {
    try {
        const { filename } = req.params;

        // Validate filename (prevent path traversal attacks)
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename'
            });
        }

        const deleted = await deleteFile(filename);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.json({
            success: true,
            message: 'File deleted successfully',
            filename
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/media
 * @desc    List all uploaded files with metadata
 * @access  Private (Admin only)
 * @returns {Object} - Success status and array of files
 *
 * @example
 * // Response:
 * {
 *   success: true,
 *   count: 15,
 *   files: [
 *     {
 *       filename: 'project-image-1234567890-123456789.jpg',
 *       path: '/uploads/images/project-image-1234567890-123456789.jpg',
 *       thumbnail: '/uploads/thumbnails/thumb-project-image-1234567890-123456789.jpg',
 *       type: 'image',
 *       size: 1024000,
 *       created: '2025-12-29T10:30:00.000Z',
 *       modified: '2025-12-29T10:30:00.000Z'
 *     },
 *     // ... more files
 *   ]
 * }
 */
router.get('/', auth, async (req, res) => {
    try {
        const files = await listFiles();

        res.json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({
            success: false,
            message: 'Error listing files',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
