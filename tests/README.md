# FrozenShield API Testing Documentation

Comprehensive testing documentation and tools for the FrozenShield Portfolio Website API.

## Overview

This directory contains complete API testing documentation, automated test scripts, issue reports, and quick reference guides for testing all endpoints in the FrozenShield application.

## Files in This Directory

### 1. `api-test-plan.md` (Main Documentation)
**Purpose:** Complete API testing documentation

**Contents:**
- All 16 API endpoints documented in detail
- Request/response formats for each endpoint
- cURL examples for every endpoint
- Expected success and error responses
- Authentication requirements
- Rate limiting details
- Security testing scenarios
- Edge cases and validation tests
- Comprehensive testing checklist

**Use When:** You need detailed information about any API endpoint, including exact request formats and expected responses.

---

### 2. `manual-tests.sh` (Linux/Mac Test Script)
**Purpose:** Automated test execution script for Unix-based systems

**Features:**
- Tests all major API endpoints
- Color-coded pass/fail output
- Automatic token management
- Edge case testing
- Rate limiting tests (optional)
- Test result summary with pass rate

**Usage:**
```bash
# Make executable
chmod +x manual-tests.sh

# Run tests
./manual-tests.sh

# Run with custom URL
./manual-tests.sh http://production-url.com
```

---

### 3. `manual-tests.bat` (Windows Test Script)
**Purpose:** Automated test execution script for Windows

**Features:**
- Same functionality as `.sh` version
- Windows-compatible commands
- PowerShell-based colored output
- Works on Windows 10+ (curl included)

**Usage:**
```cmd
REM Run tests
manual-tests.bat

REM Run with custom URL
manual-tests.bat http://production-url.com
```

---

### 4. `api-issues-and-recommendations.md` (Issues Report)
**Purpose:** Comprehensive security audit and improvement recommendations

**Contents:**
- 30+ identified issues categorized by severity
- Critical security vulnerabilities
- Missing validations and edge cases
- Performance recommendations
- Code examples for fixes
- Implementation priority guide
- Estimated time to fix each issue

**Severity Levels:**
- **Critical:** Must fix before production (7 issues)
- **Medium:** Fix within 1 week (8 issues)
- **Low:** Future enhancements (15+ recommendations)

**Use When:** Planning security improvements or conducting code review.

---

### 5. `quick-reference.md` (Quick Reference Guide)
**Purpose:** Fast reference for common testing scenarios

**Contents:**
- Quick setup instructions
- Common test commands
- Authentication flow examples
- Complete workflow scenarios
- Error testing examples
- Response status codes reference
- Troubleshooting guide
- PowerShell alternatives for Windows
- Useful bash aliases

**Use When:** You need a quick command for testing a specific endpoint without reading full documentation.

---

### 6. `README.md` (This File)
**Purpose:** Overview and navigation guide for all testing documentation

---

## Quick Start

### For First-Time Testing

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Run automated tests:**
   ```bash
   # Windows
   tests\manual-tests.bat

   # Linux/Mac
   chmod +x tests/manual-tests.sh
   ./tests/manual-tests.sh
   ```

3. **Review results:**
   - Check console output for pass/fail status
   - Review any failures in detail
   - Refer to `api-test-plan.md` for endpoint details

### For Manual Testing

1. **Get authentication token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"YourPassword"}' \
     | jq -r '.token'
   ```

2. **Use token in subsequent requests:**
   ```bash
   TOKEN="your_token_here"
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Refer to `quick-reference.md` for common commands**

---

## Testing Workflow

### Development Testing
```
1. Make code changes
2. Run automated tests: ./manual-tests.sh
3. Fix any failures
4. Test specific endpoints manually if needed
5. Commit changes
```

### Pre-Production Testing
```
1. Review api-issues-and-recommendations.md
2. Address all CRITICAL issues
3. Address HIGH priority issues
4. Run full test suite
5. Perform security testing
6. Test rate limiting
7. Load testing (optional)
```

### Production Testing
```
1. Run automated tests against production URL
2. Monitor for rate limit errors
3. Check SSL/TLS configuration
4. Verify CORS settings
5. Test from different IPs/regions
```

---

## API Endpoints Summary

### Public Endpoints (No Authentication Required)
- `GET /api/health` - Health check
- `GET /api/projects` - Get all projects
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/:id` - Get single project
- `POST /api/contact` - Submit contact form
- `POST /api/auth/login` - Login admin
- `POST /api/auth/register` - Register first admin (restricted)
- `GET /sitemap.xml` - Get sitemap
- `GET /structured-data.json` - Get structured data

### Protected Endpoints (Authentication Required)
- `GET /api/auth/me` - Get current admin
- `GET /api/contact` - Get all contacts
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PATCH /api/contact/:id` - Update contact status
- `DELETE /api/contact/:id` - Delete contact

