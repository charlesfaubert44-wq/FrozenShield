/**
 * Settings Page JavaScript
 * Handles all settings functionality including profile, site, SEO, contact, and display settings
 */

// Settings state
let currentSettings = null;
let currentProfile = null;

/**
 * Initialize settings page
 */
function initSettings() {
    // Load initial data
    loadProfile();
    loadSettings();

    // Setup tab navigation
    setupTabs();

    // Setup form handlers
    setupProfileForm();
    setupPasswordForm();
    setupSiteSettingsForm();
    setupSEOSettingsForm();
    setupContactSettingsForm();
    setupDisplaySettingsForm();

    // Setup password strength indicator
    setupPasswordStrength();

    // Setup character counters
    setupCharacterCounters();
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show corresponding content
            const content = document.getElementById(`${tabName}-tab`);
            if (content) {
                content.classList.add('active');
            }
        });
    });
}

/**
 * Load user profile
 */
async function loadProfile() {
    try {
        const response = await api('/admin/settings/profile');

        if (response.success) {
            currentProfile = response.data;
            displayProfile(currentProfile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

/**
 * Display profile data in form
 */
function displayProfile(profile) {
    document.getElementById('profileUsername').value = profile.username || '';
    document.getElementById('profileEmail').value = profile.email || '';
}

/**
 * Load site settings
 */
async function loadSettings() {
    try {
        const response = await api('/admin/settings');

        if (response.success) {
            currentSettings = response.data;
            displaySettings(currentSettings);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Display settings data in forms
 */
function displaySettings(settings) {
    // Site Settings
    document.getElementById('siteTitle').value = settings.siteTitle || '';
    document.getElementById('siteDescription').value = settings.siteDescription || '';
    document.getElementById('siteLogo').value = settings.logo || '';
    document.getElementById('siteFavicon').value = settings.favicon || '';

    // SEO Settings
    document.getElementById('metaDescription').value = settings.metaDescription || '';
    document.getElementById('metaKeywords').value = settings.metaKeywords || '';
    document.getElementById('googleAnalyticsId').value = settings.googleAnalyticsId || '';

    // Update meta description character count
    updateMetaDescCount();

    // Contact Settings
    document.getElementById('contactEmail').value = settings.contactEmail || '';

    if (settings.socialLinks) {
        document.getElementById('socialFacebook').value = settings.socialLinks.facebook || '';
        document.getElementById('socialTwitter').value = settings.socialLinks.twitter || '';
        document.getElementById('socialInstagram').value = settings.socialLinks.instagram || '';
        document.getElementById('socialLinkedin').value = settings.socialLinks.linkedin || '';
        document.getElementById('socialGithub').value = settings.socialLinks.github || '';
    }

    // Display Settings
    if (settings.displaySettings) {
        document.getElementById('itemsPerPage').value = settings.displaySettings.itemsPerPage || 12;
        document.getElementById('defaultSort').value = settings.displaySettings.defaultSort || 'newest';
        document.getElementById('theme').value = settings.displaySettings.theme || 'dark';
    }
}

/**
 * Setup profile form handler
 */
function setupProfileForm() {
    const form = document.getElementById('profileForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('profileUsername').value.trim();
        const email = document.getElementById('profileEmail').value.trim();

        // Validation
        if (!username || !email) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            const response = await api('/admin/settings/profile', {
                method: 'PUT',
                body: JSON.stringify({ username, email })
            });

            if (response.success) {
                showNotification('Profile updated successfully', 'success');
                currentProfile = response.data;

                // Update username display in header
                const usernameDisplay = document.getElementById('usernameDisplay');
                if (usernameDisplay) {
                    usernameDisplay.textContent = username;
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    });
}

/**
 * Setup password form handler
 */
function setupPasswordForm() {
    const form = document.getElementById('passwordForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Please fill in all password fields', 'error');
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        // Password strength validation
        const strength = calculatePasswordStrength(newPassword);
        if (strength.score < 3) {
            showNotification('Password is too weak. Please use a stronger password.', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showNotification('Password must be at least 8 characters long', 'error');
            return;
        }

        // Check for complexity
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            showNotification('Password must contain uppercase, lowercase, and number', 'error');
            return;
        }

        try {
            const response = await api('/admin/settings/password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            if (response.success) {
                showNotification('Password changed successfully', 'success');

                // Clear form
                form.reset();

                // Reset password strength indicator
                resetPasswordStrength();
            }
        } catch (error) {
            console.error('Error changing password:', error);
        }
    });
}

/**
 * Setup site settings form handler
 */
function setupSiteSettingsForm() {
    const form = document.getElementById('siteSettingsForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const siteTitle = document.getElementById('siteTitle').value.trim();
        const siteDescription = document.getElementById('siteDescription').value.trim();
        const logo = document.getElementById('siteLogo').value.trim();
        const favicon = document.getElementById('siteFavicon').value.trim();

        // Validation
        if (!siteTitle) {
            showNotification('Site title is required', 'error');
            return;
        }

        // URL validation for logo and favicon
        if (logo && !isValidURL(logo)) {
            showNotification('Please enter a valid logo URL', 'error');
            return;
        }

        if (favicon && !isValidURL(favicon)) {
            showNotification('Please enter a valid favicon URL', 'error');
            return;
        }

        try {
            const response = await api('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    siteTitle,
                    siteDescription,
                    logo,
                    favicon
                })
            });

            if (response.success) {
                showNotification('Site settings updated successfully', 'success');
                currentSettings = response.data;
            }
        } catch (error) {
            console.error('Error updating site settings:', error);
        }
    });
}

/**
 * Setup SEO settings form handler
 */
function setupSEOSettingsForm() {
    const form = document.getElementById('seoSettingsForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const metaDescription = document.getElementById('metaDescription').value.trim();
        const metaKeywords = document.getElementById('metaKeywords').value.trim();
        const googleAnalyticsId = document.getElementById('googleAnalyticsId').value.trim();

        // Validate Google Analytics ID format if provided
        if (googleAnalyticsId) {
            const gaRegex = /^(UA-\d{4,10}-\d{1,4}|G-[A-Z0-9]{10})$/;
            if (!gaRegex.test(googleAnalyticsId)) {
                showNotification('Invalid Google Analytics ID format', 'error');
                return;
            }
        }

        try {
            const response = await api('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    metaDescription,
                    metaKeywords,
                    googleAnalyticsId
                })
            });

            if (response.success) {
                showNotification('SEO settings updated successfully', 'success');
                currentSettings = response.data;
            }
        } catch (error) {
            console.error('Error updating SEO settings:', error);
        }
    });
}

