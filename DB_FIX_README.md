# Database Diagnostic and Fix Guide

## Problem Summary

The FrozenShield application had **3 critical bugs** preventing admin registration and login:

### Bug #1: Frontend/Backend Error Field Mismatch ✅ FIXED
- **Issue**: Frontend checked `data.error` but backend sent `data.message`
- **Impact**: Error messages weren't displayed to users
- **Fix**: Updated frontend to check both `data.message` and `data.error`

### Bug #2: Stale Database Data ✅ TOOL CREATED
- **Issue**: Database contains orphaned user records from previous deployments
- **Impact**: Registration blocked because system thinks admin already exists
- **Fix**: Created `db-diagnostic.js` script to inspect and clean database

### Bug #3: Password Validation Mismatch ✅ FIXED
- **Issue**: Frontend required 6 chars, backend required 8+ with complexity rules
- **Impact**: Users created passwords that passed frontend but failed backend
- **Fix**: Updated frontend validation to match backend requirements

---

## Quick Fix for Production

### Step 1: Connect to Production Server

SSH into your Coolify server or Docker host:

```bash
ssh user@your-server
```

### Step 2: Run Database Diagnostic

Check if database has stale users:

```bash
# Get the container name (should be: x0w0ck4sg8sg4sk08skogkog-213636601859)
docker ps | grep frozenshield

# Run diagnostic inside container
docker exec -it x0w0ck4sg8sg4sk08skogkog-213636601859 node db-diagnostic.js
```

### Step 3: Clean Database and Create Admin

If diagnostic shows existing users, clean and create fresh admin:

```bash
# Clean database and create default admin
docker exec -it x0w0ck4sg8sg4sk08skogkog-213636601859 node db-diagnostic.js --clean --create-admin
```

This will:
- Delete all existing users
- Create new admin with credentials:
  - **Email**: `admin@frozenshield.ca`
  - **Password**: `AdminPass123!`

### Step 4: Login and Change Password

1. Go to https://frozenshield.ca/admin/login.html
2. Login with default credentials
3. **IMMEDIATELY** change your password in dashboard settings

---

## Alternative: Manual MongoDB Cleanup

If you prefer to manually inspect/clean MongoDB:

```bash
# Connect to MongoDB container
docker exec -it g4ow4c844wwwkcwkw0cc8o4o mongosh

# Switch to frozenshield database
use frozenshield

# Check users
db.users.find().pretty()

# Delete all users (if needed)
db.users.deleteMany({})

# Exit
exit
```

---

## Local Development Setup

### Prerequisites

- Node.js installed
- MongoDB connection string

### Running Diagnostic Locally

1. Create `.env` file with your MongoDB URI:
   ```env
   MONGODB_URI=mongodb://root:password@host:27017/frozenshield?directConnection=true
   JWT_SECRET=your-jwt-secret
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run diagnostic:
   ```bash
   # Check database status
   node db-diagnostic.js

   # Clean database
   node db-diagnostic.js --clean

   # Clean and create admin
   node db-diagnostic.js --clean --create-admin
   ```

---

## Password Requirements

The application now enforces these password rules (frontend AND backend):

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

Example valid password: `AdminPass123!`

---

## Files Changed

### Fixed Files:
- `public/admin/js/auth.js` - Error handling and password validation
- `public/admin/login.html` - Password field requirements and help text

### New Files:
- `db-diagnostic.js` - Database diagnostic and cleanup tool
- `DB_FIX_README.md` - This file

### Existing Files (reference):
- `create-admin.js` - Original admin creation script (still works)

---

## Troubleshooting

### "Cannot connect to MongoDB"
- Verify container is running: `docker ps`
- Check network: Container must be on same network as MongoDB
- Verify MongoDB URI in environment variables

### "Registration still fails"
- Run diagnostic to verify database is actually clean
- Check browser console for JavaScript errors
- Verify backend logs: `docker logs container-name`

### "Login fails with valid credentials"
- Check that password meets all complexity requirements
- Verify JWT_SECRET is set in environment
- Check backend logs for authentication errors

---

## Prevention

To avoid this issue in the future:

1. **Use db-diagnostic.js** before each fresh deployment to verify database state
2. **Document admin credentials** securely after creation
3. **Monitor deployment logs** for MongoDB connection issues
4. **Add database migration strategy** for future schema changes

---

## Support

If issues persist after following this guide:

1. Check Coolify deployment logs
2. Verify all environment variables are set correctly
3. Ensure MongoDB container is healthy
4. Review FrozenShield server logs for specific errors

---

**Last Updated**: 2025-12-31
**FrozenShield Version**: 1.0.0
