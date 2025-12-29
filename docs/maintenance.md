# Maintenance Guide

Comprehensive guide for maintaining and operating FrozenShield in production.

## Table of Contents

1. [Routine Maintenance](#routine-maintenance)
2. [Updating Dependencies](#updating-dependencies)
3. [Database Maintenance](#database-maintenance)
4. [Backup Strategies](#backup-strategies)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Security Maintenance](#security-maintenance)
7. [Performance Optimization](#performance-optimization)
8. [Log Management](#log-management)
9. [Disaster Recovery](#disaster-recovery)
10. [Scaling Considerations](#scaling-considerations)

---

## Routine Maintenance

### Daily Tasks

**1. Monitor Application Health**

Check health endpoint:
```bash
curl https://frozenshield.ca/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-27T10:00:00.000Z",
  "uptime": 86400
}
```

**2. Review Error Logs**

Check for any errors or warnings in application logs (see [Log Management](#log-management)).

**3. Check Contact Form Submissions**

- Log into admin panel
- Review new contact submissions
- Respond to inquiries
- Archive processed submissions

---

### Weekly Tasks

**1. Database Health Check**

Monitor MongoDB Atlas dashboard:
- Connection count
- Storage usage
- Operation latency
- Error rate

**2. Review Rate Limit Hits**

Check server logs for rate limit violations:
- High rate limit hits may indicate abuse
- Consider blocking IPs if malicious

**3. Security Scan**

Run security checks:
```bash
npm audit
```

Fix critical vulnerabilities:
```bash
npm audit fix
```

**4. Performance Review**

- Check average API response times
- Monitor page load speeds
- Review database query performance

---

### Monthly Tasks

**1. Update Dependencies** (see [Updating Dependencies](#updating-dependencies))

**2. Backup Verification** (see [Backup Strategies](#backup-strategies))

**3. SSL Certificate Check**

Verify SSL certificate expiration:
```bash
echo | openssl s_client -servername frozenshield.ca -connect frozenshield.ca:443 2>/dev/null | openssl x509 -noout -dates
```

**4. Access Review**

- Review admin accounts
- Remove inactive admins
- Verify JWT secrets are secure

**5. Content Audit**

- Review all published projects
- Update outdated information
- Remove deprecated content
- Check for broken links

---

### Quarterly Tasks

**1. Major Dependency Updates**

Test and apply major version updates (see [Updating Dependencies](#updating-dependencies)).

**2. Security Audit**

- Review authentication mechanisms
- Test rate limiting effectiveness
- Audit CORS configuration
- Check Helmet.js security headers

**3. Performance Optimization** (see [Performance Optimization](#performance-optimization))

**4. Disaster Recovery Test** (see [Disaster Recovery](#disaster-recovery))

---

## Updating Dependencies

### Check for Updates

**View outdated packages**:
```bash
npm outdated
```

Output shows:
- Current version
- Wanted version (minor updates)
- Latest version (major updates)

---

### Update Strategy

**Minor & Patch Updates** (low risk):
```bash
# Update all within semver ranges
npm update

# Or update specific package
npm update express
```

**Major Updates** (requires testing):
```bash
# Update to latest major version
npm install express@latest

# Update all to latest (risky)
npm update --latest
```

---

### Safe Update Process

**1. Create backup**:
```bash
# Backup package.json
cp package.json package.json.backup

# Backup package-lock.json
cp package-lock.json package-lock.json.backup
```

**2. Update in development environment**:
```bash
npm update
```

**3. Test application thoroughly**:
```bash
# Start server
npm run dev

# Test all endpoints:
# - Public routes
# - Authentication
# - Admin panel
# - Contact form
# - SEO endpoints
```

**4. Run security audit**:
```bash
npm audit
```

**5. Commit changes**:
```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies"
```

**6. Deploy to production** (with ability to rollback).

---

### Handling Breaking Changes

**1. Read changelog**:
- Check package GitHub/npm page
- Review CHANGELOG.md or release notes
- Identify breaking changes

**2. Update code if needed**:
- Modify code to match new API
- Update configuration
- Test thoroughly

**3. Consider staying on current version**:
- If update provides no value
- If breaking changes are extensive
- Security fixes may still be backported

---

### Critical Security Updates

**Immediate action required**:
```bash
# Check for vulnerabilities
npm audit

# Apply automatic fixes
npm audit fix

# Force fixes (may break things)
npm audit fix --force
```

**If automatic fix unavailable**:
- Manually update vulnerable package
- Check for alternative packages
- Apply workarounds if update impossible
- Monitor security advisories

---

## Database Maintenance

### MongoDB Atlas Maintenance

**1. Monitor Storage Usage**

- Dashboard > Cluster > Metrics
- Free tier: 512MB limit
- Upgrade before hitting 80%

**2. Review Slow Queries**

- Performance Advisor tab
- Identify slow queries
- Add indexes if needed

**3. Index Management**

Check existing indexes:
```javascript
// In mongosh
db.projects.getIndexes()
db.contacts.getIndexes()
db.admins.getIndexes()
```

Create index if needed:
```javascript
// For frequently queried fields
db.projects.createIndex({ featured: 1, order: 1 })
```

**4. Connection Management**

- Monitor active connections
- Free tier: 100-500 connections
- Upgrade if consistently hitting limit

---

### Database Cleanup

**1. Archive Old Contact Submissions**

Remove contacts older than 6 months:
```javascript
// In mongosh
db.contacts.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
  status: 'archived'
})
```

**2. Remove Unused Projects**

Check for orphaned data:
```javascript
// Find projects without images
db.projects.find({ image: { $exists: false } })

// Find projects not featured and very old
db.projects.find({
  featured: false,
  createdAt: { $lt: new Date('2024-01-01') }
})
```

**3. Optimize Collections**

MongoDB automatically optimizes, but you can manually trigger:
```javascript
// Rebuild indexes
db.projects.reIndex()
```

---

### Data Integrity Checks

**1. Verify required fields**:
```javascript
// Check for projects missing required fields
db.projects.find({
  $or: [
    { title: { $exists: false } },
    { description: { $exists: false } }
  ]
})
```

**2. Check for duplicate admins**:
```javascript
// Should return empty if no duplicates
db.admins.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

**3. Validate email formats**:
```javascript
// Find invalid emails
db.contacts.find({
  email: { $not: /@/ }
})
```

---

## Backup Strategies

### Automated Backups (MongoDB Atlas)

**Free tier includes**:
- Daily snapshots (retained 2 days)
- Cannot customize schedule

**Paid tiers include**:
- Configurable snapshot schedule
- Point-in-time recovery
- Longer retention periods

**Enable continuous backup** (M10+ clusters):
- Atlas > Backup > Enable
- Configure snapshot schedule
- Set retention policy

---

### Manual Database Backup

**Using mongodump** (for local or Atlas):

```bash
# Backup entire database
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/frozenshield" --out=./backups/$(date +%Y%m%d)

# Backup specific collection
mongodump --uri="..." --collection=projects --out=./backups/projects-$(date +%Y%m%d)
```

**Schedule with cron** (Linux/Mac):
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/bin/mongodump --uri="..." --out=/backups/$(date +\%Y\%m\%d)
```

---

### Restore from Backup

**Restore entire database**:
```bash
mongorestore --uri="mongodb+srv://..." --drop ./backups/20251227
```

**Restore specific collection**:
```bash
mongorestore --uri="..." --collection=projects --drop ./backups/20251227/frozenshield/projects.bson
```

**Important**: Use `--drop` flag to replace existing data.

---

### Application Code Backup

**1. Git repository** (primary backup):
```bash
# Ensure code is committed
git status
git add .
git commit -m "snapshot: $(date +%Y%m%d)"
git push origin main
```

**2. GitHub/GitLab automatic backups**:
- Code is backed up automatically
- Clone repository to restore

**3. Environment variables backup**:
```bash
# Export current env vars (DO NOT commit)
cp .env .env.backup.$(date +%Y%m%d)

# Store securely (encrypted storage, password manager)
```

---

### Backup Best Practices

1. **Follow 3-2-1 rule**:
   - 3 copies of data
   - 2 different storage types
   - 1 offsite backup

2. **Test restores regularly**:
   - Monthly restore test
   - Verify data integrity
   - Document restore process

3. **Encrypt backups**:
   - Especially for sensitive data
   - Use encrypted storage

4. **Automate backups**:
   - Use cron jobs or cloud automation
   - Monitor backup success
   - Alert on failures

5. **Version backups**:
   - Keep multiple versions
   - Don't overwrite old backups immediately

---

## Monitoring & Alerts

### Application Monitoring

**1. Uptime Monitoring**

Use services like:
- UptimeRobot (free tier available)
- Pingdom
- Better Uptime
- StatusCake

**Configure health check**:
- URL: `https://frozenshield.ca/api/health`
- Interval: Every 5 minutes
- Alert if down for 2 consecutive checks

**2. Response Time Monitoring**

Monitor API response times:
- Target: <200ms for most endpoints
- Alert if >500ms average
- Alert if >1s for any endpoint

**3. Error Rate Monitoring**

Track 5xx errors:
- Acceptable: <0.1% of requests
- Alert if >1% error rate

---

### Infrastructure Monitoring

**1. Server Resources** (if using VPS):

Monitor:
- CPU usage (<70% average)
- Memory usage (<80%)
- Disk space (>20% free)
- Network bandwidth

Tools:
- htop (CPU/memory)
- df -h (disk space)
- iotop (disk I/O)
- nload (network)

**2. MongoDB Atlas Monitoring**:

Built-in metrics:
- Operations per second
- Network traffic
- Disk I/O
- Connection count

**Configure alerts**:
- Atlas > Alerts
- Set thresholds for:
  - CPU usage >80%
  - Storage >80%
  - Connections >80% of limit

---

### Log Monitoring

**Recommended approach**:

1. **Centralized logging** (recommended for production):
   - Loggly
   - Papertrail
   - Datadog
   - Sentry (for errors)

2. **Configure log shipping**:
```javascript
// Install Winston for structured logging
npm install winston winston-loggly-bulk

// Configure in server.js
const winston = require('winston');
const { Loggly } = require('winston-loggly-bulk');

winston.add(new Loggly({
  token: process.env.LOGGLY_TOKEN,
  subdomain: process.env.LOGGLY_SUBDOMAIN,
  tags: ['frozenshield', 'production'],
  json: true
}));
```

**3. Alert on critical errors**:
- Database connection failures
- Authentication failures spike
- 500 errors
- Unhandled exceptions

---

### Performance Monitoring

**1. Application Performance Monitoring (APM)**:

Tools:
- New Relic (free tier available)
- AppDynamics
- Datadog APM

**Monitors**:
- Request/response times
- Database query performance
- Error traces
- Throughput

**2. Real User Monitoring (RUM)**:

Track actual user experience:
- Google Analytics
- Google PageSpeed Insights
- Lighthouse CI

---

### Custom Health Checks

**Create comprehensive health endpoint**:

```javascript
// In server/routes/health.js
app.get('/api/health/detailed', auth, async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: 'unknown',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  // Check database
  try {
    await mongoose.connection.db.admin().ping();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
  }

  const status = health.database === 'connected' ? 200 : 503;
  res.status(status).json(health);
});
```

---

## Security Maintenance

### Regular Security Tasks

**1. Review Admin Accounts**

Monthly review:
```bash
npm run list-admins
```

Remove inactive admins:
```javascript
// In mongosh
db.admins.deleteOne({ email: 'old@email.com' })
```

**2. Rotate JWT Secret**

Annually or if compromised:
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env
JWT_SECRET=new-secret-here

# Restart server (invalidates all tokens)
```

**3. Review Rate Limits**

Check if current limits are appropriate:
```javascript
// In server/server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // Adjust based on usage patterns
});
```

**4. Update Security Headers**

Keep Helmet.js updated:
```bash
npm update helmet
```

Review CSP policy periodically.

---

### Security Audits

**1. Automated Scanning**:

```bash
# Check for known vulnerabilities
npm audit

# More detailed scan
npm install -g snyk
snyk test
```

**2. Manual Code Review**:

Focus on:
- Input validation
- Authentication logic
- Database queries (SQL/NoSQL injection)
- File operations
- Environment variable usage

**3. Penetration Testing**:

Consider annual penetration testing:
- OWASP ZAP (free, automated)
- Burp Suite (professional)
- Hire security professional

---

### SSL/TLS Maintenance

**1. Certificate Renewal**:

If using Let's Encrypt (auto-renews):
```bash
# Test renewal
certbot renew --dry-run

# Force renewal if needed
certbot renew --force-renewal
```

**2. Verify SSL Configuration**:

Test with SSL Labs:
- https://www.ssllabs.com/ssltest/
- Target: A or A+ rating

**3. Enable HSTS** (already configured via Helmet):
```javascript
helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
})
```

---

## Performance Optimization

### Database Optimization

**1. Add Indexes**:

For frequently queried fields:
```javascript
// In model files
ProjectSchema.index({ featured: 1, order: 1 });
ProjectSchema.index({ createdAt: -1 });
ContactSchema.index({ createdAt: -1, status: 1 });
```

**2. Use Lean Queries**:

For read-only operations:
```javascript
// Before (creates Mongoose documents)
const projects = await Project.find();

// After (returns plain JavaScript objects, faster)
const projects = await Project.find().lean();
```

**3. Select Only Needed Fields**:
```javascript
// Don't fetch unnecessary data
const projects = await Project.find()
  .select('title description image tags featured')
  .lean();
```

---

### API Response Caching

**Implement Redis caching**:

```bash
npm install redis
```

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache project list for 5 minutes
app.get('/api/projects', async (req, res) => {
  const cacheKey = 'projects:all';

  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from database
  const projects = await Project.find().lean();

  // Cache for 5 minutes
  await client.setEx(cacheKey, 300, JSON.stringify(projects));

  res.json({ success: true, data: projects });
});
```

---

### Static Asset Optimization

**1. Enable Compression**:
```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

**2. Cache Static Files**:
```javascript
app.use(express.static('public', {
  maxAge: '1d', // Cache for 1 day
  etag: true
}));
```

**3. Use CDN**:
- Cloudflare (free tier)
- AWS CloudFront
- Fastly

---

### Monitor Performance Metrics

**Key metrics to track**:

1. **Response Time**:
   - P50 (median): <100ms
   - P95: <300ms
   - P99: <500ms

2. **Throughput**:
   - Requests per second
   - Concurrent connections

3. **Error Rate**:
   - 4xx errors: <5%
   - 5xx errors: <0.1%

4. **Database Performance**:
   - Query time: <50ms average
   - Connection pool usage

---

## Log Management

### Implement Structured Logging

**Install Winston**:
```bash
npm install winston
```

**Configure logger** (`server/config/logger.js`):
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
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
```

**Use in application**:
```javascript
const logger = require('./config/logger');

logger.info('Server started', { port: PORT });
logger.error('Database connection failed', { error: err.message });
```

---

### Log Rotation

**Using logrotate** (Linux):

Create `/etc/logrotate.d/frozenshield`:
```
/var/log/frozenshield/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        /usr/bin/killall -SIGUSR1 node
    endscript
}
```

---

### Log Analysis

**Analyze logs for issues**:

```bash
# Find errors
grep "ERROR" combined.log

# Count 500 errors
grep "500" combined.log | wc -l

# Find slow requests
grep "response_time.*[5-9][0-9][0-9]" combined.log
```

---

## Disaster Recovery

### Disaster Recovery Plan

**1. Identify Critical Assets**:
- Database (MongoDB)
- Application code (Git)
- Environment variables
- SSL certificates
- Domain configuration

**2. Recovery Time Objective (RTO)**: 4 hours
- Maximum acceptable downtime

**3. Recovery Point Objective (RPO)**: 24 hours
- Maximum acceptable data loss

---

### Recovery Procedures

**Scenario 1: Database Failure**

1. Check MongoDB Atlas status
2. Wait for auto-recovery (usually <5 minutes)
3. If not recovered, restore from backup:
   ```bash
   mongorestore --uri="..." --drop ./backups/latest
   ```
4. Verify data integrity
5. Update DNS if switching servers

**Scenario 2: Application Server Failure**

1. Deploy to new server:
   ```bash
   git clone https://github.com/your-repo/frozenshield.git
   cd frozenshield
   npm install
   ```
2. Configure environment variables
3. Start application:
   ```bash
   npm start
   ```
4. Update DNS/load balancer
5. Verify functionality

**Scenario 3: Complete Infrastructure Loss**

1. Provision new infrastructure
2. Restore database from offsite backup
3. Clone application code from Git
4. Restore environment variables from secure storage
5. Reconfigure SSL certificates
6. Update DNS
7. Full functionality test

---

### Testing Disaster Recovery

**Quarterly DR drill**:

1. Create test environment
2. Simulate failure scenario
3. Execute recovery procedures
4. Time the recovery process
5. Document issues encountered
6. Update DR plan

---

## Scaling Considerations

### Vertical Scaling (Scale Up)

**Increase server resources**:
- More CPU cores
- More RAM
- Faster storage (SSD)

**When to scale up**:
- CPU consistently >70%
- Memory consistently >80%
- Disk I/O bottlenecks

---

### Horizontal Scaling (Scale Out)

**Add more servers**:

1. **Add load balancer** (nginx, HAProxy, cloud LB)
2. **Deploy multiple app instances**
3. **Use shared session store** (Redis)
4. **Centralize file storage** (S3, Cloud Storage)

**Example nginx load balancer**:
```nginx
upstream frozenshield {
    server app1.frozenshield.ca:5000;
    server app2.frozenshield.ca:5000;
    server app3.frozenshield.ca:5000;
}

server {
    listen 80;
    server_name frozenshield.ca;

    location / {
        proxy_pass http://frozenshield;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### Database Scaling

**MongoDB scaling options**:

1. **Vertical scaling**: Upgrade Atlas tier
2. **Read replicas**: Distribute read load
3. **Sharding**: Distribute data across servers

**When to scale database**:
- Storage >80% capacity
- Connections >80% limit
- Query latency >100ms

---

### Caching Layer

**Implement Redis for caching**:

1. Cache frequently accessed data
2. Cache API responses
3. Store sessions for multi-server setup
4. Reduce database load

---

## Conclusion

Regular maintenance ensures FrozenShield remains:
- **Secure**: Up-to-date dependencies, regular audits
- **Reliable**: Backups, monitoring, disaster recovery
- **Performant**: Optimizations, caching, scaling
- **Available**: Uptime monitoring, quick recovery

**Maintenance Schedule Summary**:
- **Daily**: Health checks, log review
- **Weekly**: Security scan, performance review
- **Monthly**: Dependency updates, backup verification
- **Quarterly**: Major updates, DR tests, security audit

For technical issues, see [Troubleshooting Guide](./troubleshooting.md).

---

Last Updated: 2025-12-27
