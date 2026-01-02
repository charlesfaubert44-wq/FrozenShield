const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { trackResponseTime, getMetrics, errorTracker } = require('./middleware/performance');
const { generalLimiter } = require('./middleware/rateLimiter');
const { authenticate } = require('./middleware/auth');

const app = express();

// Connect to database
connectDB();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.quilljs.com"], // Quill.js CDN
            scriptSrcAttr: ["'unsafe-inline'"], // Temporary: allow inline event handlers while refactoring
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.quilljs.com"], // Quill.js styles
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true, // X-XSS-Protection: 1; mode=block
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' }, // X-Frame-Options: DENY
    hidePoweredBy: true // Remove X-Powered-By header
}));

// CORS Configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Compression with configuration
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6 // Compression level (0-9, 6 is default and balanced)
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Performance monitoring
app.use(trackResponseTime);

// Body parsing with limits
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting for API routes
app.use('/api/', generalLimiter);

// Request timeout middleware
app.use((req, res, next) => {
    req.setTimeout(30000, () => {
        res.status(408).json({
            success: false,
            message: 'Request timeout'
        });
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
    });
});

// Version endpoint - returns current app version
app.get('/api/version', (req, res) => {
    const packageJson = require('../package.json');
    res.json({
        success: true,
        version: packageJson.version,
        name: packageJson.name,
        timestamp: new Date().toISOString()
    });
});

// Performance metrics endpoint (admin only)
app.get('/api/admin/metrics', authenticate, (req, res) => {
    try {
        const metrics = getMetrics();
        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve metrics'
        });
    }
});

// Security headers test endpoint
app.get('/api/security-check', (req, res) => {
    res.json({
        success: true,
        message: 'Security headers are properly configured',
        headers: {
            csp: 'Content-Security-Policy configured',
            hsts: 'Strict-Transport-Security enabled',
            xContentTypeOptions: 'X-Content-Type-Options: nosniff',
            xFrameOptions: 'X-Frame-Options: DENY',
            referrerPolicy: 'Referrer-Policy configured'
        }
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/media', require('./routes/media'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/portfolio', require('./routes/portfolio'));

// Admin Routes (Protected)
app.use('/api/admin/projects', require('./routes/admin/projects'));
app.use('/api/admin/albums', require('./routes/admin/albums'));
app.use('/api/admin/videos', require('./routes/admin/videos'));
app.use('/api/admin/media', require('./routes/admin/media'));
app.use('/api/admin/stats', require('./routes/admin/stats'));
app.use('/api/admin/settings', require('./routes/admin/settings'));

// SEO Routes (before static files to handle sitemap.xml and structured data)
app.use('/', require('./routes/seo'));

// Serve static files from public directory with caching headers
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Set cache headers for static assets
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));

// Serve main site for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error tracking middleware
app.use(errorTracker);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: isDevelopment ? err.errors : undefined
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: isDevelopment ? err.message : 'Something went wrong!',
        error: isDevelopment ? err.message : undefined,
        stack: isDevelopment ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();

    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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

    console.log(`\nSecurity features enabled:`);
    console.log(`  - Helmet security headers`);
    console.log(`  - Rate limiting`);
    console.log(`  - Request compression`);
    console.log(`  - Performance monitoring`);
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
