# API Issues and Recommendations

## Executive Summary

This document outlines the findings from comprehensive API testing of the FrozenShield portfolio website. The analysis covers security vulnerabilities, missing validations, edge cases, and recommended improvements.

**Overall Assessment:** The API is functionally sound but requires several security and validation improvements before production deployment.

---

## Critical Issues

### 1. Password Security - No Minimum Requirements

**Severity:** HIGH

**Location:** `server/routes/auth.js` - Register endpoint

**Issue:**
The register endpoint accepts passwords of any length and complexity. No validation exists for:
- Minimum password length
- Password complexity (uppercase, lowercase, numbers, special characters)
- Common password checking

**Current Code:**
```javascript
// No password validation before creating admin
const admin = new Admin({
    username,
    email,
    password
});
```

**Recommendation:**
```javascript
// Add password validation
if (password.length < 8) {
    return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
    });
}

// Check password complexity
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
if (!passwordRegex.test(password)) {
    return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number, and special character'
    });
}
```

**Test Case:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"weak","email":"weak@test.com","password":"123"}'
# Currently accepts - should reject
```

---

### 2. Email Validation Missing

**Severity:** MEDIUM-HIGH

**Location:** `server/routes/contact.js` and `server/routes/auth.js`

**Issue:**
No email format validation on contact form or admin registration. Accepts invalid email formats.

**Current Code:**
```javascript
// Contact route - no email validation
if (!name || !email || !message) {
    return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
    });
}
```

**Recommendation:**
```javascript
// Add email validation helper function
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In validation section
if (!emailRegex.test(email)) {
    return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
    });
}
```

**Test Case:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"not-an-email","message":"Test message"}'
# Currently accepts - should reject
```

---

### 3. No Request Body Size Limits

**Severity:** MEDIUM-HIGH

**Location:** `server/server.js`

**Issue:**
No explicit body size limits configured. Vulnerable to large payload attacks that could cause memory issues or DoS.

**Current Code:**
```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Recommendation:**
```javascript
// Add body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

**Test Case:**
```bash
# Generate 10MB payload
python -c "print('{\"message\": \"' + 'A'*10000000 + '\"}')" | \
  curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d @-
# Currently might accept - should reject
```

---

### 4. NoSQL Injection Vulnerability

**Severity:** MEDIUM

**Location:** Multiple routes using MongoDB queries

**Issue:**
No input sanitization for MongoDB query operators. Could allow NoSQL injection attacks.

**Vulnerable Code:**
```javascript
// In auth.js login route
const admin = await Admin.findOne({
    $or: [{ username }, { email: username.toLowerCase() }]
});
```

**Attack Example:**
```javascript
// Attacker could send:
{
    "username": {"$ne": null},
    "password": {"$ne": null}
}
```

**Recommendation:**
```bash
# Install express-mongo-sanitize
npm install express-mongo-sanitize
```

```javascript
// In server.js
const mongoSanitize = require('express-mongo-sanitize');

// Add after body parser
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Attempted NoSQL injection: ${key}`);
    }
}));
```

**Test Case:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}'
# Should be sanitized and rejected
```

---

### 5. XSS Vulnerability in User Input

**Severity:** MEDIUM

**Location:** `server/routes/contact.js` and `server/routes/projects.js`

**Issue:**
No HTML sanitization on user input fields. Stored XSS vulnerability possible.

**Current Code:**
```javascript
// Direct storage without sanitization
const contact = new Contact({
    name,
    email,
    message
});
```

**Recommendation:**
```bash
# Install sanitization library
npm install xss
```

```javascript
const xss = require('xss');

// Sanitize inputs
const contact = new Contact({
    name: xss(name),
    email: email.toLowerCase().trim(),
    message: xss(message)
});
```

**Test Case:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"<script>alert(\"XSS\")</script>",
    "email":"test@example.com",
    "message":"Test <img src=x onerror=alert(1)>"
  }'
# Should sanitize HTML tags
```

---

### 6. JWT Secret in Code

**Severity:** MEDIUM

**Location:** `server/routes/auth.js` and `server/middleware/auth.js`

**Issue:**
Hardcoded fallback JWT secret in code. Security risk if deployed without proper environment variable.

**Current Code:**
```javascript
const token = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '30d' }
);
```

**Recommendation:**
```javascript
// Fail fast if JWT_SECRET not set
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

// Use the environment variable
const token = jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
);
```

**Alternative:** Implement startup check in `server.js`:
```javascript
// At the top of server.js
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: ${envVar} is not defined.`);
        process.exit(1);
    }
});
```

---

## Medium Priority Issues

### 7. Invalid MongoDB ObjectId Handling

**Severity:** MEDIUM

**Location:** All routes with `:id` parameter

