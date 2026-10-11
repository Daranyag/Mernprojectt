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
const { ExamPaper } = require('../models/ExamPaper');
const { calculatePaperMarks } = require('../services/examPaper.service');

describe('StudySense Exam Paper Generator API (Module 9)', () => {
  let user1Cookie;
  let user1Id;
  let user2Cookie;
  let user2Id;
  let user1SubjectId;

  const testUser1 = {
    name: 'Exam Paper Student',
    email: `m9_alice_${Date.now()}@m9test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const testUser2 = {
    name: 'Other Student',
    email: `m9_bob_${Date.now()}@m9test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!'
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    await User.deleteMany({ email: { $regex: /@m9test\.com$/i } });

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
        name: 'Advanced Software Engineering',
        description: 'MCA Core Paper'
      });
    user1SubjectId = subRes.body.data.subject.id;
  });

  after(async () => {
    if (user1Id) {
      await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
      await Subject.deleteMany({ user: { $in: [user1Id, user2Id] } });
      await ExamPaper.deleteMany({ user: { $in: [user1Id, user2Id] } });
    }
  });

  // Test 1: Marks calculation service logic
  test('calculatePaperMarks accurately computes available and attempted marks with choice rules', () => {
    const sections = [
      {
        sectionId: 'Part A',
        totalQuestions: 5,
        questionsToAnswer: 5,
        marksPerQuestion: 2
      },
      {
        sectionId: 'Part B',
        totalQuestions: 4,
        questionsToAnswer: 4,
        marksPerQuestion: 5
      },
      {
        sectionId: 'Part C',
        totalQuestions: 3,
        questionsToAnswer: 2, // Choice: Answer 2 out of 3
        marksPerQuestion: 10
      }
    ];

    const result = calculatePaperMarks(sections);
    // Part A: 5x2 = 10, Part B: 4x5 = 20, Part C: 3x10 = 30 available, but 2x10 = 20 attempted
    assert.equal(result.totalAvailableMarks, 60);
    assert.equal(result.requiredAttemptedMarks, 50);
    assert.equal(result.totalQuestionsPresented, 12);
    assert.equal(result.totalQuestionsRequired, 11);
  });

  // Test 2: Unauthenticated rejection
  test('GET /api/exam-papers rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/exam-papers');
    assert.equal(res.status, 401);
  });

  // Test 3: Create and retrieve exam paper draft
  test('ExamPaper model recalculates marks correctly and preserves structure', async () => {
    const draft = new ExamPaper({
      user: user1Id,
      subject: user1SubjectId,
      title: 'Mid-Term Test Paper',
      institutionName: 'Autonomous Engineering College',
      courseCode: 'MCA-301',
      examDuration: '2 Hours',
      sections: [
        {
          sectionId: 'Part A',
          title: 'Part A: Short Questions',
          totalQuestions: 2,
          questionsToAnswer: 2,
          marksPerQuestion: 5,
          questions: [
            {
              questionNumber: 1,
              questionText: 'Define Agile Software Development Lifecycle.',
              questionType: 'short_answer',
              marks: 5,
              correctAnswer: 'Agile is an iterative development methodology emphasizing collaboration.'
            },
            {
              questionNumber: 2,
              questionText: 'Explain Scrum Sprints and ceremonies.',
              questionType: 'short_answer',
              marks: 5,
              correctAnswer: 'Scrum uses timeboxed sprints with standups, reviews, and retrospectives.'
            }
          ]
        }
      ]
    });

    draft.recalculateMarks();
    await draft.save();

    assert.equal(draft.totalAvailableMarks, 10);
    assert.equal(draft.requiredAttemptedMarks, 10);
    assert.equal(draft.totalQuestionsPresented, 2);
    assert.equal(draft.status, 'draft');

    // Retrieve via API
    const res = await request(app)
      .get(`/api/exam-papers/${draft._id}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.title, 'Mid-Term Test Paper');
  });

  // Test 4: User ownership and isolation
  test('User isolation: User 2 cannot view or duplicate User 1 exam paper', async () => {
    const paper = await ExamPaper.findOne({ user: user1Id });
    assert.ok(paper);

    const getRes = await request(app)
      .get(`/api/exam-papers/${paper._id}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(getRes.status, 404);

    const dupRes = await request(app)
      .post(`/api/exam-papers/${paper._id}/duplicate`)
      .set('Cookie', [user2Cookie]);
    assert.equal(dupRes.status, 404);
  });

  // Test 5: Finalize and duplicate operations
  test('User 1 can finalize and duplicate their own exam paper', async () => {
    const paper = await ExamPaper.findOne({ user: user1Id });
    assert.ok(paper);

    // Finalize
    const finRes = await request(app)
      .post(`/api/exam-papers/${paper._id}/finalize`)
      .set('Cookie', [user1Cookie]);
    assert.equal(finRes.status, 200);
    assert.equal(finRes.body.data.status, 'finalized');

    // Duplicate
    const dupRes = await request(app)
      .post(`/api/exam-papers/${paper._id}/duplicate`)
      .set('Cookie', [user1Cookie]);
    assert.equal(dupRes.status, 201);
    assert.ok(dupRes.body.data.title.includes('(Copy)'));
    assert.equal(dupRes.body.data.status, 'draft');
  });

  // Test 6: Delete paper
  test('User 1 can delete their own exam paper', async () => {
    const paper = await ExamPaper.findOne({ user: user1Id });
    assert.ok(paper);

    const delRes = await request(app)
      .delete(`/api/exam-papers/${paper._id}`)
      .set('Cookie', [user1Cookie]);
    assert.equal(delRes.status, 200);

    const check = await ExamPaper.findById(paper._id);
    assert.equal(check, null);
  });
});
