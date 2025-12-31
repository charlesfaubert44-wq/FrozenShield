// Videos Management JavaScript
// Handles video CRUD operations for admin panel

// API Configuration
const API_BASE = window.location.origin;
let videoCurrentPage = 1;
let videoCurrentSearch = '';
let videoCurrentFilters = {};
let isVideoEditMode = false;
let currentVideoId = null;

// DOM Elements
let videosList;
let videosPagination;
let videoSearch;
let videoFilterCategory;
let videoFilterVisibility;
let videoFilterFeatured;
let videoModal;
let videoForm;
let videoModalTitle;
let videoTypeSelect;
let videoUrlInput;
let videoUrlGroup;
let embedCodeGroup;
let videoPreviewContainer;
let videoPreview;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeVideoElements();
    setupVideoEventListeners();

    // Load videos if on videos section
    if (window.location.hash.includes('videos')) {
        loadVideos();
    }
});

// Initialize DOM elements
function initializeVideoElements() {
    videosList = document.getElementById('videosList');
    videosPagination = document.getElementById('videosPagination');
    videoSearch = document.getElementById('video-search');
    videoFilterCategory = document.getElementById('video-filter-category');
    videoFilterVisibility = document.getElementById('video-filter-visibility');
    videoFilterFeatured = document.getElementById('video-filter-featured');
    videoModal = document.getElementById('videoModal');
    videoForm = document.getElementById('videoForm');
    videoModalTitle = document.getElementById('videoModalTitle');
    videoTypeSelect = document.getElementById('video-type');
    videoUrlInput = document.getElementById('video-url');
    videoUrlGroup = document.getElementById('video-url-group');
    embedCodeGroup = document.getElementById('embed-code-group');
    videoPreviewContainer = document.getElementById('video-preview-container');
    videoPreview = document.getElementById('video-preview');
}

// Setup event listeners
function setupVideoEventListeners() {
    // Search input with debounce
    if (videoSearch) {
        videoSearch.addEventListener('input', debounce((e) => {
            videoCurrentSearch = e.target.value.trim();
            videoCurrentPage = 1;
            loadVideos();
        }, 500));
    }

    // Filter changes
    if (videoFilterCategory) {
        videoFilterCategory.addEventListener('change', (e) => {
            videoCurrentFilters.category = e.target.value;
            videoCurrentPage = 1;
            loadVideos();
        });
    }

    if (videoFilterVisibility) {
        videoFilterVisibility.addEventListener('change', (e) => {
            videoCurrentFilters.visibility = e.target.value;
            videoCurrentPage = 1;
            loadVideos();
        });
    }

    if (videoFilterFeatured) {
        videoFilterFeatured.addEventListener('change', (e) => {
            videoCurrentFilters.featured = e.target.value;
            videoCurrentPage = 1;
            loadVideos();
        });
    }

    // Video type change
    if (videoTypeSelect) {
        videoTypeSelect.addEventListener('change', handleVideoTypeChange);
    }

    // Video URL change for preview
    if (videoUrlInput) {
        videoUrlInput.addEventListener('input', debounce(updateVideoPreview, 500));
    }

    // Form submission
    if (videoForm) {
        videoForm.addEventListener('submit', handleVideoSubmit);
    }

    // Close modal on backdrop click
    const backdrop = videoModal?.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeVideoModal);
    }

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal?.classList.contains('active')) {
            closeVideoModal();
        }
    });
}

// Handle video type selection
function handleVideoTypeChange(e) {
    const videoType = e.target.value;

    if (videoType === 'direct') {
        videoUrlGroup.style.display = 'none';
        embedCodeGroup.style.display = 'block';
        videoUrlInput.removeAttribute('required');
    } else {
        videoUrlGroup.style.display = 'block';
        embedCodeGroup.style.display = 'none';
        videoUrlInput.setAttribute('required', 'required');
    }

    // Clear preview when changing type
    if (videoPreviewContainer) {
        videoPreviewContainer.style.display = 'none';
        videoPreview.innerHTML = '';
    }
}

