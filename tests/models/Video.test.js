const Video = require('../../server/models/Video');

describe('Video Model', () => {
  describe('Video Creation', () => {
    it('should create a YouTube video with valid data', async () => {
      const videoData = {
        title: 'Test YouTube Video',
        description: 'A test video description',
        videoType: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        tags: ['tutorial', 'coding'],
        category: 'Education',
        featured: true
      };

      const video = new Video(videoData);
      const savedVideo = await video.save();

      expect(savedVideo._id).toBeDefined();
      expect(savedVideo.title).toBe(videoData.title);
      expect(savedVideo.videoType).toBe('youtube');
      expect(savedVideo.videoUrl).toBe(videoData.videoUrl);
      expect(savedVideo.slug).toBeDefined();
      expect(savedVideo.createdAt).toBeDefined();
    });

    it('should create a Vimeo video with valid data', async () => {
      const videoData = {
        title: 'Test Vimeo Video',
        videoType: 'vimeo',
        videoUrl: 'https://vimeo.com/123456789'
      };

      const video = new Video(videoData);
      const savedVideo = await video.save();

      expect(savedVideo.videoType).toBe('vimeo');
      expect(savedVideo.videoUrl).toBe(videoData.videoUrl);
    });

    it('should create a direct video without videoUrl', async () => {
      const videoData = {
        title: 'Test Direct Video',
        videoType: 'direct',
        embedCode: '<video src="/uploads/video.mp4"></video>'
      };

      const video = new Video(videoData);
      const savedVideo = await video.save();

      expect(savedVideo.videoType).toBe('direct');
      expect(savedVideo.embedCode).toBe(videoData.embedCode);
    });

    it('should fail to create video without required title', async () => {
      const video = new Video({
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should fail to create video without videoType', async () => {
      const video = new Video({
        title: 'Test Video'
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.videoType).toBeDefined();
    });

    it('should require videoUrl for YouTube videos', async () => {
      const video = new Video({
        title: 'Test Video',
        videoType: 'youtube'
        // Missing videoUrl
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should set default values correctly', async () => {
      const video = new Video({
        title: 'Default Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      const savedVideo = await video.save();

      expect(savedVideo.visibility).toBe('public');
      expect(savedVideo.featured).toBe(false);
      expect(savedVideo.stats.views).toBe(0);
      expect(savedVideo.stats.likes).toBe(0);
    });
  });

  describe('Slug Generation', () => {
    it('should generate slug from title', async () => {
      const video = new Video({
        title: 'My Awesome Video Tutorial',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      const savedVideo = await video.save();
      expect(savedVideo.slug).toBe('my-awesome-video-tutorial');
    });

    it('should handle special characters in slug', async () => {
      const video = new Video({
        title: 'Video #1: Learn JavaScript!',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      const savedVideo = await video.save();
      expect(savedVideo.slug).toBe('video-1-learn-javascript');
    });

    it('should not regenerate slug if manually set', async () => {
      const customSlug = 'my-custom-video-slug';
      const video = new Video({
        title: 'Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        slug: customSlug
      });

      const savedVideo = await video.save();
      expect(savedVideo.slug).toBe(customSlug);
    });
  });

  describe('Video Updates', () => {
    it('should update updatedAt timestamp on save', async () => {
      const video = new Video({
        title: 'Update Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      const savedVideo = await video.save();
      const originalUpdatedAt = savedVideo.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      savedVideo.description = 'Updated description';
      await savedVideo.save();

      expect(savedVideo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Video Validation', () => {
    it('should enforce maximum title length', async () => {
      const longTitle = 'a'.repeat(201);
      const video = new Video({
        title: longTitle,
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should validate videoType enum values', async () => {
      const video = new Video({
        title: 'Test Video',
        videoType: 'invalid'
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.videoType).toBeDefined();
    });

    it('should validate visibility enum values', async () => {
      const video = new Video({
        title: 'Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        visibility: 'invalid'
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.visibility).toBeDefined();
    });

    it('should not allow negative duration', async () => {
      const video = new Video({
        title: 'Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        duration: -100
      });

      let error;
      try {
        await video.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.duration).toBeDefined();
    });
  });

  describe('Video Stats', () => {
    it('should initialize stats with default values', async () => {
      const video = new Video({
        title: 'Stats Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      const savedVideo = await video.save();
      expect(savedVideo.stats.views).toBe(0);
      expect(savedVideo.stats.likes).toBe(0);
    });

    it('should increment view count', async () => {
      const video = new Video({
        title: 'View Count Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      const savedVideo = await video.save();
      expect(savedVideo.stats.views).toBe(0);

      await savedVideo.incrementViews();
      expect(savedVideo.stats.views).toBe(1);

      await savedVideo.incrementViews();
      expect(savedVideo.stats.views).toBe(2);
    });
  });

  describe('Video Tags and Category', () => {
    it('should store and retrieve tags', async () => {
      const tags = ['tutorial', 'javascript', 'coding'];
      const video = new Video({
        title: 'Tagged Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        tags
      });

      const savedVideo = await video.save();
      expect(savedVideo.tags).toEqual(tags);
    });

    it('should store category', async () => {
      const video = new Video({
        title: 'Categorized Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        category: 'Education'
      });

      const savedVideo = await video.save();
      expect(savedVideo.category).toBe('Education');
    });

    it('should trim whitespace from tags', async () => {
      const video = new Video({
        title: 'Trimmed Tags Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        tags: ['  tag1  ', '  tag2  ']
      });

      const savedVideo = await video.save();
      expect(savedVideo.tags).toContain('tag1');
      expect(savedVideo.tags).toContain('tag2');
    });
  });

  describe('Video Metadata', () => {
    it('should store thumbnail URL', async () => {
      const video = new Video({
        title: 'Thumbnail Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        thumbnail: 'https://img.youtube.com/vi/test/maxresdefault.jpg'
      });

      const savedVideo = await video.save();
      expect(savedVideo.thumbnail).toBeDefined();
    });

    it('should store duration in seconds', async () => {
      const video = new Video({
        title: 'Duration Test Video',
        videoType: 'youtube',
        videoUrl: 'https://youtube.com/watch?v=test',
        duration: 360 // 6 minutes
      });

      const savedVideo = await video.save();
      expect(savedVideo.duration).toBe(360);
    });

    it('should store embedCode for direct videos', async () => {
      const embedCode = '<video controls><source src="/uploads/video.mp4" type="video/mp4"></video>';
      const video = new Video({
        title: 'Embed Code Test Video',
        videoType: 'direct',
        embedCode
      });

      const savedVideo = await video.save();
      expect(savedVideo.embedCode).toBe(embedCode);
    });
  });
});
