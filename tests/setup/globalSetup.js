const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Store the mongod instance for cleanup
  global.__MONGOD__ = mongod;

  // Store URI in environment for tests
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.NODE_ENV = 'test';
};
