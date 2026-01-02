// Albums Management JavaScript
// Handles album CRUD operations for admin panel

// API_BASE is defined in shared.js (loaded first)
// Local state for albums module
let currentPage = 1;
let currentSearch = '';
let currentFilters = {};
let isEditMode = false;
let currentAlbumId = null;

// DOM Elements
let albumsList;
let albumsPagination;
let albumSearch;
let albumFilterVisibility;
let albumModal;
let albumForm;
let albumModalTitle;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadAlbums();
});

// Initialize DOM elements
function initializeElements() {
    albumsList = document.getElementById('albumsList');
    albumsPagination = document.getElementById('albumsPagination');
    albumSearch = document.getElementById('album-search');
    albumFilterVisibility = document.getElementById('album-filter-visibility');
    albumModal = document.getElementById('albumModal');
    albumForm = document.getElementById('albumForm');
    albumModalTitle = document.getElementById('albumModalTitle');
}

// Setup event listeners
function setupEventListeners() {
    // Search input with debounce
    if (albumSearch) {
        albumSearch.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadAlbums();
        }, 500));
    }

    // Filter change
    if (albumFilterVisibility) {
        albumFilterVisibility.addEventListener('change', (e) => {
            currentFilters.visibility = e.target.value;
            currentPage = 1;
            loadAlbums();
        });
    }

    // Form submission
    if (albumForm) {
        albumForm.addEventListener('submit', handleAlbumSubmit);
    }

    // Close modal on backdrop click
    const backdrop = albumModal?.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeAlbumModal);
    }

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && albumModal?.classList.contains('active')) {
            closeAlbumModal();
        }
    });
}

