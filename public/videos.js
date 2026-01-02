// Video Gallery Management
// Handles video display, filtering, search, and video player modal

// API_URL is defined in script.js (loaded first)

// Video gallery state
let allVideos = [];
let filteredVideos = [];
let currentVideoIndex = 0;

// Video type enum
const VideoType = {
    YOUTUBE: 'youtube',
    VIMEO: 'vimeo',
    HTML5: 'html5'
};

// Initialize video gallery
async function initVideoGallery() {
    await loadVideos();
    initVideoFilters();
    initVideoSearch();
    initVideoModal();
}

// Load videos from API
async function loadVideos(filters = {}) {
    try {
        // Fetch all public videos from albums
        const response = await fetch(`${API_URL}/albums`);
        const result = await response.json();

        if (result.success && result.data) {
            // Extract all video media from albums
            const videosPromises = result.data.map(async (album) => {
                const albumResponse = await fetch(`${API_URL}/albums/${album._id}`);
                const albumResult = await albumResponse.json();

                if (albumResult.success && albumResult.data && albumResult.data.media) {
                    return albumResult.data.media
                        .filter(media => media.type === 'video' && media.visibility === 'public')
                        .map(video => ({
                            ...video,
                            albumTitle: album.title,
                            albumId: album._id,
                            videoType: detectVideoType(video.url),
                            embedId: extractVideoId(video.url)
                        }));
                }
                return [];
            });

            const videosArrays = await Promise.all(videosPromises);
            allVideos = videosArrays.flat();
            filteredVideos = [...allVideos];

            // Apply filters if provided
            if (Object.keys(filters).length > 0) {
                filteredVideos = applyFilters(filteredVideos, filters);
            }

            displayVideoGrid(filteredVideos);
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        showVideoError('Failed to load videos. Please try again later.');
    }
}

// Detect video type from URL
function detectVideoType(url) {
    if (!url) return VideoType.HTML5;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return VideoType.YOUTUBE;
    } else if (url.includes('vimeo.com')) {
        return VideoType.VIMEO;
    }
    return VideoType.HTML5;
}

// Extract video ID from YouTube/Vimeo URL
function extractVideoId(url) {
    if (!url) return null;

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
        const regExp = /vimeo.*\/(\d+)/i;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    return url;
}

// Apply filters to videos
function applyFilters(videos, filters) {
    let filtered = [...videos];

    if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter(video => video.videoType === filters.type);
    }

    if (filters.category) {
        filtered = filtered.filter(video =>
            video.tags && video.tags.some(tag =>
                tag.toLowerCase().includes(filters.category.toLowerCase())
            )
        );
    }

    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(video =>
            video.caption?.toLowerCase().includes(searchTerm) ||
            video.alt?.toLowerCase().includes(searchTerm) ||
            video.albumTitle?.toLowerCase().includes(searchTerm) ||
            video.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    return filtered;
}

// Display video grid
function displayVideoGrid(videos) {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) return;

    if (videos.length === 0) {
        videoGrid.innerHTML = `
            <div class="no-videos">
                <p>No videos found matching your criteria.</p>
            </div>
        `;
        return;
    }

    videoGrid.innerHTML = '';

    videos.forEach((video, index) => {
        const videoCard = createVideoCard(video, index);
        videoGrid.appendChild(videoCard);
    });
}

// Create video card element
function createVideoCard(video, index) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-video-index', index);

    const thumbnail = getVideoThumbnail(video);
    const playIcon = `
        <svg class="play-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <polygon points="10 8 16 12 10 16" fill="currentColor"/>
        </svg>
    `;

    card.innerHTML = `
        <div class="video-thumbnail" style="background-image: url('${thumbnail}')">
            <div class="video-overlay">
                ${playIcon}
                <span class="video-duration">${video.metadata?.duration || ''}</span>
            </div>
            <div class="video-type-badge ${video.videoType}">
                ${getVideoTypeBadge(video.videoType)}
            </div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.caption || video.alt || 'Untitled Video'}</h3>
            <p class="video-album">${video.albumTitle || 'General'}</p>
            <div class="video-stats">
                <span class="views">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${formatViews(video.stats?.views || 0)}
                </span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openVideoModal(index));

    return card;
}

// Get video thumbnail
function getVideoThumbnail(video) {
    if (video.thumbnail) {
        return video.thumbnail;
    }

    // Generate thumbnail URL based on video type
    if (video.videoType === VideoType.YOUTUBE && video.embedId) {
        return `https://img.youtube.com/vi/${video.embedId}/hqdefault.jpg`;
    } else if (video.videoType === VideoType.VIMEO && video.embedId) {
        // Vimeo thumbnails require API call, fallback to placeholder
        return '/placeholder-video.jpg';
    }

    return video.optimized || video.url || '/placeholder-video.jpg';
}

// Get video type badge
function getVideoTypeBadge(type) {
    const badges = {
        [VideoType.YOUTUBE]: 'YouTube',
        [VideoType.VIMEO]: 'Vimeo',
        [VideoType.HTML5]: 'Video'
    };
    return badges[type] || 'Video';
}

// Format view count
function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

// Open video modal
function openVideoModal(videoIndex) {
    const modal = document.getElementById('videoModal');
    if (!modal) return;

    currentVideoIndex = videoIndex;
    const video = filteredVideos[videoIndex];

    if (!video) return;

    // Update modal content
    updateVideoModalContent(video);

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Track view
    trackVideoView(video._id);
}

