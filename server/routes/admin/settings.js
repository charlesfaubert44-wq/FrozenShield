const express = require('express');
const router = express.Router();
const Settings = require('../../models/Settings');
const User = require('../../models/User');
const { authenticate } = require('../../middleware/auth');

// All routes are protected - require authentication
router.use(authenticate);

/**
 * GET /api/admin/settings
 * Get current site settings
 */
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        res.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/admin/settings
 * Update site settings
 */
router.put('/', async (req, res) => {
    try {
        const {
            siteTitle,
            siteDescription,
            logo,
            favicon,
            metaDescription,
            metaKeywords,
            googleAnalyticsId,
            contactEmail,
            socialLinks,
            displaySettings
        } = req.body;

        // Prepare updates object
        const updates = {};

        // Site configuration
        if (siteTitle !== undefined) updates.siteTitle = siteTitle;
        if (siteDescription !== undefined) updates.siteDescription = siteDescription;
        if (logo !== undefined) updates.logo = logo;
        if (favicon !== undefined) updates.favicon = favicon;

        // SEO settings
        if (metaDescription !== undefined) updates.metaDescription = metaDescription;
        if (metaKeywords !== undefined) updates.metaKeywords = metaKeywords;
        if (googleAnalyticsId !== undefined) updates.googleAnalyticsId = googleAnalyticsId;

        // Contact settings
        if (contactEmail !== undefined) updates.contactEmail = contactEmail;
        if (socialLinks !== undefined) updates.socialLinks = socialLinks;

        // Display settings
        if (displaySettings !== undefined) updates.displaySettings = displaySettings;

        // Update settings
        const settings = await Settings.updateSettings(updates);

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });

    } catch (error) {
        console.error('Error updating settings:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/admin/profile
 * Get current user profile
 */
router.get('/profile', async (req, res) => {
    try {
        // req.user is set by authenticate middleware
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/admin/profile
 * Update user profile (username, email)
 */
router.put('/profile', async (req, res) => {
    try {
        const { username, email } = req.body;

        // Find user
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if username is being changed and if it conflicts
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
            user.username = username.trim();
        }

        // Check if email is being changed and if it conflicts
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            user.email = email.trim().toLowerCase();
        }

        // Save user
        await user.save();

        // Return user without password
        const userResponse = user.toJSON();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: userResponse
        });

    } catch (error) {
        console.error('Error updating profile:', error);

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/admin/password
 * Change user password (requires current password)
 */
router.put('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        // Password strength validation
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check for uppercase, lowercase, and number
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumber) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        // Find user (need to select password explicitly)
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current
        const isSamePassword = await user.comparePassword(newPassword);

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
