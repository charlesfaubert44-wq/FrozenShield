// Enhanced Album Media Management with Beautiful UI
const urlParams = new URLSearchParams(window.location.search);
const albumId = urlParams.get('album');
if (!albumId) window.location.href = '/admin/dashboard.html#albums-section';

let currentPhotos = [];
let currentAlbum = null;
let editingPhotoId = null;
let draggedItem = null;
let selectedFiles = [];
let uploadQueue = [];
let uploadedCount = 0;
let selectedPhotoIds = new Set();

const elements = {
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    previewGrid: document.getElementById('previewGrid'),
    mediaGrid: document.getElementById('mediaGrid'),
    mediaContainer: document.getElementById('mediaContainer'),
    albumTitle: document.getElementById('albumTitle'),
    albumDescription: document.getElementById('albumDescription'),
    uploadSummary: document.getElementById('uploadSummary'),
    summaryText: document.getElementById('summaryText'),
    summaryProgressFill: document.getElementById('summaryProgressFill'),
    cancelAllBtn: document.getElementById('cancelAllBtn'),
    editModal: document.getElementById('editModal'),
    editForm: document.getElementById('editForm'),
    closeEditModal: document.getElementById('closeEditModal'),
    cancelEdit: document.getElementById('cancelEdit'),
    statTotalPhotos: document.getElementById('statTotalPhotos'),
    statStorage: document.getElementById('statStorage'),
    statLastUpload: document.getElementById('statLastUpload')
};

document.addEventListener('DOMContentLoaded', () => {
    loadAlbumInfo();
    loadPhotos();
    setupEventListeners();
});

function setupEventListeners() {
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);
    elements.closeEditModal.addEventListener('click', closeEdit);
    elements.cancelEdit.addEventListener('click', closeEdit);
    elements.editModal.querySelector('.modal-backdrop').addEventListener('click', closeEdit);
    elements.editForm.addEventListener('submit', handleEditSubmit);
    elements.mediaGrid.addEventListener('click', handleMediaAction);
    elements.mediaGrid.addEventListener('change', handleCheckboxChange);
    elements.cancelAllBtn.addEventListener('click', cancelAllUploads);

    // Create and add bulk actions toolbar
    const bulkToolbar = document.createElement('div');
    bulkToolbar.id = 'bulkActionsToolbar';
    bulkToolbar.className = 'bulk-actions-toolbar';
    bulkToolbar.style.display = 'none';
    bulkToolbar.innerHTML = `
        <div class="bulk-actions-content">
            <div class="bulk-selection-info">
                <input type="checkbox" id="selectAllCheckbox">
                <span id="selectionCount">0 selected</span>
            </div>
            <div class="bulk-actions-buttons">
                <button id="deselectAllBtn" class="btn-secondary">Deselect All</button>
                <button id="deleteSelectedBtn" class="btn-danger">Delete Selected</button>
            </div>
        </div>
    `;
    elements.mediaContainer.insertBefore(bulkToolbar, elements.mediaGrid);

    // Bulk action event listeners
    document.getElementById('selectAllCheckbox').addEventListener('change', handleSelectAll);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
}

async function loadAlbumInfo() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE + '/api/admin/albums/' + albumId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Failed to load album');
        const data = await response.json();
        currentAlbum = data.data;
        elements.albumTitle.textContent = currentAlbum.title;
        elements.albumDescription.textContent = currentAlbum.description || '';
    } catch (error) {
        console.error('Load album error:', error);
        showNotification('Failed to load album information', 'error');
    }
}

async function loadPhotos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE + '/api/media/album/' + albumId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Failed to load photos');
        const data = await response.json();
        currentPhotos = data.data || [];
        displayPhotos();
        updateStats();
    } catch (error) {
        console.error('Load photos error:', error);
        showNotification('Failed to load photos', 'error');
        displayPhotos([]);
    }
}

function displayPhotos() {
    if (currentPhotos.length === 0) {
        elements.mediaContainer.innerHTML = '<div class="empty-state"><svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><h3>No photos yet</h3><p>Upload your first photo using the upload zone above</p></div>';
        return;
    }
    elements.mediaGrid.innerHTML = currentPhotos.map(photo => createPhotoCard(photo)).join('');
    setupDragAndDrop();
}

function createPhotoCard(photo) {
    const thumbnailUrl = (photo.fileSizes && photo.fileSizes.thumbnail && photo.fileSizes.thumbnail.path) || photo.thumbnail || photo.url;
    const fileSize = formatBytes((photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.size) || (photo.metadata && photo.metadata.size) || 0);
    const width = (photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.width) || (photo.metadata && photo.metadata.width) || 0;
    const height = (photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.height) || (photo.metadata && photo.metadata.height) || 0;
    const dimensions = width + ' × ' + height;
    const filename = photo.originalFilename || (photo.metadata && photo.metadata.filename) || 'Untitled';
    const isSelected = selectedPhotoIds.has(photo._id);

    return `<div class="media-item ${isSelected ? 'selected' : ''}" data-id="${photo._id}" draggable="true">
        <div class="media-select-checkbox">
            <input type="checkbox" class="photo-checkbox" data-photo-id="${photo._id}" ${isSelected ? 'checked' : ''}>
        </div>
        <div class="media-thumbnail-container">
            <img src="${thumbnailUrl}" alt="${photo.alt || ''}" class="media-thumbnail">
            <div class="media-actions">
                <button class="media-action-btn" data-action="edit" data-id="${photo._id}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="media-action-btn danger" data-action="delete" data-id="${photo._id}" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="media-info">
            <p class="media-filename">${filename}</p>
            <div class="media-meta">${dimensions} · ${fileSize}</div>
        </div>
    </div>`;
}

function handleMediaAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'edit') openEditModal(id);
    else if (action === 'delete') deletePhoto(id);
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) addFilesToQueue(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) addFilesToQueue(files);
    elements.fileInput.value = '';
}

function addFilesToQueue(files) {
    selectedFiles = [...selectedFiles, ...files];
    renderPreviews();
    startUploads();
}

function renderPreviews() {
    elements.previewGrid.innerHTML = selectedFiles.map((file, index) => createPreviewCard(file, index)).join('');
}

function createPreviewCard(file, index) {
    const fileSize = formatBytes(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
        const card = document.querySelector('[data-preview-index="' + index + '"]');
        if (card) {
            const img = card.querySelector('.preview-image');
            if (img) img.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);

    return '<div class="preview-card" data-preview-index="' + index + '"><div class="preview-image-container"><img class="preview-image" src="" alt="Preview"><button class="preview-remove" data-remove-index="' + index + '">�</button><div class="preview-progress"><svg class="progress-ring" viewBox="0 0 60 60"><circle class="progress-ring-circle" cx="30" cy="30" r="26" stroke-dasharray="163.36" stroke-dashoffset="0"></circle></svg><span class="progress-text">0%</span></div><div class="preview-status"><div class="status-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div></div></div><div class="preview-info"><p class="preview-filename">' + file.name + '</p><p class="preview-size">' + fileSize + '</p></div></div>';
}

document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-index]');
    if (removeBtn) {
        const index = parseInt(removeBtn.dataset.removeIndex);
        removeFileFromQueue(index);
    }
});

function removeFileFromQueue(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
    if (selectedFiles.length === 0) {
        elements.uploadSummary.classList.remove('active');
    }
}

async function startUploads() {
    if (uploadQueue.length > 0) return;
    uploadQueue = [...selectedFiles];
    uploadedCount = 0;
    elements.uploadSummary.classList.add('active');

    for (let i = 0; i < uploadQueue.length; i++) {
        await uploadSingleFile(uploadQueue[i], i);
    }

    setTimeout(() => {
        elements.uploadSummary.classList.remove('active');
        selectedFiles = [];
        uploadQueue = [];
        elements.previewGrid.innerHTML = '';
        loadPhotos();
    }, 1500);
}

async function uploadSingleFile(file, index) {
    const card = document.querySelector('[data-preview-index="' + index + '"]');
    if (!card) return;

    card.classList.add('uploading');
    const progressCircle = card.querySelector('.progress-ring-circle');
    const progressText = card.querySelector('.progress-text');
    const circumference = 163.36;

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('albumId', albumId);
        const token = localStorage.getItem('token');
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                const offset = circumference - (percent / 100) * circumference;
                if (progressCircle) progressCircle.style.strokeDashoffset = offset;
                if (progressText) progressText.textContent = Math.round(percent) + '%';
                updateSummary();
            }
        });

        await new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    uploadedCount++;
                    card.classList.remove('uploading');
                    card.classList.add('success');
                    updateSummary();
                    resolve();
                } else {
                    card.classList.add('error');
                    reject(new Error('Upload failed'));
                }
            });
            xhr.addEventListener('error', () => {
                card.classList.add('error');
                reject(new Error('Network error'));
            });
            xhr.open('POST', API_BASE + '/api/media/upload');
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Upload error:', error);
        card.classList.add('error');
    }
}

function updateSummary() {
    const total = uploadQueue.length;
    const percent = (uploadedCount / total) * 100;
    elements.summaryText.textContent = 'Uploading ' + uploadedCount + ' of ' + total + ' photos...';
    elements.summaryProgressFill.style.width = percent + '%';
}

function cancelAllUploads() {
    uploadQueue = [];
    selectedFiles = [];
    elements.previewGrid.innerHTML = '';
    elements.uploadSummary.classList.remove('active');
}

function setupDragAndDrop() {
    const items = elements.mediaGrid.querySelectorAll('.media-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOverItem);
        item.addEventListener('drop', handleDropItem);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
    savePhotoOrder();
}

function handleDragOverItem(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const afterElement = getDragAfterElement(elements.mediaGrid, e.clientY);
    if (afterElement == null) {
        elements.mediaGrid.appendChild(draggedItem);
    } else {
        elements.mediaGrid.insertBefore(draggedItem, afterElement);
    }
    return false;
}

function handleDropItem(e) {
    if (e.stopPropagation) e.stopPropagation();
    return false;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.media-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function savePhotoOrder() {
    const items = Array.from(elements.mediaGrid.querySelectorAll('.media-item'));
    const mediaOrder = items.map((item, index) => ({ mediaId: item.dataset.id, order: index }));

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE + '/api/media/reorder', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ albumId, mediaOrder })
        });
        if (!response.ok) throw new Error('Failed to save order');
        showNotification('Photo order updated', 'success');
    } catch (error) {
        console.error('Save order error:', error);
        showNotification('Failed to save photo order', 'error');
    }
}

