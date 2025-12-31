const express = require('express');
const router = express.Router();
const Album = require('../models/Album');
const Video = require('../models/Video');
const Project = require('../models/Project');

/**
 * GET /api/portfolio
 * Get unified portfolio items (albums, videos, projects)
 *
 * Query Parameters:
 * - type: filter by type ('all', 'albums', 'videos', 'projects') - default: 'all'
 * - category: filter by category
 * - tag: filter by tag
 * - featured: filter by featured status ('true' or 'false')
 * - search: search across titles and descriptions
 * - sort: sort option ('date', 'featured', 'popular', 'views') - default: 'date'
 * - page: page number for pagination - default: 1
 * - limit: items per page - default: 20
 */
router.get('/', async (req, res) => {
    try {
        const {
            type = 'all',
            category,
            tag,
            featured,
            search,
            sort = 'date',
            page = 1,
            limit = 20
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
        const skip = (pageNum - 1) * limitNum;

        // Build filter criteria for each model
        const buildFilters = (modelType) => {
            const filter = { visibility: 'public' };

            // Featured filter
            if (featured === 'true' || featured === true) {
                filter.featured = true;
            } else if (featured === 'false' || featured === false) {
                filter.featured = false;
            }

            // Tag filter
            if (tag) {
                filter.tags = tag;
            }

            // Category filter (albums don't have category field)
            if (category && modelType !== 'album') {
                filter.category = category;
            }

            // Search filter
            if (search) {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];

                // Add shortDescription for projects
                if (modelType === 'project') {
                    filter.$or.push({ shortDescription: { $regex: search, $options: 'i' } });
                    filter.$or.push({ longDescription: { $regex: search, $options: 'i' } });
                }
            }

            return filter;
        };

        // Fetch data from all sources in parallel
        const fetchPromises = [];
        let shouldFetchAlbums = type === 'all' || type === 'albums';
        let shouldFetchVideos = type === 'all' || type === 'videos';
        let shouldFetchProjects = type === 'all' || type === 'projects';

        if (shouldFetchAlbums) {
            fetchPromises.push(
                Album.find(buildFilters('album'))
                    .select('title description slug coverImage tags featured stats.views createdAt order')
                    .lean()
            );
        } else {
            fetchPromises.push(Promise.resolve([]));
        }

        if (shouldFetchVideos) {
            fetchPromises.push(
                Video.find(buildFilters('video'))
                    .select('title description slug thumbnail tags category videoType featured stats.views createdAt duration')
                    .lean()
            );
        } else {
            fetchPromises.push(Promise.resolve([]));
        }

        if (shouldFetchProjects) {
            fetchPromises.push(
                Project.find(buildFilters('project'))
                    .select('title shortDescription longDescription slug thumbnail category technologies featured stats.views createdAt completedDate client')
                    .lean()
            );
        } else {
            fetchPromises.push(Promise.resolve([]));
        }

        const [albums, videos, projects] = await Promise.all(fetchPromises);

        // Normalize data structure
        const normalizedAlbums = albums.map(album => ({
            type: 'album',
            id: album._id.toString(),
            title: album.title,
            description: album.description || '',
            thumbnail: album.coverImage || '',
            slug: album.slug,
            createdAt: album.createdAt,
            views: album.stats?.views || 0,
            featured: album.featured || false,
            tags: album.tags || [],
            order: album.order || 0,
            // Album-specific fields
            coverImage: album.coverImage,
            totalMedia: album.stats?.totalMedia || 0
        }));

        const normalizedVideos = videos.map(video => ({
            type: 'video',
            id: video._id.toString(),
            title: video.title,
            description: video.description || '',
            thumbnail: video.thumbnail || '',
            slug: video.slug,
            createdAt: video.createdAt,
            views: video.stats?.views || 0,
            featured: video.featured || false,
            tags: video.tags || [],
            // Video-specific fields
            category: video.category,
            videoType: video.videoType,
            duration: video.duration,
            likes: video.stats?.likes || 0
        }));

        const normalizedProjects = projects.map(project => ({
            type: 'project',
            id: project._id.toString(),
            title: project.title,
            description: project.shortDescription || project.longDescription || '',
            thumbnail: project.thumbnail || '',
            slug: project.slug,
            createdAt: project.createdAt,
            views: project.stats?.views || 0,
            featured: project.featured || false,
            // Project-specific fields
            shortDescription: project.shortDescription,
            longDescription: project.longDescription,
            category: project.category,
            technologies: project.technologies || [],
            completedDate: project.completedDate,
            client: project.client,
            likes: project.stats?.likes || 0
        }));

        // Combine all items
        let allItems = [
            ...normalizedAlbums,
            ...normalizedVideos,
            ...normalizedProjects
        ];

        // Apply sorting
        switch (sort) {
            case 'featured':
                // Featured first, then by date
                allItems.sort((a, b) => {
                    if (a.featured === b.featured) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return b.featured ? 1 : -1;
                });
                break;

            case 'popular':
            case 'views':
                // Most views first, then by date
                allItems.sort((a, b) => {
                    if (a.views === b.views) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return b.views - a.views;
                });
                break;

            case 'date':
            default:
                // Newest first
                allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        // Calculate pagination
        const total = allItems.length;
        const pages = Math.ceil(total / limitNum);
        const hasMore = pageNum < pages;

        // Apply pagination
        const paginatedItems = allItems.slice(skip, skip + limitNum);

        // Calculate counts
        const counts = {
            albums: normalizedAlbums.length,
            videos: normalizedVideos.length,
            projects: normalizedProjects.length,
            total: total
        };

        // Return response
        res.json({
            success: true,
            data: paginatedItems,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: pages,
                hasMore: hasMore
            },
            counts: counts
        });

    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch portfolio items',
            error: error.message
        });
    }
});

/**
 * GET /api/portfolio/stats
 * Get portfolio statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [
            totalAlbums,
            totalVideos,
            totalProjects,
            featuredAlbums,
            featuredVideos,
            featuredProjects
        ] = await Promise.all([
            Album.countDocuments({ visibility: 'public' }),
            Video.countDocuments({ visibility: 'public' }),
            Project.countDocuments({ visibility: 'public' }),
            Album.countDocuments({ visibility: 'public', featured: true }),
            Video.countDocuments({ visibility: 'public', featured: true }),
            Project.countDocuments({ visibility: 'public', featured: true })
        ]);

        res.json({
            success: true,
            data: {
                total: totalAlbums + totalVideos + totalProjects,
                albums: totalAlbums,
                videos: totalVideos,
                projects: totalProjects,
                featured: {
                    total: featuredAlbums + featuredVideos + featuredProjects,
                    albums: featuredAlbums,
                    videos: featuredVideos,
                    projects: featuredProjects
                }
            }
        });
    } catch (error) {
        console.error('Get portfolio stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch portfolio statistics',
            error: error.message
        });
    }
});

module.exports = router;
