# 🚀 Quick Start Guide - Frozen Shield Portfolio Redesign

## Step-by-Step Setup (15 minutes)

### 1️⃣ Set Up MongoDB on Coolify (5 minutes)

**In Coolify Dashboard:**
1. Go to Databases → Add Database
2. Select **MongoDB**
3. Configure:
   - Name: `frozenshield-db`
   - Database: `frozenshield`
   - Username: `frozenshield_admin` (or your choice)
   - Password: Generate strong password
4. Click **Deploy**
5. Wait for status: **Running** ✅

**Copy Your Connection String:**
```
mongodb://frozenshield_admin:YOUR_PASSWORD@frozenshield-db:27017/frozenshield
```

📖 **Detailed Guide:** See `COOLIFY_MONGODB_SETUP.md`

---

### 2️⃣ Update .env File (2 minutes)

**Edit your `.env` file:**
```bash
code .env
# or
nano .env
```

**Replace the MONGODB_URI line:**
```env
# OLD (MongoDB Atlas):
MONGODB_URI=mongodb+srv://charlesfaubert44_db_user:31c175F9%2A@frozenshield.xlxx2rl.mongodb.net/frozenshield?appName=FrozenShield

# NEW (Coolify):
MONGODB_URI=mongodb://frozenshield_admin:YOUR_PASSWORD@frozenshield-db:27017/frozenshield
```

**Save the file** (Ctrl+S)

---

### 3️⃣ Install Required Dependencies (2 minutes)

```bash
cd c:\Users\charl\Desktop\Charles\frozenshield\frozenshield\FrozenShield

npm install bcryptjs jsonwebtoken express-validator
```

This installs:
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation

---

### 4️⃣ Restart Server (1 minute)

**Kill the current server:**
- Find the terminal running the server
- Press `Ctrl+C`

**Start fresh:**
```bash
npm start
```

**Look for success message:**
```
MongoDB connected successfully ✅
Server running on port 5000
```

---

### 5️⃣ Verify Everything Works (2 minutes)

**Open browser:**
```
http://localhost:5000
```

**You should see:**
- ✅ Landing page loads
- ✅ Ice crystals animation
- ✅ No MongoDB errors in terminal
- ✅ Console shows "MongoDB connected successfully"

---

## 🎯 What's Next? Start Building!

### Option A: Follow the Full Plan (Recommended)

**Read in order:**
1. `PROJECT_SUMMARY.md` - Overview (5 min read)
2. `TASK_BREAKDOWN.md` - All tasks (10 min read)
3. Start **Phase 1.1** - Create User Model

**First Task:**
```bash
# Create new branch
git checkout -b feature/admin-panel

# Create User model file
# Follow Phase 1.1 in TASK_BREAKDOWN.md
```

### Option B: Let Me Build It (AI-Assisted)

Use the **ULTRATHINK_PROMPT.md** with AI:
1. Copy the entire ULTRATHINK_PROMPT.md
2. Paste into AI chat (Claude, ChatGPT, etc.)
3. Ask: "Build Phase 1 - Authentication System"
4. Review and implement the code

### Option C: Manual Step-by-Step

I'll guide you through each file one at a time. Just say:
**"Let's start Phase 1.1 - Create the User model"**

---

## 📋 Your Development Checklist

### Immediate (Today)
- [x] Create MongoDB on Coolify
- [x] Update .env with connection string
- [x] Install dependencies
- [x] Restart server
- [x] Verify connection
- [ ] Create User model (Phase 1.1)
- [ ] Create auth routes (Phase 1.2)

### This Week (Phase 1)
- [ ] Build authentication system
- [ ] Create login page
- [ ] Test login/logout flow
- [ ] Secure routes with JWT

### This Month (Phases 1-3)
- [ ] Album admin panel
- [ ] Video management
- [ ] Public portfolio redesign

---

## 🔧 Common Commands

### Development
```bash
# Start server
npm start

# Start with auto-reload (if nodemon installed)
npm run dev

# Seed test data (after Phase 2)
npm run seed
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/admin-panel

# Commit changes
git add .
git commit -m "feat: add user authentication"

# Push to remote
git push origin feature/admin-panel
```

### Testing
```bash
# Test API endpoint (with curl)
curl http://localhost:5000/api/health

# Test MongoDB connection
node -e "require('./server/config/db')"
```

---

## 📊 Progress Tracking

Use Task Master to track progress:

```bash
# List all tasks
task-master list

# Get next task
task-master next

# Show specific task
task-master show 1.1

# Mark complete
task-master set-status --id=1.1 --status=done
```

Or use the checkboxes in `TASK_BREAKDOWN.md`!

---

## 🆘 Quick Help

### Server Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :5000

# Change port
PORT=5001 npm start
```

### MongoDB Connection Fails
1. Check Coolify dashboard - MongoDB running?
2. Verify connection string in .env
3. Check username/password are correct
4. See `COOLIFY_MONGODB_SETUP.md` troubleshooting

### Dependencies Won't Install
```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 File Structure Reference

```
FrozenShield/
├── 📘 Documentation (READ THESE)
│   ├── PROJECT_SUMMARY.md          ← Start here!
│   ├── TASK_BREAKDOWN.md           ← Detailed tasks
│   ├── ULTRATHINK_PROMPT.md        ← AI assistance
│   ├── COOLIFY_MONGODB_SETUP.md    ← MongoDB guide
│   └── QUICK_START.md              ← This file
│
├── 🔧 Configuration
│   ├── .env                        ← Your secrets
│   ├── .env.example                ← Template
│   ├── package.json
│   └── .gitignore
│
├── 💾 Backend
│   ├── server/
│   │   ├── server.js               ← Main entry
│   │   ├── models/                 ← Mongoose models
│   │   ├── routes/                 ← API routes
│   │   ├── middleware/             ← Auth, upload, etc.
│   │   └── config/                 ← DB config
│
├── 🎨 Frontend (Public)
│   ├── public/
│   │   ├── index.html              ← Landing page
│   │   ├── script.js               ← Main JS
│   │   ├── styles.css              ← Styles
│   │   └── admin/ (TO BUILD)       ← Admin panel
│
└── 📁 Uploads (Auto-created)
    └── uploads/
```

---

## 💡 Pro Tips

1. **Commit Often**
   - After each completed task
   - Before trying something risky
   - Use descriptive commit messages

2. **Test Everything**
   - Test each feature before moving on
   - Use Postman for API testing
   - Check browser console for errors

3. **Keep Landing Page Safe**
   - Don't modify hero section
   - Keep ice crystals animation
   - Maintain dark theme

4. **Use AI Wisely**
   - ULTRATHINK_PROMPT.md for big features
   - Ask specific questions for debugging
   - Always review generated code

5. **Take Breaks**
   - ~102 hours total work
   - Break into manageable chunks
   - Don't rush - quality matters!

---

## 🎉 Ready to Go!

**Your setup is complete! Choose your path:**

### Path 1: Guided Build
Say: **"Start Phase 1.1"** and I'll walk you through it

### Path 2: Independent Build
Follow `TASK_BREAKDOWN.md` Phase 1

### Path 3: AI-Assisted Build
Use `ULTRATHINK_PROMPT.md` with your favorite AI

---

**You've got this! Let's build an amazing portfolio with a powerful admin panel! 🚀**

**Current Status:**
- ✅ Server running
- ✅ MongoDB ready (configure connection)
- ✅ Dependencies installed
- ✅ Documentation complete
- 🎯 Ready to code!
