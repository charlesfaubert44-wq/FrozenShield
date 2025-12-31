const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [200, 'Short description cannot be more than 200 characters']
    },
    longDescription: {
        type: String,
        trim: true
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            trim: true
        },
        order: {
            type: Number,
            default: 0
        }
    }],
    thumbnail: {
        type: String,
        default: ''
    },
    technologies: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Category cannot be more than 50 characters']
    },
    projectUrl: {
        type: String,
        trim: true
    },
    githubUrl: {
        type: String,
        trim: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    completedDate: {
        type: Date
    },
    client: {
        type: String,
        trim: true,
        maxlength: [100, 'Client name cannot be more than 100 characters']
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        }
    },
    albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
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

// Indexes for performance
projectSchema.index({ slug: 1 });
projectSchema.index({ featured: 1, order: 1 });
projectSchema.index({ visibility: 1, createdAt: -1 });
projectSchema.index({ category: 1 });
projectSchema.index({ technologies: 1 });

// Generate slug from title before saving
projectSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    this.updatedAt = Date.now();
    next();
});

// Method to increment view count
projectSchema.methods.incrementViews = async function() {
    this.stats.views += 1;
    await this.save();
    return this.stats.views;
};

module.exports = mongoose.model('Project', projectSchema);
