# MongoDB Setup on Coolify

## 🐳 Setting Up MongoDB on Coolify

### Step 1: Create MongoDB Database in Coolify

1. **Log in to your Coolify dashboard**
   - Navigate to your project

2. **Add a new Database**
   - Click "Databases" or "Add Resource"
   - Select "MongoDB"
   - Choose MongoDB version (recommend: 7.0 or latest)

3. **Configure MongoDB**
   - **Name:** `frozenshield-db` (or your preferred name)
   - **Database Name:** `frozenshield`
   - **Username:** Create a username (e.g., `frozenshield_admin`)
   - **Password:** Generate a strong password (Coolify can auto-generate)
   - **Port:** Use default or custom (usually 27017)
   - **Persistent Storage:** Enable (important for data persistence)

4. **Deploy MongoDB**
   - Click "Deploy" or "Create"
   - Wait for deployment to complete
   - Status should show "Running"

### Step 2: Get Connection String

After deployment, Coolify will provide connection details:

**Internal Connection String (if app is on same Coolify instance):**
```
mongodb://username:password@mongodb-service-name:27017/frozenshield
```

**External Connection String (if accessing from outside Coolify):**
```
mongodb://username:password@your-domain.com:27017/frozenshield
```

**Example:**
```
mongodb://frozenshield_admin:YourSecurePassword123@frozenshield-db:27017/frozenshield
```

### Step 3: Update Your .env File

Replace the MongoDB Atlas connection string with your Coolify connection:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration - COOLIFY MONGODB
MONGODB_URI=mongodb://YOUR_USERNAME:YOUR_PASSWORD@YOUR_MONGODB_HOST:27017/frozenshield

# Example:
# MONGODB_URI=mongodb://frozenshield_admin:SecurePass123@frozenshield-db:27017/frozenshield

# JWT Secret (generate a secure random string)
JWT_SECRET=fd39502429194d266430f281e9712d0c81de7ade36a38e22e021268bf0a9c038cff1a77290a8b03cf160a36c50c8f3b78bac34e349ae0ba82d149638f04498f0

# Email Configuration (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=your-email@gmail.com
```

### Step 4: Network Configuration

**If running locally and connecting to Coolify MongoDB:**

Option A: **Use External/Public URL** (if MongoDB is exposed)
- Coolify may provide a public URL
- Use that in your MONGODB_URI

Option B: **Use Coolify Tunnel** (if MongoDB is internal only)
- Some Coolify setups allow tunneling
- Check Coolify docs for your setup

Option C: **Deploy App to Coolify** (recommended for production)
- Deploy your app on the same Coolify instance
- Use internal Docker network connection
- Much faster and more secure

### Step 5: Test Connection

**Restart your server:**
```bash
# Stop current server (Ctrl+C or kill the process)
npm start
```

**Look for successful connection message:**
```
MongoDB connected successfully
Server running on port 5000
```

**If connection fails, check:**
- Username and password are correct
- Host/port are correct
- MongoDB container is running in Coolify
- Network accessibility (firewall, security groups)

---

## 🚀 Quick Start Commands

### 1. Get MongoDB Connection String from Coolify

In Coolify dashboard:
1. Go to your MongoDB database
2. Click on "Connection Strings" or "Environment Variables"
3. Copy the connection string

### 2. Update .env

```bash
# Open .env file
code .env

# Or use nano/vim
nano .env
```

Replace `MONGODB_URI` with your Coolify connection string.

### 3. Restart Server

```bash
npm start
```

---

## 🔧 Troubleshooting

### Connection Timeout

**Error:** `MongooseError: Connection timeout`

**Solutions:**
1. Check MongoDB is running in Coolify dashboard
2. Verify connection string is correct
3. Check network/firewall rules
4. If using external connection, ensure MongoDB port is exposed

### Authentication Failed

**Error:** `Authentication failed`

**Solutions:**
1. Double-check username and password
2. Ensure password is URL-encoded if it contains special characters
3. Verify user has correct permissions

### Cannot Connect from Local Machine

**If you want to develop locally:**

**Option 1:** Deploy to Coolify for development
- Faster, more secure
- Use internal network

**Option 2:** Expose MongoDB temporarily
- Add public port in Coolify
- Use external connection string
- **Security Warning:** Only for development!

**Option 3:** Use Local MongoDB for Development
```bash
# Install MongoDB locally
# Windows: Download from mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb

