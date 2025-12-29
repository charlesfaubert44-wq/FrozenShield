# API Reference

Complete API documentation for FrozenShield backend endpoints.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://frozenshield.ca/api`

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained via the `/api/auth/login` endpoint and are valid for 30 days.

## Response Format

All API responses follow this format:

**Success Response**:
```json
{
  "success": true,
  "data": { },
  "message": "Optional success message"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Rate Limiting

- **Global**: 100 requests per 15 minutes per IP address
- **Contact Form**: 10 submissions per hour per IP address

When rate limit is exceeded:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Public Endpoints

### Health Check

Check server health and uptime.

**Endpoint**: `GET /api/health`

**Authentication**: None

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-27T10:00:00.000Z",
  "uptime": 3600
}
```

**Status Codes**:
- `200` - Server is healthy

---

### Get All Projects

Retrieve all portfolio projects, sorted by order field (ascending) and creation date (descending).

**Endpoint**: `GET /api/projects`

**Authentication**: None

**Query Parameters**: None

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "title": "E-Commerce Platform",
      "description": "Full-featured online shopping platform with payment integration",
      "image": "https://example.com/image.jpg",
      "tags": ["React", "Node.js", "MongoDB", "Stripe"],
      "link": "https://example.com",
      "featured": true,
      "order": 1,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `500` - Server error

---

### Get Featured Projects

Retrieve only featured portfolio projects.

**Endpoint**: `GET /api/projects/featured`

**Authentication**: None

**Query Parameters**: None

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "title": "E-Commerce Platform",
      "featured": true,
      ...
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `500` - Server error

---

### Get Single Project

Retrieve a specific project by ID.

**Endpoint**: `GET /api/projects/:id`

**Authentication**: None

**URL Parameters**:
- `id` (required) - MongoDB ObjectId of the project

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6a7b8c9d0e",
    "title": "E-Commerce Platform",
    "description": "Full-featured online shopping platform",
    "image": "https://example.com/image.jpg",
    "tags": ["React", "Node.js"],
    "link": "https://example.com",
    "featured": true,
    "order": 1,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Status Codes**:
- `200` - Success
- `404` - Project not found
- `500` - Server error

---

### Submit Contact Form

Submit a contact form message.

**Endpoint**: `POST /api/contact`

**Authentication**: None

**Rate Limit**: 10 requests per hour per IP

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I'm interested in your services...",
  "website": ""
}
```

**Body Parameters**:
- `name` (required) - Contact name (string, 1-100 characters)
- `email` (required) - Valid email address
- `message` (required) - Message content (string, 10-2000 characters)
- `website` (optional) - Honeypot field (must be empty to pass)

**Response**:
```json
{
  "success": true,
  "message": "Thank you for your message! We'll get back to you soon."
}
```

**Status Codes**:
- `201` - Contact submitted successfully
- `400` - Validation error or spam detected
- `429` - Rate limit exceeded
- `500` - Server error

**Validation Errors**:
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

**Spam Detection**:
```json
{
  "success": false,
  "message": "Invalid submission"
}
```

---

## Authentication Endpoints

### Register Admin

Register the first admin user. This endpoint is automatically disabled after the first admin is created.

**Endpoint**: `POST /api/auth/register`

**Authentication**: None

**Request Body**:
```json
{
  "username": "admin",
  "email": "admin@frozenshield.ca",
  "password": "SecurePassword123!"
}
```

**Body Parameters**:
- `username` (required) - Unique username (string, 3-30 characters)
- `email` (required) - Unique, valid email address
- `password` (required) - Password (string, min 6 characters)

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "674a1b2c3d4e5f6a7b8c9d0e",
    "username": "admin",
    "email": "admin@frozenshield.ca"
  }
}
```

**Status Codes**:
- `201` - Admin created successfully
- `400` - Validation error or admin already exists
- `500` - Server error

**Error Responses**:
```json
{
  "success": false,
  "message": "Admin registration is disabled. An admin already exists."
}
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint**: `POST /api/auth/login`

**Authentication**: None

**Request Body**:
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Body Parameters**:
- `username` (required) - Username or email address
- `password` (required) - Password

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "674a1b2c3d4e5f6a7b8c9d0e",
    "username": "admin",
    "email": "admin@frozenshield.ca"
  }
}
```

**Status Codes**:
- `200` - Login successful
- `400` - Missing credentials
- `401` - Invalid credentials
- `500` - Server error

**Error Responses**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Get Current Admin

