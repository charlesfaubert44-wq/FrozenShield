# Portfolio Redesign with Admin Panel - PRD

## Project Overview
Complete redesign of Frozen Shield Studio website to include a full-featured admin panel for managing photo albums, videos, and web projects. The landing page remains intact while the content sections are completely rebuilt with CRUD functionality.

## Core Requirements

### 1. Landing Page (Keep Intact)
- Preserve existing hero section with ice crystals animation
- Keep "FROZEN SHIELD Studio" branding
- Maintain tagline: "We fish, we tell stories, and we build apps. Sometimes in that order."
- Keep scroll-down indicator

### 2. Portfolio Section (Complete Redesign)
**Must display three types of content:**

#### A. Photo Albums
- Grid layout of album cards with cover images
- Album title, description, photo count
- Click to view full album with lightbox
- Tag filtering
- Featured albums highlighted
- Responsive masonry or grid layout

#### B. Videos
- Video thumbnails with play button overlay
- Video title, description, duration
- Click to play in modal with video player
- Support for YouTube/Vimeo embeds or direct uploads
- Category/tag filtering
- Featured videos

#### C. Web Projects
- Project cards with screenshots/mockups
- Project title, description, technologies used
- Click to view project details modal
- Live demo link (optional)
- GitHub repo link (optional)
- Case study content
- Technology stack badges

**Portfolio Features:**
- Unified grid displaying all three types
- Filter by type: All | Albums | Videos | Web Projects
- Filter by tags/categories
- Sort by: Date, Featured, Popular
- Search functionality
- Infinite scroll or pagination
- Smooth animations and transitions

### 3. Admin Panel (New)

#### A. Authentication System
- Secure login page (`/admin/login`)
- JWT-based authentication
- Session management
- Password hashing (bcrypt)
- Protected admin routes
- Logout functionality
- Optional: Password reset via email
- Optional: Multi-user support with roles

#### B. Admin Dashboard (`/admin/dashboard`)
- Overview statistics:
  - Total albums, photos, videos, projects
  - Recent uploads
  - View counts
  - Storage usage
- Quick actions menu
- Recent activity feed

#### C. Album Management (`/admin/albums`)
**Features:**
- List all albums (table/grid view)
- Create new album
  - Title, description, slug
  - Tags (multi-select)
  - Visibility (public/private/unlisted)
  - Featured toggle
  - Cover image upload
  - Project association (optional)
- Edit existing albums
- Delete albums (with confirmation)
- Bulk upload photos to album
  - Drag-and-drop interface
  - Progress indicators
  - Thumbnail generation
  - Image optimization
- Manage photos within album
  - Reorder via drag-and-drop
  - Edit captions/alt text
  - Set featured photo
  - Delete photos
- Preview album as public would see

#### D. Video Management (`/admin/videos`)
**Features:**
- List all videos (table/grid view)
- Add new video
  - Title, description
  - Video source:
    - YouTube/Vimeo URL embed
    - Direct upload (MP4, WebM)
  - Custom thumbnail upload
  - Duration (auto-detect if uploaded)
  - Tags/categories
  - Featured toggle
  - Visibility settings
- Edit existing videos
- Delete videos (with confirmation)
- Preview video player

#### E. Web Project Management (`/admin/projects`)
**Features:**
- List all projects (table/grid view)
- Create new project
  - Title, description
  - Long-form case study content (rich text editor)
  - Technology stack (tags/badges)
  - Project images/screenshots (multi-upload)
  - Live demo URL
  - GitHub repo URL
  - Client name (optional)
  - Project date/timeline
  - Featured toggle
  - Visibility settings
- Edit existing projects
- Delete projects (with confirmation)
- Reorder project images
- Preview project page

#### F. Media Library (`/admin/media`)
- View all uploaded media (photos, videos)
- Search/filter media
- Bulk delete
- Storage management
- Unused media detection

#### G. Settings (`/admin/settings`)
- Site configuration
- User account settings
- Change password
- Email notifications
- SEO settings
- Analytics integration

### 4. Technical Requirements

#### Backend
- Node.js + Express.js (existing)
- MongoDB + Mongoose (existing)
- Authentication: JWT tokens, bcrypt
- File upload: Multer (existing)
- Image processing: Sharp (existing)
- Video processing: FFmpeg (for thumbnails, optional)
- Validation: express-validator
- Security: helmet, rate limiting (existing)

#### Frontend - Admin Panel
- Framework: React.js or vanilla JS with modern build tools
- Alternative: Server-side rendering with EJS/Pug
- UI Components:
  - Rich text editor (TinyMCE, Quill, or similar)
  - Drag-and-drop (Sortable.js or similar)
  - Image cropper
  - Date picker
  - Tag input
- State management (if React): Context API or Redux
- Form handling and validation
- File upload with progress tracking
- Responsive design (mobile-friendly admin)

#### Frontend - Public Site
- Keep existing tech stack (vanilla JS)
- Responsive grid layouts
- Lightbox for images
- Video player modal
- Project detail modal
- Smooth animations
- Lazy loading images
- SEO optimization

#### Database Models

