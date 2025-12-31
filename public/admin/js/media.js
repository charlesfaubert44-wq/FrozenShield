/**
 * Media Library Management
 * Handles media uploads, display, filtering, and management
 */

// State management
let mediaLibrary = [];
let selectedMedia = new Set();
let currentFilters = {
    search: '',
    type: '',
    album: '',
    sort: 'newest'
};
let currentPage = 1;
const itemsPerPage = 24;
let selectedFiles = [];

/**
 * Initialize media library on page load
 */
function initMediaLibrary() {
    // Load media library when media section is active
    const mediaSection = document.getElementById('media-section');
    if (!mediaSection) return;

    // Set up event listeners
    setupMediaEventListeners();

    // Load albums for filter
    loadAlbumsForFilter();

    // Load media library
    loadMediaLibrary();
}

/**
 * Set up all event listeners for media library
 */
function setupMediaEventListeners() {
    // Upload button
    const uploadBtn = document.getElementById('uploadMediaBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', openMediaUploadModal);
    }

    // Search
    const searchInput = document.getElementById('media-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            loadMediaLibrary();
        });
    }

    // Type filter
    const typeFilter = document.getElementById('media-filter-type');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            currentFilters.type = e.target.value;
            loadMediaLibrary();
        });
    }

    // Album filter
    const albumFilter = document.getElementById('media-filter-album');
    if (albumFilter) {
        albumFilter.addEventListener('change', (e) => {
            currentFilters.album = e.target.value;
            loadMediaLibrary();
        });
    }

    // Sort
    const sortSelect = document.getElementById('media-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            loadMediaLibrary();
        });
    }

    // Bulk actions
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllMedia);
    }

    const deselectAllBtn = document.getElementById('deselectAllBtn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAllMedia);
    }

    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', bulkDeleteMedia);
    }

    // Close detail sidebar
    const closeDetailBtn = document.getElementById('closeMediaDetailBtn');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeMediaDetail);
    }

    // Upload modal setup
    setupUploadModal();
}

/**
 * Load albums for the filter dropdown and upload modal
 */
async function loadAlbumsForFilter() {
    try {
        const response = await api('/admin/albums?limit=1000');
        const albums = response.data.albums || [];

        // Update filter dropdown
        const filterSelect = document.getElementById('media-filter-album');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Albums</option>';
            albums.forEach(album => {
                const option = document.createElement('option');
                option.value = album._id;
                option.textContent = album.title;
                filterSelect.appendChild(option);
            });
        }

        // Update upload modal dropdown
        const uploadSelect = document.getElementById('media-album-select');
        if (uploadSelect) {
            uploadSelect.innerHTML = '<option value="">Choose an album...</option>';
            albums.forEach(album => {
                const option = document.createElement('option');
                option.value = album._id;
                option.textContent = album.title;
                uploadSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading albums:', error);
    }
}

/**
 * Load media library with filters
 */
async function loadMediaLibrary() {
    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.type) params.append('type', currentFilters.type);
        if (currentFilters.album) params.append('albumId', currentFilters.album);
        params.append('sort', currentFilters.sort);
        params.append('page', currentPage);
        params.append('limit', itemsPerPage);

        const response = await api(`/admin/media?${params.toString()}`);
        mediaLibrary = response.data.media || [];

        displayMediaGrid(mediaLibrary);

        // Update pagination if available
        if (response.data.pagination) {
            updateMediaPagination(response.data.pagination);
        }
    } catch (error) {
        console.error('Error loading media library:', error);
        showNotification('Failed to load media library', 'error');
    }
}

/**
 * Display media in grid
 */
function displayMediaGrid(items) {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-media">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>
                <p>No media files found. ${currentFilters.search || currentFilters.type || currentFilters.album ? 'Try adjusting your filters.' : 'Upload your first file to get started.'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(item => createMediaCard(item)).join('');

    // Add click listeners to media cards
    items.forEach((item, index) => {
        const card = grid.children[index];
        if (card) {
            // Click on checkbox
            const checkbox = card.querySelector('.media-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    toggleMediaSelection(item._id);
                });
            }

            // Click on card (not checkbox)
            card.addEventListener('click', (e) => {
                if (!e.target.matches('.media-checkbox')) {
                    showMediaDetail(item);
                }
            });
        }
    });
}

