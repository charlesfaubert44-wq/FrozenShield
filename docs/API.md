# FrozenShield API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All admin routes require authentication using JWT Bearer tokens.

### Headers
```
Authorization: Bearer {token}
```

---

## Authentication Endpoints

### Register Admin User
**POST** `/auth/register`

Register the first admin user. Only one admin can be registered.

**Request Body:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Admin already exists"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Username must be at least 3 characters",
      "param": "username"
    }
  ]
}
```

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "lastLogin": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Get Current User
**GET** `/auth/me`

Get currently authenticated user information.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "lastLogin": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Logout
**POST** `/auth/logout`

Logout user (client-side token removal).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Albums Endpoints

### Get Public Albums
**GET** `/albums`

Retrieve all public albums.

**Query Parameters:**
- `featured` (boolean) - Filter featured albums
- `tag` (string) - Filter by tag
- `project` (string) - Filter by project ID

**Example:**
```
GET /api/albums?featured=true&tag=landscape
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Northern Lights Collection",
      "description": "Aurora photography from Yellowknife",
      "slug": "northern-lights-collection",
      "coverImage": "/uploads/aurora-cover.jpg",
      "tags": ["aurora", "landscape", "nature"],
      "visibility": "public",
      "featured": true,
      "order": 0,
      "stats": {
        "totalMedia": 15,
        "views": 234
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Album by ID or Slug
**GET** `/albums/:identifier`

Get a single album with its media.

**Parameters:**
- `identifier` - Album ID (ObjectId) or slug

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Northern Lights Collection",
    "description": "Aurora photography from Yellowknife",
    "slug": "northern-lights-collection",
    "coverImage": "/uploads/aurora-cover.jpg",
    "tags": ["aurora", "landscape"],
    "visibility": "public",
    "featured": true,
    "stats": {
      "totalMedia": 2,
      "views": 235
    },
    "media": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "type": "image",
        "url": "/uploads/aurora1.jpg",
        "thumbnail": "/uploads/aurora1-thumb.jpg",
        "optimized": "/uploads/aurora1-opt.jpg",
        "caption": "Aurora over Great Slave Lake",
        "alt": "Green aurora borealis",
        "order": 0
      }
    ],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Album not found"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "This album is not publicly accessible"
}
```

### Get Album Media
**GET** `/albums/:id/media`

Get all media items for an album.

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "albumId": "507f1f77bcf86cd799439011",
      "type": "image",
      "url": "/uploads/aurora1.jpg",
      "thumbnail": "/uploads/aurora1-thumb.jpg",
      "caption": "Aurora over Great Slave Lake",
      "order": 0,
      "uploadedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## Admin Album Endpoints

All admin endpoints require authentication.

### Create Album
**POST** `/admin/albums`

Create a new album.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "New Album",
  "description": "Album description",
  "tags": ["nature", "landscape"],
  "visibility": "public",
  "featured": false,
  "order": 0,
  "metadata": {
    "location": "Yellowknife, NT",
    "camera": "Canon EOS R5"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "New Album",
    "slug": "new-album",
    "description": "Album description",
    "tags": ["nature", "landscape"],
    "visibility": "public",
    "featured": false,
    "order": 0,
    "stats": {
      "totalMedia": 0,
      "views": 0
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Album title is required"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Update Album
**PUT** `/admin/albums/:id`

Update an existing album.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Updated Album Title",
  "description": "Updated description",
  "featured": true,
  "visibility": "public"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Updated Album Title",
    "slug": "updated-album-title",
    "description": "Updated description",
    "featured": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Delete Album
**DELETE** `/admin/albums/:id`

Delete an album and all its media.

**Headers Required:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Album deleted successfully",
  "data": {
    "albumId": "507f1f77bcf86cd799439011",
    "albumTitle": "Northern Lights",
    "mediaDeleted": 15
  }
}
```

### List All Albums (Admin)
**GET** `/admin/albums`

Get all albums with pagination and filtering.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `search` (string) - Search in title/description
- `featured` (boolean) - Filter featured albums
- `visibility` (string) - Filter by visibility (public/private/unlisted)

