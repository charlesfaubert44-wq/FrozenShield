# FrozenShield - Security & Performance Quick Reference

## Security Utilities

### Input Sanitization
```javascript
const { sanitizeString, sanitizeEmail, sanitizeObject } = require('./utils/sanitize');

// Sanitize user input
const cleanName = sanitizeString(req.body.name, { maxLength: 100 });
const cleanEmail = sanitizeEmail(req.body.email);
const cleanData = sanitizeObject(req.body);
```

### Input Validation
```javascript
const { isValidEmail, validatePassword } = require('./utils/validate');

// Validate email
if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email' });
}

// Validate password strength
const passwordCheck = validatePassword(password);
if (!passwordCheck.isValid) {
    return res.status(400).json({ errors: passwordCheck.errors });
}
```

## Rate Limiting

### Apply to Routes
```javascript
const { authLimiter, contactLimiter, uploadLimiter } = require('./middleware/rateLimiter');

// Protect authentication endpoints
router.post('/login', authLimiter, loginHandler);

// Protect contact form
router.post('/contact', contactLimiter, contactHandler);

// Protect uploads
router.post('/upload', uploadLimiter, uploadHandler);
```

### Account Lockout
```javascript
const { trackFailedLogin, lockAccount, resetFailedAttempts } = require('./middleware/rateLimiter');

// Track failed login
const attempts = trackFailedLogin(email);
if (attempts >= 5) {
    lockAccount(email, 30 * 60 * 1000); // 30 min
}

// Reset on success
resetFailedAttempts(email);
```

## Performance Monitoring

### Track Performance
```javascript
const { trackResponseTime, trackSlowQuery } = require('./middleware/performance');

// Auto-track responses (already in server.js)
app.use(trackResponseTime);

// Track slow queries manually
const startTime = Date.now();
const result = await Model.find(query);
trackSlowQuery(query, Date.now() - startTime, 'ModelName');
```

### Get Metrics
```javascript
const { getMetrics } = require('./middleware/performance');

// Get all metrics
const metrics = getMetrics();
console.log(metrics.performance.responseTime);
```

## Frontend Performance

### Lazy Loading Images
```html
<!-- In HTML -->
<img data-src="image.jpg"
     data-srcset="image-small.jpg 640w, image-large.jpg 1920w"
     alt="Description">

<!-- In JavaScript -->
<script src="/js/performance.js"></script>
<script>
    const lazyLoader = new LazyLoader();
</script>
```

### Lazy Loading Content
```html
<div data-lazy-content class="fade-in">
    <!-- Content loads when visible -->
</div>
```

### Debounce Functions
```javascript
const debouncedSearch = debounce((query) => {
    // Search API call
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

### Skeleton Loading
```javascript
// Show skeleton
SkeletonLoader.show('#container', 'card', 3);

// Load data
const data = await fetchData();

// Hide skeleton and show content
SkeletonLoader.hide('#container');
container.innerHTML = renderData(data);
```

## Image Optimization

### Upload and Process
```javascript
const { upload, processImage } = require('./middleware/mediaUpload');

router.post('/upload', upload.single('image'), async (req, res) => {
    const result = await processImage(req.file.buffer, req.file.originalname);
    // result.urls contains all generated image URLs
    // result.urls.optimizedWebP - WebP version
    // result.urls.responsive.srcset - Responsive srcset
});
```

### Use Responsive Images
```html
<picture>
    <source type="image/webp"
            srcset="image-small.webp 640w, image-large.webp 1920w">
    <source type="image/jpeg"
            srcset="image-small.jpg 640w, image-large.jpg 1920w">
    <img src="image.jpg" alt="Description">
</picture>
```

## Security Headers

### Already Configured (server.js)
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy

### Check Headers
```bash
curl -I https://your-domain.com
```

## Monitoring Endpoints

### Health Check
```bash
GET /api/health
```

### Performance Metrics (Admin)
```bash
GET /api/admin/metrics
Authorization: Bearer YOUR_TOKEN
```

### Security Check
```bash
GET /api/security-check
```

## Rate Limit Reference

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| General API | 15 min | 100 |
| Login | 15 min | 5 |
| Registration | 1 hour | 3 |
| Contact Form | 1 hour | 10 |
| Upload | 1 hour | 50 |
| Password Reset | 1 hour | 3 |
| Search | 1 min | 30 |

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/frozenshield
JWT_SECRET=your-secret-key

# Optional
ALLOWED_ORIGINS=https://example.com
NODE_ENV=production
```

## Common Tasks

### Add New Protected Route
```javascript
const { authenticate } = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');

router.get('/protected',
    generalLimiter,      // Rate limit
    authenticate,         // Auth check
    handler
);
```

### Sanitize All Inputs
```javascript
const { sanitizeObject } = require('./utils/sanitize');

router.post('/endpoint', async (req, res) => {
    const cleanData = sanitizeObject(req.body);
    // Use cleanData instead of req.body
});
```

### Track Custom Metric
```javascript
const { getMetrics } = require('./middleware/performance');

// Metrics are auto-tracked
// Access via /api/admin/metrics
```

## Troubleshooting

### Rate Limit Hit
```javascript
// Adjust in middleware/rateLimiter.js
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200  // Increase from 100
});
```

### High Memory Usage
```javascript
// Check metrics
const metrics = getMetrics();
console.log(metrics.memory);

// Adjust MongoDB pool
// In config/db.js
maxPoolSize: 5  // Reduce from 10
```

### Slow Images
```javascript
// Reduce generated sizes in middleware/mediaUpload.js
const sizes = {
    thumbnail: 300,
    small: 640,
    medium: 1024  // Remove larger sizes if not needed
};
```

## File Locations

```
server/
├── utils/
│   ├── sanitize.js        # Input sanitization
│   └── validate.js        # Input validation
├── middleware/
│   ├── rateLimiter.js    # Rate limiting & lockout
│   ├── performance.js    # Performance monitoring
│   ├── auth.js           # Authentication
│   └── mediaUpload.js    # Image optimization
├── config/
│   └── db.js             # MongoDB with pooling
└── server.js             # Security headers

public/
├── js/
│   └── performance.js    # Frontend performance utils
├── css/
│   └── performance.css   # Loading styles
└── .well-known/
    └── security.txt      # Security policy
```

## Testing Commands

```bash
# Install dependencies
npm install

# Run security audit
npm audit

# Start server
npm start

# Development mode
npm run dev

# Test rate limiting
for i in {1..10}; do curl http://localhost:5000/api/endpoint; done

# Check security headers
curl -I http://localhost:5000
```

---

**Quick tip**: Always sanitize inputs, validate data, and monitor performance!