/**
 * Create media card HTML
 */
function createMediaCard(item) {
    const isSelected = selectedMedia.has(item._id);
    const thumbnail = item.thumbnail || item.optimized || item.url;
    const fileSize = formatFileSize(item.metadata?.size || 0);
    const fileName = item.metadata?.filename || 'Unknown';

    return `
        <div class="media-card ${isSelected ? 'selected' : ''}" data-id="${item._id}">
            <div class="media-checkbox-wrapper">
                <input type="checkbox" class="media-checkbox" ${isSelected ? 'checked' : ''}>
            </div>
            <div class="media-thumbnail">
                ${item.type === 'video' ? `
                    <video src="${item.url}" class="media-preview"></video>
                    <div class="media-type-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                ` : `
                    <img src="${thumbnail}" alt="${item.alt || fileName}" class="media-preview">
                    <div class="media-type-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                    </div>
                `}
            </div>
            <div class="media-info">
                <div class="media-filename" title="${fileName}">${truncateText(fileName, 20)}</div>
                <div class="media-meta">${fileSize}</div>
            </div>
        </div>
    `;
}

/**
 * Show media detail sidebar
 */
function showMediaDetail(item) {
    const sidebar = document.getElementById('mediaDetailSidebar');
    const body = document.getElementById('mediaDetailBody');

    if (!sidebar || !body) return;

    const thumbnail = item.thumbnail || item.optimized || item.url;
    const fileSize = formatFileSize(item.metadata?.size || 0);
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString();

    body.innerHTML = `
        <div class="media-detail-preview">
            ${item.type === 'video' ? `
                <video src="${item.url}" controls class="media-detail-video"></video>
            ` : `
                <img src="${item.optimized || item.url}" alt="${item.alt || ''}" class="media-detail-image">
            `}
        </div>
        <div class="media-detail-info">
            <div class="detail-section">
                <h4>File Information</h4>
                <div class="detail-row">
                    <span class="detail-label">Filename:</span>
                    <span class="detail-value">${item.metadata?.filename || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">File Size:</span>
                    <span class="detail-value">${fileSize}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${item.type}</span>
                </div>
                ${item.metadata?.width && item.metadata?.height ? `
                    <div class="detail-row">
                        <span class="detail-label">Dimensions:</span>
                        <span class="detail-value">${item.metadata.width} x ${item.metadata.height}</span>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Uploaded:</span>
                    <span class="detail-value">${uploadDate}</span>
                </div>
            </div>

            ${item.caption || item.alt ? `
                <div class="detail-section">
                    <h4>Description</h4>
                    ${item.caption ? `<p>${item.caption}</p>` : ''}
                    ${item.alt ? `<p class="text-muted">Alt: ${item.alt}</p>` : ''}
                </div>
            ` : ''}

            ${item.tags && item.tags.length > 0 ? `
                <div class="detail-section">
                    <h4>Tags</h4>
                    <div class="tags-list">
                        ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="detail-section">
                <h4>URLs</h4>
                <div class="url-list">
                    <div class="url-item">
                        <span class="url-label">Original:</span>
                        <input type="text" value="${window.location.origin}${item.url}" readonly class="url-input" onclick="this.select()">
                    </div>
                    ${item.optimized ? `
                        <div class="url-item">
                            <span class="url-label">Optimized:</span>
                            <input type="text" value="${window.location.origin}${item.optimized}" readonly class="url-input" onclick="this.select()">
                        </div>
                    ` : ''}
                    ${item.thumbnail ? `
                        <div class="url-item">
                            <span class="url-label">Thumbnail:</span>
                            <input type="text" value="${window.location.origin}${item.thumbnail}" readonly class="url-input" onclick="this.select()">
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-actions">
                <button class="btn-danger" onclick="deleteMedia('${item._id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete Media
                </button>
            </div>
        </div>
    `;

    sidebar.classList.add('active');
}

/**
 * Close media detail sidebar
 */
function closeMediaDetail() {
    const sidebar = document.getElementById('mediaDetailSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
    }
}

/**
 * Toggle media selection
 */
function toggleMediaSelection(mediaId) {
    if (selectedMedia.has(mediaId)) {
        selectedMedia.delete(mediaId);
    } else {
        selectedMedia.add(mediaId);
    }

    updateBulkActionsToolbar();
    updateMediaCardSelection(mediaId);
}

/**
 * Update media card selection state
 */
function updateMediaCardSelection(mediaId) {
    const card = document.querySelector(`.media-card[data-id="${mediaId}"]`);
    if (card) {
        const isSelected = selectedMedia.has(mediaId);
        card.classList.toggle('selected', isSelected);
        const checkbox = card.querySelector('.media-checkbox');
        if (checkbox) {
            checkbox.checked = isSelected;
        }
    }
}

/**
 * Select all media
 */
function selectAllMedia() {
    mediaLibrary.forEach(item => {
        selectedMedia.add(item._id);
        updateMediaCardSelection(item._id);
    });
    updateBulkActionsToolbar();
}

/**
 * Deselect all media
 */
function deselectAllMedia() {
    selectedMedia.clear();
    mediaLibrary.forEach(item => {
        updateMediaCardSelection(item._id);
    });
    updateBulkActionsToolbar();
}

/**
 * Update bulk actions toolbar visibility and count
 */
function updateBulkActionsToolbar() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    const countSpan = document.getElementById('selectedCount');

    if (toolbar && countSpan) {
        if (selectedMedia.size > 0) {
            toolbar.style.display = 'flex';
            countSpan.textContent = `${selectedMedia.size} selected`;
        } else {
            toolbar.style.display = 'none';
        }
    }
}

/**
 * Delete single media
 */
async function deleteMedia(mediaId) {
    if (!confirm('Are you sure you want to delete this media file? This action cannot be undone.')) {
        return;
    }

    try {
        await api(`/admin/media/${mediaId}`, {
            method: 'DELETE'
        });

        showNotification('Media deleted successfully', 'success');
        closeMediaDetail();
        loadMediaLibrary();
    } catch (error) {
        console.error('Error deleting media:', error);
        showNotification('Failed to delete media', 'error');
    }
}

/**
 * Bulk delete media
 */
async function bulkDeleteMedia() {
    if (selectedMedia.size === 0) {
        showNotification('No media selected', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedMedia.size} media file(s)? This action cannot be undone.`)) {
        return;
    }

    try {
        const mediaIds = Array.from(selectedMedia);

        await api('/admin/media/bulk-delete', {
            method: 'DELETE',
            body: JSON.stringify({ mediaIds })
        });

        showNotification(`Successfully deleted ${mediaIds.length} media file(s)`, 'success');
        selectedMedia.clear();
        updateBulkActionsToolbar();
        loadMediaLibrary();
    } catch (error) {
        console.error('Error deleting media:', error);
        showNotification('Failed to delete media files', 'error');
    }
}

