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
const { Question } = require('../models/Question');
const { Quiz } = require('../models/Quiz');
const { QuizAttempt } = require('../models/QuizAttempt');

describe('StudySense Quiz & Question Bank API (Module 5)', () => {
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  let user1SubjectId = null;
  let user1TopicId = null;
  let user2SubjectId = null;

  let question1Id = null;
  let question2Id = null;
  let createdQuizId = null;
  let attemptId = null;

  const testUser1 = {
    name: 'Module5 Alice',
    email: `m5_alice_${Date.now()}@m5test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const testUser2 = {
    name: 'Module5 Bob',
    email: `m5_bob_${Date.now()}@m5test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    // Clean test database for m5 users
    await User.deleteMany({ email: { $regex: /@m5test\.com$/i } });

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

    // Create Subject & Topic for User 1
    const subRes1 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: 'Computer Networks', color: '#10b981' });
    user1SubjectId = subRes1.body.data.subject.id;

    const topRes1 = await request(app)
      .post(`/api/subjects/${user1SubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({ title: 'TCP/IP Model', status: 'In Progress' });
    user1TopicId = topRes1.body.data.topic.id;

    // Create Subject for User 2
    const subRes2 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user2Cookie])
      .send({ name: 'Database Systems', color: '#3b82f6' });
    user2SubjectId = subRes2.body.data.subject.id;
  });

  after(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@m5test\.com$/i } }),
      Subject.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Topic.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Question.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Quiz.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      QuizAttempt.deleteMany({ user: { $in: [user1Id, user2Id] } }),
    ]);
    await mongoose.connection.close();
  });

  // --- QUESTION BANK TESTS ---

  test('POST /api/questions rejects unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/questions').send({ questionText: 'What is HTTP?' });
    assert.equal(res.status, 401);
  });

  test('POST /api/questions creates a valid multiple-choice question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user1SubjectId,
        topic: user1TopicId,
        questionText: 'Which layer of the OSI model does TCP operate on?',
        questionType: 'single_choice',
        options: [
          { id: 'opt_1', text: 'Application' },
          { id: 'opt_2', text: 'Transport' },
          { id: 'opt_3', text: 'Network' },
          { id: 'opt_4', text: 'Physical' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'TCP operates at the Transport layer (Layer 4).',
        difficulty: 'Medium',
        tags: ['networking', 'tcp'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.correctOptionId, 'opt_2');
    question1Id = res.body.data._id;
  });

  test('POST /api/questions rejects question without options or with invalid correctOptionId', async () => {
    const res1 = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user1SubjectId,
        questionText: 'Invalid question?',
        options: [{ id: 'opt_1', text: 'Single option only' }],
        correctOptionId: 'opt_1',
      });
    assert.equal(res1.status, 400);

    const res2 = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user1SubjectId,
        questionText: 'Invalid correct option ID?',
        options: [
          { id: 'opt_1', text: 'Option A' },
          { id: 'opt_2', text: 'Option B' },
        ],
        correctOptionId: 'non_existent_id',
      });
    assert.equal(res2.status, 400);
  });

  test('POST /api/questions rejects linking to another user subject or topic', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user2SubjectId, // belongs to Bob
        questionText: 'Hacking Bob subject?',
        options: [
          { id: 'opt_1', text: 'A' },
          { id: 'opt_2', text: 'B' },
        ],
        correctOptionId: 'opt_1',
      });
    assert.equal(res.status, 404);
  });

  test('POST /api/questions creates a second question for User 1', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user1SubjectId,
        topic: user1TopicId,
        questionText: 'What is the default port for HTTP?',
        options: [
          { id: 'opt_a', text: '80' },
          { id: 'opt_b', text: '443' },
          { id: 'opt_c', text: '21' },
        ],
        correctOptionId: 'opt_a',
        explanation: 'Port 80 is the standard port for unencrypted HTTP traffic.',
        difficulty: 'Easy',
        tags: ['networking', 'http'],
      });

    assert.equal(res.status, 201);
    question2Id = res.body.data._id;
  });

  test('GET /api/questions returns only authenticated user questions with filtering', async () => {
    const res = await request(app)
      .get('/api/questions?difficulty=Medium')
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0]._id, question1Id);

    // Verify Bob sees 0 questions
    const bobRes = await request(app).get('/api/questions').set('Cookie', user2Cookie);
    assert.equal(bobRes.body.data.length, 0);
  });

  // --- QUIZ MANAGEMENT TESTS ---

  test('POST /api/quizzes creates a quiz with valid questions and subject', async () => {
    const res = await request(app)
      .post('/api/quizzes')
      .set('Cookie', [user1Cookie])
      .send({
        title: 'Networking Fundamentals Quiz',
        description: 'Test your basic networking and TCP/IP knowledge.',
        subject: user1SubjectId,
        topics: [user1TopicId],
        questionIds: [question1Id, question2Id],
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
        },
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, 'Networking Fundamentals Quiz');
    assert.equal(res.body.data.questionIds.length, 2);
    createdQuizId = res.body.data._id;
  });

  test('POST /api/quizzes rejects quiz containing questions from another user or wrong subject', async () => {
    // User 2 creates a question
    const bobQRes = await request(app)
      .post('/api/questions')
      .set('Cookie', [user2Cookie])
      .send({
        subject: user2SubjectId,
        questionText: 'What is SQL?',
        options: [
          { id: 'b1', text: 'Structured Query Language' },
          { id: 'b2', text: 'Simple Query Language' },
        ],
        correctOptionId: 'b1',
      });
    const bobQId = bobQRes.body.data._id;

    // User 1 tries to add Bob's question into their own quiz
    const res = await request(app)
      .post('/api/quizzes')
      .set('Cookie', [user1Cookie])
      .send({
        title: 'Mixed Quiz',
        subject: user1SubjectId,
        questionIds: [question1Id, bobQId],
      });

    assert.equal(res.status, 400);
  });

  test('GET /api/quizzes/:id/take sanitizes questions and hides correctOptionId/explanation', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${createdQuizId}/take`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.totalQuestions, 2);
    assert.ok(Array.isArray(res.body.data.questions));

    // Verify correct answers and explanations are COMPLETELY HIDDEN
    for (const q of res.body.data.questions) {
      assert.equal(q.correctOptionId, undefined, 'correctOptionId must NOT be exposed in student taking session');
      assert.equal(q.explanation, undefined, 'explanation must NOT be exposed in student taking session');
      assert.ok(q.options.length >= 2);
    }
  });

  // --- SECURE QUIZ SUBMISSION & SERVER-SIDE SCORING ---

  test('POST /api/quizzes/:id/submit securely evaluates answers and ignores client-forged scores', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${createdQuizId}/submit`)
      .set('Cookie', [user1Cookie])
      .send({
        // Client attempts to forge a 100% score and mark answers correct
        score: 999,
        percentage: 100,
        answers: [
          { questionId: question1Id, selectedOptionId: 'opt_2' }, // Correct (Transport)
          { questionId: question2Id, selectedOptionId: 'opt_b' }, // Wrong (Selected 443 instead of 80)
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    const attempt = res.body.data;
    attemptId = attempt._id;

    // Server-side calculation verification
    assert.equal(attempt.totalQuestions, 2);
    assert.equal(attempt.score, 1, 'Server must accurately calculate score = 1 correct answer');
    assert.equal(attempt.correctAnswers, 1);
    assert.equal(attempt.incorrectAnswers, 1);
    assert.equal(attempt.unansweredCount, 0);
    assert.equal(attempt.percentage, 50, 'Percentage must be 50%, ignoring client-supplied 100');

    // Result review includes explanation and correct answers only AFTER submission
    assert.equal(attempt.results.length, 2);
    const q1Result = attempt.results.find((r) => r.questionId.toString() === question1Id.toString());
    assert.equal(q1Result.isCorrect, true);
    assert.equal(q1Result.correctOptionId, 'opt_2');

    const q2Result = attempt.results.find((r) => r.questionId.toString() === question2Id.toString());
    assert.equal(q2Result.isCorrect, false);
    assert.equal(q2Result.selectedOptionId, 'opt_b');
    assert.equal(q2Result.correctOptionId, 'opt_a');
  });

  test('POST /api/quizzes/:id/submit accurately calculates unanswered questions', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${createdQuizId}/submit`)
      .set('Cookie', [user1Cookie])
      .send({
        answers: [
          { questionId: question1Id, selectedOptionId: null }, // Unanswered
          { questionId: question2Id, selectedOptionId: 'opt_a' }, // Correct
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.score, 1);
    assert.equal(res.body.data.unansweredCount, 1);
    assert.equal(res.body.data.correctAnswers, 1);
    assert.equal(res.body.data.percentage, 50);
  });

  // --- ATTEMPTS & RESULTS ACCESS CONTROL ---

  test('GET /api/quiz-attempts lists authenticated user attempts only', async () => {
    const res = await request(app).get('/api/quiz-attempts').set('Cookie', user1Cookie);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);

    // Bob cannot see Alice attempts
    const bobRes = await request(app).get('/api/quiz-attempts').set('Cookie', user2Cookie);
    assert.equal(bobRes.body.data.length, 0);
  });

  test('GET /api/quiz-attempts/:id rejects access from another user with 404', async () => {
    const res = await request(app)
      .get(`/api/quiz-attempts/${attemptId}`)
      .set('Cookie', [user2Cookie]); // Bob trying to view Alice attempt
    assert.equal(res.status, 404);
  });

  test('GET /api/quiz-attempts/:id retrieves full review for the owner', async () => {
    const res = await request(app)
      .get(`/api/quiz-attempts/${attemptId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data._id, attemptId);
    assert.equal(res.body.data.percentage, 50);
    assert.ok(Array.isArray(res.body.data.results));
  });

  // --- CASCADE & HISTORICAL ATTEMPT INTEGRITY ---

  test('DELETE /api/quizzes/:id retains historical attempt integrity with unlinked quiz', async () => {
    const deleteRes = await request(app)
      .delete(`/api/quizzes/${createdQuizId}`)
      .set('Cookie', user1Cookie);
    assert.equal(deleteRes.status, 200);

    // Verify attempt still exists with snapshot title intact
    const attemptRes = await request(app)
      .get(`/api/quiz-attempts/${attemptId}`)
      .set('Cookie', user1Cookie);
    assert.equal(attemptRes.status, 200);
    assert.equal(attemptRes.body.data.quizTitleSnapshot, 'Networking Fundamentals Quiz');
    assert.equal(attemptRes.body.data.quiz, null);
  });
});
