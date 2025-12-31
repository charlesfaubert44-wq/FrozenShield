/**
 * Admin Dashboard JavaScript
 * Handles authentication, navigation, and dashboard functionality
 */

// API base URL
const API_URL = window.location.origin + '/api';

/**
 * Show notification to user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * API helper function with authentication
 * @param {string} endpoint - API endpoint (e.g., '/admin/stats')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function api(endpoint, options = {}) {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');

        // Set default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Make request
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Parse JSON response
        const data = await response.json();

        // Handle 401 Unauthorized (token expired or invalid)
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/admin/login.html';
            throw new Error('Authentication failed. Please login again.');
        }

        // Handle other error responses
        if (!response.ok) {
            throw new Error(data.message || `HTTP error ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message || 'An error occurred', 'error');
        throw error;
    }
}

/**
 * Check authentication status
 * Verifies token and loads user data
 */
async function checkAuth() {
    try {
        const token = localStorage.getItem('authToken');

        // No token, redirect to login
        if (!token) {
            window.location.href = '/admin/login.html';
            return;
        }

        // Verify token by fetching user data
        const response = await api('/auth/me');

        if (response.success && response.user) {
            // Display username in header
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = response.user.username;
            }

            return response.user;
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/admin/login.html';
    }
}

/**
 * Logout user
 * Clears token and redirects to login
 */
function logout() {
    localStorage.removeItem('authToken');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/admin/login.html';
    }, 500);
}

/**
 * Switch between dashboard sections
 * @param {string} sectionId - The ID of the section to show
 */
function switchSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
    }

    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    // Update URL hash
    window.location.hash = sectionId;

    // Load section-specific data
    loadSectionData(sectionId);
}

/**
 * Load data for specific section
 * @param {string} sectionId - The section to load data for
 */
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard-section':
            loadDashboardStats();
            break;
        case 'albums-section':
            // Will be implemented in albums.js
            if (typeof loadAlbums === 'function') {
                loadAlbums();
            }
            break;
        case 'videos-section':
            // Will be implemented in videos.js
            if (typeof loadVideos === 'function') {
                loadVideos();
            }
            break;
        case 'media-section':
            // Will be implemented in media.js
            if (typeof loadMedia === 'function') {
                loadMedia();
            }
            break;
        case 'projects-section':
            // Will be implemented in projects.js
            if (typeof loadProjects === 'function') {
                loadProjects();
            }
            break;
    }
}

/**
 * Load dashboard statistics
 * Fetches and displays dashboard overview data
 */
async function loadDashboardStats() {
    try {
        // Show loading state
        const statsContainer = document.getElementById('dashboardStats');
        if (statsContainer) {
            statsContainer.innerHTML = '<div class="loading">Loading statistics...</div>';
        }

        // Fetch stats from API
        const response = await api('/admin/stats');

        if (response.success && response.data) {
            displayDashboardStats(response.data);
        } else {
            throw new Error('Invalid stats response');
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        const statsContainer = document.getElementById('dashboardStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="error-message">
                    Failed to load dashboard statistics. Please try again.
                </div>
            `;
        }
    }
}

/**
 * Display dashboard statistics
 * @param {object} data - Statistics data from API
 */
function displayDashboardStats(data) {
    const statsContainer = document.getElementById('dashboardStats');
    if (!statsContainer) return;

    const { counts, recent } = data;

    // Build stats HTML
    let html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">&#128247;</div>
                <div class="stat-content">
                    <div class="stat-value">${counts.albums || 0}</div>
                    <div class="stat-label">Albums</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">&#128444;</div>
                <div class="stat-content">
                    <div class="stat-value">${counts.media || 0}</div>
                    <div class="stat-label">Media Items</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">&#128188;</div>
                <div class="stat-content">
                    <div class="stat-value">${counts.projects || 0}</div>
                    <div class="stat-label">Projects</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">&#128065;</div>
                <div class="stat-content">
                    <div class="stat-value">${counts.totalViews || 0}</div>
                    <div class="stat-label">Total Views</div>
                </div>
            </div>
        </div>

        <div class="recent-activity">
            <h3>Recent Albums</h3>
            <div class="activity-list">
    `;

    // Add recent albums
    if (recent.albums && recent.albums.length > 0) {
        recent.albums.forEach(album => {
            const date = new Date(album.createdAt).toLocaleDateString();
            html += `
                <div class="activity-item">
                    <div class="activity-icon">&#128247;</div>
                    <div class="activity-content">
                        <div class="activity-title">${escapeHtml(album.title)}</div>
                        <div class="activity-meta">${date} - ${album.stats?.totalMedia || 0} items</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="no-data">No recent albums</div>';
    }

    html += `
            </div>

            <h3>Recent Media</h3>
            <div class="activity-list">
    `;

    // Add recent media
    if (recent.media && recent.media.length > 0) {
        recent.media.forEach(media => {
            const date = new Date(media.uploadedAt).toLocaleDateString();
            const typeIcon = media.type === 'video' ? '&#127909;' : '&#128444;';
            html += `
                <div class="activity-item">
                    <div class="activity-icon">${typeIcon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${escapeHtml(media.caption || media.metadata?.filename || 'Untitled')}</div>
                        <div class="activity-meta">${date} - ${media.type}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="no-data">No recent media</div>';
    }

    html += `
            </div>
        </div>
    `;

    statsContainer.innerHTML = html;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize dashboard on page load
 */
async function initDashboard() {
    // Check authentication
    await checkAuth();

    // Set up navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            if (sectionId) {
                switchSection(sectionId);
            }
        });
    });

    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Load section from URL hash or default to dashboard
    const hash = window.location.hash.substring(1);
    const initialSection = hash || 'dashboard';
    switchSection(initialSection);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        switchSection(hash);
    }
});
