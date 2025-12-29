# FrozenShield API Test Plan

## Table of Contents
1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Project Endpoints](#project-endpoints)
5. [Contact Endpoints](#contact-endpoints)
6. [SEO Endpoints](#seo-endpoints)
7. [Health Check Endpoint](#health-check-endpoint)
8. [Error Cases & Edge Cases](#error-cases--edge-cases)
9. [Rate Limiting Tests](#rate-limiting-tests)
10. [Security Tests](#security-tests)

---

## Overview

This document provides comprehensive testing documentation for all API endpoints in the FrozenShield portfolio website. The API follows RESTful conventions and returns JSON responses with consistent structure.

**API Base URL:** `http://localhost:5000/api`

**Global Rate Limiting:** 100 requests per 15 minutes per IP address

**Response Format:**
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": {} // Optional, contains response data
}
```

---

## Base Configuration

### Environment Variables Required
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing

### Headers
```bash
# For authenticated requests
Authorization: Bearer <jwt_token>

# Standard headers
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. Register Admin (POST /api/auth/register)

**Purpose:** Create the first admin account (disabled after first admin exists)

**Authentication:** None (Public, but restricted)

**Rate Limiting:** General API limit (100/15min)

**Request Body:**
```json
{
  "username": "admin",
  "email": "admin@frozenshield.ca",
  "password": "SecurePassword123!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@frozenshield.ca"
  }
}
```

**Error Responses:**

*400 - Missing Fields*
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

*400 - User Already Exists*
```json
{
  "success": false,
  "message": "Username or email already exists"
}
```

*403 - Admin Already Registered*
```json
{
  "success": false,
  "message": "Admin registration is disabled. Please contact existing admin."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@frozenshield.ca",
    "password": "SecurePassword123!"
  }'
```

**Edge Cases to Test:**
- Empty username, email, or password
- Invalid email format
- Duplicate username
- Duplicate email
- Password less than minimum length
- Attempt to register after admin exists
- SQL injection attempts in fields
- XSS attempts in fields

---

### 2. Login (POST /api/auth/login)

**Purpose:** Authenticate admin and receive JWT token

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Note:** Can use either username OR email in the username field

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@frozenshield.ca"
  }
}
```

**Error Responses:**

*400 - Missing Credentials*
```json
{
  "success": false,
  "message": "Please provide username/email and password"
}
```

*401 - Invalid Credentials*
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**cURL Example:**
```bash
# Login with username
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }'

# Login with email
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@frozenshield.ca",
    "password": "SecurePassword123!"
  }'
```

**Edge Cases to Test:**
- Empty username/password
- Wrong username
- Wrong password
- Case sensitivity in username
- Login with email instead of username
- Special characters in password
- SQL injection attempts
- Brute force attempts (test rate limiting)

---

### 3. Get Current Admin (GET /api/auth/me)

**Purpose:** Retrieve current authenticated admin details

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@frozenshield.ca",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

*401 - No Token*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

*401 - Invalid Token*
```json
{
  "success": false,
  "message": "Token is not valid"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Edge Cases to Test:**
- Missing Authorization header
- Malformed token
- Expired token
- Token with invalid signature
- Token from deleted admin

---

## Project Endpoints

### 4. Get All Projects (GET /api/projects)

**Purpose:** Retrieve all projects sorted by order and creation date

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "E-Commerce Platform",
      "description": "Full-featured online store with inventory management",
      "imageUrl": "https://example.com/project1.jpg",
      "tags": ["React", "Node.js", "MongoDB", "Stripe"],
      "projectUrl": "https://example.com",
      "featured": true,
      "order": 1,
      "createdAt": "2025-01-10T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/projects
```

**Edge Cases to Test:**
- Empty database
- Large number of projects
- Projects with missing optional fields
- Projects with special characters in title/description

---

### 5. Get Featured Projects (GET /api/projects/featured)

**Purpose:** Retrieve only featured projects

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Featured Project",
      "description": "A highlighted project",
      "imageUrl": "https://example.com/featured.jpg",
      "tags": ["React", "TypeScript"],
      "projectUrl": "https://example.com",
      "featured": true,
      "order": 1,
      "createdAt": "2025-01-10T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/projects/featured
```

**Edge Cases to Test:**
- No featured projects
- All projects are featured
- Featured status changes

---

### 6. Get Single Project (GET /api/projects/:id)

**Purpose:** Retrieve a specific project by ID

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Project Title",
    "description": "Project description",
    "imageUrl": "https://example.com/project.jpg",
    "tags": ["React", "Node.js"],
    "projectUrl": "https://example.com",
    "featured": true,
    "order": 1,
    "createdAt": "2025-01-10T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

*404 - Project Not Found*
```json
{
  "success": false,
  "message": "Project not found"
}
```

**cURL Example:**
```bash
PROJECT_ID="507f1f77bcf86cd799439011"
curl -X GET http://localhost:5000/api/projects/$PROJECT_ID
```

**Edge Cases to Test:**
- Invalid MongoDB ObjectId format
- Valid ObjectId but non-existent project
- Deleted project

---

### 7. Create Project (POST /api/projects)

**Purpose:** Create a new project (Admin only)

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Project",
  "description": "A detailed description of the project",
  "imageUrl": "https://example.com/image.jpg",
  "tags": ["React", "Node.js", "MongoDB"],
  "projectUrl": "https://project-site.com",
  "featured": true,
  "order": 1
}
```

**Required Fields:** `title`, `description`

**Optional Fields:** `imageUrl`, `tags` (default: []), `projectUrl`, `featured` (default: false), `order` (default: 0)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "New Project",
    "description": "A detailed description of the project",
    "imageUrl": "https://example.com/image.jpg",
    "tags": ["React", "Node.js", "MongoDB"],
    "projectUrl": "https://project-site.com",
    "featured": true,
    "order": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

*400 - Missing Required Fields*
```json
{
  "success": false,
  "message": "Please provide title and description"
}
```

*401 - Unauthorized*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Project",
    "description": "A detailed description",
    "imageUrl": "https://example.com/image.jpg",
    "tags": ["React", "Node.js"],
    "featured": true,
    "order": 1
  }'
```

**Edge Cases to Test:**
- Missing title
- Missing description
- Empty title or description
- Very long title (>500 chars)
- Very long description (>5000 chars)
- Invalid URL formats
- XSS attempts in title/description
- HTML tags in fields
- Empty tags array
- Tags with special characters
- Negative order values
- Non-boolean featured value

---

### 8. Update Project (PUT /api/projects/:id)

**Purpose:** Update an existing project (Admin only)

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Project Title",
  "description": "Updated description",
  "imageUrl": "https://example.com/new-image.jpg",
  "tags": ["React", "TypeScript", "Node.js"],
  "projectUrl": "https://updated-site.com",
  "featured": false,
  "order": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Updated Project Title",
    "description": "Updated description",
    "imageUrl": "https://example.com/new-image.jpg",
    "tags": ["React", "TypeScript", "Node.js"],
    "projectUrl": "https://updated-site.com",
    "featured": false,
    "order": 2,
    "createdAt": "2025-01-10T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**

*404 - Project Not Found*
```json
{
  "success": false,
  "message": "Project not found"
}
```

*401 - Unauthorized*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
PROJECT_ID="507f1f77bcf86cd799439011"
curl -X PUT http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "featured": false
  }'
```

**Edge Cases to Test:**
- Invalid project ID
- Non-existent project
- Partial updates (only some fields)
- Removing optional fields (set to null/undefined)
- Validation errors
- Concurrent updates

---

### 9. Delete Project (DELETE /api/projects/:id)

**Purpose:** Delete a project (Admin only)

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses:**

*404 - Project Not Found*
```json
{
  "success": false,
  "message": "Project not found"
}
```

*401 - Unauthorized*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
PROJECT_ID="507f1f77bcf86cd799439011"
curl -X DELETE http://localhost:5000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Edge Cases to Test:**
- Invalid project ID
- Non-existent project
- Delete already deleted project
- Delete without authorization

---

## Contact Endpoints

### 10. Submit Contact Form (POST /api/contact)

**Purpose:** Submit a contact form message

**Authentication:** None (Public)

**Rate Limiting:** 10 requests per hour per IP (stricter than general limit)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I would like to discuss a project with you.",
  "honeypot": ""
}
```

**Required Fields:** `name`, `email`, `message`

**Honeypot Field:** `honeypot` (should be empty, used for spam protection)

**Validation:**
- Message must be at least 10 characters long

**Success Response (201):**
```json
{
  "success": true,
  "message": "Thank you for your message! We will get back to you soon.",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

*400 - Missing Fields*
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

*400 - Message Too Short*
```json
{
  "success": false,
  "message": "Message must be at least 10 characters long"
}
```

*429 - Rate Limit Exceeded*
```json
{
  "success": false,
  "message": "Too many contact form submissions from this IP, please try again later."
}
```

**Special Case - Honeypot Triggered (201):**
```json
{
  "success": true,
  "message": "Thank you for your message! We will get back to you soon."
}
```
*Note: Returns success but doesn't save to database*

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to discuss a project with you.",
    "honeypot": ""
  }'
```

**Edge Cases to Test:**
- Missing name, email, or message
- Invalid email format
- Message less than 10 characters
- Message with only whitespace
- Very long message (>10000 chars)
- Very long name (>200 chars)
- Honeypot field filled (spam bot test)
- XSS attempts in message
- HTML tags in message
- Special characters in name
- Rate limit exceeded (11th request in an hour)
- Concurrent submissions from same IP

---

### 11. Get All Contact Submissions (GET /api/contact)

**Purpose:** Retrieve all contact form submissions (Admin only)

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I would like to discuss a project.",
      "status": "new",
      "notes": "",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

*401 - Unauthorized*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:5000/api/contact \
  -H "Authorization: Bearer $TOKEN"
```

**Edge Cases to Test:**
- Empty contact list
- Large number of contacts
- Unauthorized access
- Invalid token

---

### 12. Update Contact Status (PATCH /api/contact/:id)

**Purpose:** Update contact submission status and notes (Admin only)

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "responded",
  "notes": "Sent quote via email on 2025-01-15"
}
```

**Allowed Status Values:** `new`, `read`, `responded`, `archived`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to discuss a project.",
    "status": "responded",
    "notes": "Sent quote via email on 2025-01-15",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

*404 - Contact Not Found*
```json
{
  "success": false,
  "message": "Contact not found"
}
```

*401 - Unauthorized*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
CONTACT_ID="507f1f77bcf86cd799439013"
curl -X PATCH http://localhost:5000/api/contact/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "responded",
    "notes": "Sent quote via email"
  }'