/**
 * Setup contact settings form handler
 */
function setupContactSettingsForm() {
    const form = document.getElementById('contactSettingsForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const contactEmail = document.getElementById('contactEmail').value.trim();
        const socialLinks = {
            facebook: document.getElementById('socialFacebook').value.trim(),
            twitter: document.getElementById('socialTwitter').value.trim(),
            instagram: document.getElementById('socialInstagram').value.trim(),
            linkedin: document.getElementById('socialLinkedin').value.trim(),
            github: document.getElementById('socialGithub').value.trim()
        };

        // Email validation
        if (contactEmail && !isValidEmail(contactEmail)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Validate social media URLs
        const socialUrls = Object.entries(socialLinks).filter(([key, value]) => value !== '');
        for (const [platform, url] of socialUrls) {
            if (!isValidURL(url)) {
                showNotification(`Invalid URL for ${platform}`, 'error');
                return;
            }
        }

        try {
            const response = await api('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    contactEmail,
                    socialLinks
                })
            });

            if (response.success) {
                showNotification('Contact settings updated successfully', 'success');
                currentSettings = response.data;
            }
        } catch (error) {
            console.error('Error updating contact settings:', error);
        }
    });
}

/**
 * Setup display settings form handler
 */
function setupDisplaySettingsForm() {
    const form = document.getElementById('displaySettingsForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
        const defaultSort = document.getElementById('defaultSort').value;
        const theme = document.getElementById('theme').value;

        // Validation
        if (itemsPerPage < 1 || itemsPerPage > 100) {
            showNotification('Items per page must be between 1 and 100', 'error');
            return;
        }

        try {
            const response = await api('/admin/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    displaySettings: {
                        itemsPerPage,
                        defaultSort,
                        theme
                    }
                })
            });

            if (response.success) {
                showNotification('Display settings updated successfully', 'success');
                currentSettings = response.data;
            }
        } catch (error) {
            console.error('Error updating display settings:', error);
        }
    });
}

/**
 * Setup password strength indicator
 */
function setupPasswordStrength() {
    const newPasswordInput = document.getElementById('newPassword');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    newPasswordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);

        // Update strength bar
        strengthFill.style.width = `${strength.percentage}%`;
        strengthFill.style.backgroundColor = strength.color;

        // Update strength text
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
}

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {object} Strength metrics
 */
function calculatePasswordStrength(password) {
    let score = 0;
    let text = 'Weak';
    let color = '#ef4444';
    let percentage = 0;

    if (!password) {
        return { score: 0, text: 'Password strength', color: 'var(--text-muted)', percentage: 0 };
    }

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Calculate percentage and set color
    if (score <= 2) {
        text = 'Weak';
        color = '#ef4444';
        percentage = 25;
    } else if (score <= 4) {
        text = 'Fair';
        color = '#f59e0b';
        percentage = 50;
    } else if (score <= 6) {
        text = 'Good';
        color = '#10b981';
        percentage = 75;
    } else {
        text = 'Strong';
        color = '#059669';
        percentage = 100;
    }

    return { score, text, color, percentage };
}

/**
 * Reset password strength indicator
 */
function resetPasswordStrength() {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    strengthFill.style.width = '0%';
    strengthText.textContent = 'Password strength';
    strengthText.style.color = 'var(--text-muted)';
}

/**
 * Setup character counters
 */
function setupCharacterCounters() {
    const metaDescInput = document.getElementById('metaDescription');
    const metaDescCount = document.getElementById('metaDescCount');

    if (metaDescInput && metaDescCount) {
        metaDescInput.addEventListener('input', updateMetaDescCount);
    }
}

/**
 * Update meta description character count
 */
function updateMetaDescCount() {
    const metaDescInput = document.getElementById('metaDescription');
    const metaDescCount = document.getElementById('metaDescCount');

    if (metaDescInput && metaDescCount) {
        metaDescCount.textContent = metaDescInput.value.length;

        // Change color based on length
        if (metaDescInput.value.length > 160) {
            metaDescCount.style.color = '#ef4444';
        } else if (metaDescInput.value.length > 140) {
            metaDescCount.style.color = '#f59e0b';
        } else {
            metaDescCount.style.color = 'var(--text-secondary)';
        }
    }
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid
 */
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
} else {
    initSettings();
}
