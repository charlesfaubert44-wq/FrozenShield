const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for now
}));
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Request logging
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/contact', require('./routes/contact'));
app.use('/api/projects', require('./routes/projects'));

// SEO Routes (before static files to handle sitemap.xml and structured data)
app.use('/', require('./routes/seo'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve main site for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();

    console.log(`Server running on port ${PORT}`);
    console.log(`\nLocal access:`);
    console.log(`  http://localhost:${PORT}`);

    console.log(`\nNetwork access:`);
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${PORT}`);
            }
        });
    });
});

/**
 * Graceful shutdown handler for server termination signals
 * Ensures all connections are properly closed before process exit
 * Forces shutdown after 10 seconds if graceful shutdown fails
 *
 * @param {string} signal - Signal name that triggered shutdown (SIGTERM, SIGINT, etc.)
 *
 * @example
 * // Automatically called on process signals
 * process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
 */
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);
    server.close(() => {
        console.log('HTTP server closed');
        // Close database connection
        require('mongoose').connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Register signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
