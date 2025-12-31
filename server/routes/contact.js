const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Contact = require('../models/Contact');

// Contact form rate limiting: 10 requests per hour per IP
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many contact form submissions from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', contactLimiter, async (req, res) => {
    try {
        const { name, email, message, honeypot } = req.body;

        // Honeypot field check (spam protection)
        if (honeypot) {
            // Silently discard spam
            return res.status(201).json({
                success: true,
                message: 'Thank you for your message! We will get back to you soon.'
            });
        }

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate message length (minimum 10 characters)
        if (message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Message must be at least 10 characters long'
            });
        }

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
