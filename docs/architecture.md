# System Architecture

## Overview

FrozenShield is a modern fullstack portfolio website built with a three-tier architecture: presentation layer (frontend), application layer (backend API), and data layer (MongoDB database). The system follows RESTful API design principles with JWT-based authentication for admin operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Public Site  │  │ Admin Panel  │  │  Contact     │      │
│  │ (index.html) │  │ (dashboard)  │  │  Form        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │         HTTPS/REST API              │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────┐
│         │        Application Layer (Express)  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────▼──────┐      │
│  │   Public     │  │     Auth     │  │   Contact    │      │
│  │   Routes     │  │  Middleware  │  │   Routes     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Project    │  │     SEO      │  │   Health     │      │
│  │   Routes     │  │   Routes     │  │   Check      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
          │    MongoDB Connection (Mongoose ODM)
          │                  │
┌─────────▼──────────────────▼─────────────────────────────────┐
│                      Data Layer (MongoDB)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admins     │  │   Projects   │  │   Contacts   │      │
│  │  Collection  │  │  Collection  │  │  Collection  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Public Site)

**Location**: `/public/`

**Technologies**:
- HTML5 with semantic markup
- CSS3 with CSS variables for theming
- Vanilla JavaScript (ES6+)

**Key Files**:
- `index.html` - Main portfolio page with SEO meta tags
- `styles.css` - Responsive styling with mobile-first design
- `script.js` - Dynamic content loading, animations, form handling

**Features**:
- Responsive design (mobile, tablet, desktop breakpoints)
- Smooth scrolling navigation
- Intersection Observer API for scroll animations
- Dynamic project loading from API
- Client-side form validation
- Automatic SEO updates via structured data

### 2. Admin Panel

**Location**: `/public/admin/`

**Key Files**:
- `login.html` - JWT-based authentication
- `dashboard.html` - Admin content management interface
- `admin.css` - Admin panel styling
- `admin.js` - Admin logic, API calls, JWT management

**Features**:
- Secure login with JWT tokens (30-day expiration)
- Project CRUD operations
- Contact submission management
- Real-time updates
- Session persistence with localStorage
- Automatic token refresh

### 3. Backend API

**Location**: `/server/`

**Framework**: Express.js (v4.18.2)

**Key Components**:

#### Server Core (`server.js`)
- Express application setup
- Middleware configuration
- Route mounting
- Graceful shutdown handling
- Network interface detection

#### Database Configuration (`config/db.js`)
- MongoDB connection with Mongoose ODM
- Automatic reconnection with exponential backoff
- Retry logic (5 attempts)
- Fallback mode for development

#### Models
- `Admin.js` - Admin user schema with bcrypt password hashing
- `Project.js` - Portfolio project schema with validation
- `Contact.js` - Contact form submission schema

#### Routes

**Public Routes** (`routes/`):
- `/api/projects` - Project retrieval (GET)
- `/api/contact` - Contact form submission (POST)
- `/api/health` - Health check endpoint

**Protected Routes** (require JWT):
- `/api/auth` - Authentication (login, register, me)
- `/api/projects` - Project management (POST, PUT, DELETE)
- `/api/contact` - Contact management (GET, PATCH, DELETE)

**SEO Routes** (`routes/seo.js`):
- `/sitemap.xml` - Dynamic XML sitemap generation
- `/structured-data.json` - JSON-LD structured data
- `/robots.txt` - Search engine crawler instructions

#### Middleware
- `auth.js` - JWT token verification
- Rate limiting (express-rate-limit)
- Security headers (Helmet.js)
- CORS configuration

### 4. Data Layer

**Database**: MongoDB (v6.20.0)
**ODM**: Mongoose (v8.0.3)

**Collections**:

