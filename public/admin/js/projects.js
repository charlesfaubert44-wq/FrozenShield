// Projects Management JavaScript
// Handles project CRUD operations with rich text editor and multi-image gallery

// API Configuration
const API_BASE = window.location.origin;
let currentPage = 1;
let currentSearch = '';
let currentFilters = {};
let isEditMode = false;
let currentProjectId = null;
let quillEditor = null;
let technologies = [];
let galleryImages = [];

// DOM Elements
let projectsList;
let projectsPagination;
let projectSearch;
let projectFilterCategory;
let projectFilterVisibility;
let projectFilterFeatured;
let projectModal;
let projectForm;
let projectModalTitle;
let techChips;
let techInput;
let galleryItems;
let shortDescTextarea;
let shortDescCharCount;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    initializeQuill();
    // Don't auto-load - wait for section to be activated
});

// Initialize DOM elements
function initializeElements() {
    projectsList = document.getElementById('projectsList');
    projectsPagination = document.getElementById('projectsPagination');
    projectSearch = document.getElementById('project-search');
    projectFilterCategory = document.getElementById('project-filter-category');
    projectFilterVisibility = document.getElementById('project-filter-visibility');
    projectFilterFeatured = document.getElementById('project-filter-featured');
    projectModal = document.getElementById('projectModal');
    projectForm = document.getElementById('projectForm');
    projectModalTitle = document.getElementById('projectModalTitle');
    techChips = document.getElementById('techChips');
    techInput = document.getElementById('tech-input');
    galleryItems = document.getElementById('galleryItems');
    shortDescTextarea = document.getElementById('project-short-description');
    shortDescCharCount = document.getElementById('shortDescCharCount');
}

// Initialize Quill rich text editor
function initializeQuill() {
    const editorElement = document.getElementById('project-long-description');
    if (editorElement && !quillEditor) {
        quillEditor = new Quill('#project-long-description', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Detailed project description with formatting...'
        });

        // Style the editor for dark theme
        styleQuillForDarkTheme();
    }
}

// Style Quill editor for dark theme
function styleQuillForDarkTheme() {
    const style = document.createElement('style');
    style.textContent = `
        .ql-toolbar.ql-snow {
            background: var(--bg-tertiary);
            border-color: var(--border-color);
            border-radius: 8px 8px 0 0;
        }
        .ql-container.ql-snow {
            background: var(--bg-tertiary);
            border-color: var(--border-color);
            border-radius: 0 0 8px 8px;
            color: var(--text-primary);
            min-height: 200px;
        }
        .ql-editor.ql-blank::before {
            color: var(--text-muted);
        }
        .ql-snow .ql-stroke {
            stroke: var(--text-secondary);
        }
        .ql-snow .ql-fill {
            fill: var(--text-secondary);
        }
        .ql-snow .ql-picker-label {
            color: var(--text-secondary);
        }
        .ql-toolbar.ql-snow .ql-picker-label:hover,
        .ql-toolbar.ql-snow button:hover {
            color: var(--text-primary);
        }
        .ql-toolbar.ql-snow .ql-picker-label:hover .ql-stroke,
        .ql-toolbar.ql-snow button:hover .ql-stroke {
            stroke: var(--text-primary);
        }
        .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .ql-snow .ql-toolbar button.ql-active .ql-fill {
            stroke: #667eea;
            fill: #667eea;
        }
        .ql-editor {
            font-size: 14px;
            line-height: 1.6;
        }
    `;
    document.head.appendChild(style);
}

// Setup event listeners
function setupEventListeners() {
    // Search input with debounce
    if (projectSearch) {
        projectSearch.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadProjects();
        }, 500));
    }

    // Filter changes
    if (projectFilterCategory) {
        projectFilterCategory.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            currentPage = 1;
            loadProjects();
        });
    }

    if (projectFilterVisibility) {
        projectFilterVisibility.addEventListener('change', (e) => {
            currentFilters.visibility = e.target.value;
            currentPage = 1;
            loadProjects();
        });
    }

    if (projectFilterFeatured) {
        projectFilterFeatured.addEventListener('change', (e) => {
            currentFilters.featured = e.target.value;
            currentPage = 1;
            loadProjects();
        });
    }

    // Form submission
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }

    // Technology input
    if (techInput) {
        techInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTechnology();
            }
        });
    }

    // Short description character count
    if (shortDescTextarea) {
        shortDescTextarea.addEventListener('input', updateCharCount);
    }

    // Close modal on backdrop click
    const backdrop = projectModal?.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeProjectModal);
    }

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectModal?.classList.contains('active')) {
            closeProjectModal();
        }
    });
}

