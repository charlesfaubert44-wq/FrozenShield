const express = require('express');
const router = express.Router();
const Album = require('../../models/Album');
const Media = require('../../models/Media');
const Project = require('../../models/Project');
const { authenticate } = require('../../middleware/auth');

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 * Protected route - requires authentication
 */
router.get('/', authenticate, async (req, res) => {
    try {
        // Fetch all statistics in parallel for better performance
        const [
            albumCount,
            mediaCount,
            projectCount,
            albumViewsSum,
            projectViewsSum,
            recentAlbums,
            recentMedia
        ] = await Promise.all([
            // Count total albums
            Album.countDocuments(),

            // Count total media items
            Media.countDocuments(),

            // Count total projects
            Project.countDocuments(),

            // Sum all album views
            Album.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: '$stats.views' }
                    }
                }
            ]),

            // Sum all project views (if Project model has views field)
            Project.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: { $ifNull: ['$stats.views', 0] } }
                    }
                }
            ]),

            // Get 5 most recent albums
            Album.find()
                .select('title slug createdAt stats visibility featured')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),

            // Get 5 most recent media items
            Media.find()
                .select('type caption metadata.filename uploadedAt albumId')
                .populate('albumId', 'title slug')
                .sort({ uploadedAt: -1 })
                .limit(5)
                .lean()
        ]);

        // Calculate total views
        const albumViews = albumViewsSum.length > 0 ? albumViewsSum[0].totalViews : 0;
        const projectViews = projectViewsSum.length > 0 ? projectViewsSum[0].totalViews : 0;
        const totalViews = albumViews + projectViews;

        // Build response data
        const stats = {
            counts: {
                albums: albumCount,
                media: mediaCount,
                projects: projectCount,
                totalViews: totalViews
            },
            recent: {
                albums: recentAlbums,
                media: recentMedia
            }
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
