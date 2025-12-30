# FrozenShield Media Upload & Management System

## Overview

Complete file upload and media management system with image optimization, thumbnail generation, and secure file handling.

## Features

- **File Upload**: Single and multiple file uploads
- **File Types**: Images (JPG, PNG, GIF, WEBP) and Videos (MP4, MOV, AVI)
- **Size Limits**: 10MB for images, 100MB for videos
- **Image Processing**: Automatic resize and compression with Sharp
- **Thumbnails**: Auto-generated 300px thumbnails for images
- **Security**: Admin-only access with JWT authentication
- **File Management**: List, view, and delete uploaded files

## Installation

The required packages are already installed:

```bash
npm install multer sharp fs-extra
```

## Directory Structure

```
public/
└── uploads/
    ├── images/          # Uploaded images (optimized)
    ├── videos/          # Uploaded videos
    └── thumbnails/      # Auto-generated image thumbnails (300px)
```

## API Endpoints

### 1. Upload Single File

**POST** `/api/media/upload`

**Authentication**: Required (Admin JWT token)

**Request**: `multipart/form-data`
- Field name: `file`
- File types: Images (jpg, png, gif, webp) or Videos (mp4, mov, avi)
- Max size: 10MB (images), 100MB (videos)

**Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "filename": "project-image-1735472123456-987654321.jpg",
    "path": "/uploads/images/project-image-1735472123456-987654321.jpg",
    "thumbnail": "/uploads/thumbnails/thumb-project-image-1735472123456-987654321.jpg",
    "type": "image",
    "size": 1024000,
    "originalName": "project-image.jpg"
  }
}
```

**Example (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const data = await response.json();
console.log(data.file.path); // Use this path in your HTML
```

**Example (cURL)**:
```bash
curl -X POST http://localhost:5000/api/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### 2. Upload Multiple Files

**POST** `/api/media/upload-multiple`

**Authentication**: Required (Admin JWT token)

**Request**: `multipart/form-data`
- Field name: `files` (multiple)
- Max files: 10 per request
- File types: Images (jpg, png, gif, webp) or Videos (mp4, mov, avi)
- Max size per file: 10MB (images), 100MB (videos)

**Response**:
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [
    {
      "filename": "image1-1735472123456-111111111.jpg",
      "path": "/uploads/images/image1-1735472123456-111111111.jpg",
      "thumbnail": "/uploads/thumbnails/thumb-image1-1735472123456-111111111.jpg",
      "type": "image",
      "size": 512000,
      "originalName": "image1.jpg"
    },
    // ... more files
  ]
}
```

