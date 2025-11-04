const API_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('adminToken');
let allProjects = [];
let allContacts = [];
let currentAdmin = null;

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
            const result = await response.json();
            currentAdmin = result.data;
            showScreen('dashboard-screen');
            loadDashboard();
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
    document.getElementById('nav-dashboard').addEventListener('click', () => {
        switchSection('dashboard');
    });
    document.getElementById('nav-projects').addEventListener('click', () => {
        switchSection('projects');
    });
    document.getElementById('nav-contacts').addEventListener('click', () => {
        switchSection('contacts');
    });
    document.getElementById('nav-analytics').addEventListener('click', () => {
        switchSection('analytics');
    });
    document.getElementById('nav-settings').addEventListener('click', () => {
        switchSection('settings');
    });

    // Dashboard
    document.getElementById('refresh-dashboard').addEventListener('click', loadDashboard);

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

    // Search
    document.getElementById('contact-search').addEventListener('input', handleContactSearch);

    // Export
    document.getElementById('export-contacts').addEventListener('click', exportContacts);
    document.getElementById('export-all-data').addEventListener('click', exportAllData);

    // Quick Add Project
    document.getElementById('quick-add-btn').addEventListener('click', handleQuickAddProject);
    document.getElementById('quick-add-url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleQuickAddProject();
        }
    });

    // Settings
    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
    document.getElementById('clear-cache').addEventListener('click', clearCache);
    document.getElementById('delete-all-projects').addEventListener('click', deleteAllProjects);
    document.getElementById('delete-all-contacts').addEventListener('click', deleteAllContacts);
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
            currentAdmin = result.admin;
            showScreen('dashboard-screen');
            loadDashboard();
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
            currentAdmin = result.admin;
            showScreen('dashboard-screen');
            loadDashboard();
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
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'projects') {
        loadProjects();
    } else if (section === 'contacts') {
        loadContacts();
    } else if (section === 'analytics') {
        loadAnalytics();
    } else if (section === 'settings') {
        loadSettings();
    }
}

