# Security and Performance Enhancements Guide

This document provides comprehensive information about the security and performance optimizations implemented in the FrozenShield application.

## Table of Contents

1. [Security Enhancements](#security-enhancements)
2. [Performance Optimizations](#performance-optimizations)
3. [Configuration](#configuration)
4. [Monitoring](#monitoring)
5. [Best Practices](#best-practices)

---

## Security Enhancements

### 1. Security Headers (Helmet.js)

The application implements comprehensive security headers using Helmet.js:

#### Content Security Policy (CSP)
- **Purpose**: Prevents XSS attacks by controlling resource loading
- **Configuration**: Located in `server/server.js`
- **Directives**:
  - `defaultSrc`: Only allows self-origin resources
  - `scriptSrc`: Allows self-origin and inline scripts (required for dynamic functionality)
  - `styleSrc`: Allows self-origin, inline styles, and Google Fonts
  - `imgSrc`: Allows images from self, data URIs, HTTPS, and blob URLs
  - `connectSrc`: Restricts API connections to self-origin
  - `objectSrc`: Blocks all object embeds
  - `upgradeInsecureRequests`: Forces HTTPS connections

#### HTTP Strict Transport Security (HSTS)
- **Purpose**: Enforces HTTPS connections
- **Max Age**: 1 year (31536000 seconds)
- **Include Subdomains**: Yes
- **Preload**: Enabled for browser preload lists

#### Other Security Headers
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks
- **X-XSS-Protection**: Enabled - Browser XSS filter
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **X-Powered-By**: Removed - Hides server technology

### 2. Rate Limiting

Multiple rate limiting strategies protect different endpoints:

#### General API Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies To**: All `/api/*` routes

#### Authentication Rate Limiter
- **Window**: 15 minutes
- **Max Requests**: 5 login attempts
- **Skip Successful**: Yes
- **Purpose**: Prevents brute force attacks

#### Contact Form Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 10 submissions
- **Purpose**: Prevents spam

#### Upload Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 50 uploads
- **Purpose**: Prevents abuse

#### Registration Rate Limiter
- **Window**: 1 hour
- **Max Requests**: 3 registration attempts
- **Purpose**: Prevents mass account creation

### 3. Account Lockout Protection

Located in `server/middleware/rateLimiter.js`:

- **Failed Attempts Tracked**: By both email and IP address
- **Lockout Threshold**: 5 failed login attempts
- **Lockout Duration**: 30 minutes
- **Cleanup**: Automatic cleanup of expired lockouts every 5 minutes
- **Notification**: Returns remaining attempts in response

### 4. Input Validation and Sanitization

#### Sanitization Utilities (`server/utils/sanitize.js`)

- **sanitizeString**: Removes HTML and dangerous characters
- **sanitizeEmail**: Normalizes and validates email format
- **sanitizeMongoQuery**: Prevents NoSQL injection
- **sanitizeFilename**: Prevents directory traversal
- **sanitizeURL**: Validates and sanitizes URLs
- **sanitizeObject**: Recursively sanitizes all string values
- **removeNullBytes**: Prevents null byte injection

#### Validation Utilities (`server/utils/validate.js`)

- **isValidEmail**: Email format validation
- **validatePassword**: Password strength validation
  - Minimum 8 characters
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number
  - At least one special character
- **validateUsername**: Username format validation
- **isValidFileExtension**: Whitelist-based file extension validation
- **isValidMimeType**: MIME type validation with wildcard support
- **isValidObjectId**: MongoDB ObjectId format validation

### 5. File Upload Security

Located in `server/middleware/mediaUpload.js`:

- **File Type Validation**: Whitelist of allowed extensions and MIME types
- **File Size Limits**: 100MB maximum
- **Random Filenames**: Timestamp + random number to prevent overwrites
- **MIME Type Verification**: Both extension and MIME type are checked
- **Memory Storage**: Files processed in memory before saving
- **Error Handling**: Automatic cleanup of failed uploads

### 6. Enhanced Authentication

#### JWT Token Security
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 30 days (configurable)
- **Secure Storage**: HttpOnly cookies recommended for production

#### Password Security
- **Hashing**: bcrypt with salt rounds
- **Strength Requirements**: Enforced via validation
- **No Password Sanitization**: Passwords not sanitized to preserve special characters

### 7. CORS Configuration

- **Origin**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Credentials**: Enabled
- **Options Success Status**: 200

### 8. MongoDB Security

#### Connection Pooling
- **Max Pool Size**: 10 connections
- **Min Pool Size**: 5 connections
- **Socket Timeout**: 45 seconds
- **Connection Timeout**: 10 seconds
- **Compression**: zlib enabled

#### Query Security
- **NoSQL Injection Prevention**: Input sanitization removes `$` operators
- **Query Validation**: All user inputs validated before database queries

### 9. Security.txt

Located at `public/.well-known/security.txt`:

- **Contact**: security@frozenshield.ca
- **Expires**: 2026-12-31
- **Canonical URL**: Defined for proper indexing
- **Safe Harbor**: Guidelines for security researchers

---

## Performance Optimizations

### 1. Backend Performance

#### Compression
- **Algorithm**: gzip/brotli
- **Level**: 6 (balanced compression)
- **Filter**: Customizable via `x-no-compression` header

#### Response Caching
- **Static Assets**: 1 day cache in production
- **HTML Files**: No cache (always fresh)
- **ETag**: Enabled for conditional requests
- **Last-Modified**: Enabled

#### Request Timeout
- **Timeout**: 30 seconds
- **Response**: 408 Request Timeout status

#### MongoDB Optimizations
- **Connection Pooling**: 5-10 connections maintained
- **Retry Logic**: Automatic retry for writes and reads
- **Network Compression**: zlib compression enabled
- **Idle Connection Management**: 60-second timeout

### 2. Image Optimization

Located in `server/middleware/mediaUpload.js`:

#### Multiple Size Generation
- **Thumbnail**: 300px (JPEG & WebP)
- **Small**: 640px (JPEG & WebP)
- **Medium**: 1024px (JPEG & WebP)
- **Large**: 1920px (JPEG & WebP)
- **Original**: Preserved at 95% quality

#### WebP Support
- **Quality**: 75-80% (smaller file sizes)
- **Fallback**: JPEG versions always generated
- **Responsive**: Srcset generated for all sizes

#### Image Processing
- **Library**: Sharp (fast, memory-efficient)
- **Progressive JPEG**: Enabled for faster perceived loading
- **Smart Cropping**: Attention-based cropping for thumbnails

### 3. Frontend Performance

Located in `public/js/performance.js`:

#### Lazy Loading
- **Image Lazy Loading**: Intersection Observer API
- **Content Lazy Loading**: Deferred content rendering
- **Threshold**: Load when 1% visible
- **Root Margin**: 50-100px preload buffer

#### Debouncing and Throttling
- **Debounce**: For search inputs, form validation
- **Throttle**: For scroll and resize events
- **Default Wait**: 300ms for debounce, varies for throttle

#### Loading Skeletons
- **Types**: Card, list, text block
- **Animation**: Shimmer effect
- **Purpose**: Better perceived performance

#### Resource Preloading
- **Image Preloading**: Batch image loading
- **Link Prefetching**: Next page prefetching
- **Preconnect**: Early DNS resolution

#### DOM Optimization
- **Batch Processing**: Read/write batching to avoid layout thrashing
- **Request Idle Callback**: Defer non-critical tasks
- **Will-Change**: Optimized animations

### 4. Performance Monitoring

Located in `server/middleware/performance.js`:

#### Metrics Tracked
- **Request Count**: Total and by endpoint
- **Response Times**: Min, max, avg, median, p95, p99
- **Error Rate**: Total errors and by type
- **Slow Queries**: Database queries > 100ms
- **Memory Usage**: Heap and RSS
- **System Info**: Platform, Node version, CPU usage

#### Endpoints
- **GET /api/health**: Basic health check with memory info
- **GET /api/admin/metrics**: Comprehensive performance metrics (admin only)
- **GET /api/security-check**: Security header verification

#### Data Retention
- **Response Times**: Last 1000 requests
- **Slow Queries**: Last 100 queries
- **Recent Errors**: Last 50 errors

---

## Configuration

### Environment Variables

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/frozenshield
JWT_SECRET=your-secret-key-here

# Optional Security
ALLOWED_ORIGINS=https://frozenshield.ca,https://www.frozenshield.ca
NODE_ENV=production

# Optional Performance
MAX_POOL_SIZE=10
MIN_POOL_SIZE=5
```

### Helmet CSP Configuration

To customize CSP, edit `server/server.js`:

```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            // Add or modify directives here
        }
    }
}));
```

### Rate Limiting Configuration

Edit `server/middleware/rateLimiter.js` to adjust:
- Window duration
- Maximum requests
- Skip conditions
- Custom messages

---

## Monitoring

### Health Check

```bash
curl https://your-domain.com/api/health
```

Response:
```json
{
    "success": true,
    "status": "healthy",
    "timestamp": "2025-01-15T12:00:00.000Z",
    "uptime": 3600,
    "memory": {
        "heapUsed": 45,
        "heapTotal": 60
    }
}
```

### Performance Metrics (Admin Only)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.com/api/admin/metrics
```

