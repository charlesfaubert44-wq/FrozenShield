# Dashboard Issues - Taskmaster Tasks

Run these commands to add tasks to Taskmaster:

## Priority 1: Authentication Loop (BLOCKING)

```bash
task-master add-task --prompt="Fix dashboard authentication loop after successful login. Debug token storage in auth.js (line ~106), ensure localStorage.setItem('token', data.token) executes. Verify dashboard.js reads token and sets Authorization: Bearer header on API requests. Fix 401 errors on /api/admin/settings/profile and /api/admin/settings that cause redirect loop back to login page." --priority=high
```

**Subtasks to create after expansion:**
- Debug token storage in `public/admin/js/auth.js`
- Verify token retrieval in `public/admin/js/dashboard.js`
- Fix Authorization header in API requests
- Test dashboard loads without redirect

---

## Priority 2: Duplicate Variable Declarations (HIGH)

```bash
task-master add-task --prompt="Fix duplicate variable declarations causing JavaScript errors in dashboard. Create shared.js file for common constants (API_BASE, currentPage). Refactor albums.js, videos.js, projects.js, and media.js to use shared constants instead of redeclaring. Update dashboard.html to load shared.js first before other scripts." --priority=high
```

**Subtasks to create after expansion:**
- Create `public/admin/js/shared.js` with common constants
- Remove duplicate declarations from `albums.js`
- Remove duplicate declarations from `videos.js`
- Remove duplicate declarations from `projects.js`
- Remove duplicate declarations from `media.js`
- Update `dashboard.html` script loading order

---

## Priority 3: CSP for Quill.js CDN (MEDIUM)

```bash
task-master add-task --prompt="Update Content Security Policy in server/server.js to allow Quill.js CDN resources. Add 'https://cdn.quilljs.com' to scriptSrc and styleSrc directives in helmet CSP configuration (lines 20-33). This will fix the blocked quill.js and quill.snow.css resources needed for rich text editing in the dashboard." --priority=medium
```

**Subtasks to create after expansion:**
- Update `scriptSrc` in `server/server.js` to include cdn.quilljs.com
- Update `styleSrc` in `server/server.js` to include cdn.quilljs.com
- Test Quill.js loads successfully
- Verify rich text editor works in dashboard

---

## Priority 4: Inline Event Handlers CSP Violations (LOW)

```bash
task-master add-task --prompt="Refactor dashboard inline event handlers to use addEventListener instead of onclick attributes. Remove onclick from buttons in dashboard.html for openCreateAlbumModal, openCreateVideoModal, openCreateProjectModal, closeAlbumModal, closeVideoModal, closeProjectModal, addGalleryImage, and closeMediaUploadModal. Add corresponding event listeners in dashboard.js to comply with CSP script-src-attr policy." --priority=low
```

**Subtasks to create after expansion:**
- Remove onclick attributes from `dashboard.html`
- Add event listeners in `dashboard.js` for modal functions
- Update CSP to remove unsafe-inline if desired
- Test all modal interactions work correctly

---

## Quick Add Script

Save this as `add-dashboard-tasks.sh`:

```bash
#!/bin/bash

echo "Adding Dashboard Issue Tasks to Taskmaster..."

task-master add-task --prompt="Fix dashboard authentication loop after successful login. Debug token storage in auth.js (line ~106), ensure localStorage.setItem('token', data.token) executes. Verify dashboard.js reads token and sets Authorization: Bearer header on API requests. Fix 401 errors on /api/admin/settings/profile and /api/admin/settings that cause redirect loop back to login page." --priority=high

task-master add-task --prompt="Fix duplicate variable declarations causing JavaScript errors in dashboard. Create shared.js file for common constants (API_BASE, currentPage). Refactor albums.js, videos.js, projects.js, and media.js to use shared constants instead of redeclaring. Update dashboard.html to load shared.js first before other scripts." --priority=high

task-master add-task --prompt="Update Content Security Policy in server/server.js to allow Quill.js CDN resources. Add 'https://cdn.quilljs.com' to scriptSrc and styleSrc directives in helmet CSP configuration (lines 20-33). This will fix the blocked quill.js and quill.snow.css resources needed for rich text editing in the dashboard." --priority=medium

task-master add-task --prompt="Refactor dashboard inline event handlers to use addEventListener instead of onclick attributes. Remove onclick from buttons in dashboard.html for openCreateAlbumModal, openCreateVideoModal, openCreateProjectModal, closeAlbumModal, closeVideoModal, closeProjectModal, addGalleryImage, and closeMediaUploadModal. Add corresponding event listeners in dashboard.js to comply with CSP script-src-attr policy." --priority=low

echo "Done! Run 'task-master list' to see all tasks"
```

Make executable: `chmod +x add-dashboard-tasks.sh`

Then run: `./add-dashboard-tasks.sh`

---

## Manual Task Addition

If Taskmaster CLI isn't working, you can manually add to `.taskmaster/tasks/tasks.json`:

```json
{
  "id": "X",
  "title": "Fix dashboard authentication loop",
  "description": "Debug token storage in auth.js and dashboard.js to fix redirect loop",
  "status": "pending",
  "priority": "high",
  "dependencies": [],
  "subtasks": []
},
{
  "id": "Y",
  "title": "Fix duplicate variable declarations",
  "description": "Create shared.js and refactor JS files to prevent redeclaration errors",
  "status": "pending",
  "priority": "high",
  "dependencies": [],
  "subtasks": []
},
{
  "id": "Z",
  "title": "Update CSP for Quill.js CDN",
  "description": "Allow cdn.quilljs.com in helmet CSP configuration",
  "status": "pending",
  "priority": "medium",
  "dependencies": [],
  "subtasks": []
}
```

Then run: `task-master generate` to create the markdown files.
