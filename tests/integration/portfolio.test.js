const request = require('supertest');
const express = require('express');
const authRoutes = require('../../server/routes/auth');
const albumsRoutes = require('../../server/routes/albums');
const adminAlbumsRoutes = require('../../server/routes/admin/albums');
const mediaRoutes = require('../../server/routes/media');
const portfolioRoutes = require('../../server/routes/portfolio');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/admin/albums', adminAlbumsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/portfolio', portfolioRoutes);

describe('Portfolio Integration Tests', () => {
  describe('Complete Album Workflow', () => {
    let authToken;
    let albumId;

    it('should register admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'portfolioAdmin',
          email: 'portfolio@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      authToken = response.body.token;
    });

    it('should create an album', async () => {
      const response = await request(app)
        .post('/api/admin/albums')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integration Test Album',
          description: 'Created during integration test',
          tags: ['integration', 'test'],
          visibility: 'public',
          featured: true
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      albumId = response.body.data._id;
    });

    it('should retrieve the created album', async () => {
      const response = await request(app)
        .get(`/api/albums/${albumId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Integration Test Album');
      expect(response.body.data.featured).toBe(true);
    });

    it('should appear in portfolio endpoint', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(200);

      expect(response.body.success).toBe(true);
      const albums = response.body.data.albums || [];
      expect(albums.some(album => album._id.toString() === albumId.toString())).toBe(true);
    });

    it('should update the album', async () => {
      const response = await request(app)
        .put(`/api/admin/albums/${albumId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Integration Album',
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Integration Album');
    });

    it('should delete the album', async () => {
      const response = await request(app)
        .delete(`/api/admin/albums/${albumId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not find deleted album', async () => {
      const response = await request(app)
        .get(`/api/albums/${albumId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    const credentials = {
      username: 'authflow',
      email: 'authflow@example.com',
      password: 'password123'
    };

    it('should complete full auth flow', async () => {
      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(credentials)
        .expect(201);

      const { token } = registerResponse.body;

      // Get current user
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.user.email).toBe(credentials.email);

      // Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });
});