#### Admins
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed with bcrypt),
  createdAt: Date
}
```

#### Projects
```javascript
{
  title: String (required),
  description: String (required),
  image: String (URL),
  tags: [String],
  link: String (URL),
  featured: Boolean (default: false),
  order: Number (for manual sorting),
  createdAt: Date,
  updatedAt: Date
}
```

#### Contacts
```javascript
{
  name: String (required),
  email: String (required, validated),
  message: String (required),
  status: String (enum: new, read, archived),
  notes: String,
  ip: String (for spam tracking),
  createdAt: Date
}
```

## Security Architecture

### Authentication & Authorization

**JWT Token Flow**:
1. Admin logs in with username/email and password
2. Server validates credentials against hashed password
3. JWT token generated with admin ID and 30-day expiration
4. Token stored in client localStorage
5. Token sent in Authorization header for protected routes
6. Middleware validates token on each request

**Password Security**:
- Bcrypt hashing with salt rounds (10)
- Passwords never stored in plain text
- Automatic hashing on user creation/update

### Rate Limiting

**Global Limits**:
- 100 requests per 15 minutes per IP address
- Applied to all `/api/*` routes

**Contact Form Limits**:
- 10 submissions per hour per IP
- Honeypot field for bot detection
- IP address logging for spam tracking

### Security Headers (Helmet.js)

- X-DNS-Prefetch-Control
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Content Security Policy (CSP) - currently relaxed for inline scripts

### Admin Registration Security

- First admin registration allowed
- Subsequent registrations blocked
- Prevents unauthorized admin creation

## Data Flow Patterns

### Public Portfolio View

1. User visits homepage (`/`)
2. Browser loads static HTML/CSS/JS
3. JavaScript fetches `/api/projects`
4. Projects rendered dynamically
5. Structured data updated from `/structured-data.json`
6. Scroll animations triggered via Intersection Observer

### Contact Form Submission

1. User fills contact form
2. Client-side validation runs
3. POST request to `/api/contact`
4. Rate limit check (10/hour per IP)
5. Honeypot validation
6. Data saved to MongoDB
7. Success response sent
8. Confirmation shown to user

### Admin Project Management

1. Admin logs in → JWT token received
2. Token stored in localStorage
3. Dashboard loads projects via GET `/api/projects`
4. Admin creates/updates project
5. PUT/POST request with JWT in Authorization header
6. Token verified by auth middleware
7. Project saved to database
8. Response sent to client
9. UI updates with new data
10. Sitemap automatically regenerated

### SEO Update Flow

1. Admin adds new project
2. Project saved to database
3. Next sitemap request generates fresh XML
4. Client page load fetches `/structured-data.json`
5. JSON-LD script updated with new projects
6. Search engines crawl updated sitemap
7. New project indexed

## Deployment Architecture

### Development Environment

```
Local Machine
├── MongoDB (local instance on port 27017)
├── Node.js server (port 5000)
└── Browser (localhost:5000)
```

### Production Environment (Recommended)

```
Cloud Platform (Heroku/Railway/Render)
├── Node.js Application Server
│   ├── Express app (port from env)
│   └── Static file serving
├── MongoDB Atlas (managed database)
│   ├── Replica set
│   └── Automatic backups
└── CDN (optional)
    └── Static asset caching
```

### Environment Configuration

**Required Variables**:
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - Secret key for token signing (min 32 characters)

**Optional Variables**:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)

## Scalability Considerations

### Current Limitations

- Single server instance (no horizontal scaling)
- In-memory rate limiting (resets on restart)
- No caching layer
- Synchronous operations

### Future Enhancements

**Database**:
- MongoDB replica sets for high availability
- Read replicas for query distribution
- Database indexing on frequently queried fields

**Application**:
- Redis for distributed rate limiting
- Response caching with Redis
- Background job processing for emails
- Load balancer for multiple instances

**Frontend**:
- CDN for static assets
- Service worker for offline support
- Image optimization and lazy loading
- Code splitting for faster loads

## Error Handling

### Database Errors

- Connection retry with exponential backoff
- Graceful degradation (dev mode without DB)
- Detailed error logging
- Automatic reconnection on connection loss

### API Errors

- Centralized error middleware
- Standardized error response format
- Environment-based error details
- HTTP status codes following REST conventions

### Client Errors

- Network request timeout handling
- User-friendly error messages
- Automatic retry for failed requests
- Form validation feedback

## Monitoring & Observability

### Health Checks

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-27T10:00:00.000Z",
  "uptime": 3600
}
```

**Use Cases**:
- Load balancer health checks
- Uptime monitoring services
- Automated restart triggers

### Logging

**Current Implementation**:
- Console.log for application events
- MongoDB connection status
- Server startup information
- Network interface detection
- Error stack traces (development mode)

**Recommended Enhancements**:
- Structured logging (Winston/Pino)
- Log levels (info, warn, error)
- Log aggregation (Loggly, Papertrail)
- Request logging middleware
- Performance metrics

## Technology Stack Summary

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| mongoose | ^8.0.3 | MongoDB ODM |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| helmet | ^7.1.0 | Security headers |
| cors | ^2.8.5 | Cross-origin requests |
| express-rate-limit | ^7.1.5 | Rate limiting |
| dotenv | ^16.3.1 | Environment variables |

### Development Tools

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.0.2 | Auto-restart on changes |

## File Structure

```
FrozenShield/
├── server/                     # Backend application
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── Admin.js           # Admin schema
│   │   ├── Project.js         # Project schema
│   │   └── Contact.js         # Contact schema
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── projects.js        # Project CRUD
│   │   ├── contact.js         # Contact form
│   │   └── seo.js             # SEO endpoints
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── scripts/
│   │   ├── createAdmin.js     # Admin creation CLI
│   │   └── listAdmins.js      # Admin listing CLI
│   └── server.js              # Express app setup
├── public/                     # Frontend assets
│   ├── index.html             # Main page
│   ├── styles.css             # Styling
│   ├── script.js              # Client logic
│   ├── robots.txt             # Crawler rules
│   └── admin/                 # Admin panel
│       ├── login.html
│       ├── dashboard.html
│       ├── admin.css
│       └── admin.js
├── docs/                       # Documentation
│   ├── architecture.md        # This file
│   ├── api-reference.md       # API documentation
│   ├── troubleshooting.md     # Common issues
│   ├── maintenance.md         # Maintenance guide
│   └── SEO-SYSTEM.md         # SEO documentation
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
└── README.md                  # Project overview
```

## Design Patterns

### MVC Architecture

- **Models**: Mongoose schemas define data structure
- **Views**: Static HTML/JS for presentation
- **Controllers**: Express route handlers for business logic

### Middleware Pattern

- Authentication middleware for protected routes
- Error handling middleware for centralized errors
- Rate limiting middleware for request throttling

### Repository Pattern

- Mongoose models act as data repositories
- Abstraction over direct database access
- Consistent CRUD operations

### Singleton Pattern

- Database connection shared across application
- Single Express app instance
- Centralized configuration

## Performance Characteristics

### Response Times (typical)

- Static file serving: <10ms
- Project list API: 50-100ms
- Contact form submission: 100-200ms
- Admin authentication: 200-300ms (bcrypt hashing)
- Sitemap generation: <100ms
- Health check: <5ms

### Database Performance

- Simple queries: <50ms
- Indexed lookups: <20ms
- Full collection scans: 50-200ms (depends on size)

### Optimization Techniques

- Static file caching via Express
- Mongoose query optimization
- Minimal database round trips
- Efficient bcrypt salt rounds (10)

## Security Best Practices

1. **Never commit secrets** - Use .env files
2. **Validate all input** - Server-side validation on every endpoint
3. **Use HTTPS in production** - Enforce with HSTS headers
4. **Rate limit aggressively** - Prevent abuse and DOS
5. **Keep dependencies updated** - Regular security patches
6. **Monitor failed login attempts** - Consider lockout mechanisms
7. **Sanitize database queries** - Mongoose handles injection prevention
8. **Implement CSP** - Currently relaxed, should be tightened
9. **Rotate JWT secrets** - Invalidates all tokens
10. **Backup database regularly** - MongoDB Atlas automated backups

## Conclusion

FrozenShield's architecture prioritizes simplicity, security, and maintainability. The three-tier design allows for independent scaling of frontend, backend, and database layers. The RESTful API design enables future mobile app integration or third-party integrations. Security is layered throughout with JWT authentication, rate limiting, and secure password storage.

For detailed API documentation, see [API Reference](./api-reference.md).
For common issues, see [Troubleshooting](./troubleshooting.md).
For maintenance procedures, see [Maintenance Guide](./maintenance.md).
