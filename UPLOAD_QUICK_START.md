# Media Upload System - Quick Start Guide

## Test the System (Easiest Way)

1. Start your server:
```bash
npm start
```

2. Open the test page:
```
http://localhost:5000/test-upload.html
```

3. Login with your admin credentials

4. Upload files and see them listed automatically!

## API Endpoints Summary

All endpoints require admin authentication (JWT token in `Authorization: Bearer TOKEN` header)

| Method | Endpoint | Purpose | Body |
|--------|----------|---------|------|
| POST | `/api/media/upload` | Upload single file | `multipart/form-data` with `file` field |
| POST | `/api/media/upload-multiple` | Upload multiple files | `multipart/form-data` with `files` field |
| GET | `/api/media` | List all files | None |
| DELETE | `/api/media/:filename` | Delete a file | None |

## Quick Examples

### JavaScript Upload (Single File)
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

const { file } = await response.json();
console.log('Uploaded:', file.path);
// Use file.path in your HTML: /uploads/images/filename.jpg
```

### JavaScript Upload (Multiple Files)
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

const { files } = await response.json();
files.forEach(file => console.log(file.path));
```

### HTML Form
```html
<form id="uploadForm">
    <input type="file" name="file" accept="image/*,video/*">
    <button type="submit">Upload</button>
</form>

<script>
document.getElementById('uploadForm').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
    });

    const data = await response.json();
    if (data.success) {
        console.log('File uploaded:', data.file.path);
    }
};
</script>
```

### Display Uploaded Image
```html
<!-- Full size -->
<img src="/uploads/images/filename.jpg" alt="Project">

<!-- Thumbnail (faster) -->
<img src="/uploads/thumbnails/thumb-filename.jpg" alt="Project">
```

## File Limits

- **Images**: JPG, PNG, GIF, WEBP - Max 10MB
- **Videos**: MP4, MOV, AVI - Max 100MB
- **Multiple Upload**: Max 10 files per request

## What Happens Automatically

✅ **Images are optimized**
- Resized to 2000px max width if larger
- Compressed to JPEG quality 85%
- Thumbnails generated at 300px width

✅ **Files are renamed**
- Unique timestamp + random number
- Special characters removed
- Example: `my-photo.jpg` → `my-photo-1735472123456-987654321.jpg`

✅ **Organized storage**
- Images → `/uploads/images/`
- Videos → `/uploads/videos/`
- Thumbnails → `/uploads/thumbnails/`

## Response Format

### Success
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

### Error
```json
{
  "success": false,
  "message": "File too large. Maximum size for images is 10MB"
}
```

## Common Use Cases

### Upload for Project
```javascript
// 1. Upload image
const formData = new FormData();
formData.append('file', projectImageFile);

const uploadRes = await fetch('/api/media/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});

const { file } = await uploadRes.json();

// 2. Create project with uploaded image
await fetch('/api/projects', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        title: 'My Project',
        image: file.path,  // Use the uploaded file path
        description: 'Project description'
    })
});
```

### Gallery with Thumbnails
```javascript
// Fetch all uploaded files
const response = await fetch('/api/media', {
    headers: { 'Authorization': `Bearer ${token}` }
});

const { files } = await response.json();

// Display gallery
const gallery = files.filter(f => f.type === 'image').map(file => `
    <div class="gallery-item">
        <img src="${file.thumbnail}"
             onclick="viewFullSize('${file.path}')"
             alt="${file.filename}">
    </div>
`).join('');

document.getElementById('gallery').innerHTML = gallery;
```

## Testing with cURL

```bash
# 1. Get admin token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  | jq -r '.token')

# 2. Upload file
curl -X POST http://localhost:5000/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg"

# 3. List files
curl http://localhost:5000/api/media \
  -H "Authorization: Bearer $TOKEN"

# 4. Delete file
curl -X DELETE http://localhost:5000/api/media/filename.jpg \
  -H "Authorization: Bearer $TOKEN"
```

## Need More Details?

See `MEDIA_UPLOAD_SYSTEM.md` for complete documentation including:
- Image processing details
- Security features
- Error handling
- Integration examples
- Troubleshooting guide