**Issue:**
Invalid ObjectId format causes unhandled exception and returns 500 instead of 400.

**Current Behavior:**
```bash
GET /api/projects/invalid-id
# Returns 500 Internal Server Error
# Should return 400 Bad Request
```

**Recommendation:**
```javascript
// Add ObjectId validation middleware
const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }
    next();
};

// Use in routes
router.get('/:id', validateObjectId, async (req, res) => {
    // Route handler
});
```

---

### 8. No Input Length Validation

**Severity:** MEDIUM

**Location:** Multiple routes (contact, projects, auth)

**Issue:**
No maximum length validation on text fields. Could lead to database bloat or DoS.

**Recommendation:**
```javascript
// Add length validation
const MAX_LENGTHS = {
    name: 200,
    email: 254,  // RFC 5321 max email length
    message: 5000,
    title: 200,
    description: 2000,
    url: 2000
};

// Example validation
if (name.length > MAX_LENGTHS.name) {
    return res.status(400).json({
        success: false,
        message: `Name must not exceed ${MAX_LENGTHS.name} characters`
    });
}
```

---

### 9. Missing CORS Configuration

**Severity:** MEDIUM

**Location:** `server/server.js`

**Issue:**
CORS is enabled for all origins with no restrictions.

**Current Code:**
```javascript
app.use(cors());
```

**Recommendation:**
```javascript
// Configure CORS properly
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://frozenshield.ca', 'https://www.frozenshield.ca']
        : true,
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

### 10. Rate Limiting Too Lenient

**Severity:** MEDIUM

**Location:** `server/server.js` and `server/routes/contact.js`

**Issue:**
Rate limits may be too high for production, especially for authentication endpoints.

**Current Limits:**
- General API: 100 requests / 15 minutes
- Contact form: 10 requests / hour

**Recommendation:**
```javascript
// Separate rate limiters for different endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,  // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true
});

// Apply to auth routes only
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

## Low Priority Issues

### 11. Missing Pagination

**Severity:** LOW

**Location:** `server/routes/projects.js` and `server/routes/contact.js`

**Issue:**
No pagination on list endpoints. Could cause performance issues with large datasets.

**Recommendation:**
```javascript
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Project.countDocuments();
        const projects = await Project.find()
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: projects.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: projects
        });
    } catch (error) {
        // Error handling
    }
});
```

---

### 12. No Logging System

**Severity:** LOW

**Location:** Throughout application

**Issue:**
Only console.error logging. No structured logging or audit trail.

**Recommendation:**
```bash
npm install winston
```

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;

// Usage in routes
logger.info('Admin login attempt', { username, ip: req.ip });
logger.error('Project creation failed', { error: error.message, adminId: req.admin.id });
```

---

### 13. Missing API Versioning

**Severity:** LOW

**Location:** API routes

**Issue:**
No API versioning strategy. Future breaking changes would affect all clients.

**Recommendation:**
```javascript
// In server.js
app.use('/api/v1/contact', require('./routes/contact'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/auth', require('./routes/auth'));

// Keep backward compatibility
app.use('/api/contact', require('./routes/contact'));  // Redirect or deprecate
```

---

### 14. No Request ID Tracking

**Severity:** LOW

**Location:** Throughout application

**Issue:**
Difficult to trace specific requests through logs.

**Recommendation:**
```bash
npm install uuid
```

```javascript
const { v4: uuidv4 } = require('uuid');

// Middleware to add request ID
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
});

// Include in logs
logger.info('Request received', {
    requestId: req.id,
    path: req.path,
    method: req.method
});
```

---

### 15. Email Notifications Not Implemented

**Severity:** LOW

**Location:** `server/routes/contact.js`

**Issue:**
TODO comment indicates email notifications not implemented for contact form.

**Current Code:**
```javascript
// TODO: Send email notification here
// You can use nodemailer to send an email to your business email
```

**Recommendation:**
```bash
npm install nodemailer
```

```javascript
const nodemailer = require('nodemailer');

// Configure transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// After saving contact
const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Contact Form Submission from ${name}`,
    html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
    `
};

transporter.sendMail(mailOptions).catch(err => {
    logger.error('Email notification failed', { error: err.message });
});
```

---

## Edge Cases & Validation Gaps

### 16. Whitespace-Only Input

**Issue:** Accepts whitespace-only strings for required fields.

**Test Case:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"   ","email":"test@test.com","message":"          "}'
```

**Fix:**
```javascript
// Trim and validate
const trimmedMessage = message.trim();
if (trimmedMessage.length < 10) {
    return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
    });
}
```

---

### 17. Case Sensitivity in Login

**Issue:** Username is case-sensitive, but email is not. Inconsistent behavior.

**Fix:**
```javascript
// Normalize username to lowercase on registration and login
const admin = await Admin.findOne({
    $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
    ]
});
```