// Update video preview
function updateVideoPreview() {
    const url = videoUrlInput?.value.trim();
    const videoType = videoTypeSelect?.value;

    if (!url || !videoType || videoType === 'direct') {
        videoPreviewContainer.style.display = 'none';
        videoPreview.innerHTML = '';
        return;
    }

    let embedUrl = null;

    if (videoType === 'youtube') {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
    } else if (videoType === 'vimeo') {
        const videoId = extractVimeoId(url);
        if (videoId) {
            embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }
    }

    if (embedUrl) {
        videoPreview.innerHTML = `
            <iframe
                src="${embedUrl}"
                frameborder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen
                style="width: 100%; height: 100%;">
            </iframe>
        `;
        videoPreviewContainer.style.display = 'block';
    } else {
        videoPreviewContainer.style.display = 'none';
        videoPreview.innerHTML = '<p class="text-muted">Invalid video URL</p>';
    }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Extract Vimeo video ID from URL
function extractVimeoId(url) {
    const pattern = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
}

// Load videos from API
async function loadVideos(page = videoCurrentPage, search = videoCurrentSearch, filters = videoCurrentFilters) {
    try {
        showVideoLoadingState();

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/admin/login.html';
            return;
        }

        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', '12');

        if (search) {
            params.append('search', search);
        }

        if (filters.category) {
            params.append('category', filters.category);
        }

        if (filters.visibility) {
            params.append('visibility', filters.visibility);
        }

        if (filters.featured) {
            params.append('featured', filters.featured);
        }

        const response = await fetch(`${API_BASE}/api/admin/videos?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/admin/login.html';
                return;
            }
            throw new Error('Failed to load videos');
        }

        const data = await response.json();
        displayVideos(data.data || []);
        displayVideoPagination(data.pagination || { page: 1, pages: 1 });

    } catch (error) {
        console.error('Load videos error:', error);
        showNotification('Failed to load videos: ' + error.message, 'error');
        displayVideos([]);
    }
}

// Display videos in grid
function displayVideos(videos) {
    if (!videosList) return;

    if (videos.length === 0) {
        videosList.innerHTML = `
            <div class="empty-state">
                <p>No videos found</p>
                <button class="btn-primary" onclick="openCreateVideoModal()">Add Your First Video</button>
            </div>
        `;
        return;
    }

    videosList.innerHTML = videos.map(video => createVideoCard(video)).join('');
}

// Create video card HTML
function createVideoCard(video) {
    const thumbnail = video.thumbnail || getDefaultThumbnail(video.videoType, video.videoUrl);
    const featuredBadge = video.featured ? '<span class="badge-featured">Featured</span>' : '';
    const visibilityClass = video.visibility || 'public';
    const duration = video.duration ? formatDuration(video.duration) : '';
    const category = video.category ? `<span class="badge badge-category">${escapeHtml(video.category)}</span>` : '';
    const videoTypeIcon = getVideoTypeIcon(video.videoType);

    return `
        <div class="video-card" data-id="${video._id}">
            <div class="video-thumbnail" style="background-image: url('${thumbnail}')">
                ${featuredBadge}
                ${duration ? `<span class="video-duration">${duration}</span>` : ''}
                <div class="video-overlay">
                    <button onclick="viewVideo('${video._id}')" class="btn-play" title="Play Video">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="video-info">
                <div class="video-header">
                    ${videoTypeIcon}
                    <h4>${escapeHtml(video.title)}</h4>
                </div>
                ${video.description ? `<p class="video-description">${escapeHtml(video.description.substring(0, 100))}${video.description.length > 100 ? '...' : ''}</p>` : ''}
                <div class="video-meta">
                    <span class="badge badge-${visibilityClass}">${visibilityClass}</span>
                    ${category}
                    <span class="video-stats">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        ${video.stats?.views || 0}
                    </span>
                </div>
            </div>
            <div class="video-actions">
                <button onclick="editVideo('${video._id}')" class="btn-edit" title="Edit Video">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button onclick="toggleVideoFeatured('${video._id}', ${!video.featured})" class="btn-view" title="${video.featured ? 'Unfeature' : 'Feature'} Video">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${video.featured ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    ${video.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onclick="deleteVideo('${video._id}')" class="btn-danger" title="Delete Video">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Get default thumbnail based on video type
function getDefaultThumbnail(videoType, videoUrl) {
    if (videoType === 'youtube' && videoUrl) {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
    } else if (videoType === 'vimeo' && videoUrl) {
        // Vimeo thumbnails require API call, return placeholder
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%231a1a26" width="320" height="180"/%3E%3Ctext fill="%236a6a7a" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EVimeo Video%3C/text%3E%3C/svg%3E';
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect fill="%231a1a26" width="320" height="180"/%3E%3Ctext fill="%236a6a7a" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EVideo Thumbnail%3C/text%3E%3C/svg%3E';
}

// Get video type icon
function getVideoTypeIcon(videoType) {
    const icons = {
        youtube: '<svg class="video-type-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        vimeo: '<svg class="video-type-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z"/></svg>',
        direct: '<svg class="video-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
    };
    return icons[videoType] || icons.direct;
}

// Format duration in mm:ss
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Display pagination
function displayVideoPagination(pagination) {
    if (!videosPagination) return;

    const { page, pages } = pagination;

    if (pages <= 1) {
        videosPagination.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination-controls">';

    // Previous button
    if (page > 1) {
        paginationHTML += `<button onclick="changeVideoPage(${page - 1})" class="page-btn">Previous</button>`;
    }

    // Page numbers
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            const activeClass = i === page ? 'active' : '';
            paginationHTML += `<button onclick="changeVideoPage(${i})" class="page-btn ${activeClass}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }

    // Next button
    if (page < pages) {
        paginationHTML += `<button onclick="changeVideoPage(${page + 1})" class="page-btn">Next</button>`;
    }

    paginationHTML += '</div>';
    videosPagination.innerHTML = paginationHTML;
}

// Change page
function changeVideoPage(page) {
    videoCurrentPage = page;
    loadVideos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open create video modal
function openCreateVideoModal() {
    isVideoEditMode = false;
    currentVideoId = null;

    if (videoModalTitle) {
        videoModalTitle.textContent = 'Add Video';
    }

    if (videoForm) {
        videoForm.reset();
        videoUrlGroup.style.display = 'block';
        embedCodeGroup.style.display = 'none';
        videoPreviewContainer.style.display = 'none';
    }

    showVideoModal();
}

// Edit video
async function editVideo(videoId) {
    try {
        isVideoEditMode = true;
        currentVideoId = videoId;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/admin/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load video details');
        }

        const { data } = await response.json();

        // Populate form
        if (videoForm) {
            videoForm.elements.title.value = data.title || '';
            videoForm.elements.description.value = data.description || '';
            videoForm.elements.videoType.value = data.videoType || '';
            videoForm.elements.videoUrl.value = data.videoUrl || '';
            videoForm.elements.embedCode.value = data.embedCode || '';
            videoForm.elements.thumbnail.value = data.thumbnail || '';
            videoForm.elements.duration.value = data.duration || '';
            videoForm.elements.tags.value = (data.tags || []).join(', ');
            videoForm.elements.category.value = data.category || '';
            videoForm.elements.visibility.value = data.visibility || 'public';
            videoForm.elements.featured.checked = data.featured || false;

            // Handle video type specific fields
            handleVideoTypeChange({ target: { value: data.videoType } });

            // Show preview if URL exists
            if (data.videoUrl) {
                updateVideoPreview();
            }
        }

        if (videoModalTitle) {
            videoModalTitle.textContent = 'Edit Video';
        }

        showVideoModal();

    } catch (error) {
        console.error('Edit video error:', error);
        showNotification('Failed to load video: ' + error.message, 'error');
    }
}

// Handle video form submission
async function handleVideoSubmit(e) {
    e.preventDefault();

    try {
        const formData = new FormData(videoForm);
        const videoData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            videoType: formData.get('videoType'),
            videoUrl: formData.get('videoUrl').trim(),
            embedCode: formData.get('embedCode').trim(),
            thumbnail: formData.get('thumbnail').trim(),
            duration: parseInt(formData.get('duration')) || 0,
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            category: formData.get('category'),
            visibility: formData.get('visibility'),
            featured: formData.get('featured') === 'on'
        };

        // Validate
        if (!videoData.title) {
            showNotification('Video title is required', 'error');
            return;
        }

        if (!videoData.videoType) {
            showNotification('Video type is required', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const url = isVideoEditMode
            ? `${API_BASE}/api/admin/videos/${currentVideoId}`
            : `${API_BASE}/api/admin/videos`;

        const method = isVideoEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(videoData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save video');
        }

        const result = await response.json();
        showNotification(
            isVideoEditMode ? 'Video updated successfully' : 'Video added successfully',
            'success'
        );

        closeVideoModal();
        loadVideos();

    } catch (error) {
        console.error('Save video error:', error);
        showNotification('Failed to save video: ' + error.message, 'error');
    }
}

// Delete video
async function deleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/admin/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete video');
        }

        showNotification('Video deleted successfully', 'success');
        loadVideos();

    } catch (error) {
        console.error('Delete video error:', error);
        showNotification('Failed to delete video: ' + error.message, 'error');
    }
}

// Toggle video featured status
async function toggleVideoFeatured(videoId, featured) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/admin/videos/${videoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ featured })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update video');
        }

        showNotification(
            featured ? 'Video featured successfully' : 'Video unfeatured',
            'success'
        );
        loadVideos();

    } catch (error) {
        console.error('Toggle featured error:', error);
        showNotification('Failed to update video: ' + error.message, 'error');
    }
}

// View video (open in modal or new tab)
function viewVideo(videoId) {
    // For now, open the public video page in new tab
    window.open(`/videos/${videoId}`, '_blank');
}

// Modal functions
function showVideoModal() {
    if (videoModal) {
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeVideoModal() {
    if (videoModal) {
        videoModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (videoForm) {
        videoForm.reset();
    }

    if (videoPreviewContainer) {
        videoPreviewContainer.style.display = 'none';
        videoPreview.innerHTML = '';
    }

    isVideoEditMode = false;
    currentVideoId = null;
}

// Utility functions
function showVideoLoadingState() {
    if (videosList) {
        videosList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading videos...</p>
            </div>
        `;
    }
}

// Make functions globally available
window.openCreateVideoModal = openCreateVideoModal;
window.editVideo = editVideo;
window.deleteVideo = deleteVideo;
window.toggleVideoFeatured = toggleVideoFeatured;
window.viewVideo = viewVideo;
window.closeVideoModal = closeVideoModal;
window.changeVideoPage = changeVideoPage;
window.loadVideos = loadVideos;
