const mongoose = require('mongoose');

/**
 * Establish connection to MongoDB database with automatic retry logic
 * Uses exponential backoff strategy for connection retries
 *
 * @param {number} [retries=5] - Maximum number of connection attempts
 * @param {number} [delay=5000] - Initial delay in milliseconds between retries
 * @returns {Promise<Object|null>} Mongoose connection object or null if all retries fail
 *
 * @example
 * const connectDB = require('./config/db');
 * await connectDB(); // Uses default retries and delay
 * await connectDB(10, 3000); // Custom retries and delay
 */
const connectDB = async (retries = 5, delay = 5000) => {
    let currentRetry = 0;

    /**
     * Internal function to attempt database connection
     * Implements exponential backoff: delay * 2^(currentRetry - 1)
     *
     * @returns {Promise<Object|null>} Mongoose connection or null
     * @private
     */
    const attemptConnection = async () => {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/frozenshield', {
                // Connection pooling configuration
                maxPoolSize: 10, // Maximum number of connections in the pool
                minPoolSize: 5, // Minimum number of connections to maintain

                // Timeout configurations
                serverSelectionTimeoutMS: 5000, // Timeout for selecting a server
                socketTimeoutMS: 45000, // Timeout for socket operations (45 seconds)
                connectTimeoutMS: 10000, // Timeout for initial connection (10 seconds)

                // Automatic reconnection
                retryWrites: true, // Retry write operations on failure
                retryReads: true, // Retry read operations on failure

                // Performance optimizations
                compressors: ['zlib'], // Enable compression for network traffic
                maxIdleTimeMS: 60000, // Close idle connections after 60 seconds
            });

            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return conn;
        } catch (error) {
            currentRetry++;

            if (currentRetry >= retries) {
                console.warn(`MongoDB connection failed after ${retries} attempts: ${error.message}`);
                console.warn('Running in development mode without database.');
                console.warn('Frontend will work, but contact form and admin panel will not function.');
                return null;
            }

            const waitTime = delay * Math.pow(2, currentRetry - 1); // Exponential backoff
            console.warn(`MongoDB connection attempt ${currentRetry} failed. Retrying in ${waitTime}ms...`);

            await new Promise(resolve => setTimeout(resolve, waitTime));
            return attemptConnection();
        }
    };

    return attemptConnection();
};

module.exports = connectDB;
