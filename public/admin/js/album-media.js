// Album Media Management
// Handles photo upload and management for specific albums

const urlParams = new URLSearchParams(window.location.search);
const albumId = urlParams.get('album');

if (!albumId) {
    window.location.href = '/admin/dashboard.html#albums-section';
}

let currentPhotos = [];
let currentAlbum = null;
let editingPhotoId = null;
let draggedItem = null;

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const mediaGrid = document.getElementById('mediaGrid');
const mediaContainer = document.getElementById('mediaContainer');
const albumTitle = document.getElementById('albumTitle');
const albumDescription = document.getElementById('albumDescription');
const photoCount = document.getElementById('photoCount');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEdit = document.getElementById('cancelEdit');

document.addEventListener('DOMContentLoaded', () => {
    loadAlbumInfo();
    loadPhotos();
    setupEventListeners();
});

function setupEventListeners() {
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    closeEditModal.addEventListener('click', closeEdit);
    cancelEdit.addEventListener('click', closeEdit);
    editModal.querySelector('.modal-backdrop').addEventListener('click', closeEdit);
    editForm.addEventListener('submit', handleEditSubmit);
    mediaGrid.addEventListener('click', handleMediaAction);
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
        albumTitle.textContent = currentAlbum.title;
        albumDescription.textContent = currentAlbum.description || '';
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
        updatePhotoCount();
    } catch (error) {
        console.error('Load photos error:', error);
        showNotification('Failed to load photos', 'error');
        displayPhotos([]);
    }
}

function displayPhotos() {
    if (currentPhotos.length === 0) {
        mediaContainer.innerHTML = '<div class="empty-media"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><h3>No photos yet</h3><p>Upload your first photo using the upload zone above</p></div>';
        return;
    }
    mediaGrid.innerHTML = currentPhotos.map(photo => createPhotoCard(photo)).join('');
    setupDragAndDrop();
}

function createPhotoCard(photo) {
    const thumbnailUrl = (photo.fileSizes && photo.fileSizes.thumbnail && photo.fileSizes.thumbnail.path) || photo.thumbnail || photo.url;
    const fileSize = formatBytes((photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.size) || (photo.metadata && photo.metadata.size) || 0);
    const width = (photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.width) || (photo.metadata && photo.metadata.width) || 0;
    const height = (photo.fileSizes && photo.fileSizes.original && photo.fileSizes.original.height) || (photo.metadata && photo.metadata.height) || 0;
    const dimensions = width + ' × ' + height;
    const filename = photo.originalFilename || (photo.metadata && photo.metadata.filename) || 'Untitled';

    return '<div class="media-item" data-id="' + photo._id + '" draggable="true"><img src="' + thumbnailUrl + '" alt="' + (photo.alt || '') + '" class="media-thumbnail"><div class="media-info"><p class="media-filename">' + filename + '</p><div class="media-meta">' + dimensions + ' " ' + fileSize + '</div></div><div class="media-actions"><button class="media-action-btn" data-action="edit" data-id="' + photo._id + '" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="media-action-btn danger" data-action="delete" data-id="' + photo._id + '" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></div>';
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
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) uploadFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) uploadFiles(files);
    fileInput.value = '';
}

async function uploadFiles(files) {
    uploadProgress.classList.add('active');
    uploadProgress.innerHTML = '';
    for (const file of files) {
        await uploadSingleFile(file);
    }
    setTimeout(() => {
        uploadProgress.classList.remove('active');
        loadPhotos();
    }, 1000);
}

async function uploadSingleFile(file) {
    const progressItem = createProgressItem(file.name);
    uploadProgress.appendChild(progressItem);
    const progressFill = progressItem.querySelector('.progress-fill');
    const statusText = progressItem.querySelector('.progress-status');

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('albumId', albumId);
        const token = localStorage.getItem('token');
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressFill.style.width = percent + '%';
                statusText.textContent = Math.round(percent) + '%';
            }
        });

        await new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    statusText.textContent = 'Complete';
                    progressFill.style.width = '100%';
                    progressItem.style.borderColor = '#10b981';
                    resolve();
                } else {
                    reject(new Error('Upload failed'));
                }
            });
            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.open('POST', API_BASE + '/api/media/upload');
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Upload error:', error);
        statusText.textContent = 'Failed';
        progressItem.style.borderColor = '#ef4444';
        showNotification('Failed to upload ' + file.name, 'error');
    }
}

function createProgressItem(filename) {
    const div = document.createElement('div');
    div.className = 'progress-item';
    div.innerHTML = '<div class="progress-header"><span>' + filename + '</span><span class="progress-status">0%</span></div><div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>';
    return div;
}

function setupDragAndDrop() {
    const items = mediaGrid.querySelectorAll('.media-item');
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
    const afterElement = getDragAfterElement(mediaGrid, e.clientY);
    if (afterElement == null) {
        mediaGrid.appendChild(draggedItem);
    } else {
        mediaGrid.insertBefore(draggedItem, afterElement);
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
    const items = Array.from(mediaGrid.querySelectorAll('.media-item'));
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
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEdit() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    editForm.reset();
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

function updatePhotoCount() {
    photoCount.textContent = currentPhotos.length + ' photo' + (currentPhotos.length !== 1 ? 's' : '');
}

function formatBytes(bytes, decimals) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
