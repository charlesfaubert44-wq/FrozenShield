const mongoose = require('mongoose');
const Album = require('./models/Album');
const Media = require('./models/Media');
const Project = require('./models/Project');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Seed test data
const seedData = async () => {
    try {
        // Clear existing data
        await Album.deleteMany({});
        await Media.deleteMany({});
        console.log('Cleared existing albums and media');

        // Create test albums
        const albums = [
            {
                title: 'Northern Lights Collection',
                description: 'Stunning aurora borealis photographs captured over Great Slave Lake',
                slug: 'northern-lights-collection',
                tags: ['aurora', 'landscape', 'night-photography'],
                visibility: 'public',
                featured: true,
                order: 1
            },
            {
                title: 'Yellowknife Winter',
                description: 'Frozen landscapes and ice formations around Yellowknife',
                slug: 'yellowknife-winter',
                tags: ['winter', 'landscape', 'ice'],
                visibility: 'public',
                featured: true,
                order: 2
            },
            {
                title: 'Wildlife Photography',
                description: 'Local wildlife in their natural northern habitat',
                slug: 'wildlife-photography',
                tags: ['wildlife', 'nature', 'animals'],
                visibility: 'public',
                order: 3
            }
        ];

        const createdAlbums = await Album.insertMany(albums);
        console.log(`Created ${createdAlbums.length} albums`);

        // Create test media for each album
        const mediaItems = [];

        createdAlbums.forEach((album, albumIndex) => {
            for (let i = 1; i <= 6; i++) {
                mediaItems.push({
                    albumId: album._id,
                    type: 'image',
                    url: `https://picsum.photos/1920/1080?random=${albumIndex * 10 + i}`,
                    optimized: `https://picsum.photos/800/600?random=${albumIndex * 10 + i}`,
                    thumbnail: `https://picsum.photos/400/300?random=${albumIndex * 10 + i}`,
                    caption: `${album.title} - Photo ${i}`,
                    alt: `${album.title} image ${i}`,
                    tags: album.tags,
                    order: i,
                    featured: i === 1,
                    visibility: 'public',
                    metadata: {
                        filename: `photo-${i}.jpg`,
                        size: Math.floor(Math.random() * 5000000) + 1000000,
                        width: 1920,
                        height: 1080,
                        format: 'jpeg'
                    }
                });
            }
        });

        const createdMedia = await Media.insertMany(mediaItems);
        console.log(`Created ${createdMedia.length} media items`);

        // Update album cover images and media counts
        for (const album of createdAlbums) {
            const firstMedia = await Media.findOne({ albumId: album._id, featured: true });
            if (firstMedia) {
                album.coverImage = firstMedia.optimized;
            }
            await album.updateMediaCount();
        }

        console.log('Updated album cover images and counts');
        console.log('\n✓ Test data seeding completed successfully!');
        console.log('\nCreated albums:');
        createdAlbums.forEach(album => {
            console.log(`  - ${album.title} (${album.stats.totalMedia} photos)`);
        });

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
};

// Run the seeding
const run = async () => {
    await connectDB();
    await seedData();
};

run();
