const express = require('express');
const router = express.Router();
const Project = require('../../models/Project');
const { authenticate } = require('../../middleware/auth');

// All routes are protected - require authentication
router.use(authenticate);

/**
 * GET /api/admin/projects
 * List all projects with pagination, search, and filtering
 */
router.get('/', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Search by title, shortDescription, or category
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { shortDescription: { $regex: req.query.search, $options: 'i' } },
                { category: { $regex: req.query.search, $options: 'i' } }
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

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by technology
        if (req.query.technology) {
            query.technologies = req.query.technology;
        }

        // Get total count for pagination
        const total = await Project.countDocuments(query);

        // Fetch projects
        const projects = await Project.find(query)
            .populate('albumId', 'title slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Calculate total pages
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: projects,
            pagination: {
                total,
                page,
                pages,
                limit
            }
        });

    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/admin/projects
 * Create a new project
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            slug,
            shortDescription,
            longDescription,
            images,
            thumbnail,
            technologies,
            category,
            projectUrl,
            githubUrl,
            featured,
            visibility,
            completedDate,
            client,
            albumId,
            order
        } = req.body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Project title is required'
            });
        }

        // Check if slug already exists (if provided)
        if (slug) {
            const existingProject = await Project.findOne({ slug });
            if (existingProject) {
                return res.status(400).json({
                    success: false,
                    message: 'A project with this slug already exists'
                });
            }
        }

        // Create project
        const project = new Project({
            title: title.trim(),
            slug: slug?.trim(),
            shortDescription: shortDescription?.trim(),
            longDescription: longDescription?.trim(),
            images,
            thumbnail,
            technologies,
            category: category?.trim(),
            projectUrl,
            githubUrl,
            featured: featured || false,
            visibility: visibility || 'public',
            completedDate,
            client: client?.trim(),
            albumId,
            order: order || 0
        });

        await project.save();

        res.status(201).json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error('Error creating project:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A project with this slug already exists'
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
            message: 'Error creating project',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/admin/projects/:id
 * Get a single project by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('albumId', 'title description coverImage slug')
            .lean();

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
        console.error('Error fetching project:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/admin/projects/:id
 * Update a project
 */
router.put('/:id', async (req, res) => {
    try {
        const {
            title,
            slug,
            shortDescription,
            longDescription,
            images,
            thumbnail,
            technologies,
            category,
            projectUrl,
            githubUrl,
            featured,
            visibility,
            completedDate,
            client,
            albumId,
            order
        } = req.body;

        // Find project
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if slug is being changed and if it conflicts
        if (slug && slug !== project.slug) {
            const existingProject = await Project.findOne({ slug });
            if (existingProject) {
                return res.status(400).json({
                    success: false,
                    message: 'A project with this slug already exists'
                });
            }
        }

        // Update fields
        if (title !== undefined) project.title = title.trim();
        if (slug !== undefined) project.slug = slug?.trim();
        if (shortDescription !== undefined) project.shortDescription = shortDescription?.trim();
        if (longDescription !== undefined) project.longDescription = longDescription?.trim();
        if (images !== undefined) project.images = images;
        if (thumbnail !== undefined) project.thumbnail = thumbnail;
        if (technologies !== undefined) project.technologies = technologies;
        if (category !== undefined) project.category = category?.trim();
        if (projectUrl !== undefined) project.projectUrl = projectUrl;
        if (githubUrl !== undefined) project.githubUrl = githubUrl;
        if (featured !== undefined) project.featured = featured;
        if (visibility !== undefined) project.visibility = visibility;
        if (completedDate !== undefined) project.completedDate = completedDate;
        if (client !== undefined) project.client = client?.trim();
        if (albumId !== undefined) project.albumId = albumId;
        if (order !== undefined) project.order = order;

        await project.save();

        res.json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error('Error updating project:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A project with this slug already exists'
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
                message: 'Invalid project ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating project',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/admin/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req, res) => {
    try {
        // Find project
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Delete the project
        await Project.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Project deleted successfully',
            data: {
                projectId: project._id,
                projectTitle: project.title
            }
        });

    } catch (error) {
        console.error('Error deleting project:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PATCH /api/admin/projects/:id/featured
 * Toggle featured status of a project
 */
router.patch('/:id/featured', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Toggle featured status
        project.featured = !project.featured;
        await project.save();

        res.json({
            success: true,
            message: `Project ${project.featured ? 'featured' : 'unfeatured'} successfully`,
            data: {
                projectId: project._id,
                projectTitle: project.title,
                featured: project.featured
            }
        });

    } catch (error) {
        console.error('Error toggling featured status:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID'
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
