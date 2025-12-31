const jwt = require('jsonwebtoken');
const User = require('../../server/models/User');
const Album = require('../../server/models/Album');
const Video = require('../../server/models/Video');
const Project = require('../../server/models/Project');
const Media = require('../../server/models/Media');

/**
 * Create a test user and return user object with token
 */
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'admin'
  };

  const userData = { ...defaultUser, ...overrides };
  const user = await User.create(userData);

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '30d', algorithm: 'HS256' }
  );

  return { user, token };
};

/**
 * Create a test album
 */
const createTestAlbum = async (overrides = {}) => {
  const defaultAlbum = {
    title: 'Test Album',
    description: 'A test album description',
    tags: ['test', 'sample'],
    visibility: 'public'
  };

  const albumData = { ...defaultAlbum, ...overrides };
  return await Album.create(albumData);
};

/**
 * Create a test video
 */
const createTestVideo = async (overrides = {}) => {
  const defaultVideo = {
    title: 'Test Video',
    description: 'A test video description',
    videoType: 'youtube',
    videoUrl: 'https://youtube.com/watch?v=test',
    tags: ['test', 'sample'],
    visibility: 'public'
  };

  const videoData = { ...defaultVideo, ...overrides };
  return await Video.create(videoData);
};

/**
 * Create a test project
 */
const createTestProject = async (overrides = {}) => {
  const defaultProject = {
    title: 'Test Project',
    shortDescription: 'A test project',
    longDescription: 'A detailed description of the test project',
    technologies: ['React', 'Node.js'],
    category: 'Web Development',
    visibility: 'public'
  };

  const projectData = { ...defaultProject, ...overrides };
  return await Project.create(projectData);
};

/**
 * Create test media
 */
const createTestMedia = async (albumId, overrides = {}) => {
  const defaultMedia = {
    albumId,
    type: 'image',
    url: '/uploads/test-image.jpg',
    caption: 'Test image',
    alt: 'Test alt text'
  };

  const mediaData = { ...defaultMedia, ...overrides };
  return await Media.create(mediaData);
};

module.exports = {
  createTestUser,
  createTestAlbum,
  createTestVideo,
  createTestProject,
  createTestMedia
};