---

### 18. Duplicate Admin Prevention Only by Count

**Issue:** Race condition possible if two admin registrations happen simultaneously.

**Fix:**
```javascript
// Use unique index in database instead
// In Admin model
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,  // Database-level uniqueness
        lowercase: true
    }
});
```

---

### 19. No Confirmation for Destructive Actions

**Issue:** Delete operations have no confirmation or soft-delete option.

**Recommendation:** Implement soft delete:
```javascript
// Add to schemas
deletedAt: {
    type: Date,
    default: null
}

// Modify delete route
router.delete('/:id', auth, async (req, res) => {
    const project = await Project.findByIdAndUpdate(
        req.params.id,
        { deletedAt: new Date() },
        { new: true }
    );
    // Actual deletion could be handled by scheduled cleanup job
});
```

---

### 20. Token Expiration Not Checked on Refresh

**Issue:** No token refresh mechanism. Users must re-login after 30 days.

**Recommendation:**
```javascript
// Add refresh token endpoint
router.post('/refresh', async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Issue new token
        const newToken = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token: newToken
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
```

---

## Performance Recommendations

### 21. Database Indexing

**Location:** Model files

**Recommendation:**
```javascript
// In Project model
projectSchema.index({ featured: 1, order: 1 });
projectSchema.index({ createdAt: -1 });

// In Contact model
contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });

// In Admin model
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
```

---

### 22. Response Compression

**Location:** `server/server.js`

**Recommendation:**
```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

---

### 23. Caching for Public Endpoints

**Recommendation:**
```bash
npm install apicache
```

```javascript
const apicache = require('apicache');
const cache = apicache.middleware;

// Cache public endpoints
app.get('/api/projects', cache('5 minutes'), projectsController);
app.get('/sitemap.xml', cache('1 hour'), sitemapController);
```

---

## Security Enhancements

### 24. HTTPS Enforcement in Production

**Recommendation:**
```javascript
// In server.js
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

---

### 25. Security Headers Enhancement

**Current:** Basic helmet configuration

**Recommendation:**
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

---

### 26. Rate Limit Headers

**Recommendation:**
```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
```

---

## Testing Recommendations

### 27. Automated Testing

**Recommendation:**
```bash
npm install --save-dev jest supertest mongodb-memory-server
```

Create test suite:
```javascript
// tests/api/auth.test.js
const request = require('supertest');
const app = require('../../server/server');

describe('Auth Endpoints', () => {
    test('POST /api/auth/register - should register admin', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testadmin',
                email: 'admin@test.com',
                password: 'SecurePassword123!'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    // More tests...
});
```

---

### 28. Integration Testing

**Recommendation:** Add integration tests that test full user flows:
- Complete registration → login → create project → delete project flow
- Contact form submission → admin retrieval → status update flow

---

### 29. Load Testing

**Recommendation:**
```bash
npm install -g artillery
```

```yaml
# load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: "/api/projects"
      - get:
          url: "/api/health"
```

Run: `artillery run load-test.yml`

---

## Monitoring & Observability

### 30. Health Check Enhancement

**Current:** Basic health check

**Recommendation:**
```javascript
router.get('/health', async (req, res) => {
    const health = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'unknown'
    };

    // Check database connection
    try {
        await mongoose.connection.db.admin().ping();
        health.database = 'connected';
    } catch (error) {
        health.database = 'disconnected';
        health.status = 'unhealthy';
        health.success = false;
    }

    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
});
```

---

## Implementation Priority

### Immediate (Before Production)
1. ✅ Password strength validation
2. ✅ Email format validation
3. ✅ Request body size limits
4. ✅ NoSQL injection protection
5. ✅ XSS sanitization
6. ✅ JWT secret requirement
7. ✅ CORS configuration

### High Priority (Within 1 Week)
8. Invalid ObjectId handling
9. Input length validation
10. Enhanced rate limiting for auth
11. Database indexing
12. Logging system

### Medium Priority (Within 1 Month)
13. API versioning
14. Request ID tracking
15. Email notifications
16. Automated testing
17. Response compression
18. Security headers enhancement

### Low Priority (Future Enhancements)
19. Pagination
20. Caching
21. Token refresh mechanism
22. Soft delete
23. Load testing
24. Enhanced monitoring

---

## Conclusion

The FrozenShield API is well-structured and functionally complete, but requires several security and validation improvements before production deployment. The most critical issues involve input validation and sanitization to prevent injection attacks and ensure data integrity.

**Estimated Time to Address Critical Issues:** 4-6 hours
**Estimated Time for All High Priority Items:** 12-16 hours
**Estimated Time for Complete Implementation:** 30-40 hours

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Reviewed By:** API Testing Team