// Update video modal content
function updateVideoModalContent(video) {
    const modalTitle = document.getElementById('videoModalTitle');
    const modalDescription = document.getElementById('videoModalDescription');
    const modalViews = document.getElementById('videoModalViews');
    const modalTags = document.getElementById('videoModalTags');
    const videoPlayer = document.getElementById('videoPlayerContainer');

    if (modalTitle) modalTitle.textContent = video.caption || video.alt || 'Untitled Video';
    if (modalDescription) modalDescription.textContent = video.albumTitle || '';
    if (modalViews) modalViews.textContent = `${formatViews(video.stats?.views || 0)} views`;

    // Update tags
    if (modalTags) {
        modalTags.innerHTML = '';
        if (video.tags && video.tags.length > 0) {
            video.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                modalTags.appendChild(tagElement);
            });
        }
    }

    // Create video player
    if (videoPlayer) {
        videoPlayer.innerHTML = createVideoPlayer(video);
    }

    // Update navigation buttons
    updateVideoNavigation();
}

// Create video player based on type
function createVideoPlayer(video) {
    const playerContainer = '<div class="video-player-wrapper">';
    const loadingSpinner = `
        <div class="video-loading">
            <div class="spinner"></div>
        </div>
    `;

    if (video.videoType === VideoType.YOUTUBE && video.embedId) {
        return `
            ${playerContainer}
                ${loadingSpinner}
                <iframe
                    class="video-iframe"
                    src="https://www.youtube.com/embed/${video.embedId}?autoplay=1&rel=0"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    onload="this.previousElementSibling.style.display='none'"
                ></iframe>
            </div>
        `;
    } else if (video.videoType === VideoType.VIMEO && video.embedId) {
        return `
            ${playerContainer}
                ${loadingSpinner}
                <iframe
                    class="video-iframe"
                    src="https://player.vimeo.com/video/${video.embedId}?autoplay=1"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen
                    onload="this.previousElementSibling.style.display='none'"
                ></iframe>
            </div>
        `;
    } else {
        return `
            ${playerContainer}
                <video
                    class="video-element"
                    controls
                    autoplay
                    src="${video.url}"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
    }
}

// Update navigation buttons state
function updateVideoNavigation() {
    const prevBtn = document.querySelector('.video-modal-prev');
    const nextBtn = document.querySelector('.video-modal-next');
    const counter = document.getElementById('videoCounter');

    if (counter) {
        counter.textContent = `${currentVideoIndex + 1} / ${filteredVideos.length}`;
    }

    if (prevBtn) {
        prevBtn.disabled = currentVideoIndex === 0;
        prevBtn.style.opacity = currentVideoIndex === 0 ? '0.5' : '1';
    }

    if (nextBtn) {
        nextBtn.disabled = currentVideoIndex === filteredVideos.length - 1;
        nextBtn.style.opacity = currentVideoIndex === filteredVideos.length - 1 ? '0.5' : '1';
    }
}

// Navigate to previous video
function previousVideo() {
    if (currentVideoIndex > 0) {
        currentVideoIndex--;
        updateVideoModalContent(filteredVideos[currentVideoIndex]);
    }
}

// Navigate to next video
function nextVideo() {
    if (currentVideoIndex < filteredVideos.length - 1) {
        currentVideoIndex++;
        updateVideoModalContent(filteredVideos[currentVideoIndex]);
    }
}

// Close video modal
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Stop video playback
    const videoPlayer = document.getElementById('videoPlayerContainer');
    if (videoPlayer) {
        videoPlayer.innerHTML = '';
    }
}

// Initialize video modal controls
function initVideoModal() {
    const modal = document.getElementById('videoModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');
    const prevBtn = modal.querySelector('.video-modal-prev');
    const nextBtn = modal.querySelector('.video-modal-next');

    if (closeBtn) closeBtn.addEventListener('click', closeVideoModal);
    if (backdrop) backdrop.addEventListener('click', closeVideoModal);
    if (prevBtn) prevBtn.addEventListener('click', previousVideo);
    if (nextBtn) nextBtn.addEventListener('click', nextVideo);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;

        switch(e.key) {
            case 'Escape':
                closeVideoModal();
                break;
            case 'ArrowLeft':
                previousVideo();
                break;
            case 'ArrowRight':
                nextVideo();
                break;
        }
    });
}

// Initialize video filters
function initVideoFilters() {
    const filterButtons = document.querySelectorAll('.video-filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');

            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Apply filter
            filterVideos(filterType);
        });
    });
}

// Filter videos by type
function filterVideos(type) {
    const filters = {};

    if (type && type !== 'all') {
        filters.type = type;
    }

    // Get current search term
    const searchInput = document.getElementById('videoSearch');
    if (searchInput && searchInput.value) {
        filters.search = searchInput.value;
    }

    filteredVideos = applyFilters(allVideos, filters);
    displayVideoGrid(filteredVideos);
}

// Initialize video search
function initVideoSearch() {
    const searchInput = document.getElementById('videoSearch');
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            searchVideos(this.value);
        }, 300); // Debounce search
    });
}

// Search videos
function searchVideos(query) {
    const filters = { search: query };

    // Get active filter type
    const activeFilter = document.querySelector('.video-filter-btn.active');
    if (activeFilter) {
        const filterType = activeFilter.getAttribute('data-filter');
        if (filterType && filterType !== 'all') {
            filters.type = filterType;
        }
    }

    filteredVideos = applyFilters(allVideos, filters);
    displayVideoGrid(filteredVideos);
}

// Track video view
async function trackVideoView(videoId) {
    try {
        // Increment view count
        await fetch(`${API_URL}/media/${videoId}/view`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error tracking video view:', error);
    }
}

// Show video error message
function showVideoError(message) {
    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
        videoGrid.innerHTML = `
            <div class="video-error">
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideoGallery);
} else {
    initVideoGallery();
}

// Export functions for external use
window.VideoGallery = {
    loadVideos,
    filterVideos,
    searchVideos,
    openVideoModal,
    closeVideoModal
};
