const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Video title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    videoType: {
        type: String,
        enum: ['youtube', 'vimeo', 'direct'],
        required: [true, 'Video type is required']
    },
    videoUrl: {
        type: String,
        required: function() {
            // videoUrl is required for youtube and vimeo types
            return this.videoType === 'youtube' || this.videoType === 'vimeo';
        },
        trim: true
    },
    embedCode: {
        type: String,
        trim: true
    },
    thumbnail: {
        type: String,
        trim: true
    },
    duration: {
        type: Number, // Duration in seconds
        min: [0, 'Duration cannot be negative']
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
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
videoSchema.index({ slug: 1 });
videoSchema.index({ featured: 1, createdAt: -1 });
videoSchema.index({ visibility: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ category: 1 });
videoSchema.index({ videoType: 1 });

// Generate slug from title before saving
videoSchema.pre('save', function(next) {
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
videoSchema.methods.incrementViews = async function() {
    this.stats.views += 1;
    await this.save();
};

module.exports = mongoose.model('Video', videoSchema);
