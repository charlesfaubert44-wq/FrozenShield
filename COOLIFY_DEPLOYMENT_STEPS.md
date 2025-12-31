# 🚀 Deploy to Coolify - Step by Step

## Your Code is Ready! ✅

**GitHub Repository:** https://github.com/charlesfaubert44-wq/FrozenShield.git
**Branch:** main

---

## Step 1: Create Application in Coolify

### In your Coolify Dashboard:

1. **Click "+ New Resource"** or **"Add Application"**

2. **Select Source:**
   - Choose **"GitHub"** (or your git provider)
   - Authorize Coolify to access your GitHub if needed

3. **Select Repository:**
   - Find and select: `charlesfaubert44-wq/FrozenShield`
   - Branch: `main`

4. **Build Settings:**
   - **Name:** `frozenshield` (or your preference)
   - **Port:** `5000`
   - **Build Pack:** Node.js (should auto-detect)
   - **Start Command:** `npm start`
   - **Install Command:** `npm install`
   - **Build Command:** *(leave empty)*

---

## Step 2: Configure Environment Variables

### In the Environment Variables section, add these:

```env
NODE_ENV=production

PORT=5000

MONGODB_URI=mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true

JWT_SECRET=fd39502429194d266430f281e9712d0c81de7ade36a38e22e021268bf0a9c038cff1a77290a8b03cf160a36c50c8f3b78bac34e349ae0ba82d149638f04498f0
```

**How to add:**
1. Click **"Environment Variables"** tab
2. Click **"+ Add Variable"**
3. Enter **Name** and **Value** for each
4. Click **"Save"**

**Important:** Use the INTERNAL MongoDB connection (g4ow4c844wwwkcwkw0cc8o4o) - this is correct!

---

## Step 3: Deploy

1. **Click "Deploy"** button

2. **Wait for build** (2-5 minutes)
   - You'll see build logs streaming
   - npm install runs
   - Application starts

3. **Look for success messages:**
   ```
   ✓ npm install successful
   ✓ Starting application
   ✓ MongoDB connected successfully
   ✓ Server running on port 5000
   ```

---

## Step 4: Access Your App

### Get Your URL:

Coolify will provide a URL like:
- `https://frozenshield.coolify-domain.com`
- Or use your custom domain if configured

### Test It:

1. **Click the URL** in Coolify dashboard

2. **You should see:**
   - ✅ Landing page with ice crystals animation
   - ✅ "FROZEN SHIELD Studio" branding
   - ✅ Smooth animations
   - ✅ No errors

3. **Check browser console:**
   - Should have no MongoDB errors
   - Should load successfully

---

## Step 5: Verify MongoDB Connection

### In Coolify Dashboard:

1. Go to your application
2. Click **"Logs"** tab
3. Look for:
   ```
   MongoDB connected successfully
   Server running on port 5000
   ```

### Test Database (Optional):

**In Coolify Terminal:**
```bash
# Access your app's terminal
npm run seed

# This will create:
# - 3 sample albums
# - 18 sample photos
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] App is deployed and running
- [ ] URL loads the landing page
- [ ] Ice crystals animation works
- [ ] MongoDB shows "connected successfully" in logs
- [ ] No errors in application logs
- [ ] Browser console has no errors

---

## 🔧 Next Steps

### Now that your app is live on Coolify:

**Development Workflow:**

```bash
# 1. Make changes locally
code server/models/User.js

# 2. Commit changes
git add .
git commit -m "feat: add User authentication model"

# 3. Push to GitHub
git push

# 4. Coolify auto-deploys (if enabled)
# Or manually trigger in dashboard

# 5. Check logs and test live
```

### Enable Auto-Deploy:

In Coolify app settings:
- Find **"Auto Deploy"** option
- Enable **"Deploy on Push"**
- Now every `git push` triggers automatic deployment!

---

## 🏗️ Start Building Phase 1

**Now that everything is deployed:**

### Create User Model (Phase 1.1)

**In your local environment:**

```bash
# Create the file
code server/models/User.js
```

**Add this code:**

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'editor'],
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 10
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
```

**Then:**

```bash
# Commit and push
git add server/models/User.js
git commit -m "feat: create User model with password hashing"
git push

# Coolify auto-deploys!
```

**Continue with Phase 1.2 - 1.5** from `TASK_BREAKDOWN.md`

---

## 🐛 Troubleshooting

### Build Fails

**Check Logs:**
- Coolify shows detailed build logs
- Look for npm errors

**Common Fixes:**
- Ensure `package.json` has all dependencies
- Check Node.js version compatibility
- Verify start command is correct

### MongoDB Connection Fails

**Check:**
- [ ] MONGODB_URI in environment variables
- [ ] Using internal hostname (g4ow4c844...)
- [ ] MongoDB service is running in Coolify
- [ ] Database name is `frozenshield`

**Test Connection:**
```bash
# In Coolify terminal
echo $MONGODB_URI
mongosh "$MONGODB_URI"
```

### Port Issues

**Verify:**
- PORT environment variable is `5000`
- Application settings port is `5000`
- server.js uses `process.env.PORT`

---

## 📊 Monitoring

### Check Application Health:

**Logs:**
- Coolify Dashboard → Your App → Logs
- Real-time log streaming
- Filter by error/warning

**Resources:**
- CPU usage
- Memory usage
- Disk space
- Network traffic

**Uptime:**
- Application status
- Restart history
- Deployment history

---

## 🎯 Your Deployment is Complete!

**What you have:**
- ✅ FrozenShield running on Coolify
- ✅ MongoDB connected
- ✅ Auto-deploy on git push
- ✅ Production environment
- ✅ Ready for development

**What's next:**
1. Verify app loads correctly
2. Check logs for MongoDB connection
3. Optional: Run `npm run seed` to add test data
4. Start building Phase 1: Authentication
5. Push changes and watch them deploy!

---

## 🚀 Development Commands

```bash
# Local development
npm start                  # Start server locally
npm run dev                # Start with nodemon (auto-reload)

# Deployment
git add .                  # Stage changes
git commit -m "message"    # Commit
git push                   # Deploy to Coolify

# On Coolify (via terminal)
npm run seed               # Seed test data
npm start                  # Start application
npm install                # Install dependencies
```

---

**Congratulations! Your app is live on Coolify!** 🎉

**Access it at your Coolify URL and start building the admin panel!**
