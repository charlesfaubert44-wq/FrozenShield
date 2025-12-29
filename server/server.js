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

// Critical security check: Validate JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    console.error('Please set JWT_SECRET in your .env file.');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

// Prevent use of default/example JWT secrets
const insecureSecrets = [
    'your-super-secret-jwt-key-change-this-in-production',
    'your-secret-key-change-in-production',
    'c039bfbcfdb55b536c2c76d6c7fa4f3e3dc2a352b31cf00afdff06e89b22ddf4fd1a877fa1c344e08e7010d60384667f61f9984e17081d48a8eb02818ee5dd04'
];

if (insecureSecrets.includes(process.env.JWT_SECRET)) {
    console.error('FATAL ERROR: JWT_SECRET is using a default or example value.');
    console.error('Please generate a unique JWT_SECRET for this installation.');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long for strong security.');
    console.warn('Current length:', process.env.JWT_SECRET.length);
}

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
app.use('/api/auth', require('./routes/auth'));

// SEO Routes (before static files to handle sitemap.xml and structured data)
app.use('/', require('./routes/seo'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Admin routes
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// Redirect /admin to login page
app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

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
    console.log(`  Admin: http://localhost:${PORT}/admin`);

    console.log(`\nNetwork access:`);
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${PORT}`);
                console.log(`  Admin: http://${iface.address}:${PORT}/admin`);
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