```

**Edge Cases to Test:**
- Invalid contact ID
- Invalid status value
- Empty notes
- Very long notes (>1000 chars)
- Update only status (no notes)
- Update only notes (no status)
- Unauthorized access

---

### 13. Delete Contact (DELETE /api/contact/:id)

**Purpose:** Delete a contact submission (Admin only)

**Authentication:** Required (Bearer token)

**Rate Limiting:** General API limit (100/15min)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

**Error Responses:**

*404 - Contact Not Found*
```json
{
  "success": false,
  "message": "Contact not found"
}
```

*401 - Unauthorized*
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**cURL Example:**
```bash
TOKEN="your_jwt_token_here"
CONTACT_ID="507f1f77bcf86cd799439013"
curl -X DELETE http://localhost:5000/api/contact/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Edge Cases to Test:**
- Invalid contact ID
- Non-existent contact
- Delete already deleted contact
- Unauthorized access

---

## SEO Endpoints

### 14. Get Sitemap (GET /sitemap.xml)

**Purpose:** Generate dynamic XML sitemap for SEO

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Success Response (200):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <!-- Main Pages -->
    <url>
        <loc>https://frozenshield.ca</loc>
        <lastmod>2025-01-15</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <!-- More URLs... -->
</urlset>
```

**Response Headers:**
```
Content-Type: application/xml
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/sitemap.xml
```

**Edge Cases to Test:**
- No projects in database
- Projects with missing images
- Projects with special characters in title
- Very large number of projects
- Database connection error

---

### 15. Get Structured Data (GET /structured-data.json)

**Purpose:** Generate JSON-LD structured data for SEO

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Success Response (200):**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://frozenshield.ca/#organization",
      "name": "Frozen Shield Studio",
      "url": "https://frozenshield.ca",
      "logo": "https://frozenshield.ca/logo.png",
      "description": "Expert web development and custom applications for businesses in Canada's remote territories",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Yellowknife",
        "addressRegion": "NT",
        "addressCountry": "CA"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "62.454211",
        "longitude": "-114.371788"
      },
      "email": "hello@frozenshield.ca"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/structured-data.json
```

