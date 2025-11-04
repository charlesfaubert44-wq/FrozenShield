require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function listAdmins() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');

        // Get all admins
        const admins = await Admin.find().select('-password');

        console.log(`Found ${admins.length} admin(s):\n`);

        if (admins.length === 0) {
            console.log('No admins found. Run "npm run create-admin" to create one.');
        } else {
            admins.forEach((admin, index) => {
                console.log(`${index + 1}. Username: ${admin.username}`);
                console.log(`   Email: ${admin.email}`);
                console.log(`   Created: ${admin.createdAt}`);
                console.log(`   ID: ${admin._id}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

listAdmins();
