# UltraThink Prompt: Frozen Shield Portfolio Redesign

## Context
You are redesigning a portfolio website for Frozen Shield Studio with the following requirements:

### Preserve
**Landing Page (Hero Section)** - Keep 100% intact:
- Ice crystals canvas animation
- "FROZEN SHIELD Studio" logo with glitch effect
- Tagline: "We fish, we tell stories, and we build apps. Sometimes in that order."
- Scroll indicator
- Dark theme with blue/purple gradients
- All animations and visual effects

### Complete Redesign
**Portfolio Content Section** - Complete overhaul to display:

1. **Photo Albums**
   - Grid of album cards with cover images
   - Album title + photo count overlay
   - Click to open album modal with photo grid
   - Lightbox for full-screen image viewing
   - Navigation between photos (keyboard + buttons)
   - Tag filtering
   - Featured albums highlighted

2. **Videos**
   - Video thumbnail cards with play icon overlay
   - Support YouTube/Vimeo embeds
   - Support direct MP4/WebM uploads
   - Click to play in modal video player
   - Video title, description, duration display
   - Tag/category filtering
   - Featured videos

3. **Web Projects**
   - Project cards with screenshots
   - Project title, description, tech stack
   - Click for detailed project modal
   - Multi-image gallery for each project
   - Live demo link button
   - GitHub repo link button
   - Rich text case study content
   - Technology badges/tags
   - Client name and project timeline

### Unified Portfolio Features
- **Single grid layout** combining all three types (albums, videos, projects)
- **Advanced filtering**: By type (All | Albums | Videos | Projects), by tags, by featured
- **Search bar** for quick finding
- **Sort options**: Date, Featured, Popular
- **Responsive masonry/grid** that works beautifully on mobile
- **Smooth animations**: Fade-in, hover effects, modal transitions
- **Lazy loading** for performance
- **Empty states** with helpful messages

### Admin Panel - Full CRUD System

#### Authentication
- Login page at `/admin/login`
- JWT-based authentication with secure token storage
- Protected routes middleware
- Auto-logout on token expiration
- Optional: First-admin registration flow

#### Dashboard (`/admin/dashboard`)
- Statistics cards:
  - Total albums, photos, videos, projects
  - Total views across all content
  - Storage usage
  - Recent activity
- Quick action buttons
- Recent uploads/changes feed
- Analytics charts (optional)

#### Album Management (`/admin/albums`)
**List View:**
- Table/grid showing all albums
- Search and filter
- Sort by date/title/featured
- Quick actions (edit/delete icons)

**Create/Edit:**
- Form fields:
  - Title (required)
  - Description (textarea)
  - Slug (auto-generated from title, editable)
  - Tags (multi-select or chip input)
  - Visibility (public/private/unlisted dropdown)
  - Featured checkbox
  - Order number
  - Project association (select from existing projects)
  - Cover image upload (with preview)
- Save button
- Cancel button
- Delete button (edit mode only, with confirmation)

**Photo Management:**
- After creating album, redirect to photo upload interface
- Drag-and-drop multi-file upload
- Upload progress indicators
- Thumbnail grid of uploaded photos
- Drag to reorder photos
- Click photo to:
  - Edit caption
  - Edit alt text
  - Add/edit tags
  - Set as cover image
  - Set as featured
  - Delete
- Bulk actions: Select multiple → Delete, Tag, etc.
- Preview album button (opens public view)

#### Video Management (`/admin/videos`)
**List View:**
- Table showing all videos with thumbnails
- Search and filter
- Sort options
- Quick actions

**Create/Edit:**
- Form fields:
  - Title (required)
  - Description (textarea)
  - Slug (auto-generated)
  - Video source type (radio buttons):
    - Embed URL (show input for YouTube/Vimeo link)
    - Upload file (show file picker)
  - Custom thumbnail upload (optional)
  - Duration (auto-detect for uploads, manual for embeds)
  - Tags (multi-select)
  - Category dropdown
  - Featured checkbox
  - Visibility dropdown
  - Order number
