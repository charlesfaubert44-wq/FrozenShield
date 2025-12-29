# Frozen Shield Studio

A modern, fullstack portfolio website for showcasing custom web development services and projects. Built with Node.js, Express, MongoDB, and vanilla JavaScript for a clean, professional presence.

## Features

### Frontend
- Modern dark theme with gradient accents
- Fully responsive design (mobile, tablet, desktop)
- Smooth scrolling navigation
- Fade-in animations on scroll
- Dynamic project loading from database
- Working contact form with backend integration
- Clean, minimalistic UI

### Backend & Admin
- RESTful API with Express.js
- MongoDB database with Mongoose ODM with automatic reconnection
- JWT-based authentication (30-day token expiration)
- Admin panel for content management
- Contact form submission storage with spam protection
- Full CRUD operations for projects
- Rate limiting (100 req/15min global, 10 req/hour for contact form)
- Security headers with Helmet.js
- Graceful shutdown handling
- Health check endpoint
- SEO optimization with sitemap and structured data

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Security**: Helmet, CORS, bcryptjs, JWT
- **Authentication**: JSON Web Tokens (JWT)

## Project Structure

```
FrozenShield/
├── server/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── Admin.js           # Admin user model
│   │   ├── Contact.js         # Contact submission model
│   │   └── Project.js         # Project model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── contact.js         # Contact form routes
│   │   └── projects.js        # Project CRUD routes
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   └── server.js              # Express server setup
├── public/
│   ├── index.html             # Main portfolio page
│   ├── styles.css             # Main stylesheet
│   ├── script.js              # Frontend logic
│   └── admin/
│       ├── index.html         # Admin panel UI
│       ├── admin.css          # Admin panel styles
│       └── admin.js           # Admin panel logic
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd FrozenShield
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `PORT` - Server port (default: 5000)
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string for JWT signing

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the application**
   - Portfolio site: `http://localhost:5000`
   - Admin panel: `http://localhost:5000/admin`

### First Time Setup

**Option 1: Via Admin Panel**
1. Navigate to `http://localhost:5000/admin`
2. Click "Register Admin" (only works for the first admin)
3. Create your admin account
4. Login and start managing your portfolio!

**Option 2: Via Command Line**
```bash
npm run create-admin
```
Follow the prompts to create your admin account.

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/projects` - Get all projects (sorted by order and date)
- `GET /api/projects/featured` - Get featured projects only
- `GET /api/projects/:id` - Get single project by ID
- `POST /api/contact` - Submit contact form (10 req/hour rate limit, honeypot protected)

### Protected Endpoints (Admin only)

**Authentication:**
- `POST /api/auth/register` - Register admin (disabled after first admin)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin

**Projects:**
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Contacts:**
- `GET /api/contact` - Get all contact submissions (sorted by date)
- `PATCH /api/contact/:id` - Update contact status and notes
- `DELETE /api/contact/:id` - Delete contact submission

## Customization

### Update Company Information

Edit `public/index.html` to change:
- Company name in the navbar and hero section
- Service descriptions
- Contact information (email, phone)

### Modify Colors

Edit the CSS variables in `public/styles.css`:

```css
:root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #13131a;
    --accent-1: #6366f1;
    --accent-2: #8b5cf6;
}
```

### Managing Projects

Use the admin panel to:
1. Add new projects with images and descriptions
2. Set projects as "featured"
3. Add technology tags
4. Reorder projects with the order field
5. Edit or delete existing projects

Projects added through the admin panel will automatically appear on the portfolio homepage.

## Deployment

FrozenShield is ready to deploy to multiple platforms with comprehensive configuration files included.

### Quick Start Deployment

**For detailed, step-by-step instructions, see [docs/deployment-guide.md](docs/deployment-guide.md)**

The project includes pre-configured files for:
- **Docker**: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- **Railway**: `railway.json`
- **Render**: `render.yaml`
- **Vercel**: `vercel.json`
- **Heroku**: `Procfile`

### Platform Quick Reference

#### Railway (Recommended for Beginners)
```bash
# One-click deployment with GitHub integration
# Railway auto-detects configuration from railway.json
```
[Deploy to Railway →](https://railway.app/new)

#### Render
```bash
# Auto-deployment using render.yaml blueprint
# Includes MongoDB database provisioning
```
[Deploy to Render →](https://render.com)

#### Docker
```bash
# Local deployment with Docker Compose
docker-compose up -d

