# API Testing Quick Reference Guide

Quick reference for testing FrozenShield API endpoints. For full documentation, see `api-test-plan.md`.

## Setup

```bash
# Set base URL (default: http://localhost:5000)
export BASE_URL="http://localhost:5000"
export API_URL="$BASE_URL/api"

# Start server
npm start

# Run automated tests (Windows)
tests\manual-tests.bat

# Run automated tests (Linux/Mac)
chmod +x tests/manual-tests.sh
./tests/manual-tests.sh
```

---

## Quick Test Commands

### Get a Token (First Time)

```bash
# Register admin (only works if no admin exists)
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@frozenshield.ca",
    "password": "SecurePassword123!"
  }' | jq -r '.token' > token.txt

# Or login if admin exists
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!"
  }' | jq -r '.token' > token.txt

# Set token variable
export TOKEN=$(cat token.txt)
```

### Authentication

```bash
# Login
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SecurePassword123!"}'

# Get current admin
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Projects

```bash
# Get all projects
curl -X GET $API_URL/projects

# Get featured projects
curl -X GET $API_URL/projects/featured

# Get single project
curl -X GET $API_URL/projects/{PROJECT_ID}

# Create project (requires auth)
curl -X POST $API_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Project",
    "description": "Project description",
    "tags": ["React", "Node.js"],
    "featured": true
  }'

# Update project (requires auth)
curl -X PUT $API_URL/projects/{PROJECT_ID} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete project (requires auth)
curl -X DELETE $API_URL/projects/{PROJECT_ID} \
  -H "Authorization: Bearer $TOKEN"
```

### Contact

```bash
# Submit contact form
curl -X POST $API_URL/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, I would like to work with you!",
    "honeypot": ""
  }'

# Get all contacts (requires auth)
curl -X GET $API_URL/contact \
  -H "Authorization: Bearer $TOKEN"

# Update contact status (requires auth)
curl -X PATCH $API_URL/contact/{CONTACT_ID} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"responded","notes":"Replied via email"}'

# Delete contact (requires auth)
curl -X DELETE $API_URL/contact/{CONTACT_ID} \
  -H "Authorization: Bearer $TOKEN"
```

### SEO

```bash
# Get sitemap
curl -X GET $BASE_URL/sitemap.xml

# Get structured data
curl -X GET $BASE_URL/structured-data.json
```

### Health Check

```bash
# Check server health
curl -X GET $API_URL/health
```

---

## Common Test Scenarios

### Test Authentication Flow

```bash
# 1. Register admin
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@test.com","password":"Test123!"}'

# 2. Login
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Test123!"}'

# 3. Get current admin (save token from step 2)
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Complete Project Lifecycle

```bash
# 1. Create project
PROJECT_RESPONSE=$(curl -s -X POST $API_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Project","description":"Testing lifecycle"}')

# 2. Extract project ID
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data._id')

# 3. Get the project
curl -X GET $API_URL/projects/$PROJECT_ID

# 4. Update the project
curl -X PUT $API_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Project"}'

# 5. Delete the project
curl -X DELETE $API_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Test Contact Form and Admin Review

```bash
# 1. Submit contact form
CONTACT_RESPONSE=$(curl -s -X POST $API_URL/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "message":"This is a test message for review",
    "honeypot":""
  }')

# 2. Extract contact ID
CONTACT_ID=$(echo $CONTACT_RESPONSE | jq -r '.data.id')

# 3. Admin retrieves all contacts
curl -X GET $API_URL/contact \
  -H "Authorization: Bearer $TOKEN"

# 4. Admin updates status
curl -X PATCH $API_URL/contact/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"responded","notes":"Sent response"}'

# 5. Admin deletes contact
curl -X DELETE $API_URL/contact/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Testing

### Test Validation Errors

```bash
# Missing required fields
curl -X POST $API_URL/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'
# Expected: 400 - Missing required fields

# Message too short
curl -X POST $API_URL/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","message":"Hi"}'
# Expected: 400 - Message too short

# Missing auth token
curl -X POST $API_URL/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test"}'
# Expected: 401 - No token

# Invalid token
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 - Invalid token

# Wrong password
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}'
# Expected: 401 - Invalid credentials

# Invalid project ID
curl -X GET $API_URL/projects/invalid-id
# Expected: 404 or 500
```