- If upload: Show upload progress, file size limit (50MB)
- Save button
- Cancel button
- Delete button (with confirmation)

#### Project Management (`/admin/projects`)
**List View:**
- Cards or table showing all projects
- Thumbnail preview
- Search and filter
- Sort options
- Quick actions

**Create/Edit:**
- Form fields:
  - Title (required)
  - Short description (required, 500 char limit)
  - Slug (auto-generated)
  - Long description/case study (rich text editor with formatting):
    - Headers, bold, italic
    - Lists (ordered/unordered)
    - Links
    - Images inline
    - Code blocks
  - Technology stack (chip input, predefined + custom)
  - Project images/screenshots:
    - Multi-upload
    - Drag to reorder
    - Set main image
    - Captions
  - Live demo URL (optional)
  - GitHub repository URL (optional)
  - Client name (optional)
  - Project start/end dates (date pickers)
  - Featured checkbox
  - Visibility dropdown
  - Order number
  - Associated album (select dropdown)
- Save draft button
- Publish button
- Cancel button
- Delete button (with confirmation)

#### Media Library (`/admin/media`)
- View all uploaded media files (photos, videos, thumbnails)
- Grid view with thumbnails
- Search by filename
- Filter by:
  - Type (image/video)
  - Date range
  - Associated content (album/project)
  - Used/unused
- Sort by: Date, size, filename
- Bulk select and delete
- Show file details (size, dimensions, format, upload date)
- "Find unused media" feature
- Storage usage visualization

#### Settings (`/admin/settings`)
**Profile Section:**
- Display username (read-only)
- Display email (read-only)
- Change password form

**Site Configuration:**
- Site title
- Meta description
- Contact email
- Social links

**SEO Settings:**
- Default meta tags
- Open Graph image
- Analytics ID (Google Analytics)

**Preferences:**
- Items per page
- Default visibility for new content
- Email notifications toggle
- Theme (light/dark) toggle

### Technical Implementation

#### Backend (Node.js + Express)
**New Models:**
```javascript
// User model for admin authentication
User {
  username: String (unique, required)
  email: String (unique, required)
  password: String (hashed with bcrypt)
  role: String (default: 'admin')
  createdAt: Date
  lastLogin: Date
}

// Video model
Video {
  title: String (required)
  description: String
  slug: String (unique, auto-generated)
  videoType: String (enum: 'embed', 'upload')
  embedUrl: String (for YouTube/Vimeo)
  videoFile: String (path for uploads)
  thumbnail: String
  duration: Number (seconds)
  tags: [String]
  category: String
  featured: Boolean
  visibility: String (enum: 'public', 'private', 'unlisted')
  order: Number
  stats: { views: Number }
  createdAt: Date
  updatedAt: Date
  createdBy: ObjectId (User)
}

// Enhanced Album model (add)
Album {
  // ... existing fields ...
  createdBy: ObjectId (User)
}

// Enhanced Project model (add)
Project {
  // ... existing fields ...
  longDescription: String (rich text HTML)
  images: [String] (array of image URLs)
  technologies: [String]
  liveUrl: String
  githubUrl: String
  clientName: String
  projectDate: Date
  visibility: String
  createdBy: ObjectId (User)
}

// Enhanced Media model (add)
Media {
  // ... existing fields ...
  uploadedBy: ObjectId (User)
}
```

