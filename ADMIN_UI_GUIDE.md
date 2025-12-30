# Admin UI - Project Management Guide

## Quick Start

### Creating a New Project

1. **Navigate to Projects Section**
   - Click "Projects" in the navigation bar
   - Click "Add New Project" button

2. **Fill Basic Information**
   ```
   Title: My Photography Project
   Description: A beautiful wedding photoshoot in the mountains
   ```

3. **Select Project Type**
   - Choose from:
     - Web Development
     - Photography
     - Videography
     - Other

4. **Set Project Status**
   - **Draft**: Work in progress, not public
   - **In Progress**: Active project
   - **Completed**: Finished project
   - **Archived**: Older project, hidden from main view

5. **Add Client Information (Optional)**
   ```
   Client Name: John & Jane Smith
   Invoice: [Select from dropdown] (Future feature)
   ```

## Media Management

### Adding Media

#### Method 1: Drag & Drop
1. Drag image/video files from your computer
2. Drop them onto the upload zone (dashed border area)
3. Files will be processed and added to the gallery

#### Method 2: File Browser
1. Click on the upload zone
2. Select files from your computer
3. Click "Open"

#### Method 3: URL Input
1. Paste media URL in the "Or paste media URL here" field
2. Click "Add URL" button
3. Media will be added from the URL

### Managing Media in Gallery

#### Captions
- Click on the caption field below each media thumbnail
- Type your caption
- Changes are saved when you submit the form

#### Reordering Media

**Using Arrow Buttons:**
- Click ← to move media left
- Click → to move media right
- Order numbers update automatically

**Using Drag & Drop:**
1. Click and hold on any media item
2. Drag to new position
3. Drop to reorder
4. First item becomes cover image automatically

#### Deleting Media
- Click the × button on any media item
- Item is removed from gallery
- Order numbers update automatically

#### Cover Image
- The first media item (position 1) is automatically the cover image
- Shows "COVER" badge in top-right corner
- Reorder media to change cover image

## Additional Fields

### Project URL
- Link to live project website
- Example: https://myproject.com

### Tags
- Comma-separated keywords
- Example: `React, Node.js, MongoDB, Wedding, Portrait`

### Display Order
- Number to control project order in listings
- Lower numbers appear first
- Default: 0

### Featured Project
- Check to mark as featured
- Featured projects appear in special sections
- Gets special badge in listings

## Saving Changes

1. Review all fields
2. Check media gallery
3. Click "Save Project" button
4. Project is saved to database
5. Modal closes automatically

## Editing Existing Projects

1. Find project in projects list
2. Click "Edit" button
3. Modal opens with all current data
4. Media gallery loads with existing media
5. Make changes as needed
6. Click "Save Project"

## Project Display

### In Project List
Each project card shows:
- **Title** and creation date
- **Client name** (if set)
- **Description** preview
- **Media thumbnails** (first 4 items)
  - "+N" badge if more than 4 media items
- **Type badge** (e.g., "photography")
- **Status badge** (e.g., "COMPLETED")
- **Tags** as colored badges
- **Featured badge** (if featured)

### Edit/Delete Actions
- **Edit**: Opens modal with all project data
- **Delete**: Removes project (with confirmation)

## Tips & Best Practices

### Media Files
- **Supported formats**:
  - Images: JPG, PNG, GIF, WebP, SVG
  - Videos: MP4, WebM, OGG, MOV
- **For production**: Use CDN URLs instead of uploading files directly
- **File size**: Optimize images before upload (recommended < 2MB)

### Project Organization
- Use **Draft** status while working on content
- Set to **In Progress** when actively working with client
- Mark **Completed** when project is done
- Use **Archived** for old projects you want to hide

### Media Gallery
- First image is the cover - choose wisely!
- Add captions to provide context
- Keep media count reasonable (5-10 for best performance)
- Use consistent image dimensions for best appearance

### Tags
- Use consistent tag names
- Keep tags simple and descriptive
- Common tags help with filtering and analytics
- Examples: `portrait`, `landscape`, `e-commerce`, `SaaS`

### Client Management
- Always add client name for client projects
- Use invoice linking (when implemented) for billing
- Helps with filtering and reporting

## Keyboard Shortcuts

- **Escape**: Close modal
- **Enter**: Submit form (when focused on single-line input)
- **Tab**: Navigate between form fields

## Troubleshooting

### Media not uploading?
- Check file format (must be image or video)
- Try using URL method instead
- Check browser console for errors

### Can't reorder media?
- Make sure you have at least 2 media items
- Try using arrow buttons instead of drag-and-drop
- Refresh page and try again

### Changes not saving?
- Check for error messages
- Ensure required fields are filled
- Check browser console for errors
- Verify you're logged in

### Modal not opening?
- Refresh the page
- Clear browser cache
- Check browser console for JavaScript errors

## Advanced Features (Coming Soon)

- Invoice integration
- Bulk media upload
- Media categories
- Image editing/cropping
- Video preview
- Project templates
- Client dashboard access
- Advanced filtering
- Analytics and reporting

## Technical Details

### Media Storage
- **Current**: Base64 data URLs (demo mode)
- **Recommended**: CDN/cloud storage (production)
- **Supported**: AWS S3, Cloudinary, Imgur, etc.

### API Endpoints
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- Media endpoints available for advanced usage

### Database Schema
Projects are stored with:
- Basic info (title, description, type, status)
- Client info (name, invoice reference)
- Media array (URL, type, caption, order)
- Metadata (tags, featured, order, dates)

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check ADMIN_ENHANCEMENTS_SUMMARY.md for technical details
4. Contact system administrator

---

**Last Updated**: 2025-12-29
**Version**: 1.0.0
**Author**: Claude AI
