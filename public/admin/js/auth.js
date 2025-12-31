// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const loadingOverlay = document.getElementById('loadingOverlay');

// Form Elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

const registerUsername = document.getElementById('registerUsername');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const registerConfirmPassword = document.getElementById('registerConfirmPassword');
const registerError = document.getElementById('registerError');

// API Base URL
const API_BASE = window.location.origin;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkExistingAuth();
    setupEventListeners();
});

// Check if user is already authenticated
function checkExistingAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Redirect to dashboard
        window.location.href = '/admin/dashboard.html';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Form toggle links
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleForms('register');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleForms('login');
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
}

// Toggle between login and register forms
function toggleForms(formType) {
    hideError('login');
    hideError('register');

    if (formType === 'register') {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    // Validate
    if (!validateEmail(email)) {
        showError('login', 'Please enter a valid email address');
        return;
    }

    if (!password) {
        showError('login', 'Please enter your password');
        return;
    }

    hideError('login');
    showLoading(loginForm);

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token
        localStorage.setItem('token', data.token);

        // Success - redirect to dashboard
        showSuccess('login', 'Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = '/admin/dashboard.html';
        }, 500);

    } catch (error) {
        console.error('Login error:', error);
        showError('login', error.message || 'Login failed. Please check your credentials.');
    } finally {
        hideLoading(loginForm);
    }
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();

    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;

    // Validate
    if (!username) {
        showError('register', 'Please enter a username');
        return;
    }

    if (!validateEmail(email)) {
        showError('register', 'Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        showError('register', 'Password must be at least 6 characters long');
        return;
    }

    if (password !== confirmPassword) {
        showError('register', 'Passwords do not match');
        return;
    }

    hideError('register');
    showLoading(registerForm);

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Store token
        localStorage.setItem('token', data.token);

        // Success - redirect to dashboard
        showSuccess('register', 'Registration successful! Redirecting...');
        setTimeout(() => {
            window.location.href = '/admin/dashboard.html';
        }, 500);

    } catch (error) {
        console.error('Registration error:', error);
        showError('register', error.message || 'Registration failed. Please try again.');
    } finally {
        hideLoading(registerForm);
    }
}

// Validate Email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show Error Message
function showError(formType, message) {
    const errorElement = formType === 'login' ? loginError : registerError;
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Hide Error Message
function hideError(formType) {
    const errorElement = formType === 'login' ? loginError : registerError;
    errorElement.textContent = '';
    errorElement.classList.remove('show');
}

// Show Success Message (create success element if needed)
function showSuccess(formType, message) {
    const errorElement = formType === 'login' ? loginError : registerError;
    errorElement.textContent = message;
    errorElement.classList.remove('error-message');
    errorElement.classList.add('success-message', 'show');
}

// Show Loading State
function showLoading(form) {
    const submitBtn = form.querySelector('.btn-primary');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
}

// Hide Loading State
function hideLoading(form) {
    const submitBtn = form.querySelector('.btn-primary');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
}

// Show Global Loading Overlay
function showGlobalLoading() {
    loadingOverlay.classList.add('show');
}

// Hide Global Loading Overlay
function hideGlobalLoading() {
    loadingOverlay.classList.remove('show');
}

// Handle Network Errors
window.addEventListener('online', () => {
    console.log('Network connection restored');
});

window.addEventListener('offline', () => {
    console.log('Network connection lost');
    showError('login', 'No internet connection. Please check your network.');
});