# Use local connection
MONGODB_URI=mongodb://localhost:27017/frozenshield
```

---

## 🔐 Security Best Practices

### For Production Deployment

1. **Strong Passwords**
   - Use Coolify's password generator
   - Never commit passwords to git

2. **Internal Network Only**
   - Keep MongoDB on internal Docker network
   - Don't expose to public internet

3. **Environment Variables**
   - Store connection string in Coolify environment variables
   - Never hardcode in source code

4. **Backup Strategy**
   - Enable Coolify automatic backups
   - Test backup restoration regularly

5. **Connection Limits**
   - Configure connection pooling
   - Set max connections in MongoDB config

---

## 📊 Coolify MongoDB Management

### Accessing MongoDB Shell

In Coolify dashboard:
1. Go to your MongoDB database
2. Click "Terminal" or "Shell"
3. Run MongoDB commands:

```bash
# Connect to database
mongosh

# Use your database
use frozenshield

# List collections
show collections

# View users
db.users.find()

# View albums
db.albums.find()
```

### Backup and Restore

**Create Backup:**
```bash
# In Coolify terminal
mongodump --uri="mongodb://username:password@localhost:27017/frozenshield" --out=/backup
```

**Restore Backup:**
```bash
# In Coolify terminal
mongorestore --uri="mongodb://username:password@localhost:27017/frozenshield" /backup/frozenshield
```

### Monitoring

In Coolify:
- Check database resource usage (CPU, RAM, Disk)
- View logs for connection issues
- Set up alerts for downtime

---

## 🎯 Next Steps After MongoDB Setup

Once MongoDB is connected:

1. **Seed Test Data** (optional)
   ```bash
   npm run seed
   ```

2. **Start Development**
   - Proceed with Phase 1: Authentication
   - Create User model
   - Build admin login

3. **Deploy to Coolify** (when ready)
   - Push code to Git repo
   - Connect repo to Coolify
   - Set environment variables in Coolify
   - Deploy!

---

## 📝 Example .env Configuration

```env
# === SERVER ===
PORT=5000
NODE_ENV=development

# === DATABASE (COOLIFY) ===
# Replace with your actual Coolify MongoDB connection string
MONGODB_URI=mongodb://frozenshield_admin:YOUR_PASSWORD_HERE@frozenshield-db:27017/frozenshield

# === SECURITY ===
# Generate new: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=fd39502429194d266430f281e9712d0c81de7ade36a38e22e021268bf0a9c038cff1a77290a8b03cf160a36c50c8f3b78bac34e349ae0ba82d149638f04498f0

# === EMAIL (OPTIONAL) ===
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=hello@frozenshield.ca
# SMTP_PASS=your-app-password
# SMTP_FROM=hello@frozenshield.ca

# === COOLIFY (when deployed) ===
# These will be set automatically by Coolify
# DATABASE_URL=${MONGODB_URI}
```

---

## ✅ Verification Checklist

Before proceeding with development:

- [ ] MongoDB deployed and running in Coolify
- [ ] Connection string copied from Coolify
- [ ] `.env` file updated with Coolify MongoDB URI
- [ ] Server restarted
- [ ] Connection successful (no timeout errors in logs)
- [ ] Can see "MongoDB connected successfully" message
- [ ] Ready to start Phase 1 development!

---

**Your Coolify MongoDB is now ready for the Frozen Shield portfolio redesign! 🎉**