// Update character count
function updateCharCount() {
    const count = shortDescTextarea.value.length;
    shortDescCharCount.textContent = `${count}/200`;
}

// Load projects from API
async function loadProjects(page = currentPage, search = currentSearch, filters = currentFilters) {
    try {
        showLoadingState();

        const token = localStorage.getItem('authToken');
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

        const response = await fetch(`${API_BASE}/api/admin/projects?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/admin/login.html';
                return;
            }
            throw new Error('Failed to load projects');
        }

        const data = await response.json();
        displayProjects(data.data || []);
        displayPagination(data.pagination || { page: 1, pages: 1 });

    } catch (error) {
        console.error('Load projects error:', error);
        showNotification('Failed to load projects: ' + error.message, 'error');
        displayProjects([]);
    } finally {
        hideLoadingState();
    }
}

// Display projects in grid
function displayProjects(projects) {
    if (!projectsList) return;

    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <p>No projects found</p>
                <button class="btn-primary" onclick="openCreateProjectModal()">Create Your First Project</button>
            </div>
        `;
        return;
    }

    projectsList.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

// Create project card HTML
function createProjectCard(project) {
    const thumbnail = project.thumbnail || '/images/placeholder-project.jpg';
    const featuredBadge = project.featured ? '<span class="badge-featured">Featured</span>' : '';
    const visibilityClass = project.visibility || 'public';
    const category = project.category || 'Uncategorized';
    const technologies = project.technologies || [];
    const techBadges = technologies.slice(0, 3).map(tech =>
        `<span class="tech-badge">${escapeHtml(tech)}</span>`
    ).join('');
    const moreTech = technologies.length > 3 ? `<span class="tech-badge">+${technologies.length - 3}</span>` : '';

    return `
        <div class="project-card" data-id="${project._id}">
            <div class="project-thumbnail" style="background-image: url('${thumbnail}')">
                ${featuredBadge}
            </div>
            <div class="project-info">
                <h4>${escapeHtml(project.title)}</h4>
                <p class="project-short-desc">${escapeHtml(project.shortDescription || project.description || '')}</p>
                <div class="project-meta">
                    <span class="badge badge-category">${category}</span>
                    <span class="badge badge-${visibilityClass}">${visibilityClass}</span>
                </div>
                <div class="project-tech">
                    ${techBadges}${moreTech}
                </div>
            </div>
            <div class="project-actions">
                ${project.projectUrl ? `
                <button onclick="window.open('${project.projectUrl}', '_blank')" class="btn-view" title="View Live Site">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Live
                </button>
                ` : ''}
                <button onclick="editProject('${project._id}')" class="btn-edit" title="Edit Project">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button onclick="toggleFeatured('${project._id}', ${!project.featured})" class="btn-secondary" title="Toggle Featured">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    ${project.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onclick="deleteProject('${project._id}')" class="btn-danger" title="Delete Project">
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
    if (!projectsPagination) return;

    const { page, pages } = pagination;

    if (pages <= 1) {
        projectsPagination.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination-controls">';

    // Previous button
    if (page > 1) {
        paginationHTML += `<button onclick="changePage(${page - 1})" class="page-btn">Previous</button>`;
    }

    // Page numbers
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            const activeClass = i === page ? 'active' : '';
            paginationHTML += `<button onclick="changeProjectPage(${i})" class="page-btn ${activeClass}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }

    // Next button
    if (page < pages) {
        paginationHTML += `<button onclick="changeProjectPage(${page + 1})" class="page-btn">Next</button>`;
    }

    paginationHTML += '</div>';
    projectsPagination.innerHTML = paginationHTML;
}

// Change page
function changeProjectPage(page) {
    currentPage = page;
    loadProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open create project modal
async function openCreateProjectModal() {
    isEditMode = false;
    currentProjectId = null;
    technologies = [];
    galleryImages = [];

    if (projectModalTitle) {
        projectModalTitle.textContent = 'Create Project';
    }

    if (projectForm) {
        projectForm.reset();
    }

    if (quillEditor) {
        quillEditor.setText('');
    }

    renderTechChips();
    renderGalleryItems();
    updateCharCount();

    await loadAlbumsForDropdown();
    showModal();
}

// Load albums for dropdown
async function loadAlbumsForDropdown() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/admin/albums?limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const albumSelect = document.getElementById('project-album');
            if (albumSelect && data.data) {
                albumSelect.innerHTML = '<option value="">No album</option>';
                data.data.forEach(album => {
                    albumSelect.innerHTML += `<option value="${album._id}">${escapeHtml(album.title)}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Failed to load albums:', error);
    }
}

// Edit project
async function editProject(projectId) {
    try {
        isEditMode = true;
        currentProjectId = projectId;

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/admin/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load project details');
        }

        const { data } = await response.json();

        // Populate form
        if (projectForm) {
            projectForm.elements.title.value = data.title || '';
            projectForm.elements.shortDescription.value = data.shortDescription || data.description || '';
            projectForm.elements.thumbnail.value = data.thumbnail || '';
            projectForm.elements.category.value = data.category || '';
            projectForm.elements.projectUrl.value = data.projectUrl || '';
            projectForm.elements.githubUrl.value = data.githubUrl || '';
            projectForm.elements.client.value = data.client || '';
            projectForm.elements.completedDate.value = data.completedDate ? data.completedDate.split('T')[0] : '';
            projectForm.elements.albumId.value = data.albumId || '';
            projectForm.elements.visibility.value = data.visibility || 'public';
            projectForm.elements.featured.checked = data.featured || false;
        }

        // Set rich text content
        if (quillEditor && data.longDescription) {
            quillEditor.root.innerHTML = data.longDescription;
        }

        // Set technologies
        technologies = data.technologies || [];
        renderTechChips();

        // Set gallery images
        galleryImages = data.images || [];
        renderGalleryItems();

        updateCharCount();

        if (projectModalTitle) {
            projectModalTitle.textContent = 'Edit Project';
        }

        await loadAlbumsForDropdown();
        showModal();

    } catch (error) {
        console.error('Edit project error:', error);
        showNotification('Failed to load project: ' + error.message, 'error');
    }
}

// Handle project form submission
async function handleProjectSubmit(e) {
    e.preventDefault();

    try {
        const formData = new FormData(projectForm);

        // Get rich text content
        const longDescription = quillEditor ? quillEditor.root.innerHTML : '';

        const projectData = {
            title: formData.get('title').trim(),
            shortDescription: formData.get('shortDescription').trim(),
            longDescription: longDescription,
            thumbnail: formData.get('thumbnail').trim(),
            images: galleryImages,
            technologies: technologies,
            category: formData.get('category'),
            projectUrl: formData.get('projectUrl').trim(),
            githubUrl: formData.get('githubUrl').trim(),
            client: formData.get('client').trim(),
            completedDate: formData.get('completedDate'),
            albumId: formData.get('albumId') || null,
            visibility: formData.get('visibility'),
            featured: formData.get('featured') === 'on'
        };

        // Validate
        if (!projectData.title) {
            showNotification('Project title is required', 'error');
            return;
        }

        if (!projectData.shortDescription) {
            showNotification('Short description is required', 'error');
            return;
        }

        const token = localStorage.getItem('authToken');
        const url = isEditMode
            ? `${API_BASE}/api/admin/projects/${currentProjectId}`
            : `${API_BASE}/api/admin/projects`;

        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save project');
        }

        showNotification(
            isEditMode ? 'Project updated successfully' : 'Project created successfully',
            'success'
        );

        closeProjectModal();
        loadProjects();

    } catch (error) {
        console.error('Save project error:', error);
        showNotification('Failed to save project: ' + error.message, 'error');
    }
}

// Delete project
async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/admin/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete project');
        }

        showNotification('Project deleted successfully', 'success');
        loadProjects();

    } catch (error) {
        console.error('Delete project error:', error);
        showNotification('Failed to delete project: ' + error.message, 'error');
    }
}

// Toggle featured status
async function toggleFeatured(projectId, featured) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/admin/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ featured })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update project');
        }

        showNotification(
            featured ? 'Project featured successfully' : 'Project unfeatured',
            'success'
        );
        loadProjects();

    } catch (error) {
        console.error('Toggle featured error:', error);
        showNotification('Failed to update project: ' + error.message, 'error');
    }
}

// Technology management
function addTechnology() {
    const tech = techInput.value.trim();
    if (tech && !technologies.includes(tech)) {
        technologies.push(tech);
        renderTechChips();
        techInput.value = '';
    }
}

function removeTechnology(tech) {
    technologies = technologies.filter(t => t !== tech);
    renderTechChips();
}

function renderTechChips() {
    if (!techChips) return;

    techChips.innerHTML = technologies.map(tech => `
        <div class="tech-chip">
            <span>${escapeHtml(tech)}</span>
            <button type="button" onclick="removeTechnology('${escapeHtml(tech)}')" class="tech-chip-remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
}

// Gallery management
function addGalleryImage() {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl && imageUrl.trim()) {
        const caption = prompt('Enter image caption (optional):') || '';
        galleryImages.push({
            url: imageUrl.trim(),
            caption: caption.trim()
        });
        renderGalleryItems();
    }
}

function removeGalleryImage(index) {
    galleryImages.splice(index, 1);
    renderGalleryItems();
}

function moveGalleryImage(index, direction) {
    if (direction === 'up' && index > 0) {
        [galleryImages[index], galleryImages[index - 1]] = [galleryImages[index - 1], galleryImages[index]];
        renderGalleryItems();
    } else if (direction === 'down' && index < galleryImages.length - 1) {
        [galleryImages[index], galleryImages[index + 1]] = [galleryImages[index + 1], galleryImages[index]];
        renderGalleryItems();
    }
}

function renderGalleryItems() {
    if (!galleryItems) return;

    if (galleryImages.length === 0) {
        galleryItems.innerHTML = '<p class="gallery-empty">No images added yet</p>';
        return;
    }

    galleryItems.innerHTML = galleryImages.map((img, index) => `
        <div class="gallery-item">
            <div class="gallery-item-preview" style="background-image: url('${img.url}')"></div>
            <div class="gallery-item-info">
                <input type="text" value="${escapeHtml(img.caption)}"
                       onchange="updateGalleryCaption(${index}, this.value)"
                       placeholder="Image caption..."
                       class="gallery-caption-input">
                <div class="gallery-item-actions">
                    <button type="button" onclick="moveGalleryImage(${index}, 'up')"
                            class="btn-icon" title="Move up" ${index === 0 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                    <button type="button" onclick="moveGalleryImage(${index}, 'down')"
                            class="btn-icon" title="Move down" ${index === galleryImages.length - 1 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <button type="button" onclick="removeGalleryImage(${index})"
                            class="btn-icon btn-icon-danger" title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateGalleryCaption(index, caption) {
    if (galleryImages[index]) {
        galleryImages[index].caption = caption;
    }
}

// Modal functions
function showModal() {
    if (projectModal) {
        projectModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeProjectModal() {
    if (projectModal) {
        projectModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (projectForm) {
        projectForm.reset();
    }

    if (quillEditor) {
        quillEditor.setText('');
    }

    technologies = [];
    galleryImages = [];
    renderTechChips();
    renderGalleryItems();

    isEditMode = false;
    currentProjectId = null;
}

// Utility functions
function showLoadingState() {
    if (projectsList) {
        projectsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading projects...</p>
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
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Make functions globally available
window.openCreateProjectModal = openCreateProjectModal;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.toggleFeatured = toggleFeatured;
window.closeProjectModal = closeProjectModal;
window.changeProjectPage = changeProjectPage;
window.addGalleryImage = addGalleryImage;
window.removeGalleryImage = removeGalleryImage;
window.moveGalleryImage = moveGalleryImage;
window.updateGalleryCaption = updateGalleryCaption;
window.removeTechnology = removeTechnology;
window.loadProjects = loadProjects;