# Or with custom MongoDB Atlas
docker build -t frozenshield .
docker run -p 5000:5000 --env-file .env frozenshield
```

#### Heroku
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

#### Vercel
```bash
vercel --prod
```

### Required Environment Variables

All platforms require these variables:
- `NODE_ENV=production`
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secure random string (64+ chars)

Optional (for email notifications):
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (Free M0 tier available)
3. Configure database access (username/password)
4. Whitelist IP addresses (0.0.0.0/0 for all platforms)
5. Get connection string from "Connect" → "Connect your application"

### Deployment Checklist

Before deploying, review [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) to ensure:
- [ ] Environment variables configured
- [ ] MongoDB Atlas set up
- [ ] JWT secret generated
- [ ] Dependencies updated
- [ ] Security audit passed

### Post-Deployment

After deployment:
1. Create admin user: `npm run create-admin` (or via platform shell)
2. Verify health: `https://your-app-url.com/api/health`
3. Test admin login: `https://your-app-url.com/admin`
4. Configure custom domain (optional)
5. Set up monitoring and backups

For comprehensive deployment instructions, troubleshooting, and platform-specific guides, see [docs/deployment-guide.md](docs/deployment-guide.md).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Security Features

- **JWT Authentication**: 30-day token expiration, secure signing
- **Password Security**: Bcrypt hashing with salt rounds
- **Admin Registration**: Automatically disabled after first admin created
- **Rate Limiting**:
  - Global: 100 requests per 15 minutes per IP
  - Contact form: 10 submissions per hour per IP
- **Spam Protection**: Honeypot field on contact form
- **Security Headers**: Helmet.js with CSP, XSS protection, etc.
- **Input Validation**: Server-side validation on all endpoints
- **Graceful Shutdown**: Proper cleanup of connections on SIGTERM/SIGINT
- **MongoDB Security**: Connection retry logic with exponential backoff
- **Login Flexibility**: Support for login via username or email

**Important**: Always change `JWT_SECRET` to a cryptographically random string in production!

## Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-restart on changes)
npm run dev

# Run in production mode
npm start
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Architecture Guide](./docs/architecture.md)** - System architecture, design patterns, and technical overview
- **[API Reference](./docs/api-reference.md)** - Complete API documentation with examples
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues and solutions
- **[Maintenance Guide](./docs/maintenance.md)** - Maintenance procedures, backup strategies, and monitoring
- **[SEO System](./docs/SEO-SYSTEM.md)** - SEO implementation and optimization guide
- **[Contributing Guide](./CONTRIBUTING.md)** - Guidelines for contributing to the project

---

## Quick Links

### For Developers
- [Getting Started](#getting-started) - Installation and setup
- [API Endpoints](#api-endpoints) - Quick API reference
- [Customization](#customization) - Customize the site
- [Security Features](#security-features) - Security implementation

### For Administrators
- [First Time Setup](#first-time-setup) - Create admin account
- [Managing Projects](#managing-projects) - Content management
- [Admin Panel](http://localhost:5000/admin) - Access admin dashboard

### For Operations
- [Deployment](#deployment) - Deploy to production
- [Maintenance Guide](./docs/maintenance.md) - Regular maintenance tasks
- [Troubleshooting](./docs/troubleshooting.md) - Fix common issues
- [Backup Strategies](./docs/maintenance.md#backup-strategies) - Data backup procedures

---

## Support

For help and support:

- **Email**: hello@frozenshield.ca
- **Documentation**: See `/docs` directory
- **Issues**: Check [Troubleshooting Guide](./docs/troubleshooting.md)

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Coding standards
- Pull request process

---

## License

MIT License - Free to use and modify for your business needs.

---

## Acknowledgments

Built with:
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [JWT](https://jwt.io/) - Authentication

---

**FrozenShield Studio** - Custom web development for Canada's northern territories

Website: [frozenshield.ca](https://frozenshield.ca)
Email: hello@frozenshield.ca
Location: Yellowknife, Northwest Territories, Canada