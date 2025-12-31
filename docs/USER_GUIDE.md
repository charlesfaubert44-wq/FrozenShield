# FrozenShield User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Admin Dashboard](#admin-dashboard)
- [Managing Albums](#managing-albums)
- [Managing Videos](#managing-videos)
- [Managing Projects](#managing-projects)
- [Media Upload](#media-upload)
- [Site Settings](#site-settings)
- [Troubleshooting](#troubleshooting)

## Getting Started

### First-Time Setup

1. **Access the Website**
   Navigate to your FrozenShield website URL.

2. **Register Admin Account**
   - Click "Admin Login" or navigate to `/admin`
   - Click "Register" (only available for first admin)
   - Fill in the registration form:
     - Username (minimum 3 characters)
     - Email address
     - Password (minimum 8 characters)
   - Click "Register"
   - You'll be automatically logged in

3. **Dashboard Overview**
   After logging in, you'll see the admin dashboard with:
   - Quick stats (total albums, videos, projects)
   - Recent activity
   - Quick actions

### Logging In

1. Navigate to `/admin` or click "Admin Login"
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard

### Logging Out

Click the "Logout" button in the top right corner of the admin dashboard.

## Admin Dashboard

The dashboard provides an overview of your portfolio:

### Statistics Panel
- **Total Albums** - Number of photo albums
- **Total Videos** - Number of videos
- **Total Projects** - Number of portfolio projects
- **Total Views** - Combined views across all content

### Quick Actions
- Create New Album
- Upload Video
- Add Project
- Upload Media

### Recent Activity
View your most recently added or modified content.

## Managing Albums

### Creating an Album

1. Click "Albums" in the sidebar
2. Click "Create New Album"
3. Fill in the album details:
   - **Title** (required) - Album name
   - **Description** - Detailed description
   - **Tags** - Comma-separated keywords
   - **Visibility** - Public, Private, or Unlisted
   - **Featured** - Checkbox to feature on homepage
   - **Order** - Display order number
4. Click "Create Album"

### Adding Photos to an Album

1. Go to Albums and select an album
2. Click "Upload Media"
3. Select image files (JPG, PNG, WebP)
4. Add captions and alt text for each image
5. Set display order
6. Click "Upload"

Images are automatically optimized and thumbnails are generated.

### Editing an Album

1. Go to Albums
2. Click the "Edit" button on the album
3. Modify the fields you want to change
4. Click "Save Changes"

### Setting Album Cover

1. Open the album
2. Hover over a photo
3. Click "Set as Cover"
4. The cover image will update automatically

### Deleting an Album

1. Go to Albums
2. Click the "Delete" button on the album
3. Confirm the deletion
4. **Note:** This will also delete all photos in the album

### Album Visibility Options

- **Public** - Visible to everyone, appears in listings
- **Private** - Only visible to logged-in admins
- **Unlisted** - Accessible via direct link, not in listings

## Managing Videos

### Adding a Video

1. Click "Videos" in the sidebar
2. Click "Add New Video"
3. Select video type:
   - **YouTube** - Paste YouTube URL
   - **Vimeo** - Paste Vimeo URL
   - **Direct Upload** - Upload video file (coming soon)
4. Fill in details:
   - **Title** (required)
   - **Description**
   - **Video URL** (for YouTube/Vimeo)
   - **Thumbnail URL** - Auto-fetched or custom
   - **Duration** - In seconds
   - **Tags** - Keywords
   - **Category** - Video category
   - **Featured** - Show on homepage
   - **Visibility** - Public/Private/Unlisted
5. Click "Add Video"

### Editing a Video

1. Go to Videos
2. Click "Edit" on the video
3. Update information
4. Click "Save Changes"

### Deleting a Video

1. Go to Videos
2. Click "Delete" on the video
3. Confirm deletion

## Managing Projects

### Creating a Project

1. Click "Projects" in the sidebar
2. Click "Create New Project"
3. Fill in project details:
   - **Title** (required) - Project name
   - **Short Description** - Brief summary (max 200 chars)
   - **Long Description** - Detailed description
   - **Technologies** - Tech stack used (comma-separated)
   - **Category** - Project category
   - **Project URL** - Live website link
   - **GitHub URL** - Source code link
   - **Client** - Client name (if applicable)
   - **Completed Date** - Project completion date
   - **Featured** - Feature on homepage
   - **Visibility** - Public/Private/Unlisted
4. Click "Create Project"

### Adding Project Images

1. Open the project
2. Click "Add Images"
3. Upload project screenshots
4. Add captions for each image
5. Set display order
6. Click "Save"

### Setting Project Thumbnail

1. Open the project
2. Hover over an image
3. Click "Set as Thumbnail"

### Editing a Project

1. Go to Projects
2. Click "Edit" on the project
3. Modify fields
4. Click "Save Changes"

### Deleting a Project

1. Go to Projects
2. Click "Delete" on the project
3. Confirm deletion

## Media Upload

### Supported File Types

**Images:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Max size: 10MB per file

**Videos:**
- MP4 (.mp4)
- WebM (.webm)
- Max size: 10MB per file

### Upload Process

1. Select the album for the media
2. Click "Upload Media"
3. Choose files from your computer
4. Files are automatically:
   - Resized for web
   - Optimized for fast loading
   - Thumbnails generated
   - EXIF data extracted (for photos)
5. Add captions and metadata
6. Click "Upload"

### Image Optimization

Uploaded images are automatically processed:
- **Original** - Stored for downloads
- **Optimized** - Compressed for web display (max 1920px)
- **Thumbnail** - Small preview (max 400px)

### Managing Media

**Reorder Media:**
1. Go to album
2. Drag and drop images to reorder
3. Changes save automatically

**Edit Media:**
1. Click on a media item
2. Update caption, alt text, or tags
3. Click "Save"

**Delete Media:**
1. Click on a media item
2. Click "Delete"
3. Confirm deletion

### EXIF Data

For photos with EXIF data, the following is automatically extracted:
- Camera model
- Lens information
- ISO, aperture, shutter speed
- Focal length
- Date taken

This information is displayed on the photo detail page.

## Site Settings

### Configuring Contact Form

The contact form sends emails to the address configured in your `.env` file:

```
EMAIL_FROM=your-email@example.com
```

Messages are also stored in the database for later review.

### SEO Settings

Each content type (albums, videos, projects) automatically generates:
- Meta descriptions
- Open Graph tags
- Twitter Card tags
- Schema.org structured data

### Sitemap

A sitemap is automatically generated at `/sitemap.xml` and includes all public content.

## Troubleshooting

### Login Issues

**Problem:** Can't log in
**Solutions:**
- Verify email and password are correct
- Check Caps Lock is off
- Clear browser cache and cookies
- Try "Forgot Password" (if implemented)

**Problem:** "Admin already exists" when registering
**Solution:** An admin account has already been created. Use the login form instead.

### Upload Issues

**Problem:** Image upload fails
**Solutions:**
- Check file size is under 10MB
- Verify file format is supported (JPG, PNG, WebP)
- Check internet connection
- Try a different browser

**Problem:** Images appear rotated incorrectly
**Solution:** The system uses EXIF orientation data. If images still appear wrong, use an image editor to physically rotate them before uploading.

### Display Issues

**Problem:** Content not showing on public site
**Solutions:**
- Check visibility is set to "Public"
- Verify the item is not in a private album
- Clear browser cache
- Check the item actually exists in the database

**Problem:** Featured content not appearing
**Solutions:**
- Ensure "Featured" checkbox is checked
- Save the changes
- Refresh the homepage

### Performance Issues

**Problem:** Slow image loading
**Solutions:**
- Images are automatically optimized
- Ensure browser caching is enabled
- Check internet connection speed
- Contact site administrator about CDN setup

**Problem:** Dashboard is slow
**Solutions:**
- Clear browser cache
- Close unnecessary browser tabs
- Check for large numbers of items (pagination helps)

### Common Error Messages

**"No token provided"**
- You've been logged out. Log in again.

**"Album not found"**
- The album was deleted or the link is incorrect.

**"Validation failed"**
- Check that all required fields are filled in correctly.

**"Too many requests"**
- You've exceeded the rate limit. Wait 15 minutes and try again.

## Best Practices

### Album Organization

- Use descriptive album titles
- Add detailed descriptions with keywords
- Use consistent tagging across albums
- Feature your best work
- Regularly review and update content

### Image Guidelines

- Upload high-quality original images
- Use descriptive filenames before uploading
- Add meaningful captions and alt text
- Include location and date in metadata
- Tag images with relevant keywords

### Video Guidelines

- Use descriptive titles
- Write detailed descriptions
- Add relevant tags
- Include timestamps in descriptions for long videos
- Set appropriate visibility

### Project Guidelines

- Include comprehensive project descriptions
- List all technologies used
- Add multiple screenshots
- Include live demo and GitHub links
- Update status when projects evolve

### SEO Optimization

- Use keywords naturally in titles and descriptions
- Add alt text to all images
- Keep content fresh and updated
- Link related content together
- Use consistent naming conventions

## Keyboard Shortcuts

### Dashboard
- `Ctrl+N` - Create new item (context-dependent)
- `Ctrl+S` - Save current form
- `Esc` - Close modal/cancel
- `Ctrl+F` - Focus search

### Media Management
- `Arrow Keys` - Navigate between items
- `Delete` - Delete selected item (with confirmation)
- `Enter` - Open selected item

## Support

For technical issues or feature requests:
- Email: support@frozenshield.ca
- GitHub Issues: [Repository URL]
- Documentation: See `docs/` folder

## Updates and Maintenance

### Backing Up Content

Regularly backup your:
- Database (MongoDB export)
- Uploaded files (uploads/ directory)
- Environment configuration (.env file)

### Updating the System

1. Backup all data first
2. Follow deployment guide
3. Test on staging environment
4. Deploy to production
5. Verify all features work

## Tips and Tricks

- Use bulk upload for large photo sets
- Create albums before uploading photos
- Use the search function to find content quickly
- Preview content before making it public
- Regularly review analytics to see what's popular
- Keep backups of original high-resolution images
- Use consistent image dimensions within albums for best appearance
