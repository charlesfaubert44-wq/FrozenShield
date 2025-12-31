const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const {
    authLimiter,
    registrationLimiter,
    trackFailedLogin,
    checkAccountLockout,
    lockAccount,
    resetFailedAttempts,
    checkLockout
} = require('../middleware/rateLimiter');
const { sanitizeString, sanitizeEmail } = require('../utils/sanitize');
const { validatePassword, validateUsername } = require('../utils/validate');

/**
 * Generate JWT token for user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d',
            algorithm: 'HS256'
        }
    );
};

/**
 * POST /api/auth/register
 * Register first admin user only
 * Once an admin exists, registration is blocked
 */
router.post('/register', registrationLimiter, [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Password must contain at least one special character')
], async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Sanitize inputs
        const username = sanitizeString(req.body.username, { maxLength: 30 });
        const email = sanitizeEmail(req.body.email);
        const password = req.body.password; // Don't sanitize passwords

        // Check if any users exist (only allow first admin)
        const userCount = await User.countDocuments();
        console.log(`[Registration] Current user count: ${userCount}`);

        if (userCount > 0) {
            console.log('[Registration] Blocking registration - admin already exists');
            return res.status(403).json({
                success: false,
                message: 'Admin already exists. Only one admin account is allowed during initial setup.'
            });
        }

        console.log('[Registration] No users exist - allowing first admin registration');

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create new user
        console.log(`[Registration] Creating admin user: ${username} (${email})`);
        const user = new User({
            username,
            email,
            password, // Will be hashed by pre-save hook
            role: 'admin'
        });

        await user.save();
        console.log(`[Registration] ✓ Admin user created successfully with ID: ${user._id}`);

        // Generate JWT token
        const token = generateToken(user._id);

        // Return user data without password
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        console.log(`[Registration] ✓ JWT token generated, sending response`);
        res.status(201).json({
            success: true,
            token,
            user: userData
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Includes account lockout protection after failed attempts
 */
router.post('/login',
    authLimiter,
    checkLockout((req) => req.body.email || req.ip),
    [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const email = sanitizeEmail(req.body.email);
        const password = req.body.password;

        // Find user by email (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            // Track failed attempt by IP
            const attempts = trackFailedLogin(req.ip);

            // Lock account after 5 failed attempts
            if (attempts >= 5) {
                lockAccount(req.ip, 30 * 60 * 1000); // 30 minutes
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            // Track failed attempt by both email and IP
            const emailAttempts = trackFailedLogin(email);
            const ipAttempts = trackFailedLogin(req.ip);

            // Lock account after 5 failed attempts
            if (emailAttempts >= 5) {
                lockAccount(email, 30 * 60 * 1000); // 30 minutes
            }
            if (ipAttempts >= 5) {
                lockAccount(req.ip, 30 * 60 * 1000);
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                attemptsRemaining: Math.max(0, 5 - emailAttempts)
            });
        }

        // Reset failed attempts on successful login
        resetFailedAttempts(email);
        resetFailedAttempts(req.ip);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        // Return user data without password
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };

        res.json({
            success: true,
            token,
            user: userData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires valid JWT token
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        // User is already attached to req by authenticate middleware
        const userData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            lastLogin: req.user.lastLogin,
            createdAt: req.user.createdAt
        };

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving user data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 * Token invalidation happens client-side
 */
router.post('/logout', (req, res) => {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