// Dashboard Management
async function loadDashboard() {
    try {
        // Load both projects and contacts
        const [projectsRes, contactsRes] = await Promise.all([
            fetch(`${API_URL}/projects`),
            fetch(`${API_URL}/contact`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);

        const projectsData = await projectsRes.json();
        const contactsData = await contactsRes.json();

        if (projectsData.success) {
            allProjects = projectsData.data;
        }
        if (contactsData.success) {
            allContacts = contactsData.data;
        }

        // Update stats
        updateDashboardStats();
        renderRecentContacts();
        renderRecentProjects();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateDashboardStats() {
    // Total projects
    document.getElementById('stat-total-projects').textContent = allProjects.length;

    // Total contacts
    document.getElementById('stat-total-contacts').textContent = allContacts.length;

    // New contacts (status === 'new')
    const newContacts = allContacts.filter(c => c.status === 'new').length;
    document.getElementById('stat-new-contacts').textContent = newContacts;

    // Featured projects
    const featuredProjects = allProjects.filter(p => p.featured).length;
    document.getElementById('stat-featured-projects').textContent = featuredProjects;
}

function renderRecentContacts() {
    const recentContactsEl = document.getElementById('recent-contacts');
    const recent = allContacts.slice(0, 5);

    if (recent.length === 0) {
        recentContactsEl.innerHTML = '<p style="color: var(--text-secondary);">No contacts yet.</p>';
        return;
    }

    recentContactsEl.innerHTML = recent.map(contact => `
        <div class="recent-item">
            <div class="recent-item-header">
                <h4>${contact.name}</h4>
                <span class="recent-item-time">${new Date(contact.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="recent-item-content">
                <p>${contact.email} - ${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}</p>
            </div>
            <span class="status-badge status-${contact.status}">${contact.status.toUpperCase()}</span>
        </div>
    `).join('');
}

function renderRecentProjects() {
    const recentProjectsEl = document.getElementById('recent-projects');
    const recent = allProjects.slice(0, 5);

    if (recent.length === 0) {
        recentProjectsEl.innerHTML = '<p style="color: var(--text-secondary);">No projects yet.</p>';
        return;
    }

    recentProjectsEl.innerHTML = recent.map(project => `
        <div class="recent-item">
            <div class="recent-item-header">
                <h4>${project.title}</h4>
                <span class="recent-item-time">${new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="recent-item-content">
                <p>${project.description.substring(0, 150)}${project.description.length > 150 ? '...' : ''}</p>
            </div>
            ${project.featured ? '<span class="tag" style="background-color: rgba(16, 185, 129, 0.2); color: var(--success);">Featured</span>' : ''}
        </div>
    `).join('');
}

// Projects Management
async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`);
        const result = await response.json();

        if (result.success) {
            allProjects = result.data;
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
            allContacts = result.data;
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

// Analytics Management
async function loadAnalytics() {
    // Ensure we have data
    if (allProjects.length === 0 || allContacts.length === 0) {
        await loadDashboard();
    }

    // Update analytics stats
    document.getElementById('analytics-total-projects').textContent = allProjects.length;
    document.getElementById('analytics-featured-projects').textContent =
        allProjects.filter(p => p.featured).length;
    document.getElementById('analytics-projects-with-urls').textContent =
        allProjects.filter(p => p.projectUrl).length;

    // Contact status breakdown
    document.getElementById('analytics-contacts-new').textContent =
        allContacts.filter(c => c.status === 'new').length;
    document.getElementById('analytics-contacts-read').textContent =
        allContacts.filter(c => c.status === 'read').length;
    document.getElementById('analytics-contacts-replied').textContent =
        allContacts.filter(c => c.status === 'replied').length;

    // Popular tags
    renderPopularTags();

    // Draw simple chart (without external library)
    drawContactsChart();
}

function renderPopularTags() {
    const tagsEl = document.getElementById('popular-tags');
    const tagCounts = {};

    allProjects.forEach(project => {
        project.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sortedTags.length === 0) {
        tagsEl.innerHTML = '<p style="color: var(--text-secondary);">No tags yet.</p>';
        return;
    }

    tagsEl.innerHTML = sortedTags.map(([tag, count]) => `
        <span class="tag">${tag}<span class="tag-count">(${count})</span></span>
    `).join('');
}

function drawContactsChart() {
    const canvas = document.getElementById('contacts-chart');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (allContacts.length === 0) {
        ctx.fillStyle = 'rgba(160, 160, 176, 0.5)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No contact data yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Group contacts by month
    const monthCounts = {};
    allContacts.forEach(contact => {
        const date = new Date(contact.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const months = Object.keys(monthCounts).sort();
    const counts = months.map(m => monthCounts[m]);
    const maxCount = Math.max(...counts);

    // Draw bars
    const barWidth = canvas.width / months.length - 10;
    const barSpacing = 10;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
    counts.forEach((count, i) => {
        const barHeight = (count / maxCount) * (canvas.height - 40);
        const x = i * (barWidth + barSpacing) + barSpacing;
        const y = canvas.height - barHeight - 20;

        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw count
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(count, x + barWidth / 2, y - 5);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
    });

    // Draw month labels
    ctx.fillStyle = 'rgba(160, 160, 176, 0.8)';
    ctx.font = '10px sans-serif';
    months.forEach((month, i) => {
        const x = i * (barWidth + barSpacing) + barSpacing + barWidth / 2;
        ctx.fillText(month, x, canvas.height - 5);
    });
}

// Settings Management
async function loadSettings() {
    if (currentAdmin) {
        document.getElementById('profile-username').value = currentAdmin.username;
        document.getElementById('profile-email').value = currentAdmin.email;
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageEl = document.getElementById('password-message');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
        messageEl.textContent = 'New passwords do not match';
        messageEl.className = 'form-message error';
        return;
    }

    // Note: This endpoint would need to be created on the backend
    messageEl.textContent = 'Password change feature coming soon. Contact administrator.';
    messageEl.className = 'form-message error';

    // Clear form
    document.getElementById('password-form').reset();
}

function clearCache() {
    if (confirm('Clear local cache? You will remain logged in.')) {
        allProjects = [];
        allContacts = [];
        alert('Cache cleared successfully');
        loadDashboard();
    }
}

async function deleteAllProjects() {
    if (!confirm('Are you absolutely sure you want to delete ALL projects? This cannot be undone!')) {
        return;
    }

    if (!confirm('This is your last chance! Delete ALL projects?')) {
        return;
    }

    try {
        const deletePromises = allProjects.map(project =>
            fetch(`${API_URL}/projects/${project._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        );

        await Promise.all(deletePromises);
        alert('All projects deleted successfully');
        loadDashboard();
        switchSection('dashboard');
    } catch (error) {
        console.error('Error deleting projects:', error);
        alert('An error occurred while deleting projects');
    }
}

async function deleteAllContacts() {
    if (!confirm('Are you absolutely sure you want to delete ALL contacts? This cannot be undone!')) {
        return;
    }

    if (!confirm('This is your last chance! Delete ALL contacts?')) {
        return;
    }

    try {
        const deletePromises = allContacts.map(contact =>
            fetch(`${API_URL}/contact/${contact._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        );

        await Promise.all(deletePromises);
        alert('All contacts deleted successfully');
        loadDashboard();
        switchSection('dashboard');
    } catch (error) {
        console.error('Error deleting contacts:', error);
        alert('An error occurred while deleting contacts');
    }
}

// Search and Filter
function handleContactSearch(e) {
    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm === '') {
        renderContacts(allContacts);
        return;
    }

    const filtered = allContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.email.toLowerCase().includes(searchTerm) ||
        contact.message.toLowerCase().includes(searchTerm)
    );

    renderContacts(filtered);
}

// Export Functions
function exportContacts() {
    if (allContacts.length === 0) {
        alert('No contacts to export');
        return;
    }

    // Convert to CSV
    const headers = ['Name', 'Email', 'Message', 'Status', 'Date'];
    const rows = allContacts.map(c => [
        c.name,
        c.email,
        c.message.replace(/,/g, ';'), // Replace commas in message
        c.status,
        new Date(c.createdAt).toLocaleDateString()
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    downloadFile(csv, 'contacts.csv', 'text/csv');
}

function exportAllData() {
    if (allProjects.length === 0 && allContacts.length === 0) {
        alert('No data to export');
        return;
    }

    const data = {
        projects: allProjects,
        contacts: allContacts,
        exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'frozenshield-data.json', 'application/json');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Quick Add Project from URL
async function handleQuickAddProject() {
    const urlInput = document.getElementById('quick-add-url');
    const statusEl = document.getElementById('quick-add-status');
    const projectUrl = urlInput.value.trim();

    // Reset status
    statusEl.textContent = '';
    statusEl.className = 'form-message';

    // Validate URL
    if (!projectUrl) {
        statusEl.textContent = 'Please enter a URL';
        statusEl.className = 'form-message error';
        return;
    }

    try {
        new URL(projectUrl); // Validate URL format
    } catch (error) {
        statusEl.textContent = 'Please enter a valid URL';
        statusEl.className = 'form-message error';
        return;
    }

    // Show loading state
    statusEl.textContent = 'Fetching project details...';
    statusEl.className = 'form-message';

    try {
        // Try to fetch metadata from the URL
        const metadata = await fetchUrlMetadata(projectUrl);

        // Open project modal with pre-filled data
        openProjectModalWithData(metadata);

        // Clear input and show success
        urlInput.value = '';
        statusEl.textContent = 'Project details loaded! Review and save below.';
        statusEl.className = 'form-message success';

        // Clear success message after 3 seconds
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'form-message';
        }, 3000);

    } catch (error) {
        console.error('Error fetching URL metadata:', error);

        // Even if fetching fails, open modal with basic data
        openProjectModalWithData({
            title: extractDomainName(projectUrl),
            description: '',
            projectUrl: projectUrl,
            imageUrl: '',
            tags: []
        });

        statusEl.textContent = 'Could not fetch metadata. Please fill in details manually.';
        statusEl.className = 'form-message error';

        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'form-message';
        }, 5000);
    }
}

async function fetchUrlMetadata(url) {
    // Due to CORS restrictions, we can't directly fetch external URLs from the browser
    // Instead, we'll use a simple approach with the URL itself
    // For production, you'd want to create a backend proxy endpoint

    try {
        // Try to fetch through a proxy API (using a public CORS proxy for demo)
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');

            // Extract metadata
            const title =
                doc.querySelector('meta[property="og:title"]')?.content ||
                doc.querySelector('meta[name="twitter:title"]')?.content ||
                doc.querySelector('title')?.textContent ||
                extractDomainName(url);

            const description =
                doc.querySelector('meta[property="og:description"]')?.content ||
                doc.querySelector('meta[name="twitter:description"]')?.content ||
                doc.querySelector('meta[name="description"]')?.content ||
                '';

            const imageUrl =
                doc.querySelector('meta[property="og:image"]')?.content ||
                doc.querySelector('meta[name="twitter:image"]')?.content ||
                '';

            return {
                title: title.substring(0, 100),
                description: description.substring(0, 500),
                projectUrl: url,
                imageUrl: imageUrl,
                tags: []
            };
        }
    } catch (error) {
        console.error('Proxy fetch failed:', error);
    }

    // Fallback: Return basic data based on URL
    return {
        title: extractDomainName(url),
        description: '',
        projectUrl: url,
        imageUrl: '',
        tags: []
    };
}

function extractDomainName(url) {
    try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname.replace('www.', '');
        // Capitalize first letter
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (error) {
        return 'New Project';
    }
}

function openProjectModalWithData(data) {
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('project-form');

    // Reset form
    form.reset();
    document.getElementById('project-id').value = '';

    // Set title
    modalTitle.textContent = 'Quick Add Project';

    // Pre-fill form with fetched data
    document.getElementById('project-title').value = data.title || '';
    document.getElementById('project-description').value = data.description || '';
    document.getElementById('project-image').value = data.imageUrl || '';
    document.getElementById('project-url').value = data.projectUrl || '';
    document.getElementById('project-tags').value = data.tags.join(', ') || '';
    document.getElementById('project-order').value = 0;
    document.getElementById('project-featured').checked = false;

    // Open modal
    modal.classList.add('active');
}