### Test Rate Limiting

```bash
# Test contact form rate limit (10/hour)
for i in {1..11}; do
  echo "Request $i"
  curl -X POST $API_URL/contact \
    -H "Content-Type: application/json" \
    -d "{
      \"name\":\"Test $i\",
      \"email\":\"test$i@example.com\",
      \"message\":\"This is test message number $i with enough length\"
    }"
done
# Expected: 11th request returns 429

# Test general API rate limit (100/15min)
for i in {1..101}; do
  curl -s $API_URL/health > /dev/null
  echo "Request $i"
done
# Expected: 101st request returns 429
```

### Test Security

```bash
# XSS attempt
curl -X POST $API_URL/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"<script>alert(\"XSS\")</script>",
    "email":"test@example.com",
    "message":"Test <img src=x onerror=alert(1)>"
  }'
# Should accept but sanitize HTML

# SQL injection attempt
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin\" OR \"1\"=\"1","password":"anything"}'
# Expected: 401 - Should not be vulnerable

# NoSQL injection attempt
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":{"$ne":null},"password":{"$ne":null}}'
# Should be sanitized and rejected
```

---

## Response Status Codes

| Code | Meaning | Common Scenarios |
|------|---------|------------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (create) |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Admin registration disabled |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |

---

## Response Format

All responses follow this format:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": {}  // Optional, contains response data
}
```

Examples:

**Success:**
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

**Error:**
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

---

## Using jq for JSON Parsing

```bash
# Install jq (if not installed)
# Windows: choco install jq
# Mac: brew install jq
# Linux: apt-get install jq

# Extract token
curl -s $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Test123!"}' | jq -r '.token'

# Pretty print response
curl -s $API_URL/projects | jq '.'

# Extract specific fields
curl -s $API_URL/projects | jq '.data[].title'

# Count items
curl -s $API_URL/projects | jq '.data | length'

# Filter featured projects
curl -s $API_URL/projects | jq '.data[] | select(.featured == true)'
```

---

## Windows PowerShell Alternative

```powershell
# Set variables
$BaseUrl = "http://localhost:5000"
$ApiUrl = "$BaseUrl/api"

# Login and get token
$loginBody = @{
    username = "admin"
    password = "SecurePassword123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

# Use token in subsequent requests
$headers = @{
    Authorization = "Bearer $token"
}

# Get all projects
Invoke-RestMethod -Uri "$ApiUrl/projects" -Method Get

# Create project
$projectBody = @{
    title = "New Project"
    description = "Created from PowerShell"
    featured = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$ApiUrl/projects" -Method Post -Headers $headers -Body $projectBody -ContentType "application/json"
```

---

## Troubleshooting

### Server not responding
```bash
# Check if server is running
curl $API_URL/health

# Check server logs
npm start

# Verify MongoDB is running
# Check MongoDB connection in .env file
```

### Authentication issues
```bash
# Verify token is valid
echo $TOKEN

# Check token expiration (decode JWT)
# Use online tool: https://jwt.io

# Re-login to get new token
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword"}'
```

### Rate limit errors
```bash
# Wait for rate limit window to reset
# General API: 15 minutes
# Contact form: 1 hour

# Or restart server to reset (development only)
```

---

## Environment Variables

Required in `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/frozenshield
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=development
```

---

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# API testing aliases
alias fs-health='curl http://localhost:5000/api/health'
alias fs-login='curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"SecurePassword123!\"}" | jq -r ".token"'
alias fs-projects='curl http://localhost:5000/api/projects | jq'
alias fs-test='./tests/manual-tests.sh'
```

---

**For complete documentation, see:**
- `api-test-plan.md` - Full API documentation with all endpoints
- `api-issues-and-recommendations.md` - Security issues and recommendations
- `manual-tests.sh` - Automated test script (Linux/Mac)
- `manual-tests.bat` - Automated test script (Windows)
