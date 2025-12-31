const request = require('supertest');
const express = require('express');
const albumsRoutes = require('../../server/routes/albums');
const adminAlbumsRoutes = require('../../server/routes/admin/albums');
const { createTestUser, createTestAlbum, createTestMedia } = require('../fixtures/testHelpers');

const app = express();
app.use(express.json());
app.use('/api/albums', albumsRoutes);
app.use('/api/admin/albums', adminAlbumsRoutes);

describe('Albums API Endpoints', () => {
  describe('GET /api/albums', () => {
    it('should get all public albums', async () => {
      await createTestAlbum({ title: 'Public Album 1', visibility: 'public' });
      await createTestAlbum({ title: 'Public Album 2', visibility: 'public' });
      await createTestAlbum({ title: 'Private Album', visibility: 'private' });

      const response = await request(app)
        .get('/api/albums')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter featured albums', async () => {
      await createTestAlbum({ title: 'Featured Album', featured: true, visibility: 'public' });
      await createTestAlbum({ title: 'Regular Album', featured: false, visibility: 'public' });

      const response = await request(app)
        .get('/api/albums?featured=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].featured).toBe(true);
    });

    it('should filter albums by tag', async () => {
      await createTestAlbum({ title: 'Nature Album', tags: ['nature', 'landscape'], visibility: 'public' });
      await createTestAlbum({ title: 'Urban Album', tags: ['urban', 'city'], visibility: 'public' });

      const response = await request(app)
        .get('/api/albums?tag=nature')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].tags).toContain('nature');
    });
  });

  describe('GET /api/albums/:identifier', () => {
    it('should get album by ID with media', async () => {
      const album = await createTestAlbum({ visibility: 'public' });
      await createTestMedia(album._id);

      const response = await request(app)
        .get(`/api/albums/${album._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(album.title);
      expect(response.body.data.media).toBeDefined();
      expect(response.body.data.stats.views).toBeGreaterThan(0);
    });

    it('should get album by slug', async () => {
      const album = await createTestAlbum({ title: 'My Test Album', visibility: 'public' });

      const response = await request(app)
        .get(`/api/albums/${album.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe(album.slug);
    });

    it('should return 404 for non-existent album', async () => {
      const response = await request(app)
        .get('/api/albums/000000000000000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for private album', async () => {
      const album = await createTestAlbum({ visibility: 'private' });

      const response = await request(app)
        .get(`/api/albums/${album._id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Album Routes', () => {
    let authToken;

    beforeEach(async () => {
      const { token } = await createTestUser();
      authToken = token;
    });

    describe('POST /api/admin/albums', () => {
      it('should create a new album', async () => {
        const albumData = {
          title: 'New Test Album',
          description: 'Test description',
          tags: ['test'],
          visibility: 'public'
        };

        const response = await request(app)
          .post('/api/admin/albums')
          .set('Authorization', `Bearer ${authToken}`)
          .send(albumData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(albumData.title);
        expect(response.body.data.slug).toBeDefined();
      });

      it('should reject creation without auth', async () => {
        const response = await request(app)
          .post('/api/admin/albums')
          .send({ title: 'Test Album' })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should reject creation without title', async () => {
        const response = await request(app)
          .post('/api/admin/albums')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ description: 'No title' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/admin/albums/:id', () => {
      it('should update album', async () => {
        const album = await createTestAlbum();

        const updateData = {
          title: 'Updated Title',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/admin/albums/${album._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
      });

      it('should return 404 for non-existent album', async () => {
        const response = await request(app)
          .put('/api/admin/albums/000000000000000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Test' })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/admin/albums/:id', () => {
      it('should delete album and media', async () => {
        const album = await createTestAlbum();
        await createTestMedia(album._id);

        const response = await request(app)
          .delete(`/api/admin/albums/${album._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.mediaDeleted).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /api/admin/albums', () => {
      it('should get all albums including private', async () => {
        await createTestAlbum({ title: 'Public', visibility: 'public' });
        await createTestAlbum({ title: 'Private', visibility: 'private' });

        const response = await request(app)
          .get('/api/admin/albums')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/admin/albums?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
      });
    });
  });
});
