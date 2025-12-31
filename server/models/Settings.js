const mongoose = require('mongoose');

/**
 * Settings Schema - Singleton pattern for site-wide configuration
 * Only one settings document should exist in the database
 */
const settingsSchema = new mongoose.Schema({
    // Site Configuration
    siteTitle: {
        type: String,
        default: 'Frozen Shield',
        trim: true,
        maxlength: [100, 'Site title cannot exceed 100 characters']
    },
    siteDescription: {
        type: String,
        default: 'Portfolio and Project Showcase',
        trim: true,
        maxlength: [500, 'Site description cannot exceed 500 characters']
    },
    logo: {
        type: String,
        default: '',
        trim: true
    },
    favicon: {
        type: String,
        default: '',
        trim: true
    },

    // SEO Settings
    metaDescription: {
        type: String,
        default: '',
        trim: true,
        maxlength: [160, 'Meta description should not exceed 160 characters']
    },
    metaKeywords: {
        type: String,
        default: '',
        trim: true,
        maxlength: [255, 'Meta keywords should not exceed 255 characters']
    },
    googleAnalyticsId: {
        type: String,
        default: '',
        trim: true,
        match: [/^(UA-\d{4,10}-\d{1,4}|G-[A-Z0-9]{10})$|^$/, 'Please enter a valid Google Analytics ID (UA-XXXXXXXX-X or G-XXXXXXXXXX)']
    },

    // Contact Settings
    contactEmail: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$|^$/, 'Please enter a valid email address']
    },
    socialLinks: {
        facebook: {
            type: String,
            default: '',
            trim: true
        },
        twitter: {
            type: String,
            default: '',
            trim: true
        },
        instagram: {
            type: String,
            default: '',
            trim: true
        },
        linkedin: {
            type: String,
            default: '',
            trim: true
        },
        github: {
            type: String,
            default: '',
            trim: true
        }
    },

    // Display Settings
    displaySettings: {
        itemsPerPage: {
            type: Number,
            default: 12,
            min: [1, 'Items per page must be at least 1'],
            max: [100, 'Items per page cannot exceed 100']
        },
        defaultSort: {
            type: String,
            enum: ['newest', 'oldest', 'title-asc', 'title-desc'],
            default: 'newest'
        },
        theme: {
            type: String,
            enum: ['dark', 'light', 'auto'],
            default: 'dark'
        }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get or create settings (Singleton pattern)
settingsSchema.statics.getSettings = async function() {
    try {
        let settings = await this.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = await this.create({});
        }

        return settings;
    } catch (error) {
        throw new Error('Error retrieving settings: ' + error.message);
    }
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates) {
    try {
        let settings = await this.getSettings();

        // Update fields
        Object.keys(updates).forEach(key => {
            // Handle nested objects (socialLinks, displaySettings)
            if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
                if (!settings[key]) {
                    settings[key] = {};
                }
                Object.keys(updates[key]).forEach(subKey => {
                    settings[key][subKey] = updates[key][subKey];
                });
            } else {
                settings[key] = updates[key];
            }
        });

        await settings.save();
        return settings;
    } catch (error) {
        throw new Error('Error updating settings: ' + error.message);
    }
};

module.exports = mongoose.model('Settings', settingsSchema);