**Example:**
```
GET /api/admin/albums?page=1&limit=10&search=aurora&featured=true
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

---

## Videos Endpoints

### Get Public Videos
**GET** `/videos`

Retrieve all public videos.

**Query Parameters:**
- `featured` (boolean)
- `category` (string)
- `tag` (string)

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Portfolio Walkthrough",
      "slug": "portfolio-walkthrough",
      "description": "A tour of my latest web development projects",
      "videoType": "youtube",
      "videoUrl": "https://youtube.com/watch?v=example",
      "thumbnail": "https://img.youtube.com/vi/example/maxresdefault.jpg",
      "duration": 320,
      "tags": ["tutorial", "portfolio"],
      "category": "Web Development",
      "featured": true,
      "visibility": "public",
      "stats": {
        "views": 1234,
        "likes": 89
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Video by ID or Slug
**GET** `/videos/:identifier`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "title": "Portfolio Walkthrough",
    "slug": "portfolio-walkthrough",
    "videoType": "youtube",
    "videoUrl": "https://youtube.com/watch?v=example",
    "embedCode": "<iframe...></iframe>",
    "stats": {
      "views": 1235,
      "likes": 89
    }
  }
}
```

---

## Projects Endpoints

### Get Public Projects
**GET** `/projects`

Retrieve all public projects.

**Query Parameters:**
- `featured` (boolean)
- `category` (string)
- `technology` (string)

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "E-Commerce Platform",
      "slug": "e-commerce-platform",
      "shortDescription": "Full-stack e-commerce solution",
      "longDescription": "Built with React, Node.js, and MongoDB...",
      "thumbnail": "/uploads/ecommerce-thumb.jpg",
      "images": [
        {
          "url": "/uploads/ecommerce1.jpg",
          "caption": "Homepage",
          "order": 0
        }
      ],
      "technologies": ["React", "Node.js", "MongoDB", "Express"],
      "category": "Web Development",
      "projectUrl": "https://example.com",
      "githubUrl": "https://github.com/user/repo",
      "featured": true,
      "visibility": "public",
      "completedDate": "2024-01-01T00:00:00.000Z",
      "client": "Acme Corp",
      "stats": {
        "views": 567,
        "likes": 43
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## Portfolio Endpoint

### Get Unified Portfolio
**GET** `/portfolio`

Get all public content (albums, videos, projects) in one request.

**Query Parameters:**
- `featured` (boolean) - Only featured content
- `type` (string) - Filter by type (albums/videos/projects)
- `limit` (number) - Limit per category

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "albums": [...],
    "videos": [...],
    "projects": [...]
  },
  "counts": {
    "albums": 12,
    "videos": 8,
    "projects": 15
  }
}
```

---

## Media Endpoints

### Upload Media
**POST** `/media/upload`

Upload media file to an album.

**Headers Required:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (file) - Image or video file
- `albumId` (string) - Album ID
- `caption` (string) - Media caption
- `alt` (string) - Alt text
- `order` (number) - Display order

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "albumId": "507f1f77bcf86cd799439011",
    "type": "image",
    "url": "/uploads/image-1234567890.jpg",
    "thumbnail": "/uploads/image-1234567890-thumb.jpg",
    "optimized": "/uploads/image-1234567890-opt.jpg",
    "caption": "Beautiful sunset",
    "metadata": {
      "filename": "sunset.jpg",
      "size": 2048000,
      "width": 1920,
      "height": 1080,
      "format": "jpeg"
    }
  }
}
```

---

## Health Check

### Check API Health
**GET** `/health`

Check if the API is running.

**Success Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600.5
}
```

---

## Error Responses

### Common Error Codes

#### 400 Bad Request
Invalid request data or validation errors.

#### 401 Unauthorized
Missing or invalid authentication token.

#### 403 Forbidden
Insufficient permissions or resource not accessible.

#### 404 Not Found
Resource does not exist.

#### 500 Internal Server Error
Server error occurred.

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)",
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName"
    }
  ]
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Limit:** 100 requests per IP
- **Window:** 15 minutes
- **Response when exceeded (429):**
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Data Validation

### Album Title
- Required
- Max length: 100 characters

### Album Description
- Optional
- Max length: 1000 characters

### Video Title
- Required
- Max length: 200 characters

### Project Title
- Required
- Max length: 100 characters

### Project Short Description
- Optional
- Max length: 200 characters

### Media Caption
- Optional
- Max length: 500 characters

### Media Alt Text
- Optional
- Max length: 200 characters

---

## Pagination

Admin endpoints support pagination:

**Request:**
```
GET /api/admin/albums?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 2,
    "pages": 5,
    "limit": 20
  }
}
```

---

## Filtering and Search

### Search
Search in title and description fields:
```
GET /api/admin/albums?search=northern lights
```

### Filter by Visibility
```
GET /api/admin/albums?visibility=public
```

### Filter by Featured Status
```
GET /api/admin/albums?featured=true
```

### Combine Filters
```
GET /api/admin/albums?search=aurora&featured=true&visibility=public&page=1&limit=10
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- File uploads are limited to 10MB
- JWT tokens expire after 30 days
- Only one admin account can be created
- Private and unlisted content is only accessible to authenticated users
