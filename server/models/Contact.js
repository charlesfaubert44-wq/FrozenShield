const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied'],
        default: 'new'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot be more than 500 characters']
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
contactSchema.index({ status: 1 });
contactSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