### Security Headers Check

```bash
curl https://your-domain.com/api/security-check
```

### Browser Performance Monitoring

```javascript
// In browser console
const timing = PerformanceMonitor.measurePageLoad();
console.log(timing);
```

---

## Best Practices

### Security

1. **Keep Dependencies Updated**: Regularly run `npm audit` and `npm update`
2. **Use HTTPS**: Always use HTTPS in production
3. **Environment Variables**: Never commit secrets to version control
4. **Regular Backups**: Backup database regularly
5. **Monitor Logs**: Watch for suspicious activity
6. **Rate Limit Tuning**: Adjust based on legitimate traffic patterns
7. **Input Validation**: Always validate on both client and server

### Performance

1. **Enable Compression**: Already enabled for API responses
2. **Use CDN**: Consider CDN for static assets in production
3. **Database Indexes**: Add indexes for frequently queried fields
4. **Cache Headers**: Properly configured for static assets
5. **Lazy Loading**: Implement for images and content below fold
6. **Code Splitting**: Consider for large JavaScript bundles
7. **Monitor Metrics**: Regularly check `/api/admin/metrics` endpoint

### Image Optimization

1. **Use WebP**: Modern browsers support WebP format
2. **Responsive Images**: Use srcset and sizes attributes
3. **Lazy Loading**: Implement for images below fold
4. **Compression**: Already handled by Sharp middleware
5. **Progressive JPEG**: Enabled for better perceived performance

