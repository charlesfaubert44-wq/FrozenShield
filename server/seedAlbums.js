/**
 * Seed Demo Albums with Unsplash Photos
 *
 * This script creates demo albums and populates them with photos from Unsplash
 *
 * Usage: node server/seedAlbums.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const Album = require('./models/Album');
const Media = require('./models/Media');
const { processImage } = require('./utils/imageProcessor');

// Demo albums configuration
const DEMO_ALBUMS = [
    {
        title: 'Wedding Sarah & Max',
        description: 'Beautiful winter wedding ceremony in Yellowknife',
        tags: ['wedding', 'ceremony', 'photography'],
        category: 'Photography',
        visibility: 'public',
        featured: true,
        unsplashQuery: 'wedding ceremony',
        photoCount: 5
    },
    {
        title: 'Northern Lights Adventure',
        description: 'Capturing the magic of aurora borealis over Great Slave Lake',
        tags: ['aurora', 'northern-lights', 'nature'],
        category: 'Photography',
        visibility: 'public',
        featured: true,
        unsplashQuery: 'northern lights aurora',
        photoCount: 6
    },
    {
        title: 'Yellowknife Landscapes',
        description: 'Stunning landscapes from Canada\'s North',
        tags: ['landscape', 'yellowknife', 'nature'],
        category: 'Photography',
        visibility: 'public',
        featured: false,
        unsplashQuery: 'canadian landscape winter',
        photoCount: 4
    },
    {
        title: 'Corporate Events 2024',
        description: 'Professional photography for local business events',
        tags: ['corporate', 'events', 'business'],
        category: 'Photography',
        visibility: 'public',
        featured: false,
        unsplashQuery: 'corporate event',
        photoCount: 5
    }
];

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = require('fs').createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            require('fs').unlink(filepath, () => {});
            reject(err);
        });
    });
}

/**
 * Fetch photos from Unsplash
 */
async function fetchUnsplashPhotos(query, count = 5) {
    console.log(`Fetching ${count} photos for query: "${query}"`);

    // Using Unsplash Source API (no API key needed for development)
    const photos = [];

    for (let i = 0; i < count; i++) {
        // Unsplash Source provides random photos by topic
        // Format: https://source.unsplash.com/1600x900/?query
        const url = `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}&sig=${Date.now() + i}`;
        photos.push({ url, index: i });
    }

    return photos;
}

/**
 * Create album and add photos
 */
async function createAlbumWithPhotos(albumConfig) {
    try {
        console.log(`\n=== Creating Album: ${albumConfig.title} ===`);

        // Create album
        const album = await Album.create({
            title: albumConfig.title,
            description: albumConfig.description,
            tags: albumConfig.tags,
            category: albumConfig.category,
            visibility: albumConfig.visibility,
            featured: albumConfig.featured
        });

        console.log(`✓ Album created: ${album._id}`);

        // Create upload directory for this album
        const uploadDir = path.join('public', 'uploads', 'albums', album._id.toString());
        await fs.mkdir(uploadDir, { recursive: true });

        // Fetch and process photos
        const photos = await fetchUnsplashPhotos(albumConfig.unsplashQuery, albumConfig.photoCount);

        for (const photo of photos) {
            try {
                console.log(`  Downloading photo ${photo.index + 1}/${photos.length}...`);

                // Download to temp file
                const tempPath = path.join(uploadDir, `temp-${photo.index}.jpg`);
                await downloadImage(photo.url, tempPath);

                // Read the downloaded file as buffer
                const buffer = await fs.readFile(tempPath);

                // Process image using the existing utility
                const filename = `photo-${Date.now()}-${photo.index}.jpg`;
                const processed = await processImage(buffer, filename, album._id.toString());

                // Create media record
                const media = await Media.create({
                    albumId: album._id,
                    type: 'image',
                    fileSizes: processed.fileSizes,
                    metadata: processed.metadata,
                    originalFilename: filename,
                    alt: `${albumConfig.title} - Photo ${photo.index + 1}`,
                    caption: '',
                    order: photo.index,
                    visibility: 'public'
                });

                console.log(`  ✓ Photo ${photo.index + 1} processed: ${media._id}`);

                // Clean up temp file
                await fs.unlink(tempPath);

            } catch (photoError) {
                console.error(`  ✗ Failed to process photo ${photo.index + 1}:`, photoError.message);
            }
        }

        // Update album stats
        const mediaCount = await Media.countDocuments({ albumId: album._id });
        album.stats.totalMedia = mediaCount;
        await album.save();

        console.log(`✓ Album complete with ${mediaCount} photos`);

        return album;

    } catch (error) {
        console.error(`✗ Failed to create album "${albumConfig.title}":`, error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedAlbums() {
    try {
        console.log('Starting album seeding process...\n');

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Clear existing demo albums (optional)
        const shouldClear = process.argv.includes('--clear');
        if (shouldClear) {
            console.log('Clearing existing albums...');
            await Album.deleteMany({});
            await Media.deleteMany({});
            console.log('✓ Existing data cleared\n');
        }

        // Create albums
        const createdAlbums = [];
        for (const albumConfig of DEMO_ALBUMS) {
            try {
                const album = await createAlbumWithPhotos(albumConfig);
                createdAlbums.push(album);
            } catch (error) {
                console.error(`Failed to create album: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Seeding Complete!');
        console.log('='.repeat(60));
        console.log(`Created ${createdAlbums.length} albums`);
        console.log('\nAlbums:');
        createdAlbums.forEach(album => {
            console.log(`  - ${album.title} (${album.stats.totalMedia} photos)`);
        });
        console.log('\n✓ Demo albums ready!');
        console.log('='.repeat(60) + '\n');

        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n✗ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeder
seedAlbums();
