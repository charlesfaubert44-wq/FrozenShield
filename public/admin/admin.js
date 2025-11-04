const API_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('adminToken');

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showScreen('login-screen');
    }

    setupEventListeners();
});

// Verify token validity
async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            showScreen('dashboard-screen');
            loadProjects();
        } else {
            localStorage.removeItem('adminToken');
            authToken = null;
            showScreen('login-screen');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        showScreen('login-screen');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login/Register navigation
    document.getElementById('show-register').addEventListener('click', () => {
        showScreen('register-screen');
    });

    document.getElementById('show-login').addEventListener('click', () => {
        showScreen('login-screen');
    });

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation
    document.getElementById('nav-projects').addEventListener('click', () => {
        switchSection('projects');
    });
    document.getElementById('nav-contacts').addEventListener('click', () => {
        switchSection('contacts');
    });

    // Project Management
    document.getElementById('add-project-btn').addEventListener('click', () => {
        openProjectModal();
    });
    document.getElementById('project-form').addEventListener('submit', handleProjectSubmit);
    document.getElementById('cancel-project').addEventListener('click', closeProjectModal);
    document.querySelector('.modal .close').addEventListener('click', closeProjectModal);

    // Close modal when clicking outside
    document.getElementById('project-modal').addEventListener('click', (e) => {
        if (e.target.id === 'project-modal') {
            closeProjectModal();
        }
    });
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            authToken = result.token;
            localStorage.setItem('adminToken', authToken);
            showScreen('dashboard-screen');
            loadProjects();
        } else {
            errorEl.textContent = result.message || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.success) {
            authToken = result.token;
            localStorage.setItem('adminToken', authToken);
            showScreen('dashboard-screen');
            loadProjects();
        } else {
            errorEl.textContent = result.message || 'Registration failed';
        }
    } catch (error) {
        console.error('Register error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    authToken = null;
    showScreen('login-screen');
}

// Section Navigation
function switchSection(section) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`nav-${section}`).classList.add('active');

    // Update sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Load data
    if (section === 'projects') {
        loadProjects();
    } else if (section === 'contacts') {
        loadContacts();
    }
}

// Projects Management
async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`);
        const result = await response.json();

        if (result.success) {
            renderProjects(result.data);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderProjects(projects) {
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
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" onclick="editProject('${project._id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProject('${project._id}')">Delete</button>
                </div>
            </div>
            <div class="item-content">
                <p>${project.description}</p>
            </div>
            ${project.tags.length > 0 ? `
                <div class="item-tags">
                    ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            ${project.featured ? '<span class="tag" style="background-color: rgba(16, 185, 129, 0.2); color: var(--success);">Featured</span>' : ''}
        </div>
    `).join('');
}

function openProjectModal(project = null) {
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('project-form');

    if (project) {
        modalTitle.textContent = 'Edit Project';
        document.getElementById('project-id').value = project._id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-description').value = project.description;
        document.getElementById('project-image').value = project.imageUrl || '';
        document.getElementById('project-url').value = project.projectUrl || '';
        document.getElementById('project-tags').value = project.tags.join(', ');
        document.getElementById('project-order').value = project.order || 0;
        document.getElementById('project-featured').checked = project.featured || false;
    } else {
        modalTitle.textContent = 'Add Project';
        form.reset();
        document.getElementById('project-id').value = '';
    }

    modal.classList.add('active');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

async function handleProjectSubmit(e) {
    e.preventDefault();

    const projectId = document.getElementById('project-id').value;
    const projectData = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-description').value,
        imageUrl: document.getElementById('project-image').value,
        projectUrl: document.getElementById('project-url').value,
        tags: document.getElementById('project-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        order: parseInt(document.getElementById('project-order').value) || 0,
        featured: document.getElementById('project-featured').checked
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
        } else {
            alert(result.message || 'Failed to save project');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        alert('An error occurred. Please try again.');
    }
}

async function editProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`);
        const result = await response.json();

        if (result.success) {
            openProjectModal(result.data);
        }
    } catch (error) {
        console.error('Error loading project:', error);
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            loadProjects();
        } else {
            alert(result.message || 'Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('An error occurred. Please try again.');
    }
}

// Contacts Management
async function loadContacts() {
    try {
        const response = await fetch(`${API_URL}/contact`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json();

        if (result.success) {
            renderContacts(result.data);
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function renderContacts(contacts) {
    const contactsList = document.getElementById('contacts-list');

    if (contacts.length === 0) {
        contactsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No contact submissions yet.</p>';
        return;
    }

    contactsList.innerHTML = contacts.map(contact => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <h3>${contact.name}</h3>
                    <p>${contact.email}</p>
                </div>
                <div class="item-actions">
                    <span class="status-badge status-${contact.status}">${contact.status.toUpperCase()}</span>
                    <button class="btn btn-small btn-danger" onclick="deleteContact('${contact._id}')">Delete</button>
                </div>
            </div>
            <div class="item-content">
                <p>${contact.message}</p>
            </div>
            <div class="contact-meta">
                <span>Received: ${new Date(contact.createdAt).toLocaleString()}</span>
                <select onchange="updateContactStatus('${contact._id}', this.value)" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 4px;">
                    <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="read" ${contact.status === 'read' ? 'selected' : ''}>Read</option>
                    <option value="replied" ${contact.status === 'replied' ? 'selected' : ''}>Replied</option>
                </select>
            </div>
        </div>
    `).join('');
}

async function updateContactStatus(contactId, status) {
    try {
        const response = await fetch(`${API_URL}/contact/${contactId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || 'Failed to update contact');
            loadContacts(); // Reload to reset the dropdown
        }
    } catch (error) {
        console.error('Error updating contact:', error);
        loadContacts();
    }
}

async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/contact/${contactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            loadContacts();
        } else {
            alert(result.message || 'Failed to delete contact');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('An error occurred. Please try again.');
    }
}
