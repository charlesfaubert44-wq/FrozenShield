const User = require('../../server/models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.createdAt).toBeDefined();
    });

    it('should fail to create user without required fields', async () => {
      const user = new User({});
      let error;

      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should fail to create user with duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'user1@example.com',
        password: 'password123'
      };

      await new User(userData).save();

      const duplicateUser = new User({
        username: 'duplicateuser',
        email: 'user2@example.com',
        password: 'password456'
      });

      let error;
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await new User(userData).save();

      const duplicateUser = new User({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456'
      });

      let error;
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });

    it('should fail with invalid email format', async () => {
      const user = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should set default role to admin', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.role).toBe('admin');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'plainTextPassword123';
      const user = new User({
        username: 'hashtest',
        email: 'hash@example.com',
        password
      });

      const savedUser = await user.save();
      expect(savedUser.password).not.toBe(password);
      expect(savedUser.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should not rehash password if not modified', async () => {
      const user = new User({
        username: 'norehash',
        email: 'norehash@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();
      const originalHash = savedUser.password;

      savedUser.username = 'updatedusername';
      await savedUser.save();

      expect(savedUser.password).toBe(originalHash);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const password = 'correctPassword123';
      const user = new User({
        username: 'comparetest',
        email: 'compare@example.com',
        password
      });

      const savedUser = await user.save();
      const isMatch = await savedUser.comparePassword(password);

      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const user = new User({
        username: 'comparetest2',
        email: 'compare2@example.com',
        password: 'correctPassword123'
      });

      const savedUser = await user.save();
      const isMatch = await savedUser.comparePassword('wrongPassword');

      expect(isMatch).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude password from JSON output', async () => {
      const user = new User({
        username: 'jsontest',
        email: 'json@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();
      const userJSON = savedUser.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.username).toBeDefined();
      expect(userJSON.email).toBeDefined();
    });
  });

  describe('User Validation', () => {
    it('should require minimum username length', async () => {
      const user = new User({
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'password123'
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
    });

    it('should require minimum password length', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'short' // Too short
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should trim whitespace from username and email', async () => {
      const user = new User({
        username: '  testuser  ',
        email: '  test@example.com  ',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
    });

    it('should convert email to lowercase', async () => {
      const user = new User({
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
    });
  });

  describe('Last Login', () => {
    it('should update lastLogin timestamp', async () => {
      const user = new User({
        username: 'logintest',
        email: 'login@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.lastLogin).toBeUndefined();

      savedUser.lastLogin = new Date();
      await savedUser.save();

      expect(savedUser.lastLogin).toBeDefined();
      expect(savedUser.lastLogin).toBeInstanceOf(Date);
    });
  });
});
