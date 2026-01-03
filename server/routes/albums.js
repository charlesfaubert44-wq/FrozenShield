const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Media = require('../models/Media');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/albums
// @desc    Get all public albums
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { featured, tag, project } = req.query;
        const filter = { visibility: 'public' };

        if (featured === 'true') {
            filter.featured = true;
        }

        if (tag) {
            filter.tags = tag;
        }

        if (project) {
            filter.projectId = project;
        }

        const albums = await Album.find(filter)
            .sort({ featured: -1, order: 1, createdAt: -1 })
            .select('-__v')
            .lean();

        // Populate cover images from first photo if not set and add media count
        for (const album of albums) {
            // Get first media for cover if not set or empty string
            if (!album.coverImage || album.coverImage === '') {
                const firstMedia = await Media.findOne({ albumId: album._id })
                    .sort({ order: 1, uploadedAt: 1 })
                    .select('fileSizes thumbnail optimized url')
                    .lean();

                if (firstMedia) {
                    // Priority: medium size > thumbnail > optimized > url
                    album.coverImage = (firstMedia.fileSizes?.medium?.path) ||
                                      (firstMedia.fileSizes?.thumbnail?.path) ||
                                      firstMedia.thumbnail ||
                                      firstMedia.optimized ||
                                      firstMedia.url;

                    console.log(`Auto-populated cover for album "${album.title}":`, album.coverImage);
                }
            }

            // Add media count for frontend
            album.stats = album.stats || {};
            album.stats.totalMedia = await Media.countDocuments({ albumId: album._id });
        }

        res.json({
            success: true,
            count: albums.length,
            data: albums
        });
    } catch (error) {
        console.error('Get albums error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch albums',
            error: error.message
        });
    }
});

// @route   GET /api/albums/:identifier
// @desc    Get single album by ID or slug (with media)
// @access  Public
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        // Try to find by ID first, then by slug
        let album;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            // Valid MongoDB ObjectId
            album = await Album.findById(identifier);
        } else {
            // Assume it's a slug
            album = await Album.findOne({ slug: identifier });
        }

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Only show public albums to non-authenticated users
        if (album.visibility !== 'public') {
            return res.status(403).json({
                success: false,
                message: 'This album is not publicly accessible'
            });
        }

        // Get all media for this album
        const media = await Media.find({
            albumId: album._id,
            visibility: 'public'
        }).sort({ order: 1, uploadedAt: -1 });

        // Increment view count
        album.stats.views += 1;
        await album.save();

        res.json({
            success: true,
            data: {
                ...album.toObject(),
                media
            }
        });
    } catch (error) {
        console.error('Get album error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch album',
            error: error.message
        });
    }
});

// @route   GET /api/albums/:id/media
// @desc    Get all media for an album
// @access  Public
router.get('/:id/media', async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        if (album.visibility !== 'public') {
            return res.status(403).json({
                success: false,
                message: 'This album is not publicly accessible'
            });
        }

        const media = await Media.find({
            albumId: album._id,
            visibility: 'public'
        }).sort({ order: 1, uploadedAt: -1 });

        res.json({
            success: true,
            count: media.length,
            data: media
        });
    } catch (error) {
        console.error('Get album media error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch album media',
            error: error.message
        });
    }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// @route   GET /api/admin/albums
// @desc    Get all albums (admin - includes private)
// @access  Private
router.get('/admin/albums', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 12, search, visibility, featured, sort = '-createdAt' } = req.query;

        const filter = {};

        // Search by title or description
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by visibility
        if (visibility) {
            filter.visibility = visibility;
        }

        // Filter by featured
        if (featured === 'true') {
            filter.featured = true;
        } else if (featured === 'false') {
            filter.featured = false;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [albums, total] = await Promise.all([
            Album.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            Album.countDocuments(filter)
        ]);

        res.json({
            success: true,
            count: albums.length,
            pagination: {
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            },
            data: albums
        });
    } catch (error) {
        console.error('Get admin albums error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch albums',
            error: error.message
        });
    }
});

// @route   GET /api/admin/albums/:id
// @desc    Get single album (admin)
// @access  Private
router.get('/admin/albums/:id', authenticate, async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        res.json({
            success: true,
            data: album
        });
    } catch (error) {
        console.error('Get admin album error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch album',
            error: error.message
        });
    }
});

// @route   POST /api/admin/albums
// @desc    Create new album
// @access  Private
router.post('/admin/albums', authenticate, async (req, res) => {
    try {
        const { title, description, tags, visibility, featured, order, metadata, projectId } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Album title is required'
            });
        }

        // Create album
        const album = new Album({
            title,
            description,
            tags,
            visibility: visibility || 'public',
            featured: featured || false,
            order: order || 0,
            metadata,
            projectId
        });

        await album.save();

        res.status(201).json({
            success: true,
            message: 'Album created successfully',
            data: album
        });
    } catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create album',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/albums/:id
// @desc    Update album
// @access  Private
router.put('/admin/albums/:id', authenticate, async (req, res) => {
    try {
        const { title, description, tags, visibility, featured, order, metadata, projectId, coverImage } = req.body;

        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Update fields
        if (title !== undefined) album.title = title;
        if (description !== undefined) album.description = description;
        if (tags !== undefined) album.tags = tags;
        if (visibility !== undefined) album.visibility = visibility;
        if (featured !== undefined) album.featured = featured;
        if (order !== undefined) album.order = order;
        if (metadata !== undefined) album.metadata = metadata;
        if (projectId !== undefined) album.projectId = projectId;
        if (coverImage !== undefined) album.coverImage = coverImage;

        // Update slug if title changed
        if (title) {
            album.slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        await album.save();

        res.json({
            success: true,
            message: 'Album updated successfully',
            data: album
        });
    } catch (error) {
        console.error('Update album error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update album',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/albums/:id
// @desc    Delete album
// @access  Private
router.delete('/admin/albums/:id', authenticate, async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Optional: Delete all media in this album
        await Media.deleteMany({ albumId: album._id });

        await album.deleteOne();

        res.json({
            success: true,
            message: 'Album and associated media deleted successfully'
        });
    } catch (error) {
        console.error('Delete album error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete album',
            error: error.message
        });
    }
});

// @route   PATCH /api/admin/albums/:id/cover
// @desc    Update album cover image
// @access  Private
router.patch('/admin/albums/:id/cover', authenticate, async (req, res) => {
    try {
        const { coverImage } = req.body;

        if (!coverImage) {
            return res.status(400).json({
                success: false,
                message: 'Cover image URL is required'
            });
        }

        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        album.coverImage = coverImage;
        await album.save();

        res.json({
            success: true,
            message: 'Album cover updated successfully',
            data: album
        });
    } catch (error) {
        console.error('Update album cover error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update album cover',
            error: error.message
        });
    }
});

module.exports = router;
