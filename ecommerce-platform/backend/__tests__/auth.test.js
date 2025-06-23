const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path as necessary
const server = require('../server'); // Your Express app instance
const connectDB = require('../config/db'); // To connect and disconnect

// Helper to generate unique user data
const generateUniqueUserData = (role = 'buyer') => {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'password123',
    passwordConfirm: 'password123',
    role: role,
  };
};

beforeAll(async () => {
  // Note: server.js already calls connectDB().
  // Ensure a clean state if connectDB was already called by server import
  // This setup assumes connectDB can be called multiple times or handles existing connections.
  // Alternatively, manage DB connection explicitly here.
  // For tests, it's often better to connect/disconnect around suites or tests.
  // await connectDB(); // connectDB is called when server.js is imported if NODE_ENV is set.
});

afterEach(async () => {
  // Clean up users after each test to ensure test independence
  // This is crucial for tests that create data.
  if (mongoose.connection.readyState === 1 && process.env.NODE_ENV === 'test') { // 1 === connected
    try {
        await User.deleteMany({});
    } catch (error) {
        console.error("Error cleaning up User collection:", error);
    }
  }
});

afterAll(async () => {
  // Disconnect Mongoose
  // Supertest manages the server lifecycle for the app, so explicit app.close() is not typically needed here
  // if server was just the Express app instance.
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  // console.log('Test suite finished, DB disconnected.');
});


describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new buyer successfully', async () => {
      const userData = generateUniqueUserData('buyer');
      const res = await request(server)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', userData.email);
      expect(res.body.data.user).toHaveProperty('role', 'buyer');
      expect(res.body.data.user).not.toHaveProperty('password');

      // Check if user is actually in the database
      const dbUser = await User.findOne({ email: userData.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.email).toBe(userData.email);
    });

    it('should register a new seller successfully', async () => {
      const userData = generateUniqueUserData('seller');
      const res = await request(server)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.user).toHaveProperty('role', 'seller');
    });

    it('should fail to register with an existing email', async () => {
      const userData = generateUniqueUserData();
      // First registration
      await request(server).post('/api/auth/register').send(userData);

      // Attempt to register again with the same email
      const res = await request(server)
        .post('/api/auth/register')
        .send({ ...generateUniqueUserData(), email: userData.email }); // Different username, same email

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User with this email already exists.');
    });

    it('should fail if passwords do not match', async () => {
        const userData = generateUniqueUserData();
        const res = await request(server)
            .post('/api/auth/register')
            .send({ ...userData, passwordConfirm: 'differentpassword' });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Passwords do not match.');
    });

     it('should fail if required fields are missing', async () => {
        const res = await request(server)
            .post('/api/auth/register')
            .send({ email: 'test@example.com', password: 'password123' }); // Missing username, passwordConfirm, role

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Please provide username, email, password, password confirmation, and role.');
    });
  });

  describe('POST /api/auth/login', () => {
    let registeredUser;
    const userData = generateUniqueUserData();

    beforeEach(async () => {
      // Register a user to test login
      const regResponse = await request(server).post('/api/auth/register').send(userData);
      registeredUser = regResponse.body.data.user;
    });

    it('should login an existing user successfully', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', userData.email);
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Incorrect email or password.');
    });

    it('should fail login with non-existent email', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Incorrect email or password.');
    });

     it('should fail if email or password is not provided', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({ email: userData.email }); // Missing password

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Please provide email and password.');
    });
  });
});
