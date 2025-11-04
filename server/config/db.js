const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/frozenshield');

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`MongoDB connection failed: ${error.message}`);
        console.warn('Running in development mode without database.');
        console.warn('Frontend will work, but contact form and admin panel will not function.');
    }
};

module.exports = connectDB;
