module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/server.js',
    '!server/seedTestData.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  globalSetup: './tests/setup/globalSetup.js',
  globalTeardown: './tests/setup/globalTeardown.js',
  setupFilesAfterEnv: ['./tests/setup/setupTests.js']
};
