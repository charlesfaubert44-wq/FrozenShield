# Admin Panel Debugging Guide

## Quick Diagnostic Steps

### Step 1: Verify Server is Running

In your Coolify app dashboard, check logs for:
```
✓ Server running on port 5000
✓ MongoDB connected successfully
```

### Step 2: Test API Health Endpoint

Open your browser and navigate to:
```
https://your-domain.com/api/health
```

You should see:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-31T...",
  "uptime": 1234,
  "memory": {
    "heapUsed": 50,
    "heapTotal": 100
  }
}
```

### Step 3: Check if Admin User Exists

**In Coolify Terminal** (or SSH into your server):

```bash
# Connect to MongoDB
mongosh "mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true"

# Once connected, run:
use frozenshield
db.users.countDocuments()
db.users.find({}).pretty()
```

**Expected Results:**
- If count is `0` → No admin exists, you need to **register first**
- If count is `1` or more → Admin exists, you should **login** (not register)

### Step 4: Test Admin Login Page Access

Open browser to:
```
https://your-domain.com/admin/login.html
```

**What you should see:**
- ✅ A login form with email and password fields
- ✅ A link saying "First time? Register first admin"
- ✅ No errors in browser console (press F12)

**If page doesn't load:**
- Check network tab in browser developer tools (F12)
- Look for 404 or 500 errors
- Check if static files are being served correctly

### Step 5: Check Browser Console for Errors

1. Open the admin login page
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for any red error messages

**Common errors and fixes:**

#### Error: "Failed to fetch" or "Network error"
- **Cause**: API endpoint not reachable
- **Fix**: Check server is running and MongoDB is connected

#### Error: "Content Security Policy" warnings
- **Cause**: CSP headers blocking scripts
- **Fix**: Already configured in server.js:20-44, should work

#### Error: "CORS" error
- **Cause**: Cross-origin request blocked
- **Fix**: Check ALLOWED_ORIGINS environment variable

### Step 6: Test Login API Endpoint

**In browser console (F12) or Postman:**

```javascript
// Test login endpoint
fetch('https://your-domain.com/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'your-email@example.com',
        password: 'YourPassword123!'
    })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected responses:**

**If no admin exists:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**If wrong password:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "attemptsRemaining": 4
}
```

**If correct credentials:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Step 7: Test Registration (if no admin exists)

**In browser console:**

```javascript
// Test registration endpoint
fetch('https://your-domain.com/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'admin',
        email: 'admin@frozenshield.ca',
        password: 'SecurePass123!'
    })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected responses:**

**If admin already exists:**
```json
{
  "success": false,
  "message": "Admin already exists"
}
```

**If password doesn't meet requirements:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [...]
}
```

**If successful:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@frozenshield.ca",
    "role": "admin"
  }
}
```

## Common Issues & Solutions

### Issue 1: "404 Not Found" when accessing /admin/login.html

**Possible Causes:**
1. Static files not being served correctly
2. Public directory path is wrong
3. File doesn't exist in deployment

**Fix:**
```bash
# In Coolify terminal, verify files exist:
ls -la public/admin/
ls -la public/admin/login.html
ls -la public/admin/js/auth.js

# Expected output should show these files
```

### Issue 2: "Cannot POST /api/auth/login" or 404 on API routes

**Possible Causes:**
1. Server not running
2. Routes not registered correctly
3. Port mismatch

**Fix:**
Check server logs in Coolify dashboard for startup errors.

### Issue 3: Login form submits but nothing happens

**Possible Causes:**
1. JavaScript error blocking form submission
2. API endpoint returning unexpected response
3. CORS blocking the request

**Fix:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check Network tab to see if request is sent
4. Review response from API

### Issue 4: "Admin already exists" but you don't know the credentials

**Solution:**
You need to reset the admin user in MongoDB:

```bash
# Connect to MongoDB
mongosh "mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true"

# Delete existing admin
use frozenshield
db.users.deleteMany({})

# Verify deletion
db.users.countDocuments()
# Should return: 0

# Now you can register a new admin
```

### Issue 5: Rate limiting - "Too many requests"

