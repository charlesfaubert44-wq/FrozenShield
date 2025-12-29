# Security Guide - FrozenShield

Quick reference for security best practices and deployment guidelines.

## Quick Start Security Checklist

### Before First Run

1. **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your generated JWT_SECRET:**
   ```bash
   JWT_SECRET=your_generated_secret_here
   ```

### Before Production Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT_SECRET (128 chars)
- [ ] Enable HTTPS via reverse proxy
- [ ] Configure CORS for production domain only
- [ ] Enable MongoDB authentication
- [ ] Review all environment variables
- [ ] Complete deployment checklist in `docs/security-audit.md`

## Security Features

### ✅ Implemented
- JWT-based authentication with 30-day expiration
- Bcrypt password hashing (10 rounds)
- Helmet security headers
- Rate limiting (100 req/15min API, 10 req/hour contact form)
- Input validation via Mongoose schemas
- MongoDB injection prevention
- XSS protection (XML escaping, limited innerHTML)
- CORS enabled
- Graceful error handling (no stack traces in production)
- Request body size limits (10MB)
- Honeypot spam protection
- Admin registration auto-disabled after first user

### ⚠️ Recommended Before Production
- Content Security Policy (CSP)
- Stricter CORS configuration
- HTTPS enforcement
- Enhanced password requirements (12+ chars, complexity)
- Login rate limiting (5 attempts/15min)
- Security event logging

## Documentation

- **Full Security Audit:** `docs/security-audit.md`
- **Applied Fixes:** `docs/security-fixes-applied.md`
- **Environment Setup:** `.env.example`

## Reporting Security Issues

If you discover a security vulnerability, please email:
- **Security Contact:** security@frozenshield.ca
- **Response Time:** Within 24 hours
- **Policy:** Responsible disclosure

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security](https://nodejs.org/en/security/)

---

**Last Updated:** December 27, 2025
**Security Rating:** B+ (Good)
