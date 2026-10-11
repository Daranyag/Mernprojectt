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
const { StudyMaterial } = require('../models/StudyMaterial');

describe('StudySense Study Materials & Notes API (Module 4)', () => {
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  let user1SubjectId = null;
  let user1TopicId = null;
  let user2SubjectId = null;

  let createdNoteId = null;
  let createdResourceId = null;

  const testUser1 = {
    name: 'Module4 Alice',
    email: `m4_alice_${Date.now()}@m4test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const testUser2 = {
    name: 'Module4 Bob',
    email: `m4_bob_${Date.now()}@m4test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    // Clean test database for m4 users
    await User.deleteMany({ email: { $regex: /@m4test\.com$/i } });

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
    const subjRes1 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: 'Computer Networks', color: '#3b82f6' });
    user1SubjectId = subjRes1.body.data.subject.id;

    // Create Topic for User 1
    const topRes1 = await request(app)
      .post(`/api/subjects/${user1SubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({ title: 'TCP/IP Model' });
    user1TopicId = topRes1.body.data.topic.id;

    // Create Subject for User 2
    const subjRes2 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user2Cookie])
      .send({ name: 'Cloud Computing', color: '#10b981' });
    user2SubjectId = subjRes2.body.data.subject.id;
  });

  after(async () => {
    await StudyMaterial.deleteMany({ user: { $in: [user1Id, user2Id] } });
    await Topic.deleteMany({ user: { $in: [user1Id, user2Id] } });
    await Subject.deleteMany({ user: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ email: { $regex: /@m4test\.com$/i } });
    await mongoose.connection.close();
  });

  // 1. Unauthenticated request rejected
  test('POST /api/materials rejects unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/materials').send({
      type: 'note',
      title: 'OSI Layers Note',
      subject: user1SubjectId,
      content: 'Physical, Data Link, Network, Transport, Session, Presentation, Application',
    });
    assert.equal(res.status, 401);
  });

  // 2. Create valid Note
  test('POST /api/materials creates a valid study note', async () => {
    const res = await request(app)
      .post('/api/materials')
      .set('Cookie', [user1Cookie])
      .send({
        type: 'note',
        title: 'TCP vs UDP Deep Dive',
        subject: user1SubjectId,
        topic: user1TopicId,
        content: 'TCP is connection-oriented with 3-way handshake. UDP is connectionless and lightweight.',
        tags: ['networking', 'tcp', 'transport'],
        isFavorite: true,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.material.type, 'note');
    assert.equal(res.body.data.material.title, 'TCP vs UDP Deep Dive');
    assert.equal(res.body.data.material.isFavorite, true);
    assert.equal(res.body.data.material.isReviewed, false);
    assert.deepEqual(res.body.data.material.tags, ['networking', 'tcp', 'transport']);

    createdNoteId = res.body.data.material.id;
  });

  // 3. Reject note without content
  test('POST /api/materials rejects note without content with 400', async () => {
    const res = await request(app)
      .post('/api/materials')
      .set('Cookie', [user1Cookie])
      .send({
        type: 'note',
        title: 'Empty Note',
        subject: user1SubjectId,
        content: '',
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.content);
  });

  // 4. Create valid External Resource
  test('POST /api/materials creates a valid external resource with URL', async () => {
    const res = await request(app)
      .post('/api/materials')
      .set('Cookie', [user1Cookie])
      .send({
        type: 'resource',
        title: 'RFC 793 - TCP Specification',
        subject: user1SubjectId,
        topic: user1TopicId,
        url: 'https://datatracker.ietf.org/doc/html/rfc793',
        content: 'Official IETF standard specification for Transmission Control Protocol.',
        tags: ['rfc', 'standards'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.material.type, 'resource');
    assert.equal(res.body.data.material.url, 'https://datatracker.ietf.org/doc/html/rfc793');

    createdResourceId = res.body.data.material.id;
  });

  // 5. Reject external resource with invalid URL
  test('POST /api/materials rejects external resource with invalid URL with 400', async () => {
    const res = await request(app)
      .post('/api/materials')
      .set('Cookie', [user1Cookie])
      .send({
        type: 'resource',
        title: 'Bad URL Resource',
        subject: user1SubjectId,
        url: 'ftp://invalid-web-link',
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.errors.url);
  });

  // 6. Reject material referencing another user's subject
  test('POST /api/materials rejects linking to another user subject with 404', async () => {
    const res = await request(app)
      .post('/api/materials')
      .set('Cookie', [user1Cookie])
      .send({
        type: 'note',
        title: 'Unauthorized Subject Note',
        subject: user2SubjectId, // Belongs to User 2!
        content: 'Should be rejected',
      });

    assert.equal(res.status, 404);
  });

  // 7. Reject material referencing topic that belongs to another subject
  test('POST /api/materials rejects topic not belonging to selected subject with 400', async () => {
    // Create an extra subject for User 1
    const extraSubj = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: 'Web Engineering' });

    const res = await request(app)
      .post('/api/materials')
      .set('Cookie', [user1Cookie])
      .send({
        type: 'note',
        title: 'Mismatched Topic Note',
        subject: extraSubj.body.data.subject.id,
        topic: user1TopicId, // user1TopicId belongs to 'Computer Networks', not 'Web Engineering'!
        content: 'Should be rejected due to mismatch',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /not belong to the selected subject/i);
  });

  // 8. List materials returns only authenticated user's records
  test('GET /api/materials returns only authenticated user materials', async () => {
    const res1 = await request(app).get('/api/materials').set('Cookie', [user1Cookie]);
    assert.equal(res1.status, 200);
    assert.equal(res1.body.data.materials.length, 2);

    const res2 = await request(app).get('/api/materials').set('Cookie', [user2Cookie]);
    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.materials.length, 0); // User 2 has no materials
  });

  // 9. Filter and search materials
  test('GET /api/materials filters by type, favorite, and search term', async () => {
    // Search for "RFC"
    const searchRes = await request(app)
      .get('/api/materials?search=RFC')
      .set('Cookie', [user1Cookie]);
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.data.materials.length, 1);
    assert.equal(searchRes.body.data.materials[0].title, 'RFC 793 - TCP Specification');

    // Filter by type=note
    const typeRes = await request(app)
      .get('/api/materials?type=note')
      .set('Cookie', [user1Cookie]);
    assert.equal(typeRes.status, 200);
    assert.equal(typeRes.body.data.materials.length, 1);
    assert.equal(typeRes.body.data.materials[0].type, 'note');

    // Filter by favorite=true
    const favRes = await request(app)
      .get('/api/materials?favorite=true')
      .set('Cookie', [user1Cookie]);
    assert.equal(favRes.status, 200);
    assert.equal(favRes.body.data.materials.length, 1);
    assert.equal(favRes.body.data.materials[0].isFavorite, true);
  });

  // 10. Toggle favorite status
  test('PATCH /api/materials/:id/favorite toggles favorite boolean', async () => {
    const res = await request(app)
      .patch(`/api/materials/${createdNoteId}/favorite`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.isFavorite, false); // Was true, now false

    // Toggle back
    const resBack = await request(app)
      .patch(`/api/materials/${createdNoteId}/favorite`)
      .set('Cookie', [user1Cookie]);
    assert.equal(resBack.body.data.isFavorite, true);
  });

  // 11. Toggle reviewed status
  test('PATCH /api/materials/:id/reviewed toggles reviewed boolean', async () => {
    const res = await request(app)
      .patch(`/api/materials/${createdNoteId}/reviewed`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.isReviewed, true); // Was false, now true
  });

  // 12. User 2 cannot access or modify User 1 material
  test('User isolation: User 2 cannot view, update, favorite, or delete User 1 material', async () => {
    // Get
    const getRes = await request(app)
      .get(`/api/materials/${createdNoteId}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(getRes.status, 404);

    // Update
    const putRes = await request(app)
      .put(`/api/materials/${createdNoteId}`)
      .set('Cookie', [user2Cookie])
      .send({ title: 'Hacked Title' });
    assert.equal(putRes.status, 404);

    // Toggle favorite
    const favRes = await request(app)
      .patch(`/api/materials/${createdNoteId}/favorite`)
      .set('Cookie', [user2Cookie]);
    assert.equal(favRes.status, 404);

    // Delete
    const delRes = await request(app)
      .delete(`/api/materials/${createdNoteId}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(delRes.status, 404);
  });

  // 13. Update material successfully
  test('PUT /api/materials/:id updates material content and tags', async () => {
    const res = await request(app)
      .put(`/api/materials/${createdNoteId}`)
      .set('Cookie', [user1Cookie])
      .send({
        title: 'TCP vs UDP Deep Dive - Revised Edition',
        content: 'Updated content with reliable transport details and flow control windows.',
        tags: ['networking', 'tcp', 'udp', 'revised'],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.material.title, 'TCP vs UDP Deep Dive - Revised Edition');
    assert.ok(res.body.data.material.tags.includes('revised'));
  });

  // 14. Delete single material
  test('DELETE /api/materials/:id deletes material for owner', async () => {
    const res = await request(app)
      .delete(`/api/materials/${createdNoteId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify it is gone
    const checkRes = await request(app)
      .get(`/api/materials/${createdNoteId}`)
      .set('Cookie', [user1Cookie]);
    assert.equal(checkRes.status, 404);
  });

  // 15. Deleting topic unlinks material topic field safely
  test('Deleting a topic unlinks its topic field on existing material without deleting the material', async () => {
    // createdResourceId was linked to user1TopicId
    await request(app)
      .delete(`/api/topics/${user1TopicId}`)
      .set('Cookie', [user1Cookie]);

    // Resource should still exist, with topic set to null
    const res = await request(app)
      .get(`/api/materials/${createdResourceId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.material.topic, null);
  });

  // 16. Deleting subject cascades and deletes all its materials
  test('Deleting a subject cascades and permanently deletes its study materials', async () => {
    await request(app)
      .delete(`/api/subjects/${user1SubjectId}`)
      .set('Cookie', [user1Cookie]);

    const res = await request(app)
      .get(`/api/materials/${createdResourceId}`)
      .set('Cookie', [user1Cookie]);
    assert.equal(res.status, 404);
  });
});