**Edge Cases to Test:**
- No featured projects
- Projects without tags
- Database connection error
- Missing project URLs

---

## Health Check Endpoint

### 16. Health Check (GET /api/health)

**Purpose:** Check server status and uptime

**Authentication:** None (Public)

**Rate Limiting:** General API limit (100/15min)

**Success Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/health
```

**Edge Cases to Test:**
- Server under heavy load
- Database connection issues
- Long uptime values

---

## Error Cases & Edge Cases

### General Error Scenarios

#### 1. Invalid JSON Payload
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d 'invalid json{'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Invalid JSON"
}
```

#### 2. Missing Content-Type Header
**Test:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Test"}'
```

**Expected:** May fail to parse body correctly

#### 3. Method Not Allowed
**Test:**
```bash
curl -X DELETE http://localhost:5000/api/health
```

**Expected Response (404/405):**
Route not found or method not allowed

#### 4. Large Payload Attack
**Test:**
```bash
# Generate very large payload (>10MB)
python -c "print('{\"message\": \"' + 'A'*10000000 + '\"}')" | \
  curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d @-
```

**Expected:** Request should be rejected (need to verify body size limits)

#### 5. SQL Injection Attempts
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin\" OR \"1\"=\"1",
    "password": "anything"
  }'
```

**Expected:** Should not be vulnerable (MongoDB is NoSQL)