/**
 * Update pagination
 */
function updateMediaPagination(pagination) {
    const container = document.getElementById('mediaPagination');
    if (!container || !pagination) return;

    const { page, pages, total } = pagination;

    if (pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-buttons">';

    // Previous button
    html += `
        <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">
            Previous
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            html += `
                <button class="pagination-btn ${i === page ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // Next button
    html += `
        <button class="pagination-btn" ${page === pages ? 'disabled' : ''} onclick="changePage(${page + 1})">
            Next
        </button>
    `;

    html += '</div>';
    html += `<div class="pagination-info">Showing page ${page} of ${pages} (${total} total)</div>`;

    container.innerHTML = html;
}

/**
 * Change page
 */
function changePage(page) {
    currentPage = page;
    loadMediaLibrary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== UPLOAD MODAL ==========

/**
 * Open media upload modal
 */
function openMediaUploadModal() {
    const modal = document.getElementById('mediaUploadModal');
    if (modal) {
        modal.classList.add('active');
        loadAlbumsForFilter(); // Refresh albums list
        resetUploadForm();
    }
}

/**
 * Close media upload modal
 */
function closeMediaUploadModal() {
    const modal = document.getElementById('mediaUploadModal');
    if (modal) {
        modal.classList.remove('active');
        resetUploadForm();
    }
}

/**
 * Reset upload form
 */
function resetUploadForm() {
    const form = document.getElementById('mediaUploadForm');
    if (form) {
        form.reset();
    }

    selectedFiles = [];
    updateSelectedFilesList();

    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }

    const progressContainer = document.getElementById('uploadProgressContainer');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

/**
 * Set up upload modal drag & drop and file selection
 */
function setupUploadModal() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('mediaFiles');
    const form = document.getElementById('mediaUploadForm');

    if (!uploadArea || !fileInput) return;

    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileSelection(Array.from(e.target.files));
    });

    // Drag & drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = Array.from(e.dataTransfer.files);
        handleFileSelection(files);
    });

    // Form submit
    if (form) {
        form.addEventListener('submit', handleUploadSubmit);
    }
}

