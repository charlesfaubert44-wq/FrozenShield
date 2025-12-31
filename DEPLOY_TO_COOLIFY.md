# 🚀 Deploy FrozenShield to Coolify

## Quick Deployment Guide

### Step 1: Push Your Code to Git (5 minutes)

**Option A: Create New GitHub Repo (Recommended)**

```bash
# Initialize git (if not already)
cd c:\Users\charl\Desktop\Charles\frozenshield\frozenshield\FrozenShield
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - FrozenShield portfolio with admin panel"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/frozenshield.git
git branch -M main
git push -u origin main
```

**Option B: Use Existing Repo**
```bash
git add .
git commit -m "Update for Coolify deployment"
git push
```

---

### Step 2: Deploy to Coolify (10 minutes)

**In Coolify Dashboard:**

1. **Create New Resource**
   - Click "+ New Resource"
   - Select "Application"

2. **Configure Application**
   - **Source:** Select "GitHub" (or your git provider)
   - **Repository:** Select your `frozenshield` repo
   - **Branch:** `main`
   - **Build Pack:** Node.js (auto-detected)

3. **Basic Settings**
   - **Name:** `frozenshield-app`
   - **Port:** `5000`
   - **Start Command:** `npm start`
   - **Install Command:** `npm install`
   - **Build Command:** Leave empty (no build needed)

4. **Environment Variables**
   Click "Environment Variables" and add:

   ```env
   NODE_ENV=production
   PORT=5000

   # Use the INTERNAL MongoDB connection (from Coolify)
   MONGODB_URI=mongodb://root:3STHRYyW2WFzJiiGc0jb1xcxvbDGxb538jpvi98ObQUbrXL0dFpVDoBrpJGrRPuM@g4ow4c844wwwkcwkw0cc8o4o:27017/frozenshield?directConnection=true

   JWT_SECRET=fd39502429194d266430f281e9712d0c81de7ade36a38e22e021268bf0a9c038cff1a77290a8b03cf160a36c50c8f3b78bac34e349ae0ba82d149638f04498f0
   ```

5. **Domain Settings** (Optional)
   - Add your custom domain: `frozenshield.ca`
   - Or use Coolify's provided domain

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)

---

### Step 3: Verify Deployment (2 minutes)

**Check Logs:**
- In Coolify, go to your app
- Click "Logs"
- Look for:
  ```
  MongoDB connected successfully ✅
  Server running on port 5000
  ```

**Access Your App:**
- Click the URL Coolify provides
- You should see your landing page with ice crystals!

---

## 🔧 Important Files for Coolify

### 1. Create `.dockerignore` (Optional but Recommended)

```bash
# In your project root
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.env
.DS_Store
uploads/
*.md
.taskmaster/
EOF
```

### 2. Update `package.json` Scripts

Your `package.json` should have:

```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "seed": "node server/seedTestData.js"
  }
}
```

This is already set up! ✅

### 3. Create `.coolify.yml` (Optional - Advanced)

```yaml
# .coolify.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    depends_on:
      - mongodb
```

---

## 🌐 Development Workflow with Coolify

### Option 1: Develop Locally, Deploy to Test

**Local Development:**
```bash
# Use local MongoDB or test MongoDB
MONGODB_URI=mongodb://localhost:27017/frozenshield npm start

# Make changes, test locally
# Commit and push when ready
git add .
git commit -m "Add authentication system"
git push
```

**Auto-Deploy:**
- Coolify can auto-deploy on git push
- Enable in Coolify: Settings → "Auto Deploy on Push"

### Option 2: Develop Directly on Coolify (Fastest)

**Use Coolify's Terminal:**
1. Go to your app in Coolify
2. Click "Terminal"
3. Edit files directly
4. Changes reflect immediately

**Or Use VS Code Remote SSH:**
- Connect to your Coolify server via SSH
- Edit files remotely

---

## 🔐 Environment Variables Reference

