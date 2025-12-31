const express = require('express');
const router = express.Router();
const Media = require('../../models/Media');
const Album = require('../../models/Album');
const { upload, processImage, processVideo, deleteMediaFiles } = require('../../middleware/mediaUpload');
const { authenticate } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// @route   GET /api/admin/media
// @desc    Get all media with filters, search, and pagination
// @access  Private (Admin)
router.get('/', async (req, res) => {
    try {
        const {
            search,
            type,
            albumId,
            sort = 'newest',
            page = 1,
            limit = 24
        } = req.query;

        // Build query
        const query = {};

        // Search filter (search in filename, caption, alt, tags)
        if (search) {
            query.$or = [
                { 'metadata.filename': { $regex: search, $options: 'i' } },
                { caption: { $regex: search, $options: 'i' } },
                { alt: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Type filter
        if (type) {
            query.type = type;
        }

        // Album filter
        if (albumId) {
            query.albumId = albumId;
        }

        // Sort options
        let sortOption = {};
        switch (sort) {
            case 'oldest':
                sortOption = { uploadedAt: 1 };
                break;
            case 'name':
                sortOption = { 'metadata.filename': 1 };
                break;
            case 'size':
                sortOption = { 'metadata.size': -1 };
                break;
            case 'newest':
            default:
                sortOption = { uploadedAt: -1 };
                break;
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query
        const media = await Media.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .populate('albumId', 'title');

        // Get total count for pagination
        const total = await Media.countDocuments(query);

        res.json({
            success: true,
            data: {
                media,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve media',
            error: error.message
        });
    }
});

// @route   GET /api/admin/media/:id
// @desc    Get single media by ID
// @access  Private (Admin)
router.get('/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id).populate('albumId', 'title');

        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        res.json({
            success: true,
            data: media
        });
    } catch (error) {
        console.error('Get media by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve media',
            error: error.message
        });
    }
});

// @route   POST /api/admin/media/upload
// @desc    Upload single media file
// @access  Private (Admin)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { albumId, caption, alt, tags } = req.body;

        if (!albumId) {
            return res.status(400).json({
                success: false,
                message: 'Album ID is required'
            });
        }

        // Verify album exists
        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Determine file type
        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');

        let processedMedia;

        if (isImage) {
            // Process image
            processedMedia = await processImage(req.file.buffer, req.file.originalname);
        } else if (isVideo) {
            // Process video
            processedMedia = await processVideo(req.file.buffer, req.file.originalname);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Unsupported file type'
            });
        }

        // Create media record
        const media = new Media({
            albumId,
            type: isImage ? 'image' : 'video',
            url: processedMedia.urls.original,
            optimized: processedMedia.urls.optimized,
            thumbnail: processedMedia.urls.thumbnail,
            caption: caption || '',
            alt: alt || '',
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            metadata: {
                filename: req.file.originalname,
                size: processedMedia.metadata.size,
                width: processedMedia.metadata.width,
                height: processedMedia.metadata.height,
                format: processedMedia.metadata.format
            }
        });

        await media.save();

        // Update album cover image if it's the first media
        if (!album.coverImage && isImage) {
            album.coverImage = processedMedia.urls.optimized;
            await album.save();
        }

        res.status(201).json({
            success: true,
            message: 'Media uploaded successfully',
            data: media
        });
    } catch (error) {
        console.error('Upload media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload media',
            error: error.message
        });
    }
});

// @route   POST /api/admin/media/upload-multiple
// @desc    Upload multiple media files at once
// @access  Private (Admin)
router.post('/upload-multiple', upload.array('files', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const { albumId, tags } = req.body;

        if (!albumId) {
            return res.status(400).json({
                success: false,
                message: 'Album ID is required'
            });
        }

        // Verify album exists
        const album = await Album.findById(albumId);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        const uploadedMedia = [];
        const errors = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

            try {
                const isImage = file.mimetype.startsWith('image/');
                const isVideo = file.mimetype.startsWith('video/');

                let processedMedia;

                if (isImage) {
                    processedMedia = await processImage(file.buffer, file.originalname);
                } else if (isVideo) {
                    processedMedia = await processVideo(file.buffer, file.originalname);
                } else {
                    errors.push({ filename: file.originalname, error: 'Unsupported file type' });
                    continue;
                }

                const media = new Media({
                    albumId,
                    type: isImage ? 'image' : 'video',
                    url: processedMedia.urls.original,
                    optimized: processedMedia.urls.optimized,
                    thumbnail: processedMedia.urls.thumbnail,
                    alt: file.originalname.split('.')[0],
                    tags: tags ? tags.split(',').map(t => t.trim()) : [],
                    order: i,
                    metadata: {
                        filename: file.originalname,
                        size: processedMedia.metadata.size,
                        width: processedMedia.metadata.width,
                        height: processedMedia.metadata.height,
                        format: processedMedia.metadata.format
                    }
                });

                await media.save();
                uploadedMedia.push(media);

                // Set first image as cover if album doesn't have one
                if (!album.coverImage && isImage && uploadedMedia.length === 1) {
                    album.coverImage = processedMedia.urls.optimized;
                    await album.save();
                }
            } catch (error) {
                errors.push({ filename: file.originalname, error: error.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Uploaded ${uploadedMedia.length} of ${req.files.length} files`,
            data: uploadedMedia,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Upload multiple media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload media',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/media/:id
// @desc    Update media metadata
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { caption, alt, tags, order, featured } = req.body;

        const updateData = {};
        if (caption !== undefined) updateData.caption = caption;
        if (alt !== undefined) updateData.alt = alt;
        if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        if (order !== undefined) updateData.order = order;
        if (featured !== undefined) updateData.featured = featured;

        const media = await Media.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        res.json({
            success: true,
            message: 'Media updated successfully',
            data: media
        });
    } catch (error) {
        console.error('Update media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update media',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/media/:id
// @desc    Delete single media file
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        // Delete files from filesystem
        await deleteMediaFiles({
            original: media.url,
            optimized: media.optimized,
            thumbnail: media.thumbnail
        });

        // Delete from database
        await Media.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete media',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/media/bulk-delete
// @desc    Delete multiple media files
// @access  Private (Admin)
router.delete('/bulk-delete', async (req, res) => {
    try {
        const { mediaIds } = req.body;

        if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Media IDs array is required'
            });
        }

        // Get all media to delete
        const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

        if (mediaToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No media found with provided IDs'
            });
        }

        // Delete files from filesystem
        for (const media of mediaToDelete) {
            await deleteMediaFiles({
                original: media.url,
                optimized: media.optimized,
                thumbnail: media.thumbnail
            });
        }

        // Delete from database
        await Media.deleteMany({ _id: { $in: mediaIds } });

        res.json({
            success: true,
            message: `Successfully deleted ${mediaToDelete.length} media file(s)`
        });
    } catch (error) {
        console.error('Bulk delete media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete media files',
            error: error.message
        });
    }
});

module.exports = router;