function openEditModal(photoId) {
    const photo = currentPhotos.find(p => p._id === photoId);
    if (!photo) return;
    editingPhotoId = photoId;
    document.getElementById('photoCaption').value = photo.caption || '';
    document.getElementById('photoAlt').value = photo.alt || '';
    document.getElementById('photoTags').value = photo.tags ? photo.tags.join(', ') : '';
    elements.editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEdit() {
    elements.editModal.classList.remove('active');
    document.body.style.overflow = '';
    elements.editForm.reset();
    editingPhotoId = null;
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const caption = document.getElementById('photoCaption').value.trim();
    const alt = document.getElementById('photoAlt').value.trim();
    const tagsInput = document.getElementById('photoTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE + '/api/media/' + editingPhotoId, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caption, alt, tags })
        });
        if (!response.ok) throw new Error('Failed to update photo');
        showNotification('Photo updated successfully', 'success');
        closeEdit();
        loadPhotos();
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Failed to update photo', 'error');
    }
}

async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE + '/api/media/' + photoId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!response.ok) throw new Error('Failed to delete photo');
        showNotification('Photo deleted successfully', 'success');
        loadPhotos();
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Failed to delete photo', 'error');
    }
}

function updateStats() {
    elements.statTotalPhotos.textContent = currentPhotos.length;

    const totalSize = currentPhotos.reduce((sum, photo) => {
        return sum + ((photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.size) || (photo.metadata && photo.metadata.size) || 0);
    }, 0);
    elements.statStorage.textContent = formatBytes(totalSize);

    if (currentPhotos.length > 0) {
        const latestPhoto = currentPhotos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
        const timeSince = getTimeSince(new Date(latestPhoto.uploadedAt));
        elements.statLastUpload.textContent = timeSince;
    } else {
        elements.statLastUpload.textContent = 'Never';
    }
}

function getTimeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [name, secs] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secs);
        if (interval >= 1) {
            return interval + ' ' + name + (interval > 1 ? 's' : '') + ' ago';
        }
    }
    return 'Just now';
}

// Multi-select functionality
function handleCheckboxChange(e) {
    if (!e.target.classList.contains('photo-checkbox')) return;
    const photoId = e.target.dataset.photoId;
    const mediaItem = e.target.closest('.media-item');

    if (e.target.checked) {
        selectedPhotoIds.add(photoId);
        mediaItem.classList.add('selected');
    } else {
        selectedPhotoIds.delete(photoId);
        mediaItem.classList.remove('selected');
    }

    updateBulkActionsToolbar();
}

function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.photo-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const photoId = checkbox.dataset.photoId;
        const mediaItem = checkbox.closest('.media-item');

        if (e.target.checked) {
            selectedPhotoIds.add(photoId);
            mediaItem.classList.add('selected');
        } else {
            selectedPhotoIds.delete(photoId);
            mediaItem.classList.remove('selected');
        }
    });

    updateBulkActionsToolbar();
}

function deselectAll() {
    selectedPhotoIds.clear();
    document.querySelectorAll('.photo-checkbox').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('.media-item').forEach(item => item.classList.remove('selected'));
    updateBulkActionsToolbar();
}

function updateBulkActionsToolbar() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    const countEl = document.getElementById('selectionCount');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');

    if (selectedPhotoIds.size > 0) {
        toolbar.style.display = 'block';
        countEl.textContent = `${selectedPhotoIds.size} selected`;
        selectAllCheckbox.checked = selectedPhotoIds.size === currentPhotos.length;
    } else {
        toolbar.style.display = 'none';
        selectAllCheckbox.checked = false;
    }
}

async function deleteSelected() {
    if (selectedPhotoIds.size === 0) return;

    const count = selectedPhotoIds.size;
    if (!confirm(`Are you sure you want to delete ${count} photo${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
        return;
    }

    const deleteBtn = document.getElementById('deleteSelectedBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = `Deleting...`;

    let deletedCount = 0;
    let errorCount = 0;

    for (const photoId of selectedPhotoIds) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_BASE + '/api/media/' + photoId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                deletedCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error('Error deleting photo:', photoId, error);
            errorCount++;
        }
    }

    // Clear selection and reload
    selectedPhotoIds.clear();
    await loadPhotos();
    updateBulkActionsToolbar();

    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Delete Selected';

    if (deletedCount > 0) {
        showNotification(`Successfully deleted ${deletedCount} photo${deletedCount > 1 ? 's' : ''}`, 'success');
    }
    if (errorCount > 0) {
        showNotification(`Failed to delete ${errorCount} photo${errorCount > 1 ? 's' : ''}`, 'error');
    }
}

function formatBytes(bytes, decimals) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
