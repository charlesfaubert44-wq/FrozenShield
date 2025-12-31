const request = require('supertest');
const express = require('express');
const authRoutes = require('../../server/routes/auth');
const User = require('../../server/models/User');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register first admin user successfully', async () => {
      const userData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.role).toBe('admin');
    });

    it('should reject registration when admin already exists', async () => {
      // Create first admin
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123'
      });

      // Try to create second admin
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin2',
          email: 'admin2@example.com',
          password: 'password123'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin already exists');
    });

    it('should reject registration with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'short'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      await User.create({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should reject registration with duplicate username', async () => {
      await User.create({
        username: 'duplicateuser',
        email: 'user1@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'user2@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already taken');
    });
  });

  describe('POST /api/auth/login', () => {
    const userCredentials = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create a test user
      await User.create(userCredentials);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userCredentials.email);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.lastLogin).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userCredentials.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: userCredentials.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: userCredentials.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should update lastLogin timestamp on successful login', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password
        })
        .expect(200);

      const user = await User.findOne({ email: userCredentials.email });
      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;
    const userCredentials = {
      username: 'metest',
      email: 'me@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Register and get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userCredentials);

      authToken = registerResponse.body.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userCredentials.email);
      expect(response.body.user.username).toBe(userCredentials.username);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', authToken)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
