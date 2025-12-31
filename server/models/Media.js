const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: [true, 'Album ID is required']
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    url: {
        type: String,
        required: [true, 'Media URL is required']
    },
    thumbnail: {
        type: String,
        default: ''
    },
    optimized: {
        type: String,
        default: ''
    },
    caption: {
        type: String,
        trim: true,
        maxlength: [500, 'Caption cannot exceed 500 characters']
    },
    alt: {
        type: String,
        trim: true,
        maxlength: [200, 'Alt text cannot exceed 200 characters']
    },
    tags: [{
        type: String,
        trim: true
    }],
    order: {
        type: Number,
        default: 0
    },
    metadata: {
        filename: String,
        size: Number, // bytes
        width: Number,
        height: Number,
        format: String,
        exif: {
            camera: String,
            lens: String,
            iso: String,
            aperture: String,
            shutterSpeed: String,
            focalLength: String,
            dateTaken: Date
        }
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    featured: {
        type: Boolean,
        default: false
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        downloads: {
            type: Number,
            default: 0
        }
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
mediaSchema.index({ albumId: 1, order: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ featured: 1 });
mediaSchema.index({ visibility: 1 });

// Update timestamp
mediaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Update album media count after save/delete
mediaSchema.post('save', async function(doc) {
    const Album = mongoose.model('Album');
    const album = await Album.findById(doc.albumId);
    if (album) {
        await album.updateMediaCount();
    }
});

mediaSchema.post('remove', async function(doc) {
    const Album = mongoose.model('Album');
    const album = await Album.findById(doc.albumId);
    if (album) {
        await album.updateMediaCount();
    }
});

module.exports = mongoose.model('Media', mediaSchema);
