# Troubleshooting Guide

Common issues and solutions for FrozenShield.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Database Connection Problems](#database-connection-problems)
3. [Authentication Issues](#authentication-issues)
4. [API Errors](#api-errors)
5. [Admin Panel Issues](#admin-panel-issues)
6. [Contact Form Problems](#contact-form-problems)
7. [SEO & Sitemap Issues](#seo--sitemap-issues)
8. [Performance Issues](#performance-issues)
9. [Deployment Problems](#deployment-problems)
10. [Common Error Messages](#common-error-messages)

---

## Installation Issues

### npm install fails

**Symptoms**:
- `npm install` command fails with errors
- Missing dependencies warnings

**Solutions**:

1. **Check Node.js version**:
   ```bash
   node --version
   ```
   Ensure you have Node.js v14 or higher.

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   npm install
   ```

3. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Update npm**:
   ```bash
   npm install -g npm@latest
   ```

---

### .env file issues

**Symptoms**:
- "Cannot find module 'dotenv'" error
- Environment variables not loading

**Solutions**:

1. **Ensure .env file exists in root directory**:
   ```bash
   cp .env.example .env
   ```

2. **Check .env file format** (no quotes needed):
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/frozenshield
   JWT_SECRET=your-secret-key-here
   ```

3. **Verify dotenv is installed**:
   ```bash
   npm install dotenv
   ```

---

## Database Connection Problems

### MongoDB connection failed

**Symptoms**:
- "MongoDB connection failed after 5 attempts"
- Server runs but shows database warnings

**Solutions**:

1. **Check if MongoDB is running** (local):
   ```bash
   # Start MongoDB
   mongod
   ```

2. **Verify MONGODB_URI** in `.env`:
   ```
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/frozenshield

   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/frozenshield
   ```

3. **Test connection manually**:
   ```bash
   # Using mongosh
   mongosh "mongodb://localhost:27017/frozenshield"
   ```

4. **Check MongoDB Atlas IP whitelist**:
   - Go to MongoDB Atlas dashboard
   - Network Access > Add IP Address
   - Add `0.0.0.0/0` for development (allow all)
   - Or add your specific IP address

5. **Verify credentials**:
   - Check username and password in connection string
   - Ensure special characters are URL-encoded

---

### Database disconnects randomly

**Symptoms**:
- Server crashes after some time
- "MongooseServerSelectionError" errors

**Solutions**:

1. **Enable automatic reconnection** (already configured):
   The system uses exponential backoff retry logic.

2. **Check network stability**:
   - Ensure stable internet connection for MongoDB Atlas
   - Check firewall settings

3. **Monitor MongoDB Atlas M0 (free tier) limits**:
   - 512MB storage limit
   - Connection limits may apply
   - Consider upgrading if hitting limits

---

## Authentication Issues

### Cannot register first admin

**Symptoms**:
- "Admin registration is disabled" message
- Registration fails unexpectedly

**Solutions**:

1. **Check if an admin already exists**:
   ```bash
   npm run list-admins
   ```

2. **If stuck, manually create admin**:
   ```bash
   npm run create-admin
   ```

3. **Reset admin collection** (DANGER - deletes all admins):
   ```bash
   # Using mongosh
   mongosh "mongodb://localhost:27017/frozenshield"
   db.admins.deleteMany({})
   ```

---

### JWT token invalid or expired

**Symptoms**:
- "Token is not valid" error
- Automatically logged out
- API returns 401 Unauthorized

**Solutions**:

1. **Clear localStorage and login again**:
   ```javascript
   localStorage.clear();
   ```
   Then navigate to `/admin/login` and log in again.

2. **Check JWT_SECRET consistency**:
   - Ensure `JWT_SECRET` in `.env` hasn't changed
   - Changing the secret invalidates all existing tokens

3. **Token expiration**:
   - Tokens expire after 30 days
   - Log in again to get a new token

4. **Verify token in request**:
   ```javascript
   // Check if token is being sent
   console.log(localStorage.getItem('token'));
   ```

---

### Cannot log in with correct credentials

**Symptoms**:
- "Invalid credentials" error
- Password definitely correct

**Solutions**:

1. **Check username/email**:
   - Login accepts both username OR email
   - Verify the account exists: `npm run list-admins`

2. **Password case sensitivity**:
   - Passwords are case-sensitive
   - Check for extra spaces

3. **Reset password manually**:
   ```bash
   npm run create-admin
   # Follow prompts to update existing admin password
   ```

---

## API Errors

### 500 Internal Server Error

**Symptoms**:
- API returns 500 status code
- "Something went wrong!" message

**Solutions**:

1. **Check server logs**:
   ```bash
   npm run dev
   ```
   Look for error stack traces in console.

2. **Verify database connection**:
   - Ensure MongoDB is connected
   - Check server startup logs

3. **Validate request data**:
   - Ensure all required fields are provided
   - Check data types match schema

4. **Enable development mode** for detailed errors:
   ```
   NODE_ENV=development
   ```
   Restart server to see full error messages.

---

### 404 Not Found for API routes

**Symptoms**:
- API endpoint returns 404
- Routes not accessible

**Solutions**:

1. **Verify correct URL**:
   ```
   http://localhost:5000/api/projects  ✓
   http://localhost:5000/projects      ✗
   ```

2. **Check server is running**:
   ```bash
   npm run dev
   ```

3. **Verify route is mounted** in `server/server.js`:
   ```javascript
   app.use('/api/projects', require('./routes/projects'));
   ```

---

### CORS errors

**Symptoms**:
- "Access-Control-Allow-Origin" error
- Requests blocked by browser

**Solutions**:

1. **Verify CORS is enabled** (should be by default):
   ```javascript
   app.use(cors());
   ```

2. **For production with specific domain**:
   ```javascript
   app.use(cors({
     origin: 'https://frozenshield.ca'
   }));
   ```

---

## Admin Panel Issues

### Admin panel shows blank page

**Symptoms**:
- White/blank screen at `/admin/dashboard`
- Console shows JavaScript errors

**Solutions**:

1. **Check browser console** for errors:
   - Press F12 > Console tab
   - Look for JavaScript errors

2. **Verify token exists**:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```
   If null, go to `/admin/login`.

3. **Clear cache and reload**:
   - Ctrl+Shift+R (hard refresh)
   - Clear browser cache

4. **Check if backend is running**:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

### Projects not loading in admin panel

**Symptoms**:
- Dashboard loads but no projects shown
- "Failed to load projects" error

**Solutions**:

1. **Check API endpoint**:
   ```bash
   curl http://localhost:5000/api/projects
   ```

2. **Verify token is valid**:
   - Check console for 401 errors
   - Re-login if token expired

3. **Check database connection**:
   - Look for database errors in server logs

---

### Cannot upload project images

**Symptoms**:
- Image field doesn't work
- Images don't display

**Solutions**:

1. **Use external image URLs**:
   - FrozenShield uses image URLs, not direct uploads
   - Host images on Imgur, Cloudinary, or similar
   - Example: `https://i.imgur.com/abc123.jpg`

2. **Verify image URL is valid**:
   - Test URL in browser
   - Must be publicly accessible
   - HTTPS recommended

3. **Future enhancement**:
   - Consider adding image upload functionality
   - Use services like Cloudinary or AWS S3

---

## Contact Form Problems

### Contact form submissions fail

**Symptoms**:
- Form shows error message
- Submissions not saved to database

**Solutions**:

1. **Check rate limiting**:
   - Limit: 10 submissions per hour per IP
   - Wait if limit exceeded

2. **Verify all required fields**:
   - Name (required)
   - Email (required, valid format)
   - Message (required, 10-2000 characters)

3. **Check honeypot field**:
   - Hidden "website" field must be empty
   - Some browser extensions auto-fill forms

4. **Test API directly**:
   ```bash
   curl -X POST http://localhost:5000/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test",
       "email": "test@example.com",
       "message": "Test message from curl"
     }'
   ```

---

### Rate limit too restrictive

**Symptoms**:
- "Too many requests" error
- Cannot test contact form repeatedly

**Solutions**:

1. **Adjust rate limit** in `server/routes/contact.js`:
   ```javascript
   const contactLimiter = rateLimit({
     windowMs: 60 * 60 * 1000,  // 1 hour
     max: 50,  // Increase from 10 to 50 for testing
   });
   ```

2. **Disable rate limiting temporarily** (development only):
   ```javascript
   // Comment out rate limiter
   // router.post('/', contactLimiter, async (req, res) => {
   router.post('/', async (req, res) => {
   ```

3. **Clear rate limit** (restart server):
   - Rate limits reset when server restarts
   - Or wait for the time window to expire

---

## SEO & Sitemap Issues

### Sitemap not updating with new projects

**Symptoms**:
- `/sitemap.xml` doesn't show new projects
- Sitemap outdated

**Solutions**:

1. **Verify project is featured**:
   - Only featured projects appear in sitemap
   - Set `featured: true` in admin panel

2. **Check sitemap endpoint**:
   ```bash
   curl http://localhost:5000/sitemap.xml
   ```

3. **Clear browser cache**:
   - Browser may cache sitemap XML
   - Hard refresh: Ctrl+Shift+R

4. **Verify route is mounted**:
   ```javascript
   app.use('/', require('./routes/seo'));
   ```

---

### Structured data not showing in Google

**Symptoms**:
- Rich results test shows no data
- Structured data missing

**Solutions**:

1. **Test structured data endpoint**:
   ```bash
   curl http://localhost:5000/structured-data.json
   ```

2. **Verify script tag updates** in browser console:
   ```javascript
   console.log(document.querySelector('script[type="application/ld+json"]').textContent);
   ```

3. **Use Google Rich Results Test**:
   - Go to: https://search.google.com/test/rich-results
   - Enter: `https://frozenshield.ca`
   - Check for errors

4. **Wait for Google to crawl**:
   - Changes may take 1-2 weeks to reflect
   - Submit sitemap in Google Search Console

---

## Performance Issues

### Slow API response times

**Symptoms**:
- API takes >1 second to respond
- Pages load slowly

**Solutions**:

1. **Check database indexes**:
   - Mongoose creates indexes automatically
   - For custom queries, add indexes:
   ```javascript
   ProjectSchema.index({ featured: 1, order: 1 });
   ```

2. **Monitor MongoDB performance**:
   - Check MongoDB Atlas metrics
   - Look for slow queries

3. **Optimize database queries**:
   ```javascript
   // Only select needed fields
   await Project.find().select('title description image');
   ```

4. **Consider caching**:
   - Add Redis for frequently accessed data
   - Cache project list for 5 minutes

---

### High memory usage

**Symptoms**:
- Server crashes with memory errors
- `FATAL ERROR: ... JavaScript heap out of memory`

**Solutions**:

1. **Increase Node.js memory limit**:
   ```json
   {
     "scripts": {
       "start": "node --max-old-space-size=4096 server/server.js"
     }
   }
   ```

2. **Check for memory leaks**:
   - Monitor with `process.memoryUsage()`
   - Look for unclosed connections

3. **Optimize Mongoose queries**:
   - Use `.lean()` for read-only queries
   - Close cursors properly

---

## Deployment Problems

### Heroku deployment fails

**Symptoms**:
- `git push heroku main` fails
- Application error after deployment

**Solutions**:

1. **Verify Procfile exists**:
   ```
   web: node server/server.js
   ```

2. **Check environment variables**:
   ```bash
   heroku config:set MONGODB_URI=your-uri
   heroku config:set JWT_SECRET=your-secret
   ```

3. **View Heroku logs**:
   ```bash
   heroku logs --tail
   ```

4. **Ensure correct Node.js version** in `package.json`:
   ```json
   {
     "engines": {
       "node": "14.x"
     }
   }
   ```

---

### Railway/Render deployment issues

**Symptoms**:
- Build succeeds but app doesn't start
- Health checks fail

**Solutions**:

1. **Set PORT environment variable**:
   - Railway/Render assigns dynamic ports
   - Ensure `process.env.PORT` is used

2. **Bind to 0.0.0.0, not localhost**:
   ```javascript
   const HOST = '0.0.0.0';
   server.listen(PORT, HOST);
   ```

3. **Check build logs**:
   - Review deployment logs for errors
   - Verify all dependencies installed

4. **Set environment variables**:
   - Add `MONGODB_URI`
   - Add `JWT_SECRET`
   - Add `NODE_ENV=production`

---

### Production site not accessible

**Symptoms**:
- Domain shows error page
- Cannot access deployed site

**Solutions**:

1. **Verify DNS settings**:
   - Point A record to server IP
   - Or CNAME to hosting platform

2. **Check SSL certificate**:
   - Ensure HTTPS is configured
   - Use Let's Encrypt for free SSL

3. **Verify domain in platform settings**:
   - Add custom domain in Railway/Render
   - Configure SSL/TLS

4. **Check firewall rules**:
   - Allow HTTP (80) and HTTPS (443)
   - Check cloud provider security groups

---

## Common Error Messages

### "MongooseServerSelectionError: connect ECONNREFUSED"

**Cause**: MongoDB is not running or connection string is wrong.

**Solution**:
- Start MongoDB: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify MongoDB Atlas IP whitelist

---

### "JsonWebTokenError: jwt malformed"

**Cause**: Invalid JWT token format.

**Solution**:
- Clear localStorage and re-login
- Check if token is being sent correctly
- Verify Authorization header format: `Bearer <token>`

---

### "ValidationError: Path `title` is required"

**Cause**: Required field missing in request.

**Solution**:
- Check all required fields are provided
- Verify field names match schema exactly
- Check request body is valid JSON

---

### "E11000 duplicate key error"

**Cause**: Trying to create duplicate unique field (username/email).

**Solution**:
- Use different username/email
- Check if admin already exists
- Verify database for existing records

---

### "Cannot find module './routes/projects'"

**Cause**: File path incorrect or file doesn't exist.

**Solution**:
- Verify file exists at `server/routes/projects.js`
- Check file name case (case-sensitive on Linux)
- Ensure file was not accidentally deleted

---

### "SyntaxError: Unexpected token < in JSON"

**Cause**: API returned HTML instead of JSON (usually an error page).

**Solution**:
- Check API endpoint URL is correct
- Verify server is running
- Look at actual response in Network tab

---

## Getting Help

If you encounter an issue not covered here:

1. **Check server logs**: Run `npm run dev` and watch console output
2. **Check browser console**: Press F12 > Console tab for frontend errors
3. **Test API with curl**: Verify endpoints work independently
4. **Search error message**: Copy exact error and search online
5. **Review documentation**: Check [API Reference](./api-reference.md) and [Architecture](./architecture.md)

**Contact Support**:
- Email: hello@frozenshield.ca
- Include: Error message, steps to reproduce, environment details

---

## Preventive Measures

### Regular Maintenance

- Keep dependencies updated: `npm outdated`
- Monitor MongoDB Atlas usage
- Review server logs weekly
- Test all features after updates
- Backup database regularly

### Best Practices

- Always use `.env` for secrets
- Never commit `.env` to git
- Use strong JWT_SECRET (32+ characters)
- Enable HTTPS in production
- Monitor rate limits
- Regular security audits

### Development Tips

- Use `npm run dev` for auto-restart
- Enable `NODE_ENV=development` for detailed errors
- Test API endpoints with Postman/Insomnia
- Use browser DevTools Network tab
- Check MongoDB Compass for database inspection

---

Last Updated: 2025-12-27