// Load albums from API
async function loadAlbums(page = currentPage, search = currentSearch, filters = currentFilters) {
    try {
        showLoadingState();

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

        if (filters.visibility) {
            params.append('visibility', filters.visibility);
        }

        const response = await fetch(`${API_BASE}/api/admin/albums?${params.toString()}`, {
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
            throw new Error('Failed to load albums');
        }

        const data = await response.json();
        displayAlbums(data.data || []);
        displayPagination(data.pagination || { page: 1, pages: 1 });

    } catch (error) {
        console.error('Load albums error:', error);
        showNotification('Failed to load albums: ' + error.message, 'error');
        displayAlbums([]);
    } finally {
        hideLoadingState();
    }
}

// Display albums in grid
function displayAlbums(albums) {
    if (!albumsList) return;

    if (albums.length === 0) {
        albumsList.innerHTML = `
            <div class="empty-state">
                <p>No albums found</p>
                <button class="btn-primary" data-action="create-album">Create Your First Album</button>
            </div>
        `;
        return;
    }

    albumsList.innerHTML = albums.map(album => createAlbumCard(album)).join('');
}

// Create album card HTML
function createAlbumCard(album) {
    const coverImage = album.coverImage || '/images/placeholder-album.jpg';
    const featuredBadge = album.featured ? '<span class="badge-featured">Featured</span>' : '';
    const visibilityClass = album.visibility || 'public';
    const photoCount = album.stats?.totalMedia || 0;

    return `
        <div class="album-card" data-id="${album._id}">
            <div class="album-cover" style="background-image: url('${coverImage}')">
                ${featuredBadge}
            </div>
            <div class="album-info">
                <h4>${escapeHtml(album.title)}</h4>
                <p>${photoCount} photo${photoCount !== 1 ? 's' : ''}</p>
                <span class="badge badge-${visibilityClass}">${visibilityClass}</span>
            </div>
            <div class="album-actions">
                <button data-action="view-album" data-id="${album._id}" class="btn-view" title="View Photos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View
                </button>
                <button data-action="edit-album" data-id="${album._id}" class="btn-edit" title="Edit Album">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button data-action="delete-album" data-id="${album._id}" class="btn-danger" title="Delete Album">
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

// Display pagination
function displayPagination(pagination) {
    if (!albumsPagination) return;

    const { page, pages } = pagination;

    if (pages <= 1) {
        albumsPagination.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination-controls">';

    // Previous button
    if (page > 1) {
        paginationHTML += `<button data-action="change-page" data-page="${page - 1}" class="page-btn">Previous</button>`;
    }

    // Page numbers
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            const activeClass = i === page ? 'active' : '';
            paginationHTML += `<button data-action="change-page" data-page="${i}" class="page-btn ${activeClass}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }

    // Next button
    if (page < pages) {
        paginationHTML += `<button data-action="change-page" data-page="${page + 1}" class="page-btn">Next</button>`;
    }

    paginationHTML += '</div>';
    albumsPagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadAlbums();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open create album modal
function openCreateAlbumModal() {
    isEditMode = false;
    currentAlbumId = null;

    if (albumModalTitle) {
        albumModalTitle.textContent = 'Create Album';
    }

    if (albumForm) {
        albumForm.reset();
    }

    showModal();
}

// Edit album
async function editAlbum(albumId) {
    try {
        isEditMode = true;
        currentAlbumId = albumId;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/admin/albums/${albumId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load album details');
        }

        const { data } = await response.json();

        // Populate form
        if (albumForm) {
            albumForm.elements.title.value = data.title || '';
            albumForm.elements.description.value = data.description || '';
            albumForm.elements.tags.value = (data.tags || []).join(', ');
            albumForm.elements.visibility.value = data.visibility || 'public';
            albumForm.elements.featured.checked = data.featured || false;
            albumForm.elements.order.value = data.order || 0;
        }

        if (albumModalTitle) {
            albumModalTitle.textContent = 'Edit Album';
        }

        showModal();

    } catch (error) {
        console.error('Edit album error:', error);
        showNotification('Failed to load album: ' + error.message, 'error');
    }
}

// Handle album form submission
async function handleAlbumSubmit(e) {
    e.preventDefault();

    try {
        const formData = new FormData(albumForm);
        const albumData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            visibility: formData.get('visibility'),
            featured: formData.get('featured') === 'on',
            order: parseInt(formData.get('order')) || 0
        };

        // Validate
        if (!albumData.title) {
            showNotification('Album title is required', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const url = isEditMode
            ? `${API_BASE}/api/admin/albums/${currentAlbumId}`
            : `${API_BASE}/api/admin/albums`;

        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(albumData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save album');
        }

        const result = await response.json();
        showNotification(
            isEditMode ? 'Album updated successfully' : 'Album created successfully',
            'success'
        );

        closeAlbumModal();
        loadAlbums();

    } catch (error) {
        console.error('Save album error:', error);
        showNotification('Failed to save album: ' + error.message, 'error');
    }
}

// Delete album
async function deleteAlbum(albumId) {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/admin/albums/${albumId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete album');
        }

        showNotification('Album deleted successfully', 'success');
        loadAlbums();

    } catch (error) {
        console.error('Delete album error:', error);
        showNotification('Failed to delete album: ' + error.message, 'error');
    }
}

// View album photos
function viewAlbum(albumId) {
    // Navigate to media management page for this album
    window.location.href = `/admin/media.html?album=${albumId}`;
}

// Modal functions
function showModal() {
    if (albumModal) {
        albumModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAlbumModal() {
    if (albumModal) {
        albumModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (albumForm) {
        albumForm.reset();
    }

    isEditMode = false;
    currentAlbumId = null;
}

// Utility functions
function showLoadingState() {
    if (albumsList) {
        albumsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading albums...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    // Loading state is replaced by actual content
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to body
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Event Delegation for Albums Section (CSP Compliant)
 * Handles all click events using data-action attributes
 */
function setupAlbumsEventDelegation() {
    // Event delegation for albums list
    if (albumsList) {
        albumsList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const id = btn.dataset.id;

            switch (action) {
                case 'create-album':
                    openCreateAlbumModal();
                    break;
                case 'view-album':
                    if (id) viewAlbum(id);
                    break;
                case 'edit-album':
                    if (id) editAlbum(id);
                    break;
                case 'delete-album':
                    if (id) deleteAlbum(id);
                    break;
            }
        });
    }

    // Event delegation for pagination
    if (albumsPagination) {
        albumsPagination.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="change-page"]');
            if (!btn) return;

            const page = parseInt(btn.dataset.page);
            if (page) changePage(page);
        });
    }
}

// Initialize event delegation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAlbumsEventDelegation);
} else {
    setupAlbumsEventDelegation();
}

// Make functions globally available
window.openCreateAlbumModal = openCreateAlbumModal;
window.editAlbum = editAlbum;
window.deleteAlbum = deleteAlbum;
window.viewAlbum = viewAlbum;
window.closeAlbumModal = closeAlbumModal;
window.changePage = changePage;
