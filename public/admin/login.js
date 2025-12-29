// DEV MODE: Set to true to bypass login (DISABLE IN PRODUCTION!)
const DEV_MODE = false;

const API_URL = window.location.origin + '/api';

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // DEV MODE: Auto-redirect to dashboard
    if (DEV_MODE) {
        console.warn('DEV MODE: Auto-redirecting to dashboard (login bypassed)');
        window.location.href = '/admin/dashboard';
        return;
    }

    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Redirect to dashboard
        window.location.href = '/admin/dashboard';
        return;
    }

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
});

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.textContent = '';

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
            // Store token
            localStorage.setItem('adminToken', result.token);

            // Redirect to dashboard
            window.location.href = '/admin/dashboard';
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

    errorEl.textContent = '';

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
            // Store token
            localStorage.setItem('adminToken', result.token);

            // Redirect to dashboard
            window.location.href = '/admin/dashboard';
        } else {
            errorEl.textContent = result.message || 'Registration failed';
        }
    } catch (error) {
        console.error('Register error:', error);
        errorEl.textContent = 'An error occurred. Please try again.';
    }
}
