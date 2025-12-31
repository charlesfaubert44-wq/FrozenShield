module.exports = async () => {
  // Stop the in-memory MongoDB instance
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
