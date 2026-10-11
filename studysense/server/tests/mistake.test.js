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
const { Mistake } = require('../models/Mistake');
const { PracticeAttempt } = require('../models/PracticeAttempt');

describe('StudySense Mistake Book & Practice Engine API (Module 6)', () => {
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  let user1SubjectId = null;
  let question1Id = null;
  let question2Id = null;
  let createdQuizId = null;
  let attemptId = null;
  let createdMistakeId = null;

  const testUser1 = {
    name: 'Module6 Alice',
    email: `m6_alice_${Date.now()}@m6test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const testUser2 = {
    name: 'Module6 Bob',
    email: `m6_bob_${Date.now()}@m6test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    // Clean test database for m6 users
    await User.deleteMany({ email: { $regex: /@m6test\.com$/i } });

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
    const subRes1 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: 'Software Engineering', color: '#6366f1' });
    user1SubjectId = subRes1.body.data.subject.id;

    // Create 2 Questions for User 1
    const qRes1 = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user1SubjectId,
        questionText: 'What is the primary purpose of the Agile Manifesto?',
        options: [
          { id: 'opt_1', text: 'Detailed rigid documentation' },
          { id: 'opt_2', text: 'Individuals and interactions over processes and tools' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Agile values individuals and interactions over processes and tools.',
      });
    question1Id = qRes1.body.data._id;

    const qRes2 = await request(app)
      .post('/api/questions')
      .set('Cookie', [user1Cookie])
      .send({
        subject: user1SubjectId,
        questionText: 'Which architectural style uses decoupled autonomous microservices?',
        options: [
          { id: 'opt_a', text: 'Monolithic architecture' },
          { id: 'opt_b', text: 'Microservices architecture' },
        ],
        correctOptionId: 'opt_b',
        explanation: 'Microservices break application features into loosely coupled services.',
      });
    question2Id = qRes2.body.data._id;

    // Create Quiz for User 1
    const quizRes = await request(app)
      .post('/api/quizzes')
      .set('Cookie', [user1Cookie])
      .send({
        title: 'Software Design Assessment',
        subject: user1SubjectId,
        questionIds: [question1Id, question2Id],
      });
    createdQuizId = quizRes.body.data._id;
  });

  after(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@m6test\.com$/i } }),
      Subject.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Topic.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Question.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Quiz.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      QuizAttempt.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Mistake.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      PracticeAttempt.deleteMany({ user: { $in: [user1Id, user2Id] } }),
    ]);
    await mongoose.connection.close();
  });

  // --- AUTOMATIC MISTAKE GENERATION FROM QUIZ SUBMISSION ---

  test('Submitting a quiz with an incorrect answer automatically creates a Mistake record', async () => {
    // Alice submits: Question 1 WRONG ('opt_1' instead of 'opt_2'), Question 2 CORRECT ('opt_b')
    const subRes = await request(app)
      .post(`/api/quizzes/${createdQuizId}/submit`)
      .set('Cookie', [user1Cookie])
      .send({
        answers: [
          { questionId: question1Id, selectedOptionId: 'opt_1' }, // WRONG
          { questionId: question2Id, selectedOptionId: 'opt_b' }, // CORRECT
        ],
      });

    assert.equal(subRes.status, 201);
    attemptId = subRes.body.data._id;

    // Verify Mistake was created ONLY for Question 1
    const mistakes = await Mistake.find({ user: user1Id });
    assert.equal(mistakes.length, 1);
    const m = mistakes[0];
    createdMistakeId = m._id.toString();

    assert.equal(m.question.toString(), question1Id.toString());
    assert.equal(m.selectedOptionId, 'opt_1');
    assert.equal(m.correctOptionId, 'opt_2');
    assert.equal(m.status, 'needs_review');
    assert.equal(m.incorrectCount, 1);
    assert.equal(m.correctPracticeCount, 0);
  });

  test('Unanswered questions are not classified as mistake misconceptions', async () => {
    // Alice submits: Question 1 unanswered (null), Question 2 correct
    await request(app)
      .post(`/api/quizzes/${createdQuizId}/submit`)
      .set('Cookie', [user1Cookie])
      .send({
        answers: [
          { questionId: question1Id, selectedOptionId: null },
          { questionId: question2Id, selectedOptionId: 'opt_b' },
        ],
      });

    // Count of mistakes should remain 1 (no new mistake created for unanswered)
    const mistakes = await Mistake.find({ user: user1Id });
    assert.equal(mistakes.length, 1);
  });

  test('Repeated mistake for the same question deduplicates and increments incorrectCount', async () => {
    // Alice misses Question 1 again in another attempt
    await request(app)
      .post(`/api/quizzes/${createdQuizId}/submit`)
      .set('Cookie', [user1Cookie])
      .send({
        answers: [
          { questionId: question1Id, selectedOptionId: 'opt_1' },
          { questionId: question2Id, selectedOptionId: 'opt_b' },
        ],
      });

    const mistakes = await Mistake.find({ user: user1Id, question: question1Id });
    assert.equal(mistakes.length, 1, 'Should NOT create duplicate record for same question');
    assert.equal(mistakes[0].incorrectCount, 2, 'Should increment incorrectCount to 2');
  });

  // --- MISTAKE BOOK RETRIEVAL & SECURITY ---

  test('GET /api/mistakes lists only authenticated user mistakes', async () => {
    const res = await request(app).get('/api/mistakes').set('Cookie', [user1Cookie]);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);

    // User 2 (Bob) sees 0 mistakes
    const bobRes = await request(app).get('/api/mistakes').set('Cookie', [user2Cookie]);
    assert.equal(bobRes.status, 200);
    assert.equal(bobRes.body.data.length, 0);
  });

  test('GET /api/mistakes/:id rejects access from another user with 404', async () => {
    const res = await request(app)
      .get(`/api/mistakes/${createdMistakeId}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(res.status, 404);
  });

  test('PATCH /api/mistakes/:id updates personal note and review status', async () => {
    const res = await request(app)
      .patch(`/api/mistakes/${createdMistakeId}`)
      .set('Cookie', [user1Cookie])
      .send({
        personalNote: 'Remember: Agile focuses on communication, not heavy documentation.',
        isMarkedForReview: true,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.personalNote, 'Remember: Agile focuses on communication, not heavy documentation.');
    assert.equal(res.body.data.isMarkedForReview, true);
  });

  test('PATCH /api/mistakes/:id/review toggles review status', async () => {
    const res = await request(app)
      .patch(`/api/mistakes/${createdMistakeId}/review`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.isMarkedForReview, false);
  });

  // --- PRACTICE SESSION & ZERO ANSWER LEAKAGE ---

  test('GET /api/mistakes/practice/session sanitizes questions and hides correctOptionId/explanation', async () => {
    const res = await request(app)
      .get('/api/mistakes/practice/session')
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.totalQuestions, 1);
    const q = res.body.data.questions[0];

    // Ensure answer key and explanation are NOT exposed during practice
    assert.equal(q.correctOptionId, undefined, 'correctOptionId must NOT be revealed before practice submission');
    assert.equal(q.explanation, undefined, 'explanation must NOT be revealed before practice submission');
    assert.ok(q.optionsSnapshot.length >= 2);
  });

  // --- AUTHORITATIVE PRACTICE EVALUATION & CORRECTION POLICY ---

  test('POST /api/mistakes/:id/practice-result evaluates wrong practice answer server-side', async () => {
    const res = await request(app)
      .post(`/api/mistakes/${createdMistakeId}/practice-result`)
      .set('Cookie', [user1Cookie])
      .send({
        selectedOptionId: 'opt_1', // Still WRONG
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.isCorrect, false);
    assert.equal(res.body.data.status, 'needs_review');
    assert.equal(res.body.data.incorrectCount, 3);
  });

  test('POST /api/mistakes/:id/practice-result evaluates correct answer and updates status to corrected', async () => {
    const res = await request(app)
      .post(`/api/mistakes/${createdMistakeId}/practice-result`)
      .set('Cookie', [user1Cookie])
      .send({
        selectedOptionId: 'opt_2', // CORRECT
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.isCorrect, true);
    assert.equal(res.body.data.status, 'corrected');
    assert.equal(res.body.data.correctPracticeCount, 1);
    assert.equal(res.body.data.explanation, 'Agile values individuals and interactions over processes and tools.');
  });

  test('GET /api/mistakes/practice/history returns practice attempts owned by user', async () => {
    const res = await request(app)
      .get('/api/mistakes/practice/history')
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2); // 1 wrong practice, 1 correct practice

    const bobRes = await request(app)
      .get('/api/mistakes/practice/history')
      .set('Cookie', [user2Cookie]);
    assert.equal(bobRes.body.data.length, 0);
  });

  test('DELETE /api/mistakes/:id removes mistake and its practice history', async () => {
    const res = await request(app)
      .delete(`/api/mistakes/${createdMistakeId}`)
      .set('Cookie', [user1Cookie]);

    assert.equal(res.status, 200);

    const getRes = await request(app)
      .get(`/api/mistakes/${createdMistakeId}`)
      .set('Cookie', [user1Cookie]);
    assert.equal(getRes.status, 404);
  });
});
