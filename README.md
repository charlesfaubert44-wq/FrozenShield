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
- MongoDB database with Mongoose ODM
- JWT-based authentication
- Admin panel for content management
- Contact form submission storage
- Full CRUD operations for projects
- Rate limiting and security headers

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

1. Navigate to `http://localhost:5000/admin`
2. Click "Register Admin" (only works for the first admin)
3. Create your admin account
4. Login and start managing your portfolio!

## API Endpoints

### Public Endpoints

- `GET /api/projects` - Get all projects
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/:id` - Get single project
- `POST /api/contact` - Submit contact form

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
- `GET /api/contact` - Get all contact submissions
- `PATCH /api/contact/:id` - Update contact status
- `DELETE /api/contact/:id` - Delete contact

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

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

### Heroku Deployment

```bash
# Install Heroku CLI
heroku login

# Create new app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main

# Open your app
heroku open
```

### Railway / Render / Digital Ocean

1. Connect your GitHub repository
2. Set environment variables in the platform
3. Deploy automatically on push

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Security Notes

- Change `JWT_SECRET` to a strong random string in production
- Admin registration is automatically disabled after the first admin is created
- All admin routes are protected with JWT authentication
- Rate limiting is enabled on API routes (100 requests per 15 minutes)
- Helmet.js provides security headers
- Passwords are hashed with bcrypt

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

## License

Free to use and modify for your business needs.