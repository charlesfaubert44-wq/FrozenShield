const express = require('express');
const router = express.Router();
const Video = require('../../models/Video');
const { authenticate } = require('../../middleware/auth');

// All routes are protected - require authentication
router.use(authenticate);

/**
 * GET /api/admin/videos
 * List all videos with pagination, search, and filtering
 */
router.get('/', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Search by title or description
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filter by featured status
        if (req.query.featured !== undefined) {
            query.featured = req.query.featured === 'true';
        }

        // Filter by visibility
        if (req.query.visibility) {
            query.visibility = req.query.visibility;
        }

        // Filter by video type
        if (req.query.videoType) {
            query.videoType = req.query.videoType;
        }

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Get total count for pagination
        const total = await Video.countDocuments(query);

        // Fetch videos
        const videos = await Video.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Calculate total pages
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: videos,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });

    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching videos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/admin/videos
 * Create a new video
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            slug,
            videoType,
            videoUrl,
            embedCode,
            thumbnail,
            duration,
            tags,
            category,
            featured,
            visibility
        } = req.body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Video title is required'
            });
        }

        if (!videoType) {
            return res.status(400).json({
                success: false,
                message: 'Video type is required'
            });
        }

        // Validate videoUrl for youtube/vimeo types
        if ((videoType === 'youtube' || videoType === 'vimeo') && (!videoUrl || videoUrl.trim().length === 0)) {
            return res.status(400).json({
                success: false,
                message: `Video URL is required for ${videoType} type`
            });
        }

        // Check if slug already exists (if provided)
        if (slug) {
            const existingVideo = await Video.findOne({ slug });
            if (existingVideo) {
                return res.status(400).json({
                    success: false,
                    message: 'A video with this slug already exists'
                });
            }
        }

        // Create video
        const video = new Video({
            title: title.trim(),
            description: description?.trim(),
            slug: slug?.trim(),
            videoType,
            videoUrl: videoUrl?.trim(),
            embedCode: embedCode?.trim(),
            thumbnail: thumbnail?.trim(),
            duration,
            tags,
            category: category?.trim(),
            featured: featured || false,
            visibility: visibility || 'public'
        });

        await video.save();

        res.status(201).json({
            success: true,
            message: 'Video created successfully',
            data: video
        });

    } catch (error) {
        console.error('Error creating video:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A video with this slug already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating video',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/admin/videos/:id
 * Get a single video by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id).lean();

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        res.json({
            success: true,
            data: video
        });

    } catch (error) {
        console.error('Error fetching video:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching video',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/admin/videos/:id
 * Update a video
 */
router.put('/:id', async (req, res) => {
    try {
        const {
            title,
            description,
            slug,
            videoType,
            videoUrl,
            embedCode,
            thumbnail,
            duration,
            tags,
            category,
            featured,
            visibility
        } = req.body;

        // Find video
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Check if slug is being changed and if it conflicts
        if (slug && slug !== video.slug) {
            const existingVideo = await Video.findOne({ slug });
            if (existingVideo) {
                return res.status(400).json({
                    success: false,
                    message: 'A video with this slug already exists'
                });
            }
        }

        // Update fields
        if (title !== undefined) video.title = title.trim();
        if (description !== undefined) video.description = description?.trim();
        if (slug !== undefined) video.slug = slug?.trim();
        if (videoType !== undefined) video.videoType = videoType;
        if (videoUrl !== undefined) video.videoUrl = videoUrl?.trim();
        if (embedCode !== undefined) video.embedCode = embedCode?.trim();
        if (thumbnail !== undefined) video.thumbnail = thumbnail?.trim();
        if (duration !== undefined) video.duration = duration;
        if (tags !== undefined) video.tags = tags;
        if (category !== undefined) video.category = category?.trim();
        if (featured !== undefined) video.featured = featured;
        if (visibility !== undefined) video.visibility = visibility;

        await video.save();

        res.json({
            success: true,
            message: 'Video updated successfully',
            data: video
        });

    } catch (error) {
        console.error('Error updating video:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A video with this slug already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating video',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/admin/videos/:id
 * Delete a video
 */
router.delete('/:id', async (req, res) => {
    try {
        // Find video
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Delete the video
        await Video.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Video deleted successfully',
            data: {
                videoId: video._id,
                videoTitle: video.title
            }
        });

    } catch (error) {
        console.error('Error deleting video:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting video',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PATCH /api/admin/videos/:id/featured
 * Toggle featured status
 */
router.patch('/:id/featured', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Toggle featured status
        video.featured = !video.featured;
        await video.save();

        res.json({
            success: true,
            message: `Video ${video.featured ? 'featured' : 'unfeatured'} successfully`,
            data: video
        });

    } catch (error) {
        console.error('Error toggling featured status:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error toggling featured status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