### Database

1. **Connection Pooling**: Already configured (5-10 connections)
2. **Query Optimization**: Use indexes, limit results
3. **Avoid N+1 Queries**: Use populate() judiciously
4. **Monitor Slow Queries**: Check metrics endpoint
5. **Regular Cleanup**: Remove old/unused data

---

## Testing Security

### Test Rate Limiting

```bash
# Test auth rate limit (should block after 5 attempts)
for i in {1..10}; do
    curl -X POST https://your-domain.com/api/auth/login \
         -H "Content-Type: application/json" \
         -d '{"email":"test@test.com","password":"wrong"}'
    sleep 1
done
```

### Test Security Headers

```bash
curl -I https://your-domain.com | grep -E "(X-|Content-Security|Strict-Transport)"
```

### Test Input Sanitization

```javascript
// Try to inject HTML
fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: '<script>alert("xss")</script>',
        email: 'test@test.com',
        message: 'Test message'
    })
});
// Should sanitize the HTML tags
```

---

## Troubleshooting

### High Memory Usage
1. Check `/api/admin/metrics` for memory stats
2. Review connection pool size
3. Check for memory leaks in custom code
4. Restart server if needed (graceful shutdown implemented)

### Slow Response Times
1. Check `/api/admin/metrics` for slow endpoints
2. Review database slow queries
3. Check network latency
4. Consider enabling Redis caching

### Rate Limit Issues
1. Adjust rate limits in `server/middleware/rateLimiter.js`
2. Whitelist trusted IPs if needed
3. Monitor false positives

### Failed Uploads
1. Check file size limits (100MB default)
2. Verify file type whitelist
3. Check disk space
4. Review error logs

---

## Additional Resources

- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Web Performance Guide](https://web.dev/performance/)

---

**Last Updated**: December 30, 2025
**Version**: 1.0.0