#### 6. NoSQL Injection Attempts
**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": {"$ne": null},
    "password": {"$ne": null}
  }'
```

**Expected:** Should properly validate input types

#### 7. XSS Attack Attempts
**Test:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "email": "test@example.com",
    "message": "Test message with <img src=x onerror=alert(1)>"
  }'
```

**Expected:** Should sanitize or escape HTML

#### 8. CORS Violations
**Test:**
```bash
# From different origin
curl -X GET http://localhost:5000/api/projects \
  -H "Origin: https://malicious-site.com"
```

**Expected:** CORS headers should be properly configured

#### 9. Token Manipulation
**Test:**
```bash
# Expired token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImV4cCI6MTYwMDAwMDAwMH0.signature"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Token is not valid"
}
```

#### 10. Unicode and Special Characters
**Test:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "José García 日本語",
    "email": "test@example.com",
    "message": "Testing unicode: 你好世界 🚀"
  }'
```

**Expected:** Should handle Unicode properly

---

## Rate Limiting Tests

### 1. General API Rate Limit
**Limit:** 100 requests per 15 minutes per IP

**Test Script:**
```bash
# Make 101 requests rapidly
for i in {1..101}; do
  curl -X GET http://localhost:5000/api/projects
  echo "Request $i"
done
```

**Expected:** 101st request should return 429 error

### 2. Contact Form Rate Limit
**Limit:** 10 requests per hour per IP

**Test Script:**
```bash
# Make 11 contact submissions
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/contact \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test User $i\",
      \"email\": \"test$i@example.com\",
      \"message\": \"This is test message number $i\"
    }"
  echo "Request $i"
done
```

**Expected:** 11th request should return 429 error with contact-specific message

### 3. Rate Limit Reset
**Test:**
1. Hit rate limit
2. Wait 15 minutes (or 1 hour for contact)
3. Try again

**Expected:** Should allow requests after window expires

---

## Security Tests

### 1. Authentication Bypass Attempts

#### Attempt 1: Missing Authorization Header
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "Hack", "description": "Test"}'
```