**Production (.env on Coolify):**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://root:PASSWORD@MONGODB_HOST:27017/frozenshield?directConnection=true
JWT_SECRET=your-long-random-string
```

**Development (local .env):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/frozenshield
JWT_SECRET=same-as-production
```

---

## 📊 After Successful Deployment

### 1. Seed Initial Data (Optional)

**In Coolify Terminal:**
```bash
npm run seed
```

This will create:
- 3 sample albums
- 18 sample photos (6 per album)

### 2. Access Your App

**Your live URL:**
- Coolify provides: `https://your-app.coolify-domain.com`
- Or your custom domain: `https://frozenshield.ca`

**Test the frontend:**
- Landing page should load ✅
- Ice crystals animation working ✅
- No MongoDB errors in logs ✅

### 3. Start Building Features

Now that your app is deployed and MongoDB is connected:

**Next Steps:**
1. Create User model (Phase 1.1)
2. Build authentication system
3. Create admin login page
4. Continue with phases 2-6

**Development workflow:**
```bash
# Make changes locally
code server/models/User.js

# Test locally (optional)
npm start

# Commit and push
git add .
git commit -m "feat: add User model with auth"
git push

# Coolify auto-deploys!
# Check logs in Coolify dashboard
```

---

## 🐛 Troubleshooting

### Build Fails

**Check Coolify Logs:**
- "Logs" tab shows npm install output
- Look for dependency errors

**Common fixes:**
```bash
# Update package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### MongoDB Connection Fails

**Check environment variables:**
- MONGODB_URI is set correctly
- Using INTERNAL hostname (g4ow4c844wwwkcwkw0cc8o4o)
- MongoDB is running in Coolify

**Test connection in Coolify terminal:**
```bash
mongosh "$MONGODB_URI"
```

### App Not Starting

**Check PORT:**
- PORT=5000 in environment variables
- Matches port in Coolify app settings

**Check Start Command:**
- Should be: `npm start`
- Or: `node server/server.js`

---

## 🎯 Benefits of Running on Coolify

✅ **No Network Issues**
- App and MongoDB on same internal network
- Fast, secure connections

✅ **Production Environment**
- Matches your live setup
- Test in real conditions

✅ **Auto-Deploy**
- Push to git → Automatic deployment
- See changes immediately

✅ **Easy Scaling**
- Add more resources in Coolify
- Horizontal scaling ready

✅ **Monitoring**
- Built-in logs
- Resource usage stats
- Uptime monitoring

---

## 📝 Git Workflow Summary

```bash
# 1. Make changes locally
code server/models/User.js

# 2. Test locally (optional)
npm start

# 3. Commit changes
git add .
git commit -m "feat: add user authentication"

# 4. Push to GitHub
git push

# 5. Coolify auto-deploys (if enabled)
# Or manually trigger deploy in Coolify dashboard

# 6. Check deployment logs
# Go to Coolify → Your App → Logs

# 7. Test live app
# Visit your Coolify URL
```

---

## 🚀 Quick Deploy Checklist

Before deploying:
- [ ] Code is in Git repository
- [ ] `.env` secrets removed from repo (use .gitignore)
- [ ] package.json has correct start script
- [ ] MongoDB is running in Coolify
- [ ] You have MongoDB connection string

Deploy steps:
- [ ] Create application in Coolify
- [ ] Connect to Git repository
- [ ] Set environment variables
- [ ] Configure port (5000)
- [ ] Click Deploy
- [ ] Wait for build to complete
- [ ] Check logs for "MongoDB connected"
- [ ] Visit app URL
- [ ] See landing page working!

---

## 🎉 You're Ready!

**Deploy your app to Coolify and you'll have:**
- ✅ Working MongoDB connection
- ✅ Live app accessible via URL
- ✅ Automatic deployments on git push
- ✅ Production-ready environment

**After deployment:**
- Start building Phase 1: Authentication
- Follow TASK_BREAKDOWN.md
- Push changes and see them live!

---

**Next:** Push your code to GitHub and create the Coolify app! 🚀
