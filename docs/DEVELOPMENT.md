# FrozenShield Development Guide

## Table of Contents
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Local Setup](#local-setup)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)
- [Code Standards](#code-standards)

## Project Structure

```
FrozenShield/
├── public/                  # Frontend static files
│   ├── index.html          # Main HTML file
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # Styles
├── server/                 # Backend Node.js/Express
│   ├── config/            # Configuration files
│   │   └── db.js          # MongoDB connection
│   ├── middleware/        # Custom middleware
│   │   ├── auth.js        # Authentication middleware
│   │   └── mediaUpload.js # File upload middleware
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   ├── Album.js
│   │   ├── Media.js
│   │   ├── Video.js
│   │   ├── Project.js
│   │   └── Contact.js
│   ├── routes/            # API routes
│   │   ├── admin/         # Protected admin routes
│   │   │   ├── albums.js
│   │   │   ├── videos.js
│   │   │   ├── projects.js
│   │   │   └── stats.js
│   │   ├── auth.js        # Authentication routes
│   │   ├── albums.js      # Public album routes
│   │   ├── videos.js      # Public video routes
│   │   ├── projects.js    # Public project routes
│   │   ├── media.js       # Media management routes
│   │   ├── portfolio.js   # Unified portfolio endpoint
│   │   ├── contact.js     # Contact form
│   │   └── seo.js         # SEO routes (sitemap, robots.txt)
│   ├── server.js          # Main application entry point
│   └── seedTestData.js    # Database seeding script
├── tests/                  # Test suites
│   ├── api/               # API endpoint tests
│   ├── models/            # Model tests
│   ├── integration/       # Integration tests
│   ├── fixtures/          # Test fixtures and helpers
│   └── setup/             # Test configuration
├── docs/                   # Documentation
├── uploads/                # User-uploaded files (gitignored)
├── .env                    # Environment variables (gitignored)
├── .gitignore
├── package.json
└── jest.config.js          # Test configuration
```

## Technology Stack

### Backend
- **Node.js** (v18+) - JavaScript runtime
- **Express.js** (v4.18+) - Web framework
- **MongoDB** (v6+) - Database
- **Mongoose** (v8+) - ODM for MongoDB

### Security & Authentication
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### File Handling
- **multer** - File upload handling
- **sharp** - Image processing and optimization

### Development Tools
- **nodemon** - Auto-restart on file changes
- **dotenv** - Environment variable management

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **@shelf/jest-mongodb** - In-memory MongoDB for tests

## Local Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd FrozenShield
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/frozenshield

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@frozenshield.ca

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Run the development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

6. **Seed test data (optional)**
```bash
npm run seed
```

## Database Schema

### User Model
```javascript
{
  username: String (unique, required, min: 3),
  email: String (unique, required, lowercase),
  password: String (required, hashed, min: 8),
  role: String (enum: ['admin', 'editor'], default: 'admin'),
  createdAt: Date,
  lastLogin: Date
}
```

### Album Model
```javascript
{
  title: String (required, max: 100),
  description: String (max: 1000),
  slug: String (unique, auto-generated),
  coverImage: String (URL),
  tags: [String],
  projectId: ObjectId (ref: 'Project'),
  visibility: String (enum: ['public', 'private', 'unlisted']),
  order: Number (default: 0),
  featured: Boolean (default: false),
  metadata: {
    location: String,
    date: Date,
    camera: String,
    settings: String
  },
  stats: {
    totalMedia: Number,
    views: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Media Model
```javascript
{
  albumId: ObjectId (required, ref: 'Album'),
  type: String (enum: ['image', 'video']),
  url: String (required),
  thumbnail: String,
  optimized: String,
  caption: String (max: 500),
  alt: String (max: 200),
  tags: [String],
  order: Number (default: 0),
  metadata: {
    filename: String,
    size: Number,
    width: Number,
    height: Number,
    format: String,
    exif: {
      camera: String,
      lens: String,
      iso: String,
      aperture: String,
      shutterSpeed: String,
      focalLength: String,
      dateTaken: Date
    }
  },
  visibility: String (enum: ['public', 'private']),
  featured: Boolean,
  stats: {
    views: Number,
    downloads: Number
  },
  uploadedAt: Date,
  updatedAt: Date
}
```

### Video Model
```javascript
{
  title: String (required, max: 200),
  description: String,
  slug: String (unique, auto-generated),
  videoType: String (enum: ['youtube', 'vimeo', 'direct']),
  videoUrl: String (required for youtube/vimeo),
  embedCode: String,
  thumbnail: String,
  duration: Number (seconds),
  tags: [String],
  category: String,
  featured: Boolean,
  visibility: String (enum: ['public', 'private', 'unlisted']),
  stats: {
    views: Number,
    likes: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model
```javascript
{
  title: String (required, max: 100),
  slug: String (unique, auto-generated),
  shortDescription: String (max: 200),
  longDescription: String,
  images: [{
    url: String (required),
    caption: String,
    order: Number
  }],
  thumbnail: String,
  technologies: [String],
  category: String (max: 50),
  projectUrl: String,
  githubUrl: String,
  featured: Boolean,
  visibility: String (enum: ['public', 'private', 'unlisted']),
  completedDate: Date,
  client: String (max: 100),
  stats: {
    views: Number,
    likes: Number
  },
  albumId: ObjectId (ref: 'Album'),
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Architecture

### API Architecture

FrozenShield follows a RESTful API architecture with clear separation between public and admin routes.

#### Public Routes
- `/api/albums` - Album viewing
- `/api/videos` - Video viewing
- `/api/projects` - Project viewing
- `/api/portfolio` - Unified content endpoint
- `/api/contact` - Contact form submission
- `/api/health` - Health check

#### Protected Admin Routes
All admin routes require JWT authentication:
- `/api/admin/albums` - Album CRUD operations
- `/api/admin/videos` - Video CRUD operations
- `/api/admin/projects` - Project CRUD operations
- `/api/admin/stats` - Analytics and statistics

#### Authentication Flow
1. Admin registers via `/api/auth/register` (first user only)
2. Login via `/api/auth/login` returns JWT token
3. Token included in `Authorization: Bearer {token}` header
4. `authenticate` middleware verifies token and attaches user to request
5. Protected routes access `req.user` for user information

### Frontend Architecture

The frontend is a vanilla JavaScript SPA with:
- Dynamic content loading via Fetch API
- Client-side routing (hash-based)
- Responsive design with CSS Grid and Flexbox
- SEO optimization with server-side meta tags

### Middleware Pipeline

```
Request → Rate Limiter → Helmet (Security) → CORS → Body Parser
  → Route Matching → Authentication (if admin route) → Controller → Response
```

## Adding New Features

### Adding a New Model

1. Create model file in `server/models/`:
```javascript
// server/models/NewModel.js
const mongoose = require('mongoose');

const newModelSchema = new mongoose.Schema({
  // Define schema fields
  title: {
    type: String,
    required: true
  },
  // ... more fields
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes
newModelSchema.index({ title: 1 });

// Add methods if needed
newModelSchema.methods.customMethod = function() {
  // Method logic
};

module.exports = mongoose.model('NewModel', newModelSchema);
```

2. Create routes in `server/routes/`:
```javascript
// server/routes/newmodel.js
const express = require('express');
const router = express.Router();
const NewModel = require('../models/NewModel');
const { authenticate } = require('../middleware/auth');

// Public route
router.get('/', async (req, res) => {
  try {
    const items = await NewModel.find({ visibility: 'public' });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Protected route
router.post('/', authenticate, async (req, res) => {
  try {
    const item = new NewModel(req.body);
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

3. Register routes in `server/server.js`:
```javascript
app.use('/api/newmodel', require('./routes/newmodel'));
```

4. Create tests in `tests/models/` and `tests/api/`:
```javascript
// tests/models/NewModel.test.js
const NewModel = require('../../server/models/NewModel');

describe('NewModel', () => {
  it('should create a new item', async () => {
    const item = new NewModel({ title: 'Test' });
    const saved = await item.save();
    expect(saved.title).toBe('Test');
  });
});
```

### Adding Validation

Use express-validator for input validation:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/', [
  body('title').trim().isLength({ min: 3 }).withMessage('Title required'),
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  // Process request
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:models
npm run test:api
npm run test:integration

# Watch mode
npm run test:watch
```

### Writing Tests

#### Model Tests
```javascript
const ModelName = require('../../server/models/ModelName');

describe('ModelName', () => {
  it('should validate required fields', async () => {
    const model = new ModelName({});
    let error;
    try {
      await model.save();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
  });
});
```

#### API Tests
```javascript
const request = require('supertest');
const { createTestUser } = require('../fixtures/testHelpers');

describe('GET /api/endpoint', () => {
  it('should return data', async () => {
    const { token } = await createTestUser();

    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### Test Coverage Goals
- Models: 80%+
- Routes: 70%+
- Overall: 70%+

## Code Standards

### JavaScript Style
- Use `const` for constants, `let` for variables
- Use async/await instead of callbacks
- Use arrow functions for short functions
- Use template literals for string interpolation

### Error Handling
Always use try-catch blocks in async routes:
```javascript
router.get('/', async (req, res) => {
  try {
    // Route logic
  } catch (error) {
    console.error('Error description:', error);
    res.status(500).json({
      success: false,
      message: 'User-friendly error message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

### Response Format
Consistent JSON response format:
```javascript
// Success
{
  success: true,
  data: {...},      // Single item
  data: [...],      // Array of items
  count: 5,         // Optional: number of items
  pagination: {...} // Optional: pagination info
}

// Error
{
  success: false,
  message: "Error description",
  error: "Detailed error (dev only)",
  errors: [...]     // Validation errors
}
```

### Naming Conventions
- Models: PascalCase (User, Album, Media)
- Routes: lowercase with hyphens (albums, admin/albums)
- Variables: camelCase (userId, albumData)
- Constants: UPPER_SNAKE_CASE (JWT_SECRET, MAX_FILE_SIZE)

### Comments
- Use JSDoc for functions and complex logic
- Add comments for non-obvious code
- Keep comments up-to-date

### Security Best Practices
- Never commit `.env` file
- Hash all passwords with bcrypt
- Validate all user input
- Use parameterized queries (Mongoose handles this)
- Implement rate limiting
- Use helmet for security headers
- Keep dependencies updated
- Never expose sensitive data in error messages

### Git Workflow
1. Create feature branch from `main`
2. Make changes and commit with descriptive messages
3. Run tests before committing
4. Create pull request with description
5. Code review and merge

### Commit Message Format
```
type: Brief description

Longer description if needed

Type can be: feat, fix, docs, style, refactor, test, chore
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `SMTP_HOST` | Email SMTP host | - | No |
| `SMTP_PORT` | Email SMTP port | - | No |
| `SMTP_USER` | Email username | - | No |
| `SMTP_PASS` | Email password | - | No |
| `EMAIL_FROM` | Email sender address | - | No |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 10485760 | No |
| `UPLOAD_PATH` | File upload directory | ./uploads | No |

## Debugging

### Enable Debug Logging
```bash
# Windows
set DEBUG=frozenshield:*
npm run dev

# Linux/Mac
DEBUG=frozenshield:* npm run dev
```

### Database Debugging
```javascript
mongoose.set('debug', true); // Log all queries
```

### Common Issues

**MongoDB Connection Fails**
- Check MongoDB is running
- Verify connection string in `.env`
- Check firewall settings

**Authentication Errors**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure Bearer token format

**File Upload Fails**
- Check upload directory exists and is writable
- Verify file size within limits
- Check file type restrictions

## Performance Optimization

- Use MongoDB indexes for frequently queried fields
- Implement pagination for large datasets
- Enable gzip compression (already enabled)
- Optimize images with Sharp before storing
- Use CDN for static assets in production
- Cache frequently accessed data
- Use lean() for read-only queries

## Deployment

See `COOLIFY_DEPLOYMENT_STEPS.md` for production deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Ensure tests pass
6. Submit a pull request

## License

MIT License - See LICENSE file for details
