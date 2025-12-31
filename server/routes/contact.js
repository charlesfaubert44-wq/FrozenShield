const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { contactLimiter } = require('../middleware/rateLimiter');
const { sanitizeString, sanitizeEmail } = require('../utils/sanitize');
const { isValidEmail, isValidLength } = require('../utils/validate');

// @route   POST /api/contact
// @desc    Submit contact form with enhanced validation and sanitization
// @access  Public
router.post('/', contactLimiter, [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('message')
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Message must be between 10 and 5000 characters')
], async (req, res) => {
    try {
        // Honeypot field check (spam protection)
        if (req.body.honeypot) {
            // Silently discard spam
            return res.status(201).json({
                success: true,
                message: 'Thank you for your message! We will get back to you soon.'
            });
        }

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
        const name = sanitizeString(req.body.name, { maxLength: 100 });
        const email = sanitizeEmail(req.body.email);
        const message = sanitizeString(req.body.message, { maxLength: 5000 });

        // Create contact
        const contact = new Contact({
            name,
            email,
            message
        });

        await contact.save();

        // TODO: Send email notification here
        // You can use nodemailer to send an email to your business email

        res.status(201).json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            data: {
                id: contact._id,
                name: contact.name,
                createdAt: contact.createdAt
            }
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit contact form',
            error: error.message
        });
    }
});

module.exports = router;
