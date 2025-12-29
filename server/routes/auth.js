const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register admin (only for initial setup)
// @access  Public (should be disabled after first admin is created)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if admin already exists
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(403).json({
                success: false,
                message: 'Admin registration is disabled. Please contact existing admin.'
            });
        }

        // Check if username or email already exists
        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Create admin
        const admin = new Admin({
            username,
            email,
            password
        });

        await admin.save();

        // Create token
        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register admin',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username/email and password'
            });
        }

        // Check if admin exists (allow login by username or email)
        const admin = await Admin.findOne({
            $or: [{ username }, { email: username.toLowerCase() }]
        });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current admin
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');

        res.json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admin',
            error: error.message
        });
    }
});

module.exports = router;
