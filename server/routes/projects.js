const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

/**
 * GET /api/projects
 * Get all public projects with optional filtering
 */
router.get('/', async (req, res) => {
    try {
        // Build query - only show public projects
        const query = { visibility: 'public' };

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by technology
        if (req.query.technology) {
            query.technologies = req.query.technology;
        }

        // Filter by featured
        if (req.query.featured !== undefined) {
            query.featured = req.query.featured === 'true';
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get total count
        const total = await Project.countDocuments(query);

        // Fetch projects
        const projects = await Project.find(query)
            .populate('albumId', 'title slug coverImage')
            .sort({ featured: -1, order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.json({
            success: true,
            data: projects,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch projects',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/projects/featured
 * Get featured public projects
 */
router.get('/featured', async (req, res) => {
    try {
        const projects = await Project.find({
            featured: true,
            visibility: 'public'
        })
            .populate('albumId', 'title slug coverImage')
            .sort({ order: 1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error('Get featured projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured projects',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/projects/slug/:slug
 * Get single project by slug
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const project = await Project.findOne({
            slug: req.params.slug,
            visibility: 'public'
        })
            .populate('albumId', 'title slug coverImage description');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/projects/:id
 * Get single project by ID
 * Kept for backward compatibility
 */
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('albumId', 'title slug coverImage description');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Only return if public or unlisted
        if (project.visibility === 'private') {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Get project error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/projects/:id/view
 * Increment project view count
 */
router.post('/:id/view', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const views = await project.incrementViews();

        res.json({
            success: true,
            data: { views }
        });
    } catch (error) {
        console.error('Increment view error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to increment view count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
