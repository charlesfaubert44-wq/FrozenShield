const express = require('express');
const router = express.Router();
const Album = require('../../models/Album');
const Media = require('../../models/Media');
const { authenticate } = require('../../middleware/auth');

// All routes are protected - require authentication
router.use(authenticate);

/**
 * GET /api/admin/albums
 * List all albums with pagination, search, and filtering
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

        // Get total count for pagination
        const total = await Album.countDocuments(query);

        // Fetch albums
        const albums = await Album.find(query)
            .populate('projectId', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Calculate total pages
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: albums,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });

    } catch (error) {
        console.error('Error fetching albums:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching albums',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/admin/albums
 * Create a new album
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            slug,
            coverImage,
            tags,
            projectId,
            visibility,
            order,
            featured,
            metadata
        } = req.body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Album title is required'
            });
        }

        // Check if slug already exists (if provided)
        if (slug) {
            const existingAlbum = await Album.findOne({ slug });
            if (existingAlbum) {
                return res.status(400).json({
                    success: false,
                    message: 'An album with this slug already exists'
                });
            }
        }

        // Create album
        const album = new Album({
            title: title.trim(),
            description: description?.trim(),
            slug: slug?.trim(),
            coverImage,
            tags,
            projectId,
            visibility: visibility || 'public',
            order: order || 0,
            featured: featured || false,
            metadata
        });

        await album.save();

        res.status(201).json({
            success: true,
            data: album
        });

    } catch (error) {
        console.error('Error creating album:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An album with this slug already exists'
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
            message: 'Error creating album',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/admin/albums/:id
 * Get a single album by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const album = await Album.findById(req.params.id)
            .populate('projectId', 'title description imageUrl')
            .lean();

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Get media count
        const mediaCount = await Media.countDocuments({ albumId: album._id });
        album.mediaCount = mediaCount;

        res.json({
            success: true,
            data: album
        });

    } catch (error) {
        console.error('Error fetching album:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid album ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching album',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/admin/albums/:id
 * Update an album
 */
router.put('/:id', async (req, res) => {
    try {
        const {
            title,
            description,
            slug,
            coverImage,
            tags,
            projectId,
            visibility,
            order,
            featured,
            metadata
        } = req.body;

        // Find album
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Check if slug is being changed and if it conflicts
        if (slug && slug !== album.slug) {
            const existingAlbum = await Album.findOne({ slug });
            if (existingAlbum) {
                return res.status(400).json({
                    success: false,
                    message: 'An album with this slug already exists'
                });
            }
        }

        // Update fields
        if (title !== undefined) album.title = title.trim();
        if (description !== undefined) album.description = description?.trim();
        if (slug !== undefined) album.slug = slug?.trim();
        if (coverImage !== undefined) album.coverImage = coverImage;
        if (tags !== undefined) album.tags = tags;
        if (projectId !== undefined) album.projectId = projectId;
        if (visibility !== undefined) album.visibility = visibility;
        if (order !== undefined) album.order = order;
        if (featured !== undefined) album.featured = featured;
        if (metadata !== undefined) album.metadata = metadata;

        await album.save();

        res.json({
            success: true,
            data: album
        });

    } catch (error) {
        console.error('Error updating album:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An album with this slug already exists'
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
                message: 'Invalid album ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating album',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/admin/albums/:id
 * Delete an album and all its media
 */
router.delete('/:id', async (req, res) => {
    try {
        // Find album
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Delete all media in this album
        const mediaDeleteResult = await Media.deleteMany({ albumId: album._id });

        // Delete the album
        await Album.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Album deleted successfully',
            data: {
                albumId: album._id,
                albumTitle: album.title,
                mediaDeleted: mediaDeleteResult.deletedCount
            }
        });

    } catch (error) {
        console.error('Error deleting album:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid album ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting album',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