**New API Routes:**
```javascript
// Authentication
POST   /api/auth/register         // First admin only
POST   /api/auth/login            // JWT token
GET    /api/auth/me               // Current user
POST   /api/auth/logout           // Invalidate token

// Admin - Albums
GET    /api/admin/albums          // List all (paginated)
POST   /api/admin/albums          // Create new
GET    /api/admin/albums/:id      // Get single
PUT    /api/admin/albums/:id      // Update
DELETE /api/admin/albums/:id      // Delete
POST   /api/admin/albums/:id/media    // Upload photos
PUT    /api/admin/albums/:id/media/reorder  // Reorder photos

// Admin - Videos
GET    /api/admin/videos
POST   /api/admin/videos
GET    /api/admin/videos/:id
PUT    /api/admin/videos/:id
DELETE /api/admin/videos/:id

// Admin - Projects
GET    /api/admin/projects
POST   /api/admin/projects
GET    /api/admin/projects/:id
PUT    /api/admin/projects/:id
DELETE /api/admin/projects/:id

// Admin - Media Library
GET    /api/admin/media           // All media
DELETE /api/admin/media/:id       // Delete file
GET    /api/admin/media/unused    // Find unused

// Admin - Dashboard Stats
GET    /api/admin/stats            // Dashboard statistics

// Public - Portfolio
GET    /api/portfolio/items       // All items (albums, videos, projects)
GET    /api/portfolio/albums      // Just albums
GET    /api/portfolio/videos      // Just videos
GET    /api/portfolio/projects    // Just projects
GET    /api/portfolio/featured    // All featured items
GET    /api/portfolio/search?q=query  // Search across all
```

**Middleware:**
```javascript
// Existing
- multer (file uploads)
- sharp (image optimization)

// New
- express-validator (input validation)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)

// Auth middleware
authenticate: (req, res, next) => {
  // Extract token from header
  // Verify JWT
  // Attach user to req.user
  // Handle errors
}

authorizeAdmin: (req, res, next) => {
  // Check if req.user.role === 'admin'
}
```

#### Frontend

**Public Site:**
- Keep existing vanilla JS approach
- Add new functions for:
  - Loading all portfolio items
  - Advanced filtering/searching
  - Video modal player
  - Enhanced lightbox
  - Infinite scroll/pagination

**Admin Panel:**
- Two options:
  1. **Vanilla JS** (consistent with existing codebase)
     - SPA-like experience with routing
     - State management with custom solution
     - Component-like organization

  2. **React** (modern, but new dependency)
     - Faster development
     - Rich ecosystem (React Hook Form, React Query)
     - Better state management

**Recommendation:** Start with vanilla JS to maintain consistency, migrate to React if needed later.

**Admin Panel Structure:**
```
public/admin/
├── index.html          // Shell with all sections
├── login.html          // Separate login page
├── css/
│   ├── admin.css       // Main admin styles
│   └── components.css  // Reusable components
├── js/
│   ├── auth.js         // Authentication logic
│   ├── dashboard.js    // Dashboard functionality
│   ├── albums.js       // Album management
│   ├── videos.js       // Video management
│   ├── projects.js     // Project management
│   ├── media.js        // Media library
│   ├── settings.js     // Settings
│   └── utils.js        // Shared utilities
└── components/
    ├── modal.js        // Reusable modal
    ├── upload.js       // File upload component
    └── editor.js       // Rich text editor
```

### Security Considerations
- JWT tokens in localStorage (httpOnly cookies better but more complex)
- CSRF protection
- XSS prevention (sanitize all inputs)
- Rate limiting on auth endpoints
- File upload validation (type, size, malware scan)
- Image sanitization with Sharp
- SQL/NoSQL injection prevention
- Secure password requirements (min 8 chars, complexity)
- Password hashing with bcrypt (cost factor 10)
- Secure JWT secret (long random string)
- HTTPS in production
- Helmet for security headers
- CORS configuration
- Regular dependency updates

### UX/UI Design Principles

**Public Site:**
- Maintain dark theme consistency
- Blue/purple gradient accents
- Smooth, delightful animations
- Fast perceived performance
- Mobile-first responsive design
- Accessible (keyboard navigation, screen readers)
- Clear visual hierarchy
- Generous whitespace

