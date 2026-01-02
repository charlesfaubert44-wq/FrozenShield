const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Album title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    coverImage: {
        type: String,
        default: ''
    },
    coverPhotoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media'
    },
    tags: [{
        type: String,
        trim: true
    }],
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public'
    },
    order: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    metadata: {
        location: String,
        date: Date,
        camera: String,
        settings: String
    },
    stats: {
        totalMedia: {
            type: Number,
            default: 0
        },
        views: {
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
albumSchema.index({ slug: 1 });
albumSchema.index({ featured: 1, order: 1 });
albumSchema.index({ visibility: 1, createdAt: -1 });
albumSchema.index({ tags: 1 });
albumSchema.index({ projectId: 1 });

// Generate slug from title before saving
albumSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    this.updatedAt = Date.now();
    next();
});

// Update totalMedia count
albumSchema.methods.updateMediaCount = async function() {
    const Media = mongoose.model('Media');
    this.stats.totalMedia = await Media.countDocuments({ albumId: this._id });
    await this.save();
};

module.exports = mongoose.model('Album', albumSchema);