**User Model (new)**
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (admin/editor),
  createdAt: Date,
  lastLogin: Date
}
```

**Album Model (existing - enhance)**
```javascript
{
  title: String,
  description: String,
  slug: String,
  coverImage: String,
  tags: [String],
  projectId: ObjectId (optional),
  visibility: String,
  featured: Boolean,
  order: Number,
  stats: {
    totalMedia: Number,
    views: Number
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId (user)
}
```

**Media Model (existing - enhance)**
```javascript
{
  albumId: ObjectId,
  type: String (image/video),
  url: String,
  optimized: String,
  thumbnail: String,
  caption: String,
  alt: String,
  tags: [String],
  order: Number,
  featured: Boolean,
  visibility: String,
  metadata: {
    filename: String,
    size: Number,
    width: Number,
    height: Number,
    format: String,
    duration: Number (for videos)
  },
  uploadedAt: Date,
  uploadedBy: ObjectId (user)
}
```

**Video Model (new)**
```javascript
{
  title: String,
  description: String,
  slug: String,
  videoType: String (embed/upload),
  embedUrl: String (YouTube/Vimeo),
  videoFile: String (for uploads),
  thumbnail: String,
  duration: Number,
  tags: [String],
  category: String,
  featured: Boolean,
  visibility: String,
  order: Number,
  stats: {
    views: Number,
    likes: Number
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId (user)
}
```

**Project Model (existing - enhance)**
```javascript
{
  title: String,
  description: String,
  slug: String,
  longDescription: String (rich text),
  imageUrl: String (main image),
  images: [String] (gallery),
  albumId: ObjectId (optional),
  tags: [String],
  technologies: [String],
  liveUrl: String,
  githubUrl: String,
  clientName: String,
  projectDate: Date,
  featured: Boolean,
  visibility: String,
  order: Number,
  stats: {
    views: Number
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId (user)
}
```

### 5. API Endpoints

#### Authentication
- POST /api/auth/register (optional - for first user setup)
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me (get current user)
- POST /api/auth/forgot-password (optional)
- POST /api/auth/reset-password (optional)

#### Admin - Albums
- GET /api/admin/albums (list all, with pagination)
- POST /api/admin/albums (create new)
- GET /api/admin/albums/:id (get single)
- PUT /api/admin/albums/:id (update)
- DELETE /api/admin/albums/:id (delete)
- POST /api/admin/albums/:id/media (upload photos)
- PUT /api/admin/albums/:id/media/reorder (reorder photos)

#### Admin - Videos
- GET /api/admin/videos
- POST /api/admin/videos
- GET /api/admin/videos/:id
- PUT /api/admin/videos/:id
- DELETE /api/admin/videos/:id

#### Admin - Projects
- GET /api/admin/projects
- POST /api/admin/projects
- GET /api/admin/projects/:id
- PUT /api/admin/projects/:id
- DELETE /api/admin/projects/:id

#### Admin - Media
- GET /api/admin/media (all media)
- DELETE /api/admin/media/:id
- POST /api/admin/media/upload (generic upload)

#### Admin - Dashboard
- GET /api/admin/stats (dashboard statistics)

#### Public - Portfolio
- GET /api/portfolio/items (all items: albums, videos, projects)
- GET /api/portfolio/albums
- GET /api/portfolio/videos
- GET /api/portfolio/projects
- GET /api/portfolio/featured

### 6. Security Requirements
- HTTPS in production
- CSRF protection
- XSS prevention
- SQL/NoSQL injection prevention
- Rate limiting on login attempts
- File upload validation (type, size)
- Image sanitization
- Secure headers (helmet)
- Environment variables for secrets
- Regular dependency updates

### 7. Performance Requirements
- Image optimization (Sharp)
- Lazy loading
- CDN integration (optional)
- Caching strategy
- Database indexing
- Pagination for large datasets
- Thumbnail generation
- Progressive image loading

### 8. UX/UI Requirements

#### Admin Panel
- Clean, modern interface
- Intuitive navigation
- Responsive design
- Dark/light theme toggle (optional)
- Keyboard shortcuts
- Undo/redo functionality
- Auto-save drafts
- Success/error notifications
- Loading states
- Empty states with helpful messages
- Confirmation dialogs for destructive actions

#### Public Site
- Smooth animations
- Fast page loads
- Mobile-first design
- Accessible (WCAG 2.1 AA)
- SEO optimized
- Social sharing integration
- Print-friendly styles

### 9. Phase Breakdown

#### Phase 1: Foundation
- User authentication system
- Protected routes middleware
- Admin login page
- Basic admin dashboard shell

#### Phase 2: Album Management
- Enhanced album CRUD in admin
- Photo upload interface
- Drag-and-drop photo management
- Public album display redesign

#### Phase 3: Video Management
- Video model and routes
- Video admin interface
- YouTube/Vimeo embed support
- Video upload (optional)
- Public video gallery

#### Phase 4: Web Project Management
- Enhanced project model
- Rich text editor integration
- Project admin interface
- Multi-image upload for projects
- Public project showcase redesign

#### Phase 5: Unified Portfolio
- Unified portfolio API
- Combined grid layout
- Advanced filtering
- Search functionality
- Responsive design polish

#### Phase 6: Polish & Launch
- Media library management
- Settings page
- Analytics integration
- Performance optimization
- Security audit
- Documentation
- User testing
- Production deployment

### 10. Success Criteria
- Admin can log in securely
- Admin can create/edit/delete albums, videos, and projects
- Admin can upload and manage media files
- Public site displays all portfolio items beautifully
- Filtering and search work smoothly
- Site loads quickly on all devices
- Mobile experience is excellent
- SEO remains strong or improves
- No security vulnerabilities
- Analytics tracking works

### 11. Future Enhancements
- Multi-user support with roles
- Comments/feedback system
- Analytics dashboard
- Email notifications
- Automated backups
- Version history for content
- A/B testing capabilities
- Client portal for project collaboration
- Blog/news section
- Contact form inquiries management

## Constraints
- Must maintain existing brand identity
- Keep landing page completely intact
- Minimize dependencies
- Prioritize performance
- Ensure mobile responsiveness
- Maintain SEO optimization

## Out of Scope (for initial release)
- E-commerce functionality
- Customer accounts/login
- Social media integration beyond sharing
- Live chat support
- Multi-language support
- Advanced analytics beyond basic tracking