Retrieve information about the currently authenticated admin.

**Endpoint**: `GET /api/auth/me`

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6a7b8c9d0e",
    "username": "admin",
    "email": "admin@frozenshield.ca",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Status Codes**:
- `200` - Success
- `401` - Not authenticated or invalid token
- `404` - Admin not found
- `500` - Server error

---

## Protected Endpoints (Admin Only)

All endpoints below require JWT authentication.

### Create Project

Create a new portfolio project.

**Endpoint**: `POST /api/projects`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "title": "E-Commerce Platform",
  "description": "Full-featured online shopping platform with payment integration",
  "image": "https://example.com/image.jpg",
  "tags": ["React", "Node.js", "MongoDB", "Stripe"],
  "link": "https://example.com",
  "featured": true,
  "order": 1
}
```

**Body Parameters**:
- `title` (required) - Project title (string)
- `description` (required) - Project description (string)
- `image` (optional) - Image URL (string, valid URL)
- `tags` (optional) - Array of technology tags (string[])
- `link` (optional) - Project URL (string, valid URL)
- `featured` (optional) - Featured flag (boolean, default: false)
- `order` (optional) - Display order (number, default: 999)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6a7b8c9d0e",
    "title": "E-Commerce Platform",
    "description": "Full-featured online shopping platform",
    "image": "https://example.com/image.jpg",
    "tags": ["React", "Node.js", "MongoDB", "Stripe"],
    "link": "https://example.com",
    "featured": true,
    "order": 1,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Status Codes**:
- `201` - Project created successfully
- `400` - Validation error
- `401` - Not authenticated
- `500` - Server error

---

### Update Project

Update an existing project.

**Endpoint**: `PUT /api/projects/:id`

**Authentication**: Required (JWT)

**URL Parameters**:
- `id` (required) - MongoDB ObjectId of the project

**Request Body**:
```json
{
  "title": "Updated E-Commerce Platform",
  "featured": false
}
```

**Body Parameters**: Same as Create Project (all optional for updates)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6a7b8c9d0e",
    "title": "Updated E-Commerce Platform",
    "featured": false,
    ...
  }
}
```

**Status Codes**:
- `200` - Project updated successfully
- `400` - Validation error
- `401` - Not authenticated
- `404` - Project not found
- `500` - Server error

---

### Delete Project

Delete a project permanently.

**Endpoint**: `DELETE /api/projects/:id`

**Authentication**: Required (JWT)

**URL Parameters**:
- `id` (required) - MongoDB ObjectId of the project

**Response**:
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Status Codes**:
- `200` - Project deleted successfully
- `401` - Not authenticated
- `404` - Project not found
- `500` - Server error

---

### Get All Contact Submissions

Retrieve all contact form submissions, sorted by date (newest first).

**Endpoint**: `GET /api/contact`

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I'm interested in your services...",
      "status": "new",
      "notes": "",
      "ip": "192.168.1.1",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Contact Status Values**:
- `new` - Unread submission
- `read` - Reviewed but not archived
- `archived` - Archived submission

**Status Codes**:
- `200` - Success
- `401` - Not authenticated
- `500` - Server error

---

### Update Contact Submission

Update contact submission status and notes.

**Endpoint**: `PATCH /api/contact/:id`

**Authentication**: Required (JWT)

**URL Parameters**:
- `id` (required) - MongoDB ObjectId of the contact submission

**Request Body**:
```json
{
  "status": "read",
  "notes": "Responded via email on 2025-01-15"
}
```

**Body Parameters**:
- `status` (optional) - Status (enum: "new", "read", "archived")
- `notes` (optional) - Admin notes (string)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "674a1b2c3d4e5f6a7b8c9d0e",
    "name": "John Doe",
    "status": "read",
    "notes": "Responded via email on 2025-01-15",
    ...
  }
}
```

**Status Codes**:
- `200` - Contact updated successfully
- `400` - Validation error
- `401` - Not authenticated
- `404` - Contact not found
- `500` - Server error

---

### Delete Contact Submission

Delete a contact submission permanently.

**Endpoint**: `DELETE /api/contact/:id`

**Authentication**: Required (JWT)

**URL Parameters**:
- `id` (required) - MongoDB ObjectId of the contact submission

**Response**:
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

**Status Codes**:
- `200` - Contact deleted successfully
- `401` - Not authenticated
- `404` - Contact not found
- `500` - Server error

---

## SEO Endpoints

### Get Sitemap

Generate dynamic XML sitemap with all pages and projects.

**Endpoint**: `GET /sitemap.xml`

**Authentication**: None

**Response**: XML document
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://frozenshield.ca/</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://frozenshield.ca/#services</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://frozenshield.ca/#project-674a1b2c3d4e5f6a7b8c9d0e</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <image:image>
      <image:loc>https://example.com/image.jpg</image:loc>
      <image:title>E-Commerce Platform</image:title>
    </image:image>
  </url>
</urlset>
```