**Admin Panel:**
- Clean, minimal interface
- Consistent with public site (dark theme)
- Intuitive navigation
- Clear action buttons
- Helpful empty states
- Inline validation with helpful messages
- Loading states (spinners, skeleton screens)
- Success/error notifications (toast or inline)
- Confirmation dialogs for destructive actions
- Keyboard shortcuts for power users
- Responsive (works on tablet)
- Breadcrumbs for deep navigation

### Performance Optimization
- Image optimization with Sharp (resize, compress, WebP)
- Lazy loading images below fold
- Infinite scroll or pagination for large datasets
- Database indexing on frequently queried fields
- Query optimization (limit fields, use lean())
- Caching strategy (Cache-Control headers)
- CDN for static assets (optional)
- Minify CSS/JS in production
- Bundle splitting for admin panel
- Progressive image loading (blur-up)
- Video thumbnail generation
- Compression middleware (gzip)

### Progressive Enhancement Plan

**Phase 1: Foundation (Week 1)**
- User authentication system
- Protected admin routes
- Basic admin dashboard shell
- Login/logout functionality

**Phase 2: Album Management (Week 2)**
- Enhanced album CRUD
- Admin album interface
- Photo upload with drag-and-drop
- Photo management (reorder, edit, delete)
- Public album display redesign

**Phase 3: Video Management (Week 3)**
- Video model and routes
- Admin video interface
- YouTube/Vimeo embed support
- Video upload (optional, starts with embeds)
- Public video gallery

**Phase 4: Project Management (Week 4)**
- Enhanced project model
- Rich text editor integration
- Admin project interface
- Multi-image upload
- Public project showcase redesign

**Phase 5: Unified Portfolio (Week 5)**
- Unified API endpoint
- Combined grid layout on public site
- Advanced filtering/search
- Infinite scroll
- Responsive design polish
- Cross-device testing

**Phase 6: Polish & Launch (Week 6)**
- Media library interface
- Settings page
- Analytics integration
- Performance optimization
- Security audit
- Documentation
- User testing
- Production deployment

### Success Metrics
- Admin can perform all CRUD operations easily
- Public site loads in <2 seconds
- Mobile experience is seamless
- SEO scores remain high (Lighthouse 90+)
- Zero accessibility errors
- Admin panel is intuitive (minimal training needed)
- All images optimized (80% size reduction)
- Forms have helpful validation
- No security vulnerabilities (npm audit clean)

### Testing Strategy
- Unit tests for API routes (Jest)
- Integration tests for auth flow
- E2E tests for critical paths (Playwright)
- Manual testing checklist for all features
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS, Android)
- Accessibility testing (WAVE, axe DevTools)
- Performance testing (Lighthouse, WebPageTest)
- Security testing (OWASP ZAP, npm audit)
- Load testing for API (Artillery, k6)

---

## Your Task

Using this comprehensive specification:

1. **Review the existing codebase** at the current state
2. **Create a detailed implementation plan** with specific file changes
3. **Build the system incrementally**:
   - Start with authentication
   - Then album admin features
   - Then video features
   - Then project enhancements
   - Finally unified portfolio view
4. **Maintain code quality**: Clean, commented, modular code
5. **Test thoroughly** at each phase
6. **Document everything**: API endpoints, admin guides, deployment steps

**Current State Analysis:**
- Backend is functional with Express, MongoDB, Mongoose
- Album and Media models exist
- Media upload middleware with Sharp exists
- Basic public frontend exists
- Hero section is complete and must be preserved
- Some routes already exist

**What Needs to be Built:**
- Complete authentication system
- User model
- Video model
- Enhanced Project model
- All admin panel UI
- All admin panel JavaScript
- Admin CRUD routes
- Enhanced public portfolio section
- Unified filtering/search
- Rich text editor
- Video player integration
- Advanced media management

**Constraints:**
- Keep hero section 100% intact
- Maintain dark theme throughout
- Use existing tech stack (Node, Express, MongoDB, vanilla JS)
- Prioritize performance
- Ensure security
- Mobile-first design

Begin with Phase 1 (Authentication) and proceed systematically through each phase, testing and validating before moving forward.
