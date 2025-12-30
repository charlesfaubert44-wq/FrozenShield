// Media Management Extension for Admin Dashboard
// This file extends admin.js with media upload and gallery functionality

// Global variables for media management
let currentProjectMedia = [];
let draggedMediaIndex = null;

// Initialize media upload functionality
function initializeMediaUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('media-file-input');
    const addUrlBtn = document.getElementById('add-media-url-btn');
    const urlInput = document.getElementById('media-url-input');

    // Click to browse files
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
        fileInput.value = ''; // Reset
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        handleFileUpload(e.dataTransfer.files);
    });

    // Add URL button
    addUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            addMediaFromUrl(url);
            urlInput.value = '';
        }
    });

    // Enter key in URL input
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const url = urlInput.value.trim();
            if (url) {
                addMediaFromUrl(url);
                urlInput.value = '';
            }
        }
    });
}

// Handle file uploads
async function handleFileUpload(files) {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
        // Check if it's an image or video
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            alert(`${file.name} is not a valid image or video file`);
            continue;
        }

        // For demo purposes, we'll convert to base64 data URL
        // In production, you'd upload to a server/CDN
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            const type = file.type.startsWith('image/') ? 'image' : 'video';
            addMediaToGallery({ url, type, caption: file.name });
        };
        reader.readAsDataURL(file);
    }
}

// Add media from URL
function addMediaFromUrl(url) {
    try {
        new URL(url); // Validate URL

        // Determine type based on URL extension
        const ext = url.split('.').pop().toLowerCase().split('?')[0];
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const videoExts = ['mp4', 'webm', 'ogg', 'mov'];

        let type = 'image';
        if (videoExts.includes(ext)) {
            type = 'video';
        }

        addMediaToGallery({ url, type, caption: '' });
    } catch (error) {
        alert('Please enter a valid URL');
    }
}

// Add media item to gallery
function addMediaToGallery(mediaData) {
    currentProjectMedia.push({
        ...mediaData,
        order: currentProjectMedia.length,
        _id: `temp-${Date.now()}-${Math.random()}`
    });
    renderMediaGallery();
}

