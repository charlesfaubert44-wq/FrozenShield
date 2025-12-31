/**
 * Script to create the first admin user
 * Run with: node create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true&authSource=admin';

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');

        // Ensure authSource=admin is set for root user
        let mongoUri = MONGODB_URI;
        if (mongoUri.includes('root:') && !mongoUri.includes('authSource=')) {
            mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'authSource=admin';
        }

        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        // Check if any users exist
        const userCount = await User.countDocuments();
        console.log(`Current user count: ${userCount}`);

        if (userCount > 0) {
            console.log('\n⚠️  WARNING: Users already exist in the database!');
            console.log('This script is for creating the FIRST admin user only.');

            const users = await User.find({}, { username: 1, email: 1, role: 1 });
            console.log('\nExisting users:');
            users.forEach(user => {
                console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
            });

            console.log('\nIf you want to create a new admin anyway, delete existing users first:');
            console.log('  db.users.deleteMany({})');

            process.exit(0);
        }

        // Create admin user
        console.log('\nCreating admin user...');

        const admin = new User({
            username: 'admin',
            email: 'admin@frozenshield.ca',
            password: 'SecurePass123!', // Will be hashed by pre-save hook
            role: 'admin'
        });

        await admin.save();

        console.log('\n✓ Admin user created successfully!');
        console.log('\nLogin credentials:');
        console.log('  Email: admin@frozenshield.ca');
        console.log('  Password: SecurePass123!');
        console.log('\nYou can now login at: https://frozenshield.ca/admin/login.html');
        console.log('\n⚠️  IMPORTANT: Change your password after first login!');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error.message);

        if (error.name === 'ValidationError') {
            console.log('\nValidation errors:');
            Object.keys(error.errors).forEach(key => {
                console.log(`  - ${key}: ${error.errors[key].message}`);
            });
        }

        process.exit(1);
    }
}

createAdmin();
