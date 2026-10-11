const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_studysense_testing_12345';
process.env.COOKIE_SECRET = 'test_cookie_secret_testing_studysense_67890';
process.env.LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/studysense_test';

const app = require('../app');
const User = require('../models/User');

describe('StudySense Authentication API (Module 1)', () => {
  let authCookie = null;
  const testUser = {
    name: 'Test Student',
    email: `student_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  };

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    // Clean test database
    await User.deleteMany({ email: { $regex: /@example\.com$/i } });
  });

  after(async () => {
    // Clean up created test accounts and close connection
    await User.deleteMany({ email: { $regex: /@example\.com$/i } });
    await mongoose.connection.close();
  });

  // Health Endpoint
  test('GET /api/health should return 200 OK and healthy status', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
  });

  // Registration Validation: Missing Fields
  test('POST /api/auth/register should reject empty fields with 400 Bad Request', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors);
    assert.ok(res.body.errors.name);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.password);
  });

  // Registration Validation: Invalid Email
  test('POST /api/auth/register should reject malformed email with 400 Bad Request', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'not-an-email',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.email);
  });

  // Registration Validation: Weak Password
  test('POST /api/auth/register should reject password under 8 characters with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'shortpass@example.com',
      password: '123',
      confirmPassword: '123',
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.password);
  });

  // Registration Validation: Password Mismatch
  test('POST /api/auth/register should reject mismatched password confirmation with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'mismatch@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'DifferentPassword456!',
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.confirmPassword);
  });

  // Successful Registration
  test('POST /api/auth/register should register a new account and set HttpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.name, testUser.name);
    assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
    assert.equal(res.body.data.user.password, undefined); // Never return password

    // Check database has hashed password, not plaintext
    const dbUser = await User.findOne({ email: testUser.email.toLowerCase() }).select('+password');
    assert.ok(dbUser);
    assert.notEqual(dbUser.password, testUser.password);
    assert.ok(dbUser.password.startsWith('$2')); // bcrypt hash signature

    // Verify Set-Cookie header contains studysense_token
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Set-Cookie header should be present');
    const tokenCookie = cookies.find((c) => c.startsWith('studysense_token='));
    assert.ok(tokenCookie, 'studysense_token cookie must be set');
    assert.ok(tokenCookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
  });

  // Duplicate Registration
  test('POST /api/auth/register should reject duplicate email with 409 Conflict', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('already exists'));
  });

  // Successful Login
  test('POST /api/auth/login should log in with valid credentials and return safe user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
    assert.equal(res.body.data.user.password, undefined);

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const tokenCookie = cookies.find((c) => c.startsWith('studysense_token='));
    assert.ok(tokenCookie);
    authCookie = tokenCookie.split(';')[0];
  });

  // Login with Wrong Password
  test('POST /api/auth/login should reject wrong password with 401 and generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword999!',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  // Login with Nonexistent Email
  test('POST /api/auth/login should reject nonexistent email with 401 and generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent_person_999@example.com',
      password: 'SomePassword123!',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  // GET /api/auth/me without authentication
  test('GET /api/auth/me should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // GET /api/auth/me with authentication cookie
  test('GET /api/auth/me should return authenticated user profile using cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', [authCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
    assert.equal(res.body.data.user.password, undefined);
  });

  // POST /api/auth/logout
  test('POST /api/auth/logout should clear the authentication cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const clearedCookie = cookies.find((c) => c.startsWith('studysense_token='));
    assert.ok(clearedCookie);
    assert.ok(clearedCookie.includes('Expires=Thu, 01 Jan 1970') || clearedCookie.includes('Max-Age=0'));
  });
});
