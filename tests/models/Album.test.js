const Album = require('../../server/models/Album');
const Media = require('../../server/models/Media');

describe('Album Model', () => {
  describe('Album Creation', () => {
    it('should create a new album with valid data', async () => {
      const albumData = {
        title: 'Test Album',
        description: 'A test album description',
        tags: ['nature', 'landscape'],
        visibility: 'public',
        featured: true
      };

      const album = new Album(albumData);
      const savedAlbum = await album.save();

      expect(savedAlbum._id).toBeDefined();
      expect(savedAlbum.title).toBe(albumData.title);
      expect(savedAlbum.description).toBe(albumData.description);
      expect(savedAlbum.tags).toEqual(albumData.tags);
      expect(savedAlbum.visibility).toBe(albumData.visibility);
      expect(savedAlbum.featured).toBe(true);
      expect(savedAlbum.slug).toBeDefined();
      expect(savedAlbum.createdAt).toBeDefined();
    });

    it('should fail to create album without title', async () => {
      const album = new Album({
        description: 'No title album'
      });

      let error;
      try {
        await album.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should set default values correctly', async () => {
      const album = new Album({
        title: 'Default Test Album'
      });

      const savedAlbum = await album.save();

      expect(savedAlbum.visibility).toBe('public');
      expect(savedAlbum.featured).toBe(false);
      expect(savedAlbum.order).toBe(0);
      expect(savedAlbum.stats.totalMedia).toBe(0);
      expect(savedAlbum.stats.views).toBe(0);
    });
  });

  describe('Slug Generation', () => {
    it('should generate slug from title', async () => {
      const album = new Album({
        title: 'My Awesome Album'
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.slug).toBe('my-awesome-album');
    });

    it('should handle special characters in slug', async () => {
      const album = new Album({
        title: 'Test Album! @#$ 2024'
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.slug).toBe('test-album-2024');
    });

    it('should handle multiple spaces in slug', async () => {
      const album = new Album({
        title: 'Test    Multiple   Spaces'
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.slug).toBe('test-multiple-spaces');
    });

    it('should generate unique slugs for albums with same title', async () => {
      const album1 = new Album({
        title: 'Duplicate Title',
        slug: 'duplicate-title-1'
      });
      await album1.save();

      const album2 = new Album({
        title: 'Duplicate Title',
        slug: 'duplicate-title-2'
      });
      const savedAlbum2 = await album2.save();

      expect(savedAlbum2.slug).not.toBe(album1.slug);
    });

    it('should not regenerate slug if manually set', async () => {
      const customSlug = 'my-custom-slug';
      const album = new Album({
        title: 'Test Album',
        slug: customSlug
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.slug).toBe(customSlug);
    });
  });

  describe('Album Updates', () => {
    it('should update updatedAt timestamp on save', async () => {
      const album = new Album({
        title: 'Update Test Album'
      });

      const savedAlbum = await album.save();
      const originalUpdatedAt = savedAlbum.updatedAt;

      // Wait a moment then update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedAlbum.description = 'Updated description';
      await savedAlbum.save();

      expect(savedAlbum.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should only regenerate slug if title is modified', async () => {
      const album = new Album({
        title: 'Original Title'
      });

      const savedAlbum = await album.save();
      const originalSlug = savedAlbum.slug;

      savedAlbum.description = 'Updated description';
      await savedAlbum.save();

      expect(savedAlbum.slug).toBe(originalSlug);
    });
  });

  describe('Album Validation', () => {
    it('should enforce maximum title length', async () => {
      const longTitle = 'a'.repeat(101);
      const album = new Album({
        title: longTitle
      });

      let error;
      try {
        await album.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should enforce maximum description length', async () => {
      const longDescription = 'a'.repeat(1001);
      const album = new Album({
        title: 'Test Album',
        description: longDescription
      });

      let error;
      try {
        await album.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.description).toBeDefined();
    });

    it('should validate visibility enum values', async () => {
      const album = new Album({
        title: 'Test Album',
        visibility: 'invalid'
      });

      let error;
      try {
        await album.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.visibility).toBeDefined();
    });

    it('should allow valid visibility values', async () => {
      const visibilities = ['public', 'private', 'unlisted'];

      for (const visibility of visibilities) {
        const album = new Album({
          title: `Test Album ${visibility}`,
          visibility
        });

        const savedAlbum = await album.save();
        expect(savedAlbum.visibility).toBe(visibility);
      }
    });
  });

  describe('Album Metadata', () => {
    it('should store metadata fields', async () => {
      const metadata = {
        location: 'Yellowknife, NT',
        date: new Date('2024-01-15'),
        camera: 'Canon EOS R5',
        settings: 'f/2.8, 1/500s, ISO 400'
      };

      const album = new Album({
        title: 'Metadata Test Album',
        metadata
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.metadata.location).toBe(metadata.location);
      expect(savedAlbum.metadata.camera).toBe(metadata.camera);
      expect(savedAlbum.metadata.settings).toBe(metadata.settings);
    });
  });

  describe('Album Stats', () => {
    it('should initialize stats with default values', async () => {
      const album = new Album({
        title: 'Stats Test Album'
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.stats.totalMedia).toBe(0);
      expect(savedAlbum.stats.views).toBe(0);
    });

    it('should update media count correctly', async () => {
      const album = new Album({
        title: 'Media Count Test Album'
      });

      const savedAlbum = await album.save();

      // Create media items for this album
      await Media.create({
        albumId: savedAlbum._id,
        type: 'image',
        url: '/uploads/test1.jpg'
      });

      await Media.create({
        albumId: savedAlbum._id,
        type: 'image',
        url: '/uploads/test2.jpg'
      });

      await savedAlbum.updateMediaCount();
      expect(savedAlbum.stats.totalMedia).toBe(2);
    });
  });

  describe('Album Tags', () => {
    it('should store and retrieve tags', async () => {
      const tags = ['landscape', 'nature', 'photography'];
      const album = new Album({
        title: 'Tagged Album',
        tags
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.tags).toEqual(tags);
    });

    it('should trim whitespace from tags', async () => {
      const album = new Album({
        title: 'Trimmed Tags Album',
        tags: ['  tag1  ', '  tag2  ']
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.tags).toContain('tag1');
      expect(savedAlbum.tags).toContain('tag2');
    });
  });

  describe('Album Relations', () => {
    it('should allow projectId reference', async () => {
      const mongoose = require('mongoose');
      const projectId = new mongoose.Types.ObjectId();

      const album = new Album({
        title: 'Project Album',
        projectId
      });

      const savedAlbum = await album.save();
      expect(savedAlbum.projectId.toString()).toBe(projectId.toString());
    });
  });
});