**Cause:** Too many failed login attempts (see server/middleware/rateLimiter.js)

**Fix:**
Wait 30 minutes, or reset in MongoDB:

```bash
# The rate limiter stores attempts in memory, so restarting the server clears them
# In Coolify: restart your application
```

### Issue 6: Environment variables not set

**Check required environment variables in Coolify:**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true
JWT_SECRET=fd39502429194d266430f281e9712d0c81de7ade36a38e22e021268bf0a9c038cff1a77290a8b03cf160a36c50c8f3b78bac34e349ae0ba82d149638f04498f0
```

**Missing JWT_SECRET will cause:**
- Token generation failures
- "Server error" messages on login/register

## Security Notes

### Account Lockout Protection

After 5 failed login attempts, the account is locked for 30 minutes. This is tracked by:
- Email address
- IP address

**To unlock:**
- Wait 30 minutes
- OR restart the server (clears in-memory lockout data)

### Password Requirements

Passwords must have:
- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

## File Structure Reference

```
FrozenShield/
├── public/
│   ├── admin/
│   │   ├── login.html          ← Admin login page
│   │   ├── dashboard.html      ← Admin dashboard (after login)
│   │   ├── css/
│   │   │   └── auth.css        ← Login page styles
│   │   └── js/
│   │       ├── auth.js         ← Login/register logic
│   │       ├── dashboard.js    ← Dashboard logic
│   │       ├── albums.js       ← Album management
│   │       ├── media.js        ← Media management
│   │       ├── projects.js     ← Project management
│   │       ├── videos.js       ← Video management
│   │       └── settings.js     ← Settings management
│   └── index.html              ← Public homepage
├── server/
│   ├── server.js               ← Main server file
│   ├── routes/
│   │   ├── auth.js             ← Authentication API
│   │   └── admin/
│   │       ├── albums.js       ← Admin album routes
│   │       ├── media.js        ← Admin media routes
│   │       ├── projects.js     ← Admin project routes
│   │       ├── stats.js        ← Admin stats routes
│   │       ├── videos.js       ← Admin video routes
│   │       └── settings.js     ← Admin settings routes
│   ├── models/
│   │   └── User.js             ← User model with auth
│   └── middleware/
│       ├── auth.js             ← JWT verification middleware
│       └── rateLimiter.js      ← Rate limiting middleware
└── .env                        ← Environment variables
```

## Quick Command Reference

```bash
# Check server logs
# (In Coolify: click "Logs" tab)

# Restart server
# (In Coolify: click "Restart" button)

# Connect to MongoDB
mongosh "mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true"

# Check users in database
use frozenshield
db.users.find({}).pretty()

# Delete all users (reset)
db.users.deleteMany({})

# Check all collections
show collections

# Exit MongoDB
exit
```

## Testing Checklist

- [ ] Server is running (check Coolify logs)
- [ ] MongoDB is connected (check logs for "MongoDB connected successfully")
- [ ] /api/health endpoint returns 200 OK
- [ ] /admin/login.html page loads without errors
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows successful file loads (200 status)
- [ ] Admin user exists in database OR registration form works
- [ ] Login API endpoint responds correctly
- [ ] After successful login, redirects to /admin/dashboard.html
- [ ] JWT token is stored in localStorage

## Next Steps After Successful Login

Once you can access the admin dashboard:

1. **Create content:**
   - Add projects
   - Create albums
   - Upload media
   - Manage videos

2. **Configure settings:**
   - Site metadata
   - SEO settings
   - Contact form settings

3. **Monitor:**
   - Check /api/admin/metrics for performance
   - Review /api/admin/stats for statistics

## Need More Help?

If you're still having issues after following this guide:

1. **Share specific error messages** from:
   - Browser console (F12 → Console tab)
   - Network tab (F12 → Network tab)
   - Server logs (Coolify dashboard)

2. **Confirm:**
   - What URL you're using to access admin panel
   - What happens when you visit that URL
   - Any error messages you see

3. **Test endpoints:**
   - Share results from /api/health test
   - Share response from login API test