/**
 * Handle file selection
 */
function handleFileSelection(files) {
    // Validate files
    const validFiles = files.filter(file => {
        const isValid = validateFile(file);
        if (!isValid) {
            showNotification(`Invalid file: ${file.name}`, 'error');
        }
        return isValid;
    });

    selectedFiles = [...selectedFiles, ...validFiles];
    updateSelectedFilesList();
}

/**
 * Validate file
 */
function validateFile(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

    if (file.size > maxSize) {
        showNotification(`File too large: ${file.name} (max 100MB)`, 'error');
        return false;
    }

    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
        showNotification(`Invalid file type: ${file.name}`, 'error');
        return false;
    }

    return true;
}

/**
 * Update selected files list display
 */
function updateSelectedFilesList() {
    const listContainer = document.getElementById('selectedFilesList');
    const filesContainer = document.getElementById('selectedFilesContainer');

    if (!listContainer || !filesContainer) return;

    if (selectedFiles.length === 0) {
        listContainer.style.display = 'none';
        return;
    }

    listContainer.style.display = 'block';
    filesContainer.innerHTML = selectedFiles.map((file, index) => `
        <div class="selected-file-item">
            <div class="file-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${file.type.startsWith('image/') ? `
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                    ` : `
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    `}
                </svg>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="btn-icon" onclick="removeSelectedFile(${index})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');
}

/**
 * Remove selected file
 */
function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    updateSelectedFilesList();
}

/**
 * Handle upload form submit
 */
async function handleUploadSubmit(e) {
    e.preventDefault();

    if (selectedFiles.length === 0) {
        showNotification('Please select at least one file', 'error');
        return;
    }

    const albumId = document.getElementById('media-album-select').value;
    if (!albumId) {
        showNotification('Please select an album', 'error');
        return;
    }

    const submitBtn = document.getElementById('uploadSubmitBtn');
    const progressContainer = document.getElementById('uploadProgressContainer');
    const progressList = document.getElementById('uploadProgressList');

    if (submitBtn) submitBtn.disabled = true;
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressList) progressList.innerHTML = '';

    // Upload files one by one
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Add progress item
        const progressItem = document.createElement('div');
        progressItem.className = 'upload-progress-item';
        progressItem.id = `progress-${i}`;
        progressItem.innerHTML = `
            <div class="progress-info">
                <span>${file.name}</span>
                <span class="progress-status">Uploading...</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        if (progressList) progressList.appendChild(progressItem);

        try {
            await uploadSingleFile(file, albumId, i);

            // Update progress item
            const statusSpan = progressItem.querySelector('.progress-status');
            const fillDiv = progressItem.querySelector('.progress-fill');
            if (statusSpan) statusSpan.textContent = 'Complete';
            if (fillDiv) fillDiv.style.width = '100%';
            progressItem.classList.add('success');
        } catch (error) {
            // Update progress item
            const statusSpan = progressItem.querySelector('.progress-status');
            if (statusSpan) statusSpan.textContent = 'Failed';
            progressItem.classList.add('error');
        }
    }

    // All done
    showNotification(`Successfully uploaded ${selectedFiles.length} file(s)`, 'success');

    setTimeout(() => {
        closeMediaUploadModal();
        loadMediaLibrary();
    }, 1500);

    if (submitBtn) submitBtn.disabled = false;
}

/**
 * Upload single file
 */
async function uploadSingleFile(file, albumId, index) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('albumId', albumId);

    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_URL}/admin/media/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMediaLibrary);
} else {
    initMediaLibrary();
}
