const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Media = require('../models/Media');

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
            .select('-__v');

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

module.exports = router;
