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
const { ImportantTopicAnalysis } = require('../models/ImportantTopicAnalysis');

describe('StudySense Important Topic Generator API (Module 10)', () => {
  let user1Cookie;
  let user1Id;
  let user2Cookie;
  let user2Id;
  let user1SubjectId;

  const testUser1 = {
    name: 'Topic Analysis Student',
    email: `m10_alice_${Date.now()}@m10test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const testUser2 = {
    name: 'Other Student',
    email: `m10_bob_${Date.now()}@m10test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!'
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    await User.deleteMany({ email: { $regex: /@m10test\.com$/i } });

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

    // Create Subject for User 1
    const subRes = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({
        name: 'Database Management Systems',
        description: 'Core MCA Subject'
      });
    user1SubjectId = subRes.body.data.subject.id;
  });

  after(async () => {
    if (user1Id) {
      await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
      await Subject.deleteMany({ user: { $in: [user1Id, user2Id] } });
      await ImportantTopicAnalysis.deleteMany({ user: { $in: [user1Id, user2Id] } });
    }
  });

  // Test 1: Authentication enforcement
  test('GET /api/important-topics rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/important-topics');
    assert.equal(res.status, 401);
  });

  // Test 2: Create and retrieve saved analysis record
  test('ImportantTopicAnalysis model stores topics and supports revision tracking', async () => {
    const analysis = await ImportantTopicAnalysis.create({
      user: user1Id,
      subject: user1SubjectId,
      title: 'DBMS End-Sem Priority Analysis',
      sourceScope: 'general_knowledge',
      targetTopicCount: 2,
      summaryNote: 'Core transaction and indexing topics.',
      topics: [
        {
          topicTitle: 'ACID Properties and Transaction States',
          unitOrChapter: 'Unit 3: Transactions',
          shortDescription: 'Atomicity, Consistency, Isolation, and Durability principles.',
          priority: 'High',
          priorityEvidence: 'Foundational transaction processing topic with high theoretical and practical weightage.',
          suggestedQuestionFormats: ['Short Answer', '10-Mark Essay'],
          suggestedMarks: [5, 10],
          revisionStatus: 'Not Reviewed'
        },
        {
          topicTitle: 'B+ Tree Indexing Mechanisms',
          unitOrChapter: 'Unit 4: Indexing',
          shortDescription: 'Balanced search tree structures for disk storage.',
          priority: 'High',
          priorityEvidence: 'Primary storage organization algorithm in database engines.',
          suggestedQuestionFormats: ['10-Mark Essay'],
          suggestedMarks: [10],
          revisionStatus: 'Not Reviewed'
        }
      ]
    });

    assert.ok(analysis._id);
    assert.equal(analysis.topics.length, 2);

    // Retrieve via API
    const res = await request(app)
      .get(`/api/important-topics/${analysis._id}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.title, 'DBMS End-Sem Priority Analysis');
    assert.equal(res.body.data.topics[0].topicTitle, 'ACID Properties and Transaction States');
  });

  // Test 3: Update revision status
  test('PATCH /api/important-topics/:id/topics/:topicId/status updates revision status', async () => {
    const analysis = await ImportantTopicAnalysis.findOne({ user: user1Id });
    assert.ok(analysis);
    const targetTopic = analysis.topics[0];

    const patchRes = await request(app)
      .patch(`/api/important-topics/${analysis._id}/topics/${targetTopic._id}/status`)
      .set('Cookie', [user1Cookie])
      .send({ revisionStatus: 'Understood' });

    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.data.revisionStatus, 'Understood');

    // Verify in database
    const updated = await ImportantTopicAnalysis.findById(analysis._id);
    assert.equal(updated.topics[0].revisionStatus, 'Understood');
  });

  // Test 4: Reject invalid revision status
  test('PATCH revision status rejects invalid status values with 400', async () => {
    const analysis = await ImportantTopicAnalysis.findOne({ user: user1Id });
    const targetTopic = analysis.topics[0];

    const res = await request(app)
      .patch(`/api/important-topics/${analysis._id}/topics/${targetTopic._id}/status`)
      .set('Cookie', [user1Cookie])
      .send({ revisionStatus: 'MasteredCompletely' });

    assert.equal(res.status, 400);
  });

  // Test 5: User data isolation
  test('User isolation: User 2 cannot access or delete User 1 topic analysis', async () => {
    const analysis = await ImportantTopicAnalysis.findOne({ user: user1Id });

    // User 2 GET
    const getRes = await request(app)
      .get(`/api/important-topics/${analysis._id}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(getRes.status, 404);

    // User 2 DELETE
    const delRes = await request(app)
      .delete(`/api/important-topics/${analysis._id}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(delRes.status, 404);
  });

  // Test 6: User 1 deletes their own analysis
  test('User 1 can delete their own analysis', async () => {
    const analysis = await ImportantTopicAnalysis.findOne({ user: user1Id });

    const delRes = await request(app)
      .delete(`/api/important-topics/${analysis._id}`)
      .set('Cookie', [user1Cookie]);
    assert.equal(delRes.status, 200);

    const check = await ImportantTopicAnalysis.findById(analysis._id);
    assert.equal(check, null);
  });
});
