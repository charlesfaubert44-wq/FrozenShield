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
    imageUrl: {
        type: String,
        default: ''
    },
    albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
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

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Project', projectSchema);
