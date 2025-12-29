const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

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

// @route   GET /api/contact
// @desc    Get all contact submissions
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contacts',
            error: error.message
        });
    }
});

// @route   PATCH /api/contact/:id
// @desc    Update contact status and notes
// @access  Private (Admin only)
router.patch('/:id', auth, async (req, res) => {
    try {
        const { status, notes } = req.body;

        const updateFields = {};
        if (status) updateFields.status = status;
        if (notes !== undefined) updateFields.notes = notes;

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contact',
            error: error.message
        });
    }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete contact',
            error: error.message
        });
    }
});

module.exports = router;