// Render media gallery
function renderMediaGallery() {
    const gallery = document.getElementById('media-gallery');

    if (currentProjectMedia.length === 0) {
        gallery.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">No media added yet</p>';
        return;
    }

    // Sort by order
    const sortedMedia = [...currentProjectMedia].sort((a, b) => a.order - b.order);

    gallery.innerHTML = sortedMedia.map((media, index) => `
        <div class="media-item" data-index="${index}" data-id="${media._id}" draggable="true">
            <span class="media-order-badge">${index + 1}</span>
            ${index === 0 ? '<span class="cover-badge">COVER</span>' : ''}
            ${media.type === 'image' ? `
                <img src="${media.url}" alt="${media.caption}" class="media-preview" />
            ` : `
                <div class="media-preview video">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                    </svg>
                </div>
            `}
            <input
                type="text"
                class="media-caption"
                placeholder="Caption (optional)"
                value="${media.caption || ''}"
                data-id="${media._id}"
            />
            <div class="media-actions">
                <button type="button" class="btn-move-left" data-id="${media._id}" ${index === 0 ? 'disabled' : ''}>
                    ←
                </button>
                <button type="button" class="btn-move-right" data-id="${media._id}" ${index === sortedMedia.length - 1 ? 'disabled' : ''}>
                    →
                </button>
                <button type="button" class="btn-delete-media" data-id="${media._id}">
                    ×
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    attachMediaEventListeners();
}

// Attach event listeners to media items
function attachMediaEventListeners() {
    const gallery = document.getElementById('media-gallery');

    // Caption changes
    gallery.querySelectorAll('.media-caption').forEach(input => {
        input.addEventListener('input', (e) => {
            const mediaId = e.target.dataset.id;
            const media = currentProjectMedia.find(m => m._id === mediaId);
            if (media) {
                media.caption = e.target.value;
            }
        });
    });

    // Delete buttons
    gallery.querySelectorAll('.btn-delete-media').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mediaId = btn.dataset.id;
            deleteMediaItem(mediaId);
        });
    });

    // Move left buttons
    gallery.querySelectorAll('.btn-move-left').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mediaId = btn.dataset.id;
            moveMediaItem(mediaId, -1);
        });
    });

    // Move right buttons
    gallery.querySelectorAll('.btn-move-right').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mediaId = btn.dataset.id;
            moveMediaItem(mediaId, 1);
        });
    });

    // Drag and drop for reordering
    const mediaItems = gallery.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

// Delete media item
function deleteMediaItem(mediaId) {
    currentProjectMedia = currentProjectMedia.filter(m => m._id !== mediaId);
    // Reorder remaining items
    currentProjectMedia.forEach((m, i) => m.order = i);
    renderMediaGallery();
}

// Move media item
function moveMediaItem(mediaId, direction) {
    const index = currentProjectMedia.findIndex(m => m._id === mediaId);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentProjectMedia.length) return;

    // Swap
    [currentProjectMedia[index], currentProjectMedia[newIndex]] =
    [currentProjectMedia[newIndex], currentProjectMedia[index]];

    // Update order
    currentProjectMedia.forEach((m, i) => m.order = i);
    renderMediaGallery();
}

// Drag and drop handlers
function handleDragStart(e) {
    draggedMediaIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.currentTarget.dataset.index);

    if (draggedMediaIndex !== null && draggedMediaIndex !== targetIndex) {
        // Reorder media array
        const draggedItem = currentProjectMedia[draggedMediaIndex];
        currentProjectMedia.splice(draggedMediaIndex, 1);
        currentProjectMedia.splice(targetIndex, 0, draggedItem);

        // Update order
        currentProjectMedia.forEach((m, i) => m.order = i);
        renderMediaGallery();
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedMediaIndex = null;
}

// Override the existing openProjectModal function
const originalOpenProjectModal = window.openProjectModal || openProjectModal;
window.openProjectModal = function(project = null) {
    // Call original function
    if (originalOpenProjectModal) {
        originalOpenProjectModal(project);
    }

    // Initialize media upload if not already done
    if (!window.mediaUploadInitialized) {
        initializeMediaUpload();
        window.mediaUploadInitialized = true;
    }

    // Load project media if editing
    if (project && project.media) {
        currentProjectMedia = project.media.map(m => ({
            ...m,
            _id: m._id || `temp-${Date.now()}-${Math.random()}`
        }));

        // Fill in new fields
        document.getElementById('project-type').value = project.type || 'other';
        document.getElementById('project-status').value = project.status || 'draft';
        document.getElementById('project-client').value = project.clientName || '';
        document.getElementById('project-invoice').value = project.invoiceId || '';
    } else {
        currentProjectMedia = [];
    }

    renderMediaGallery();
};

// Override the handleProjectSubmit to include new fields
const originalHandleProjectSubmit = window.handleProjectSubmit;
if (!originalHandleProjectSubmit) {
    console.error('handleProjectSubmit not found. Media management may not work correctly.');
}

// Extend the handleProjectSubmit function
document.getElementById('project-form').removeEventListener('submit', handleProjectSubmit);
document.getElementById('project-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const projectId = document.getElementById('project-id').value;
    const projectData = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-description').value,
        type: document.getElementById('project-type').value,
        status: document.getElementById('project-status').value,
        clientName: document.getElementById('project-client').value,
        invoiceId: document.getElementById('project-invoice').value || null,
        imageUrl: document.getElementById('project-image').value || '',
        projectUrl: document.getElementById('project-url').value,
        tags: document.getElementById('project-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        order: parseInt(document.getElementById('project-order').value) || 0,
        featured: document.getElementById('project-featured').checked,
        media: currentProjectMedia.map(m => ({
            url: m.url,
            type: m.type,
            caption: m.caption || '',
            order: m.order
        })),
        coverImage: currentProjectMedia.length > 0 ? currentProjectMedia[0].url : ''
    };

    try {
        const url = projectId ? `${API_URL}/projects/${projectId}` : `${API_URL}/projects`;
        const method = projectId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();

        if (result.success) {
            closeProjectModal();
            loadProjects();
            currentProjectMedia = [];
        } else {
            alert(result.message || 'Failed to save project');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('An error occurred. Please try again.');
    }
});

// Update renderProjects to show new fields
const originalRenderProjects = window.renderProjects;
window.renderProjects = function(projects) {
    const projectsList = document.getElementById('projects-list');

    if (projects.length === 0) {
        projectsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No projects yet. Add your first project!</p>';
        return;
    }

    projectsList.innerHTML = projects.map(project => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <h3>${project.title}</h3>
                    <p>${new Date(project.createdAt).toLocaleDateString()}</p>
                    ${project.clientName ? `<p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">Client: ${project.clientName}</p>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" onclick="editProject('${project._id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProject('${project._id}')">Delete</button>
                </div>
            </div>
            <div class="item-content">
                <p>${project.description}</p>
                ${project.media && project.media.length > 0 ? `
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                        ${project.media.slice(0, 4).map(m =>
                            m.type === 'image'
                            ? `<img src="${m.url}" alt="${m.caption}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />`
                            : `<div style="width: 60px; height: 60px; background: var(--bg-secondary); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
                            </div>`
                        ).join('')}
                        ${project.media.length > 4 ? `<div style="width: 60px; height: 60px; background: var(--bg-secondary); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">+${project.media.length - 4}</div>` : ''}
                    </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin-top: 1rem;">
                ${project.type ? `<span class="tag">${project.type.replace('-', ' ')}</span>` : ''}
                ${project.status ? `<span class="status-badge status-${project.status}">${project.status.toUpperCase()}</span>` : ''}
                ${project.tags.length > 0 ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                ${project.featured ? '<span class="tag" style="background-color: rgba(16, 185, 129, 0.2); color: var(--success);">Featured</span>' : ''}
            </div>
        </div>
    `).join('');
};

console.log('Admin Media Management Extension Loaded');
