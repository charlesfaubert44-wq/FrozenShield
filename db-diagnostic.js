/**
 * Database Diagnostic and Cleanup Script
 *
 * This script:
 * 1. Connects to the production MongoDB database
 * 2. Shows current user count and details
 * 3. Provides options to clean database or create admin
 *
 * Usage:
 *   node db-diagnostic.js                    # Show database status
 *   node db-diagnostic.js --clean            # Delete all users
 *   node db-diagnostic.js --create-admin     # Create admin after cleaning
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

// Get command line arguments
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const shouldCreateAdmin = args.includes('--create-admin');

// MongoDB connection string from environment or fallback
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in environment variables');
    console.log('\nPlease set MONGODB_URI in your .env file or environment');
    console.log('Example: MONGODB_URI=mongodb://root:password@host:27017/frozenshield?directConnection=true');
    process.exit(1);
}

/**
 * Main diagnostic function
 */
async function runDiagnostic() {
    try {
        console.log('🔍 FrozenShield Database Diagnostic Tool\n');
        console.log('Connecting to MongoDB...');
        console.log(`Target: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//****:****@')}\n`);

        // Ensure authSource=admin is set for root user
        let mongoUri = MONGODB_URI;
        if (mongoUri.includes('root:') && !mongoUri.includes('authSource=')) {
            mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'authSource=admin';
            console.log('Note: Added authSource=admin for root user authentication\n');
        }

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });

        console.log('✓ Connected to MongoDB successfully\n');

        // Get database statistics
        const userCount = await User.countDocuments();
        console.log(`📊 Current user count: ${userCount}`);

        if (userCount === 0) {
            console.log('\n✓ Database is clean - no users exist');
            console.log('➜ You can now register the first admin user via the web interface');
            console.log('   or run: node db-diagnostic.js --create-admin\n');
        } else {
            console.log('\n⚠️  WARNING: Users exist in database!\n');

            // List all users
            const users = await User.find({}, {
                username: 1,
                email: 1,
                role: 1,
                createdAt: 1,
                lastLogin: 1
            });

            console.log('Existing users:');
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.username}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
            });

            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('This is why registration is failing!');
            console.log('The registration endpoint only allows creating the FIRST admin.');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            if (shouldClean) {
                await cleanDatabase();
            } else {
                console.log('To clean the database and start fresh:');
                console.log('  node db-diagnostic.js --clean\n');
                console.log('To clean AND create a new admin:');
                console.log('  node db-diagnostic.js --clean --create-admin\n');
            }
        }

        // Create admin if requested
        if (shouldCreateAdmin && (shouldClean || userCount === 0)) {
            await createAdmin();
        } else if (shouldCreateAdmin && userCount > 0 && !shouldClean) {
            console.log('❌ Cannot create admin - users already exist');
            console.log('   Use --clean flag to delete existing users first\n');
        }

        await mongoose.connection.close();
        console.log('Connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.name === 'MongoServerSelectionError') {
            console.log('\n💡 Troubleshooting:');
            console.log('   1. Check that MongoDB container is running');
            console.log('   2. Verify MONGODB_URI is correct');
            console.log('   3. Ensure network connectivity to MongoDB host');
        }

        process.exit(1);
    }
}

/**
 * Clean database by deleting all users
 */
async function cleanDatabase() {
    console.log('\n🧹 Cleaning database...');
    console.log('⚠️  This will DELETE ALL USERS!\n');

    const result = await User.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} user(s)`);
    console.log('✓ Database is now clean\n');
}

/**
 * Create default admin user
 */
async function createAdmin() {
    console.log('\n👤 Creating default admin user...');

    const admin = new User({
        username: 'admin',
        email: 'admin@frozenshield.ca',
        password: 'AdminPass123!', // Meets all requirements: 8+ chars, upper, lower, number, special
        role: 'admin'
    });

    try {
        await admin.save();
        console.log('\n✅ Admin user created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('LOGIN CREDENTIALS:');
        console.log('  Email:    admin@frozenshield.ca');
        console.log('  Password: AdminPass123!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🌐 Login at: https://frozenshield.ca/admin/login.html');
        console.log('⚠️  IMPORTANT: Change your password after first login!\n');
    } catch (error) {
        console.error('❌ Failed to create admin:', error.message);

        if (error.name === 'ValidationError') {
            console.log('\nValidation errors:');
            Object.keys(error.errors).forEach(key => {
                console.log(`  - ${key}: ${error.errors[key].message}`);
            });
        }
    }
}

// Run the diagnostic
runDiagnostic();
