const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeID(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
}

/**
 * Extract Vimeo video ID from Vimeo URL
 */
function extractVimeoID(url) {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
}

/**
 * GET /api/videos
 * Get all public videos with filtering and sorting
 */
router.get('/', async (req, res) => {
    try {
        const { featured, tag, category, videoType, sort = '-createdAt' } = req.query;
        const filter = { visibility: 'public' };

        // Filter by featured status
        if (featured === 'true') {
            filter.featured = true;
        }

        // Filter by tag
        if (tag) {
            filter.tags = tag;
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Filter by video type
        if (videoType) {
            filter.videoType = videoType;
        }

        const videos = await Video.find(filter)
            .sort(sort)
            .select('-__v')
            .lean();

        // Auto-generate thumbnails and format duration
        videos.forEach(video => {
            // Auto-generate thumbnails for videos without thumbnails
            if (!video.thumbnail) {
                if (video.videoType === 'youtube') {
                    const videoId = extractYouTubeID(video.videoUrl);
                    if (videoId) {
                        video.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    }
                } else if (video.videoType === 'vimeo') {
                    const videoId = extractVimeoID(video.videoUrl);
                    if (videoId) {
                        // Vimeo thumbnail - will need to be fetched from their API ideally
                        // For now, use a placeholder or the embed thumbnail
                        video.thumbnail = `https://vumbnail.com/${videoId}.jpg`;
                    }
                }
            }

            // Format duration if it exists (convert seconds to MM:SS or HH:MM:SS)
            if (video.duration && typeof video.duration === 'number') {
                const hours = Math.floor(video.duration / 3600);
                const minutes = Math.floor((video.duration % 3600) / 60);
                const seconds = Math.floor(video.duration % 60);

                if (hours > 0) {
                    video.formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    video.formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            } else {
                video.formattedDuration = '0:00';
            }
        });

        res.json({
            success: true,
            count: videos.length,
            data: videos
        });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch videos',
            error: error.message
        });
    }
});

/**
 * GET /api/videos/:slug
 * Get single video by slug
 */
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Try to find by ID first, then by slug
        let video;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            // Valid MongoDB ObjectId
            video = await Video.findById(slug);
        } else {
            // Assume it's a slug
            video = await Video.findOne({ slug });
        }

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Only show public videos to non-authenticated users
        if (video.visibility !== 'public') {
            return res.status(403).json({
                success: false,
                message: 'This video is not publicly accessible'
            });
        }

        res.json({
            success: true,
            data: video
        });
    } catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video',
            error: error.message
        });
    }
});

/**
 * POST /api/videos/:id/view
 * Increment view count for a video
 */
router.post('/:id/view', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Increment view count
        await video.incrementViews();

        res.json({
            success: true,
            message: 'View count incremented',
            data: {
                views: video.stats.views
            }
        });
    } catch (error) {
        console.error('Increment view error:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to increment view count',
            error: error.message
        });
    }
});

module.exports = router;
