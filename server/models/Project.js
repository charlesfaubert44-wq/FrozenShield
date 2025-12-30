const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    // Legacy field - maintained for backward compatibility
    imageUrl: {
        type: String,
        default: ''
    },
    // New cover image field (main project thumbnail)
    coverImage: {
        type: String,
        default: ''
    },
    // Project type
    type: {
        type: String,
        enum: ['photography', 'videography', 'web-development', 'other'],
        default: 'other'
    },
    // Media gallery array
    media: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['image', 'video'],
            required: true
        },
        caption: {
            type: String,
            default: ''
        },
        order: {
            type: Number,
            default: 0
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        }
    }],
    // Client information
    clientName: {
        type: String,
        trim: true
    },
    // Invoice reference (for future Invoice model integration)
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    // Project status
    status: {
        type: String,
        enum: ['draft', 'in-progress', 'completed', 'archived'],
        default: 'draft'
    },
    // Completion date
    completedDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    projectUrl: {
        type: String,
        trim: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
projectSchema.index({ featured: 1, order: 1 });
projectSchema.index({ type: 1, status: 1 });
projectSchema.index({ status: 1, createdAt: -1 });

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Project', projectSchema);