**Status Codes**:
- `200` - Success
- `500` - Server error

---

### Get Structured Data

Generate JSON-LD structured data for search engines.

**Endpoint**: `GET /structured-data.json`

**Authentication**: None

**Response**: JSON-LD document
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "name": "Frozen Shield Studio",
      "url": "https://frozenshield.ca",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Yellowknife",
        "addressRegion": "NT",
        "addressCountry": "CA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 62.454211,
        "longitude": -114.371788
      },
      "email": "hello@frozenshield.ca",
      "description": "Custom web development for Canada's remote territories",
      "areaServed": ["Northwest Territories", "Yukon", "Nunavut", "Canada"]
    },
    {
      "@type": "WebSite",
      "name": "Frozen Shield Studio",
      "url": "https://frozenshield.ca"
    },
    {
      "@type": "ProfessionalService",
      "name": "Frozen Shield Studio",
      "serviceType": ["Web Development", "Custom Applications", "API Development"]
    },
    {
      "@type": "ItemList",
      "name": "Projects",
      "itemListElement": [
        {
          "@type": "CreativeWork",
          "name": "E-Commerce Platform",
          "description": "Full-featured online shopping platform",
          "url": "https://frozenshield.ca/#project-674a1b2c3d4e5f6a7b8c9d0e",
          "keywords": ["React", "Node.js", "MongoDB", "Stripe"]
        }
      ]
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `500` - Server error

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

### Common Error Messages

**Authentication Errors**:
- `"No token, authorization denied"` - No JWT token provided
- `"Token is not valid"` - Expired or invalid JWT token
- `"Invalid credentials"` - Wrong username/password

**Validation Errors**:
- `"Please provide all required fields"` - Missing required fields
- `"Invalid email format"` - Email validation failed
- `"Project not found"` - Invalid project ID

**Rate Limit Errors**:
- `"Too many requests from this IP, please try again later."` - Global rate limit
- `"Too many contact form submissions. Please try again later."` - Contact rate limit

---

## Code Examples

### JavaScript (Fetch API)

**Get All Projects**:
```javascript
fetch('https://frozenshield.ca/api/projects')
  .then(response => response.json())
  .then(data => {
    console.log(data.data); // Array of projects
  })
  .catch(error => console.error('Error:', error));
```

**Submit Contact Form**:
```javascript
fetch('https://frozenshield.ca/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello from the API!'
  })
})
  .then(response => response.json())
  .then(data => console.log(data.message))
  .catch(error => console.error('Error:', error));
```

**Admin Login**:
```javascript
fetch('https://frozenshield.ca/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
})
  .then(response => response.json())
  .then(data => {
    const token = data.token;
    localStorage.setItem('token', token);
  })
  .catch(error => console.error('Error:', error));
```

**Create Project (Authenticated)**:
```javascript
const token = localStorage.getItem('token');

fetch('https://frozenshield.ca/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'New Project',
    description: 'A new portfolio project',
    featured: true
  })
})
  .then(response => response.json())
  .then(data => console.log(data.data))
  .catch(error => console.error('Error:', error));
```

### cURL Examples

**Get All Projects**:
```bash
curl https://frozenshield.ca/api/projects
```

**Submit Contact Form**:
```bash
curl -X POST https://frozenshield.ca/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello from cURL!"
  }'
```

**Admin Login**:
```bash
curl -X POST https://frozenshield.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**Create Project**:
```bash
curl -X POST https://frozenshield.ca/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "New Project",
    "description": "A new portfolio project",
    "featured": true
  }'
```

**Delete Project**:
```bash
curl -X DELETE https://frozenshield.ca/api/projects/674a1b2c3d4e5f6a7b8c9d0e \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Changelog

### Version 1.0.0 (2025-01-15)
- Initial API release
- All endpoints documented
- Authentication system implemented
- Rate limiting added
- SEO endpoints created

---

## Support

For API issues or questions:
- Email: hello@frozenshield.ca
- See [Troubleshooting Guide](./troubleshooting.md)
