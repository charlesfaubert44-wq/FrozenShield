# Quick Deploy Guide - FrozenShield

Get FrozenShield deployed in under 10 minutes!

## Choose Your Platform

### 🚂 Railway (Recommended for Beginners)

**Why:** Easiest setup, free tier, includes MongoDB

**Steps:**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add MongoDB database: Click "New" → "Database" → "Add MongoDB"
6. In your web service, add variables:
   ```
   NODE_ENV=production
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=[generate random 64-char string]
   ```
7. Deploy automatically happens on push
8. Create admin: Use Railway shell → `npm run create-admin`

**Done!** Your site is live at `yourapp.railway.app`

---

### 🎨 Render (Best Free Tier)

**Why:** Complete free tier, auto-provisions MongoDB, uses Blueprint

**Steps:**
1. Push code to GitHub (ensure `render.yaml` is committed)
2. Go to [render.com](https://render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render detects `render.yaml` and creates:
   - Web service
   - MongoDB database
6. Click "Apply" to deploy
7. Create admin: Dashboard → Shell → `npm run create-admin`

**Done!** Your site is live at `yourapp.onrender.com`

---

### 🐳 Docker (Full Control)

**Why:** Run anywhere, complete local development environment

**Steps:**
1. Install [Docker Desktop](https://docker.com/products/docker-desktop)
2. Copy environment template:
   ```bash
   cp .env.docker .env
   ```
3. Edit `.env` and set:
   - `MONGO_ROOT_PASSWORD` (strong password)
   - `JWT_SECRET` (generate random string)
4. Start services:
   ```bash
   docker-compose up -d
   ```
5. Create admin:
   ```bash
   docker exec -it frozenshield-app npm run create-admin
   ```

**Done!** Your site is at `http://localhost:5000`

---

### ☁️ Vercel (Serverless)

**Why:** Lightning-fast edge network, great for global reach

**Prerequisites:** MongoDB Atlas required (no local DB in serverless)

**Steps:**
1. Set up MongoDB Atlas (see below)
2. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy:
   ```bash
   vercel
   ```
4. Add environment variables in Vercel dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI=[your-atlas-connection-string]`
   - `JWT_SECRET=[random-string]`
5. Deploy to production:
   ```bash
   vercel --prod
   ```
6. Create admin locally pointing to production:
   ```bash
   MONGODB_URI=[production-uri] npm run create-admin
   ```

**Done!** Your site is at `yourapp.vercel.app`

---

### 🟣 Heroku (Traditional PaaS)

**Why:** Mature platform, extensive add-ons ecosystem

**Prerequisites:** MongoDB Atlas required

**Steps:**
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Login and create app:
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=mongodb+srv://...
   heroku config:set JWT_SECRET=[random-string]
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```
5. Create admin:
   ```bash
   heroku run npm run create-admin
   ```

**Done!** Your site is at `your-app-name.herokuapp.com`

---

## MongoDB Atlas Setup (Required for Vercel & Heroku)

### 5-Minute Setup

1. **Create Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up (free)

2. **Create Cluster**
   - Click "Create" → Choose "Free" (M0 Sandbox)
   - Select region closest to your users
   - Name: `frozenshield-production`
   - Click "Create Cluster"

3. **Database Access**
   - Left sidebar → "Database Access"
   - Click "Add New Database User"
   - Username: `frozenshield`
   - Password: Generate strong password (save it!)
   - Privileges: "Read and write to any database"
   - Click "Add User"

4. **Network Access**
   - Left sidebar → "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere"
   - Click "Confirm"

5. **Get Connection String**
   - Go back to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Replace `myFirstDatabase` with `frozenshield`

**Your connection string:**
```
mongodb+srv://frozenshield:YOUR_PASSWORD@cluster.mongodb.net/frozenshield?retryWrites=true&w=majority
```

---

## Generate JWT Secret

Pick one method:

### Node.js
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### OpenSSL
```bash
openssl rand -hex 64
```

### Online
Visit: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

**Result:** A 128-character random string like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

---

## Post-Deployment Checklist

After deploying to any platform:

### 1. Verify Health
```bash
curl https://your-app-url.com/api/health
```
Should return `{"success":true,"status":"healthy",...}`

### 2. Create Admin User
Run create-admin via platform shell (shown in platform steps above)

### 3. Test Admin Login
1. Go to `https://your-app-url.com/admin`
2. Login with admin credentials
3. Verify dashboard loads

### 4. Test Application
- [ ] Homepage loads
- [ ] Projects display (after adding via admin)
- [ ] Contact form submits
- [ ] Admin can create/edit/delete projects
- [ ] Responsive on mobile

### 5. Optional: Custom Domain
Most platforms support custom domains:
- Railway: Settings → Domains
- Render: Settings → Custom Domains
- Vercel: Settings → Domains
- Heroku: Settings → Domains

---

## Environment Variables Summary

### Required (All Platforms)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/frozenshield
JWT_SECRET=your-64-character-random-string
```

### Optional (Email Notifications)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Gmail App Password:**
1. Enable 2FA on Google account
2. Generate App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use that password as `SMTP_PASS`

---

## Troubleshooting

### App Won't Start
**Check:** Environment variables are set correctly
```bash
# Railway
railway variables

# Heroku
heroku config

# Render/Vercel
# Check in dashboard under Settings → Environment
```

### Can't Connect to MongoDB
**Solutions:**
- Verify connection string has correct password
- Check MongoDB Atlas allows IP `0.0.0.0/0`
- Ensure database user exists with read/write permissions

### Admin Panel Shows 404
**Check:** Static files are included in deployment
- Verify `public/` folder is not in `.gitignore`
- For Docker: Ensure `public/` is copied in Dockerfile
- For platforms: Verify build includes all files

### Email Not Sending
**Solutions:**
- Use Gmail App Password (not regular password)
- Verify SMTP credentials are correct
- Check application logs for email errors

---

## Quick Command Reference

### Docker
```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f app

# Stop
docker-compose down

# Admin
docker exec -it frozenshield-app npm run create-admin
```

### Railway
```bash
# Deploy
git push origin main

# Logs
railway logs

# Shell
railway run npm run create-admin
```

### Heroku
```bash
# Deploy
git push heroku main

# Logs
heroku logs --tail

# Admin
heroku run npm run create-admin
```

### Vercel
```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs
```

---

## Need More Help?

- **Detailed Guide:** [docs/deployment-guide.md](docs/deployment-guide.md) - 600+ lines
- **Complete Checklist:** [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- **File Reference:** [docs/deployment-files-summary.md](docs/deployment-files-summary.md)

---

## Platform Status Pages

If having issues, check platform status:
- Railway: https://railway.app/status
- Render: https://status.render.com
- Vercel: https://www.vercel-status.com
- Heroku: https://status.heroku.com
- MongoDB Atlas: https://status.mongodb.com

---

**That's it!** Pick your platform above and follow the steps. You'll be live in minutes.

For production deployments, review the security checklist in [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) before going live.

**Questions?** See the full deployment guide at [docs/deployment-guide.md](docs/deployment-guide.md)