**Expected:** 401 Unauthorized

#### Attempt 2: Invalid Token Format
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: InvalidToken" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hack", "description": "Test"}'
```

**Expected:** 401 Unauthorized

#### Attempt 3: Bearer Token Without "Bearer" Prefix
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hack", "description": "Test"}'
```

**Expected:** 401 Unauthorized

### 2. Password Security

#### Test: Weak Password Acceptance
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "weakadmin",
    "email": "weak@example.com",
    "password": "123"
  }'
```

**Note:** Should implement password strength validation

### 3. Email Validation

#### Test: Invalid Email Format
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "not-an-email",
    "message": "Testing invalid email"
  }'
```

**Expected:** Should validate email format

### 4. HTTPS Enforcement

**Test:** Access via HTTP in production

**Expected:** Should redirect to HTTPS

### 5. Helmet Security Headers

**Test:**
```bash
curl -I http://localhost:5000/api/health
```

**Expected Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

---

## Testing Checklist

### Authentication
- [ ] Register first admin successfully
- [ ] Prevent second admin registration
- [ ] Login with username
- [ ] Login with email
- [ ] Login fails with wrong password
- [ ] Get current admin with valid token
- [ ] Get current admin fails with invalid token
- [ ] Token expires after 30 days

### Projects
- [ ] Get all projects (empty list)
- [ ] Get all projects (with data)
- [ ] Get featured projects only
- [ ] Get single project by ID
- [ ] Get project with invalid ID
- [ ] Create project with auth
- [ ] Create project without auth fails
- [ ] Create project missing required fields
- [ ] Update project with auth
- [ ] Update project without auth fails
- [ ] Delete project with auth
- [ ] Delete project without auth fails

### Contact
- [ ] Submit valid contact form
- [ ] Submit fails with missing fields
- [ ] Submit fails with short message
- [ ] Honeypot field prevents spam
- [ ] Rate limit at 10 submissions/hour
- [ ] Get contacts with auth
- [ ] Get contacts without auth fails
- [ ] Update contact status with auth
- [ ] Update contact without auth fails
- [ ] Delete contact with auth
- [ ] Delete contact without auth fails

### SEO
- [ ] Generate sitemap with projects
- [ ] Generate sitemap without projects
- [ ] Generate structured data with projects
- [ ] Generate structured data without projects

### Rate Limiting
- [ ] General API limit (100/15min)
- [ ] Contact form limit (10/hour)
- [ ] Rate limit resets after window

### Security
- [ ] XSS attempts sanitized
- [ ] NoSQL injection prevented
- [ ] Invalid tokens rejected
- [ ] CORS properly configured
- [ ] Helmet headers present
- [ ] Password hashing verified

---

## Notes for Developers

### Known Issues
1. **Email Validation:** Contact form accepts invalid email formats (needs validation)
2. **Password Strength:** No minimum password requirements enforced
3. **Body Size Limits:** No explicit max body size limit configured
4. **Email Notifications:** Contact form TODO comment indicates emails not implemented

### Recommended Improvements
1. Add email format validation
2. Implement password strength requirements
3. Add body size limits (e.g., 1MB max)
4. Implement email notifications for contact forms
5. Add request logging for security monitoring
6. Add integration tests
7. Add automated test suite
8. Implement API versioning
9. Add pagination for list endpoints
10. Add filtering and sorting options for list endpoints

---

## Test Environment Setup

### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start MongoDB (local or Docker)
docker run -d -p 27017:27017 mongo

# Start the server
npm start
```

### Quick Test Commands

#### 1. Get a token
```bash
# Register admin (first time only)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@frozenshield.ca",
    "password": "SecurePassword123!"
  }' | jq -r '.token' > token.txt

# Or login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }' | jq -r '.token' > token.txt

# Set token variable
TOKEN=$(cat token.txt)
```

#### 2. Run all basic tests
```bash
# See manual-tests.sh script
./tests/manual-tests.sh
```

---

**Last Updated:** 2025-01-15
**API Version:** 1.0
**Author:** FrozenShield Testing Team
