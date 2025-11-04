require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('../models/Admin');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createAdmin() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        // Check if admin already exists
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            console.log(`⚠️  Warning: ${adminCount} admin(s) already exist in the database.`);
            const answer = await question('Do you want to create another admin anyway? (yes/no): ');
            if (answer.toLowerCase() !== 'yes') {
                console.log('Cancelled. Exiting...');
                process.exit(0);
            }
        }

        // Get admin details
        console.log('\n=== Create New Admin User ===\n');
        const username = await question('Username: ');
        const email = await question('Email: ');
        const password = await question('Password (min 6 characters): ');

        // Validate inputs
        if (!username || !email || !password) {
            console.error('❌ Error: All fields are required!');
            process.exit(1);
        }

        if (password.length < 6) {
            console.error('❌ Error: Password must be at least 6 characters!');
            process.exit(1);
        }

        // Check if username or email already exists
        const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
        if (existingAdmin) {
            console.error('❌ Error: Username or email already exists!');
            process.exit(1);
        }

        // Create admin
        console.log('\nCreating admin...');
        const admin = new Admin({
            username,
            email,
            password
        });

        await admin.save();

        console.log('\n✅ Admin created successfully!');
        console.log('\n=== Admin Details ===');
        console.log(`Username: ${admin.username}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Created: ${admin.createdAt}`);
        console.log('\n🎉 You can now login at: http://localhost:5000/admin');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.connection.close();
        rl.close();
        process.exit(0);
    }
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

createAdmin();
