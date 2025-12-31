const Project = require('../../server/models/Project');

describe('Project Model', () => {
  describe('Project Creation', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        title: 'Test Project',
        shortDescription: 'A short description',
        longDescription: 'A detailed long description of the project',
        technologies: ['React', 'Node.js', 'MongoDB'],
        category: 'Web Development',
        featured: true,
        visibility: 'public'
      };

      const project = new Project(projectData);
      const savedProject = await project.save();

      expect(savedProject._id).toBeDefined();
      expect(savedProject.title).toBe(projectData.title);
      expect(savedProject.shortDescription).toBe(projectData.shortDescription);
      expect(savedProject.technologies).toEqual(projectData.technologies);
      expect(savedProject.category).toBe(projectData.category);
      expect(savedProject.slug).toBeDefined();
      expect(savedProject.createdAt).toBeDefined();
    });

    it('should fail to create project without title', async () => {
      const project = new Project({
        shortDescription: 'No title project'
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should set default values correctly', async () => {
      const project = new Project({
        title: 'Default Test Project'
      });

      const savedProject = await project.save();

      expect(savedProject.visibility).toBe('public');
      expect(savedProject.featured).toBe(false);
      expect(savedProject.order).toBe(0);
      expect(savedProject.stats.views).toBe(0);
      expect(savedProject.stats.likes).toBe(0);
    });
  });

  describe('Slug Generation', () => {
    it('should generate slug from title', async () => {
      const project = new Project({
        title: 'My Awesome Web Project'
      });

      const savedProject = await project.save();
      expect(savedProject.slug).toBe('my-awesome-web-project');
    });

    it('should handle special characters in slug', async () => {
      const project = new Project({
        title: 'Project #1: E-Commerce Site!'
      });

      const savedProject = await project.save();
      expect(savedProject.slug).toBe('project-1-e-commerce-site');
    });

    it('should not regenerate slug if manually set', async () => {
      const customSlug = 'my-custom-project-slug';
      const project = new Project({
        title: 'Test Project',
        slug: customSlug
      });

      const savedProject = await project.save();
      expect(savedProject.slug).toBe(customSlug);
    });
  });

  describe('Project Validation', () => {
    it('should enforce maximum title length', async () => {
      const longTitle = 'a'.repeat(101);
      const project = new Project({
        title: longTitle
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
    });

    it('should enforce maximum shortDescription length', async () => {
      const longDescription = 'a'.repeat(201);
      const project = new Project({
        title: 'Test Project',
        shortDescription: longDescription
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.shortDescription).toBeDefined();
    });

    it('should enforce maximum category length', async () => {
      const longCategory = 'a'.repeat(51);
      const project = new Project({
        title: 'Test Project',
        category: longCategory
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.category).toBeDefined();
    });

    it('should enforce maximum client length', async () => {
      const longClient = 'a'.repeat(101);
      const project = new Project({
        title: 'Test Project',
        client: longClient
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.client).toBeDefined();
    });

    it('should validate visibility enum values', async () => {
      const project = new Project({
        title: 'Test Project',
        visibility: 'invalid'
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.visibility).toBeDefined();
    });
  });

  describe('Project Images', () => {
    it('should store project images with metadata', async () => {
      const images = [
        { url: '/uploads/img1.jpg', caption: 'Homepage', order: 0 },
        { url: '/uploads/img2.jpg', caption: 'Dashboard', order: 1 }
      ];

      const project = new Project({
        title: 'Image Test Project',
        images
      });

      const savedProject = await project.save();
      expect(savedProject.images).toHaveLength(2);
      expect(savedProject.images[0].url).toBe(images[0].url);
      expect(savedProject.images[0].caption).toBe(images[0].caption);
      expect(savedProject.images[1].url).toBe(images[1].url);
    });

    it('should require url for each image', async () => {
      const project = new Project({
        title: 'Test Project',
        images: [{ caption: 'No URL' }]
      });

      let error;
      try {
        await project.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should store thumbnail URL', async () => {
      const project = new Project({
        title: 'Thumbnail Test Project',
        thumbnail: '/uploads/thumbnail.jpg'
      });

      const savedProject = await project.save();
      expect(savedProject.thumbnail).toBe('/uploads/thumbnail.jpg');
    });
  });

  describe('Project Technologies', () => {
    it('should store array of technologies', async () => {
      const technologies = ['React', 'Node.js', 'Express', 'MongoDB'];
      const project = new Project({
        title: 'Tech Stack Project',
        technologies
      });

      const savedProject = await project.save();
      expect(savedProject.technologies).toEqual(technologies);
    });

    it('should trim whitespace from technologies', async () => {
      const project = new Project({
        title: 'Trimmed Tech Project',
        technologies: ['  React  ', '  Node.js  ']
      });

      const savedProject = await project.save();
      expect(savedProject.technologies).toContain('React');
      expect(savedProject.technologies).toContain('Node.js');
    });
  });

  describe('Project URLs', () => {
    it('should store projectUrl and githubUrl', async () => {
      const project = new Project({
        title: 'URL Test Project',
        projectUrl: 'https://example.com',
        githubUrl: 'https://github.com/user/repo'
      });

      const savedProject = await project.save();
      expect(savedProject.projectUrl).toBe('https://example.com');
      expect(savedProject.githubUrl).toBe('https://github.com/user/repo');
    });

    it('should trim URLs', async () => {
      const project = new Project({
        title: 'Trimmed URL Project',
        projectUrl: '  https://example.com  '
      });

      const savedProject = await project.save();
      expect(savedProject.projectUrl).toBe('https://example.com');
    });
  });

  describe('Project Stats', () => {
    it('should initialize stats with default values', async () => {
      const project = new Project({
        title: 'Stats Test Project'
      });

      const savedProject = await project.save();
      expect(savedProject.stats.views).toBe(0);
      expect(savedProject.stats.likes).toBe(0);
    });

    it('should increment view count and return new count', async () => {
      const project = new Project({
        title: 'View Count Test Project'
      });

      const savedProject = await project.save();
      expect(savedProject.stats.views).toBe(0);

      const newViews1 = await savedProject.incrementViews();
      expect(newViews1).toBe(1);
      expect(savedProject.stats.views).toBe(1);

      const newViews2 = await savedProject.incrementViews();
      expect(newViews2).toBe(2);
      expect(savedProject.stats.views).toBe(2);
    });
  });

  describe('Project Metadata', () => {
    it('should store completedDate', async () => {
      const completedDate = new Date('2024-01-15');
      const project = new Project({
        title: 'Completed Project',
        completedDate
      });

      const savedProject = await project.save();
      expect(savedProject.completedDate).toEqual(completedDate);
    });

    it('should store client name', async () => {
      const project = new Project({
        title: 'Client Project',
        client: 'Acme Corporation'
      });

      const savedProject = await project.save();
      expect(savedProject.client).toBe('Acme Corporation');
    });

    it('should store category', async () => {
      const project = new Project({
        title: 'Categorized Project',
        category: 'E-Commerce'
      });

      const savedProject = await project.save();
      expect(savedProject.category).toBe('E-Commerce');
    });
  });

  describe('Project Updates', () => {
    it('should update updatedAt timestamp on save', async () => {
      const project = new Project({
        title: 'Update Test Project'
      });

      const savedProject = await project.save();
      const originalUpdatedAt = savedProject.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      savedProject.shortDescription = 'Updated description';
      await savedProject.save();

      expect(savedProject.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Project Relations', () => {
    it('should allow albumId reference', async () => {
      const mongoose = require('mongoose');
      const albumId = new mongoose.Types.ObjectId();

      const project = new Project({
        title: 'Album Project',
        albumId
      });

      const savedProject = await project.save();
      expect(savedProject.albumId.toString()).toBe(albumId.toString());
    });
  });

  describe('Project Ordering', () => {
    it('should support ordering projects', async () => {
      const project1 = new Project({
        title: 'First Project',
        order: 1
      });

      const project2 = new Project({
        title: 'Second Project',
        order: 2
      });

      await project1.save();
      await project2.save();

      const projects = await Project.find().sort({ order: 1 });
      expect(projects[0].title).toBe('First Project');
      expect(projects[1].title).toBe('Second Project');
    });
  });
});
