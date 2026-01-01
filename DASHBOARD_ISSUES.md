# Dashboard Issues - Post Login Fix

## Overview

After successfully fixing the login functionality, the dashboard has separate issues that prevent it from loading properly. These are **NOT** login bugs - login is working correctly. These are dashboard-specific implementation issues.

---

## Issue #1: Content Security Policy Blocking Quill.js CDN

### Problem
The CSP headers are blocking external CDN resources needed by the dashboard:

**Blocked Resources:**
- Script: `https://cdn.quilljs.com/1.3.6/quill.js`
- Style: `https://cdn.quilljs.com/1.3.6/quill.snow.css`

**CSP Violations:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

### Solution
Update CSP in `server/server.js` to allow Quill.js CDN:

**Current:**
```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
```

**Should be:**
```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.quilljs.com"],
styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.quilljs.com"],
```

**Files to Update:**
- `server/server.js` - Lines 20-33 (helmet CSP configuration)

---

## Issue #2: Inline Event Handlers Blocked by CSP

### Problem
CSP is blocking inline `onclick` handlers in the dashboard HTML:

**Blocked Functions:**
- `openCreateAlbumModal()`
- `openCreateVideoModal()`
- `openCreateProjectModal()`
- `closeAlbumModal()`
- `closeVideoModal()`
- `closeProjectModal()`
- `addGalleryImage()`
- `closeMediaUploadModal()`

**CSP Violation:**
```
script-src-attr 'none'
```

### Solution Options

**Option 1: Add script-src-attr to CSP (Quick Fix)**
```javascript
contentSecurityPolicy: {
  directives: {
    scriptSrcAttr: ["'unsafe-hashes'", "'sha256-...'"], // Allow specific hashes
  }
}
```

**Option 2: Refactor to use addEventListener (Best Practice)**

Replace inline handlers in `public/admin/dashboard.html`:

**Current (Bad):**
```html
<button onclick="openCreateAlbumModal()">Create Album</button>
```

**Should be (Good):**
```html
<button id="create-album-btn">Create Album</button>
```

Then in JavaScript:
```javascript
document.getElementById('create-album-btn').addEventListener('click', openCreateAlbumModal);
```

**Files to Update:**
- `public/admin/dashboard.html` - Remove all `onclick` attributes
- `public/admin/js/dashboard.js` - Add event listeners

---

## Issue #3: Duplicate Variable Declarations

### Problem
Multiple JavaScript files are declaring the same global variables, causing errors:

**Errors:**
```
Uncaught SyntaxError: redeclaration of const API_BASE
  Source: videos.js:1

Uncaught SyntaxError: redeclaration of let currentPage
  Source: projects.js:1, media.js:1
```

### Root Cause
All admin JavaScript files are being loaded on the dashboard page simultaneously, and they each declare:
- `const API_BASE`
- `let currentPage`

### Solution

**Option 1: Create Shared Constants File**

Create `public/admin/js/shared.js`:
```javascript
// Shared constants across all admin pages
const API_BASE = window.location.origin + '/api';
let sharedState = {
  currentPage: 1
};
```

Load this FIRST in dashboard.html:
```html
<script src="js/shared.js"></script>
<script src="js/albums.js"></script>
<script src="js/videos.js"></script>
<!-- etc -->
```

Remove declarations from individual files.

**Option 2: Use IIFE to Scope Variables**

Wrap each file's code in an IIFE:
```javascript
(function() {
  const API_BASE = window.location.origin + '/api';
  let currentPage = 1;

  // ... rest of code
})();
```

**Files to Update:**
- `public/admin/js/albums.js`
- `public/admin/js/videos.js`
- `public/admin/js/projects.js`
- `public/admin/js/media.js`

---

## Issue #4: Dashboard Authentication Loop

### Problem
After successful login, dashboard attempts to load but redirects back to login page, creating an infinite loop.

**Symptoms:**
- Login succeeds (token generated)
- Dashboard starts loading
- API calls return 401 Unauthorized
- Page redirects to login
- Repeat

**API Errors:**
```
GET https://frozenshield.ca/api/admin/settings/profile
[HTTP/2 401]

GET https://frozenshield.ca/api/admin/settings
[HTTP/2 401]
```

### Root Cause Investigation Needed

Check if:
1. **Token is being saved to localStorage?**
   - Check: DevTools → Application → Local Storage → `token`

2. **Token is being sent with requests?**
   - Check: Network tab → Request headers → `Authorization: Bearer ...`

3. **Token format is correct?**
   - Should be: `Bearer <jwt-token>`

4. **Dashboard.js is reading token correctly?**
   - Check `public/admin/js/dashboard.js` initialization

### Potential Solutions

**If token is NOT saved:**
- Fix `public/admin/js/auth.js` login handler (line ~106)
- Ensure: `localStorage.setItem('token', data.token);` executes

**If token IS saved but not sent:**
- Fix `public/admin/js/dashboard.js` API request headers
- Ensure: `Authorization: Bearer ${token}` is set

**If token is sent but backend rejects:**
- Check JWT verification in `server/middleware/auth.js`
- Verify JWT_SECRET is consistent

**Files to Check:**
- `public/admin/js/auth.js` - Token storage after login
- `public/admin/js/dashboard.js` - Token retrieval and usage
- `server/middleware/auth.js` - Token verification

---

## Priority Order

### **Priority 1: Authentication Loop (BLOCKING)**
Without fixing this, dashboard is completely unusable.

**Tasks:**
1. Debug token storage/retrieval
2. Fix API authentication
3. Test dashboard loads successfully

### **Priority 2: Duplicate Variables (HIGH)**
Causes JavaScript errors that may break functionality.

**Tasks:**
1. Create shared constants file
2. Refactor individual JS files
3. Test all dashboard sections

### **Priority 3: CSP for Quill.js (MEDIUM)**
Prevents rich text editor from working.

**Tasks:**
1. Update CSP headers
2. Test Quill.js loads
3. Verify rich text editing works

### **Priority 4: Inline Event Handlers (LOW)**
CSP warnings but may not break functionality. Can be deferred.

**Tasks:**
1. Refactor HTML to remove onclick
2. Add event listeners in JavaScript
3. Clean up CSP to remove unsafe-inline

---

## Testing Checklist

After fixes:

- [ ] Login works (already verified ✅)
- [ ] Dashboard loads without redirect loop
- [ ] No JavaScript errors in console
- [ ] All sections accessible (Albums, Videos, Projects, Media)
- [ ] Rich text editor (Quill.js) works
- [ ] Create/Edit/Delete functionality works
- [ ] No CSP violations in console
- [ ] Authentication persists across page reloads

---

## Notes

- **Login is WORKING** - These are separate dashboard bugs
- **Database is clean** - Admin user created successfully
- **MongoDB connection works** - authSource=admin fix applied
- **Server is correct** - DNS pointing to 54.39.131.33

All core authentication infrastructure is functional. These issues are purely frontend implementation bugs in the dashboard code.
