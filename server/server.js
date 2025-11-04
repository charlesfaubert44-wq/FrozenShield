const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

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

app.listen(PORT, HOST, () => {
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
