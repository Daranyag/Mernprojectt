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
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

describe('StudySense Subject & Topic API (Module 3)', () => {
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  let createdSubjectId = null;
  let createdTopicId = null;

  const testUser1 = {
    name: 'Module3 Alice',
    email: `m3_alice_${Date.now()}@m3test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const testUser2 = {
    name: 'Module3 Bob',
    email: `m3_bob_${Date.now()}@m3test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    // Clean test database for m3 users
    await User.deleteMany({ email: { $regex: /@m3test\.com$/i } });

    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send(testUser1);
    const cookies1 = res1.headers['set-cookie'];
    user1Cookie = cookies1.find((c) => c.startsWith('studysense_token=')).split(';')[0];
    user1Id = res1.body.data.user.id;

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send(testUser2);
    const cookies2 = res2.headers['set-cookie'];
    user2Cookie = cookies2.find((c) => c.startsWith('studysense_token=')).split(';')[0];
    user2Id = res2.body.data.user.id;
  });

  after(async () => {
    await Subject.deleteMany({ user: { $in: [user1Id, user2Id] } });
    await Topic.deleteMany({ user: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $regex: /@m3test\.com$/i } });
    await mongoose.connection.close();
  });

  // 1. Unauthenticated subject creation rejected
  test('POST /api/subjects should reject unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/subjects').send({ name: 'Data Structures' });
    assert.equal(res.status, 401);
  });

  // 2. Validate empty subject name
  test('POST /api/subjects should reject empty name with 400', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: '' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.name);
  });

  // 3. Create Subject successfully
  test('POST /api/subjects creates subject for authenticated user', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({
        name: 'Data Structures & Algorithms',
        description: 'Core MCA Computer Science subject',
        color: '#6366f1',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.subject.name, 'Data Structures & Algorithms');
    assert.equal(res.body.data.subject.color, '#6366f1');
    assert.equal(res.body.data.subject.topicsCount, 0);
    assert.equal(res.body.data.subject.progressPercentage, 0);

    createdSubjectId = res.body.data.subject.id;
  });

  // 4. Duplicate subject name for same user rejected with 409
  test('POST /api/subjects rejects duplicate subject name with 409', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({
        name: 'Data Structures & Algorithms',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  // 5. User 2 can create subject with same name (User isolation)
  test('POST /api/subjects allows another user to use the same subject name', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user2Cookie])
      .send({
        name: 'Data Structures & Algorithms',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  // 6. User 2 cannot access User 1 subject
  test('GET /api/subjects/:id returns 404/denied when accessing another user subject', async () => {
    const res = await request(app)
      .get(`/api/subjects/${createdSubjectId}`)
      .set('Cookie', [user2Cookie]);

    assert.equal(res.status, 404);
  });

  // 7. User 1 can retrieve own subject with empty topics list and 0 progress
  test('GET /api/subjects/:id returns own subject with topic progress summary', async () => {
    const res = await request(app)
      .get(`/api/subjects/${createdSubjectId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.subject.id, createdSubjectId);
    assert.equal(res.body.data.subject.progress.totalTopics, 0);
    assert.equal(res.body.data.subject.progress.progressPercentage, 0);
    assert.deepEqual(res.body.data.subject.topics, []);
  });

  // 8. Create Topic in owned subject
  test('POST /api/subjects/:subjectId/topics creates topic in owned subject', async () => {
    const res = await request(app)
      .post(`/api/subjects/${createdSubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({
        title: 'Binary Search Trees',
        description: 'Operations, balancing, and traversals',
        status: 'In Progress',
        priority: 'High',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.topic.title, 'Binary Search Trees');
    assert.equal(res.body.data.topic.status, 'In Progress');
    assert.equal(res.body.data.topic.priority, 'High');

    createdTopicId = res.body.data.topic.id;
  });

  // 9. Reject creating topic under another user's subject
  test('POST /api/subjects/:subjectId/topics rejects creating topic in another user subject', async () => {
    const res = await request(app)
      .post(`/api/subjects/${createdSubjectId}/topics`)
      .set('Cookie', [user2Cookie])
      .send({
        title: 'Unauthorized Topic',
      });

    assert.equal(res.status, 404);
  });

  // 10. Reject invalid topic status
  test('POST /api/subjects/:subjectId/topics rejects invalid status with 400', async () => {
    const res = await request(app)
      .post(`/api/subjects/${createdSubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({
        title: 'Graph Algorithms',
        status: 'UnknownStatus',
      });

    assert.equal(res.status, 400);
  });

  // 11. Add a second topic with status 'Completed' and third with 'Mastered'
  test('Calculate topic completion and mastery percentage accurately', async () => {
    // Topic 2: Completed
    await request(app)
      .post(`/api/subjects/${createdSubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({ title: 'Arrays and Linked Lists', status: 'Completed' });

    // Topic 3: Mastered
    await request(app)
      .post(`/api/subjects/${createdSubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({ title: 'Stack and Queue', status: 'Mastered' });

    // Retrieve subject details
    const res = await request(app)
      .get(`/api/subjects/${createdSubjectId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    const { progress } = res.body.data.subject;
    // Total = 3 (1 In Progress, 1 Completed, 1 Mastered)
    // Completed or Mastered = 2
    // Expected percentage = round((2/3) * 100) = 67%
    assert.equal(progress.totalTopics, 3);
    assert.equal(progress.completedTopics, 2);
    assert.equal(progress.masteredTopics, 1);
    assert.equal(progress.inProgressTopics, 1);
    assert.equal(progress.progressPercentage, 67);
  });

  // 12. Update Topic details and status
  test('PUT /api/topics/:id updates topic status and priority', async () => {
    const res = await request(app)
      .put(`/api/topics/${createdTopicId}`)
      .set('Cookie', [user1Cookie])
      .send({
        status: 'Mastered',
        priority: 'Low',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.topic.status, 'Mastered');
    assert.equal(res.body.data.topic.priority, 'Low');
  });

  // 13. User 2 cannot edit or delete User 1 topic
  test('PUT /api/topics/:id rejects update from another user with 404', async () => {
    const res = await request(app)
      .put(`/api/topics/${createdTopicId}`)
      .set('Cookie', [user2Cookie])
      .send({ status: 'Not Started' });

    assert.equal(res.status, 404);
  });

  // 14. Delete single topic
  test('DELETE /api/topics/:id deletes topic for owner', async () => {
    const res = await request(app)
      .delete(`/api/topics/${createdTopicId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  // 15. Delete subject and cascade delete child topics
  test('DELETE /api/subjects/:id deletes subject and cascades all remaining topics', async () => {
    const res = await request(app)
      .delete(`/api/subjects/${createdSubjectId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.deletedTopicsCount, 2); // The 2 remaining topics

    // Confirm subject is gone
    const checkSubject = await Subject.findById(createdSubjectId);
    assert.equal(checkSubject, null);

    // Confirm child topics are gone
    const checkTopics = await Topic.find({ subject: createdSubjectId });
    assert.equal(checkTopics.length, 0);
  });
});
