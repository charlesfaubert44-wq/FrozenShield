const Media = require('../../server/models/Media');
const Album = require('../../server/models/Album');

describe('Media Model', () => {
  let testAlbum;

  beforeEach(async () => {
    testAlbum = await Album.create({
      title: 'Test Album for Media'
    });
  });

  describe('Media Creation', () => {
    it('should create image media with valid data', async () => {
      const mediaData = {
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test-image.jpg',
        caption: 'Test image caption',
        alt: 'Test image alt text',
        tags: ['landscape', 'nature']
      };

      const media = new Media(mediaData);
      const savedMedia = await media.save();

      expect(savedMedia._id).toBeDefined();
      expect(savedMedia.albumId.toString()).toBe(testAlbum._id.toString());
      expect(savedMedia.type).toBe('image');
      expect(savedMedia.url).toBe(mediaData.url);
      expect(savedMedia.caption).toBe(mediaData.caption);
      expect(savedMedia.alt).toBe(mediaData.alt);
      expect(savedMedia.tags).toEqual(mediaData.tags);
      expect(savedMedia.uploadedAt).toBeDefined();
    });

    it('should create video media with valid data', async () => {
      const mediaData = {
        albumId: testAlbum._id,
        type: 'video',
        url: '/uploads/test-video.mp4',
        thumbnail: '/uploads/test-video-thumb.jpg'
      };

      const media = new Media(mediaData);
      const savedMedia = await media.save();

      expect(savedMedia.type).toBe('video');
      expect(savedMedia.url).toBe(mediaData.url);
      expect(savedMedia.thumbnail).toBe(mediaData.thumbnail);
    });

    it('should fail to create media without albumId', async () => {
      const media = new Media({
        type: 'image',
        url: '/uploads/test.jpg'
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.albumId).toBeDefined();
    });

    it('should fail to create media without url', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image'
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.url).toBeDefined();
    });

    it('should fail to create media without type', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        url: '/uploads/test.jpg'
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    it('should set default values correctly', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg'
      });

      const savedMedia = await media.save();

      expect(savedMedia.visibility).toBe('public');
      expect(savedMedia.featured).toBe(false);
      expect(savedMedia.order).toBe(0);
      expect(savedMedia.stats.views).toBe(0);
      expect(savedMedia.stats.downloads).toBe(0);
    });
  });

  describe('Media Validation', () => {
    it('should validate type enum values', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'invalid',
        url: '/uploads/test.jpg'
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    it('should validate visibility enum values', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        visibility: 'invalid'
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.visibility).toBeDefined();
    });

    it('should enforce maximum caption length', async () => {
      const longCaption = 'a'.repeat(501);
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        caption: longCaption
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.caption).toBeDefined();
    });

    it('should enforce maximum alt text length', async () => {
      const longAlt = 'a'.repeat(201);
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        alt: longAlt
      });

      let error;
      try {
        await media.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.alt).toBeDefined();
    });
  });

  describe('Media Metadata', () => {
    it('should store file metadata', async () => {
      const metadata = {
        filename: 'test-image.jpg',
        size: 1024000,
        width: 1920,
        height: 1080,
        format: 'jpeg'
      };

      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        metadata
      });

      const savedMedia = await media.save();
      expect(savedMedia.metadata.filename).toBe(metadata.filename);
      expect(savedMedia.metadata.size).toBe(metadata.size);
      expect(savedMedia.metadata.width).toBe(metadata.width);
      expect(savedMedia.metadata.height).toBe(metadata.height);
      expect(savedMedia.metadata.format).toBe(metadata.format);
    });

    it('should store EXIF data', async () => {
      const exifData = {
        camera: 'Canon EOS R5',
        lens: 'RF 24-70mm f/2.8',
        iso: '400',
        aperture: 'f/2.8',
        shutterSpeed: '1/500',
        focalLength: '50mm',
        dateTaken: new Date('2024-01-15')
      };

      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        metadata: { exif: exifData }
      });

      const savedMedia = await media.save();
      expect(savedMedia.metadata.exif.camera).toBe(exifData.camera);
      expect(savedMedia.metadata.exif.lens).toBe(exifData.lens);
      expect(savedMedia.metadata.exif.iso).toBe(exifData.iso);
      expect(savedMedia.metadata.exif.aperture).toBe(exifData.aperture);
    });
  });

  describe('Media URLs', () => {
    it('should store optimized and thumbnail URLs', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test-original.jpg',
        optimized: '/uploads/test-optimized.jpg',
        thumbnail: '/uploads/test-thumb.jpg'
      });

      const savedMedia = await media.save();
      expect(savedMedia.url).toBe('/uploads/test-original.jpg');
      expect(savedMedia.optimized).toBe('/uploads/test-optimized.jpg');
      expect(savedMedia.thumbnail).toBe('/uploads/test-thumb.jpg');
    });
  });

  describe('Media Tags', () => {
    it('should store and retrieve tags', async () => {
      const tags = ['landscape', 'nature', 'mountains'];
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        tags
      });

      const savedMedia = await media.save();
      expect(savedMedia.tags).toEqual(tags);
    });

    it('should trim whitespace from tags', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg',
        tags: ['  tag1  ', '  tag2  ']
      });

      const savedMedia = await media.save();
      expect(savedMedia.tags).toContain('tag1');
      expect(savedMedia.tags).toContain('tag2');
    });
  });

  describe('Media Stats', () => {
    it('should initialize stats with default values', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg'
      });

      const savedMedia = await media.save();
      expect(savedMedia.stats.views).toBe(0);
      expect(savedMedia.stats.downloads).toBe(0);
    });

    it('should allow updating stats', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg'
      });

      const savedMedia = await media.save();

      savedMedia.stats.views = 10;
      savedMedia.stats.downloads = 5;
      await savedMedia.save();

      expect(savedMedia.stats.views).toBe(10);
      expect(savedMedia.stats.downloads).toBe(5);
    });
  });

  describe('Media Updates', () => {
    it('should update updatedAt timestamp on save', async () => {
      const media = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test.jpg'
      });

      const savedMedia = await media.save();
      const originalUpdatedAt = savedMedia.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      savedMedia.caption = 'Updated caption';
      await savedMedia.save();

      expect(savedMedia.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Media Ordering', () => {
    it('should support ordering media within album', async () => {
      const media1 = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test1.jpg',
        order: 1
      });

      const media2 = new Media({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test2.jpg',
        order: 0
      });

      await media1.save();
      await media2.save();

      const mediaItems = await Media.find({ albumId: testAlbum._id }).sort({ order: 1 });
      expect(mediaItems[0].url).toBe('/uploads/test2.jpg');
      expect(mediaItems[1].url).toBe('/uploads/test1.jpg');
    });
  });

  describe('Album Media Count Update', () => {
    it('should update album media count after saving media', async () => {
      const initialCount = testAlbum.stats.totalMedia;

      await Media.create({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test1.jpg'
      });

      await Media.create({
        albumId: testAlbum._id,
        type: 'image',
        url: '/uploads/test2.jpg'
      });

      const updatedAlbum = await Album.findById(testAlbum._id);
      expect(updatedAlbum.stats.totalMedia).toBeGreaterThan(initialCount);
    });
  });
});
