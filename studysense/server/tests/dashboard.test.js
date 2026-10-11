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

describe('StudySense Dashboard API (Module 2)', () => {
  let user1Cookie = null;
  let user2Cookie = null;

  const testUser1 = {
    name: 'Alice Student',
    email: `alice_${Date.now()}@dashboardtest.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const testUser2 = {
    name: 'Bob Student',
    email: `bob_${Date.now()}@dashboardtest.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    // Clean test database for dashboard test emails only
    await User.deleteMany({ email: { $regex: /@dashboardtest\.com$/i } });

    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send(testUser1);
    const cookies1 = res1.headers['set-cookie'];
    user1Cookie = cookies1.find((c) => c.startsWith('studysense_token=')).split(';')[0];

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send(testUser2);
    const cookies2 = res2.headers['set-cookie'];
    user2Cookie = cookies2.find((c) => c.startsWith('studysense_token=')).split(';')[0];
  });

  after(async () => {
    await User.deleteMany({ email: { $regex: /@dashboardtest\.com$/i } });
    await mongoose.connection.close();
  });

  // 1. Unauthenticated request rejected
  test('GET /api/dashboard/summary should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/dashboard/summary');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /authentication required/i);
  });

  // 2. Invalid token rejected
  test('GET /api/dashboard/summary should reject invalid bearer token with 401', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', 'Bearer invalid_forged_token_value');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 3. Authenticated request with cookie returns 200 OK
  test('GET /api/dashboard/summary should return 200 OK for authenticated user with HttpOnly cookie', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.equal(res.body.data.user.name, testUser1.name);
    assert.equal(res.body.data.user.email, testUser1.email.toLowerCase());
    assert.equal(res.body.data.user.password, undefined); // Password never exposed
  });

  // 4. Honest metrics for unimplemented features
  test('GET /api/dashboard/summary returns genuine empty metrics without fake data', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    const { summary, subjectProgress, quizPerformance, upcomingRevisions, recentActivity } = res.body.data;

    // Numerical counts start at 0
    assert.equal(summary.subjectsCount, 0);
    assert.equal(summary.topicsMastered, 0);
    assert.equal(summary.quizzesCompleted, 0);
    // Score is null when no quizzes exist
    assert.equal(summary.averageQuizScore, null);

    // Arrays are genuine empty arrays
    assert.deepEqual(subjectProgress, []);
    assert.deepEqual(quizPerformance, []);
    assert.deepEqual(upcomingRevisions, []);
    assert.deepEqual(recentActivity, []);

    // No study time tracking fields exist
    assert.equal(res.body.data.totalStudyHours, undefined);
    assert.equal(res.body.data.dailyStreaks, undefined);
    assert.equal(res.body.data.pomodoroSessions, undefined);
  });

  // 5. User data isolation
  test('GET /api/dashboard/summary ensures strict user data isolation between accounts', async () => {
    const res1 = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', [user1Cookie]);

    const res2 = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', [user2Cookie]);

    assert.equal(res1.status, 200);
    assert.equal(res2.status, 200);
    assert.notEqual(res1.body.data.user.id, res2.body.data.user.id);
    assert.equal(res1.body.data.user.name, testUser1.name);
    assert.equal(res2.body.data.user.name, testUser2.name);
  });

  // 6. Meta payload indicates implemented vs pending modules
  test('GET /api/dashboard/summary returns accurate module implementation metadata', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    const { meta } = res.body.data;
    assert.ok(meta);
    assert.equal(meta.modulesImplemented.module1_auth, true);
    assert.equal(meta.modulesImplemented.module2_dashboard, true);
    assert.equal(meta.modulesImplemented.module3_subjects_topics, true);
    assert.equal(meta.modulesImplemented.module4_quizzes, false);
    assert.equal(meta.modulesImplemented.module5_mistakes, false);
    assert.equal(meta.modulesImplemented.module6_revisions, false);
  });
});