---

## Rate Limits

- **General API:** 100 requests per 15 minutes per IP
- **Contact Form:** 10 requests per hour per IP
- **Recommended Auth Limit:** 5 login attempts per 15 minutes (not yet implemented)

---

## Common Issues and Solutions

### Issue: "Too many requests" error
**Solution:** Wait for rate limit window to reset (15 min or 1 hour)

### Issue: "No token, authorization denied"
**Solution:** Include `Authorization: Bearer <token>` header

### Issue: "Invalid credentials"
**Solution:** Check username/password, verify admin exists in database

### Issue: "Project not found"
**Solution:** Verify project ID is valid MongoDB ObjectId

### Issue: Server not responding
**Solution:**
1. Check if server is running (`npm start`)
2. Verify MongoDB is running
3. Check `.env` configuration

---

## Critical Security Issues to Fix

Before deploying to production, address these issues from `api-issues-and-recommendations.md`:

1. **Password Strength Validation** - No minimum requirements enforced
2. **Email Format Validation** - Accepts invalid email formats
3. **Request Body Size Limits** - No protection against large payloads
4. **NoSQL Injection Protection** - Missing input sanitization
5. **XSS Protection** - No HTML sanitization on user input
6. **JWT Secret Hardcoded** - Fallback secret in code
7. **CORS Configuration** - Allows all origins

**Estimated time to fix:** 4-6 hours

See `api-issues-and-recommendations.md` for detailed fixes and code examples.

---

## Test Coverage

### Currently Tested
✅ All endpoint functionality
✅ Authentication and authorization
✅ Request validation
✅ Error responses
✅ Rate limiting
✅ Basic security (XSS, SQL injection attempts)
✅ Edge cases (invalid IDs, missing fields, etc.)

### Not Yet Tested
❌ Automated unit tests
❌ Automated integration tests
❌ Load/stress testing
❌ Database connection failure scenarios
❌ Concurrent request handling
❌ Token expiration scenarios
❌ Email notification functionality

---

## Recommended Testing Tools

### Command Line
- **curl** - HTTP requests (included in Windows 10+, macOS, Linux)
- **jq** - JSON parsing and formatting
- **artillery** - Load testing
- **httpie** - User-friendly HTTP client

### GUI Tools
- **Postman** - API testing with GUI
- **Insomnia** - REST API client
- **Thunder Client** - VS Code extension

### Development Tools
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion library
- **MongoDB Memory Server** - In-memory MongoDB for tests

---

## Performance Benchmarks

Expected response times (development environment):

- Health check: < 50ms
- Get all projects: < 100ms
- Get single project: < 50ms
- Create project: < 200ms
- Contact form submission: < 150ms
- Authentication: < 300ms (due to bcrypt hashing)

**Note:** Times may vary based on database size and server specifications.

---

## Environment Variables Required

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/frozenshield
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=development
```

Optional for email notifications:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
NOTIFICATION_EMAIL=admin@frozenshield.ca
```

---

## Contributing to Tests

### Adding New Tests to Automated Scripts

1. **Edit the test script** (`manual-tests.sh` or `manual-tests.bat`)
2. **Add new test function** following existing pattern
3. **Update test count** variables
4. **Add to summary** section
5. **Test the test** - run and verify it works

### Adding New Documentation

1. **Update `api-test-plan.md`** with new endpoint details
2. **Add to `quick-reference.md`** if commonly used
3. **Update this README** with new file information
4. **Cross-reference** between documents

---

## Resources

### Internal Documentation
- `/server/routes/` - Route implementation files
- `/server/models/` - Database schema definitions
- `/server/middleware/auth.js` - Authentication middleware
- `package.json` - Dependencies and scripts

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/) - JWT decoder and validator
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

## Support

For questions or issues:
1. Check `api-test-plan.md` for endpoint documentation
2. Review `api-issues-and-recommendations.md` for known issues
3. Consult `quick-reference.md` for common scenarios
4. Review server logs for error details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial comprehensive test documentation |

---

## License

This testing documentation is part of the FrozenShield project.

---

**Next Steps:**
1. Run automated tests to establish baseline
2. Review and address critical security issues
3. Implement recommended improvements
4. Set up automated testing pipeline
5. Configure monitoring and logging