**Example (JavaScript)**:
```javascript
const formData = new FormData();
Array.from(fileInput.files).forEach(file => {
    formData.append('files', file);
});

const response = await fetch('/api/media/upload-multiple', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### 3. List All Files

**GET** `/api/media`

**Authentication**: Required (Admin JWT token)

**Response**:
```json
{
  "success": true,
  "count": 15,
  "files": [
    {
      "filename": "project-image-1735472123456-987654321.jpg",
      "path": "/uploads/images/project-image-1735472123456-987654321.jpg",
      "thumbnail": "/uploads/thumbnails/thumb-project-image-1735472123456-987654321.jpg",
      "type": "image",
      "size": 1024000,
      "created": "2025-12-29T10:30:00.000Z",
      "modified": "2025-12-29T10:30:00.000Z"
    },
    // ... more files (sorted by created date, newest first)
  ]
}
```

**Example (JavaScript)**:
```javascript
const response = await fetch('/api/media', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const data = await response.json();
data.files.forEach(file => {
    console.log(`${file.filename}: ${file.path}`);
});
```

### 4. Delete File

**DELETE** `/api/media/:filename`

**Authentication**: Required (Admin JWT token)

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully",
  "filename": "project-image-1735472123456-987654321.jpg"
}
```

**Example (JavaScript)**:
```javascript
const response = await fetch('/api/media/project-image-1735472123456-987654321.jpg', {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

**Example (cURL)**:
```bash
curl -X DELETE http://localhost:5000/api/media/filename.jpg \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Image Processing

All uploaded images are automatically processed using Sharp:

### Main Image Processing
- **Resize**: Images wider than 2000px are resized to 2000px width (maintains aspect ratio)
- **Compression**: JPEG quality 85% for optimal size/quality balance
- **Format**: Converted to JPEG for consistency

### Thumbnail Generation
- **Size**: 300px width (maintains aspect ratio)
- **Compression**: JPEG quality 80%
- **Path**: Stored in `/uploads/thumbnails/thumb-{filename}`

### Example Output
```
Original: 4000x3000 @ 5MB
Processed: 2000x1500 @ 800KB
Thumbnail: 300x225 @ 25KB
```

## File Naming Convention

Uploaded files are automatically renamed to prevent conflicts:

**Format**: `{sanitized-basename}-{timestamp}-{random}.{ext}`

**Example**:
- Original: `My Project Image!.jpg`
- Saved as: `my-project-image-1735472123456-987654321.jpg`

**Features**:
- Special characters replaced with hyphens
- Lowercase for consistency
- Timestamp + random number ensures uniqueness
- Original extension preserved

## Security Features

### Authentication
- All endpoints require admin JWT token
- Token verified via middleware: `server/middleware/auth.js`

### File Validation
- **Type Filtering**: Only allowed mimetypes accepted
- **Size Limits**: Enforced before processing
- **Path Traversal Protection**: Filename validation prevents directory traversal attacks

### Allowed File Types
```javascript
Images: 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
Videos: 'video/mp4', 'video/quicktime', 'video/x-msvideo'
```

## Using in Projects

### Add Image to Project
```javascript
// In admin panel when creating/editing project
const uploadResponse = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});

const { file } = await uploadResponse.json();

// Use file.path in project data
const projectData = {
    title: 'My Project',
    image: file.path,  // /uploads/images/project-image-1735472123456-987654321.jpg
    thumbnail: file.thumbnail  // /uploads/thumbnails/thumb-project-image-1735472123456-987654321.jpg
};

// Save project with image path
await fetch('/api/projects', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
});
```

### Display Image on Frontend
```html
<!-- Full size image -->
<img src="/uploads/images/project-image-1735472123456-987654321.jpg" alt="Project">

<!-- Thumbnail (faster loading for galleries) -->
<img src="/uploads/thumbnails/thumb-project-image-1735472123456-987654321.jpg" alt="Project">
```

## Testing the System

### Test Page
A complete test interface is available at:
```
http://localhost:5000/test-upload.html
```

Features:
- Admin login
- Single file upload
- Multiple file upload
- File list with thumbnails
- Delete functionality
- Copy file paths

### Manual Testing with cURL

1. **Login to get token**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

2. **Upload file**:
```bash
curl -X POST http://localhost:5000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg"
```

3. **List files**:
```bash
curl http://localhost:5000/api/media \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Delete file**:
```bash
curl -X DELETE http://localhost:5000/api/media/filename.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

### Common Errors

**No token provided**:
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**Invalid file type**:
```json
{
  "success": false,
  "message": "Invalid file type. Allowed: jpg, png, gif, webp, mp4, mov, avi"
}
```

**File too large**:
```json
{
  "success": false,
  "message": "File too large. Maximum size for images is 10MB"
}
```

**File not found (delete)**:
```json
{
  "success": false,
  "message": "File not found"
}
```

## Middleware Components

### `server/middleware/upload.js`

**Exports**:
- `upload`: Multer instance configured for single/multiple uploads
- `validateFileSize`: Validates file size based on type
- `processUploadedImages`: Optimizes images and generates thumbnails
- `deleteFile(filename)`: Helper function to delete files
- `listFiles()`: Helper function to list all files

**Usage in custom routes**:
```javascript
const { upload, validateFileSize, processUploadedImages } = require('./middleware/upload');

router.post('/custom-upload',
    auth,
    upload.single('file'),
    validateFileSize,
    processUploadedImages,
    (req, res) => {
        const { file, thumbnail } = req.processedFile;
        // Your custom logic
    }
);
```

## Files Created

### Core System
- `server/middleware/upload.js` - Upload middleware with image processing
- `server/routes/media.js` - Media management API routes
- `server/server.js` - Updated with media routes

### Directories
- `public/uploads/images/` - Uploaded and optimized images
- `public/uploads/videos/` - Uploaded videos
- `public/uploads/thumbnails/` - Auto-generated thumbnails
- `public/uploads/.gitignore` - Prevents committing uploaded files

### Testing
- `public/test-upload.html` - Complete test interface

## Integration with Admin Dashboard

To integrate into your admin dashboard:

1. **Add upload UI to project form**:
```html
<div class="form-group">
    <label>Project Image</label>
    <input type="file" id="projectImage" accept="image/*">
    <button onclick="uploadProjectImage()">Upload</button>
    <img id="imagePreview" style="max-width: 300px;">
</div>
```

2. **Upload handler**:
```javascript
async function uploadProjectImage() {
    const fileInput = document.getElementById('projectImage');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
    });

    const data = await response.json();
    if (data.success) {
        // Show preview
        document.getElementById('imagePreview').src = data.file.path;
        // Store path for project creation
        window.uploadedImagePath = data.file.path;
    }
}
```

3. **Include in project data**:
```javascript
const projectData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    image: window.uploadedImagePath,  // From upload
    // ... other fields
};
```

## Performance Considerations

### Image Optimization
- Large images automatically resized to 2000px max width
- JPEG compression reduces file size by ~60-80%
- Thumbnails enable fast-loading galleries

### Example Savings
```
Original Upload: 4000x3000 @ 5MB
After Processing:
  - Main Image: 2000x1500 @ 800KB (84% reduction)
  - Thumbnail: 300x225 @ 25KB (99.5% reduction)
```

### Recommendations
- Use thumbnails for gallery views
- Use full images for detail views
- Consider lazy loading for image-heavy pages

## Maintenance

### Cleaning Up Old Files
```javascript
// Custom cleanup script (example)
const { listFiles, deleteFile } = require('./server/middleware/upload');

async function cleanupOldFiles(daysOld = 30) {
    const files = await listFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    for (const file of files) {
        if (new Date(file.created) < cutoffDate) {
            await deleteFile(file.filename);
            console.log(`Deleted old file: ${file.filename}`);
        }
    }
}
```

### Backup Strategy
```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz public/uploads/

# Restore from backup
tar -xzf uploads-backup-20251229.tar.gz
```

## Troubleshooting

### Upload fails silently
- Check file size limits
- Verify token is valid
- Check console for errors

### Images not optimizing
- Ensure Sharp is installed: `npm install sharp`
- Check Sharp supports your OS/architecture
- Review server logs for processing errors

### Thumbnails not generating
- Verify `thumbnails/` directory exists
- Check file permissions
- Review Sharp processing logs

### Files uploaded but not appearing
- Check correct upload directory
- Verify static file serving is configured
- Check file permissions

## Next Steps

1. **Integrate with Projects**: Update project creation to use upload system
2. **Add to Admin Dashboard**: Create upload UI in admin panel
3. **Implement Gallery**: Create image gallery view
4. **Add Video Processing**: Consider video thumbnail generation
5. **Cloud Storage**: Optionally integrate AWS S3/Cloudinary for production

## Support

For issues or questions:
- Check server logs for detailed error messages
- Test with `test-upload.html` to isolate issues
- Review this documentation for proper API usage
- Check file permissions on upload directories
