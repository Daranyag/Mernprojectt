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

describe('StudySense Performance Analytics & Recommendations API (Module 7)', () => {
  let user1Cookie = null;
  let user2Cookie = null;
  let user1Id = null;
  let user2Id = null;

  let subject1Id = null;
  let subject2Id = null;
  let topic1Id = null;

  const testUser1 = {
    name: 'Module7 Alice',
    email: `m7_alice_${Date.now()}@m7test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const testUser2 = {
    name: 'Module7 Bob',
    email: `m7_bob_${Date.now()}@m7test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    await User.deleteMany({ email: { $regex: /@m7test\.com$/i } });

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

    // Subject 1 (with attempts)
    const subRes1 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: 'Data Structures', color: '#10b981' });
    subject1Id = subRes1.body.data.subject.id;

    // Topic 1 in Subject 1
    const topRes1 = await request(app)
      .post(`/api/subjects/${subject1Id}/topics`)
      .set('Cookie', [user1Cookie])
      .send({ title: 'Binary Search Trees' });
    topic1Id = topRes1.body.data.topic.id;

    // Subject 2 (without attempts - to test unassessed recognition)
    const subRes2 = await request(app)
      .post('/api/subjects')
      .set('Cookie', [user1Cookie])
      .send({ name: 'Cloud Computing', color: '#3b82f6' });
    subject2Id = subRes2.body.data.subject.id;

    // Seed 2 Quiz Attempts for User 1
    // Attempt 1: 3 questions, 2 correct, 1 wrong, 67%
    const attempt1 = new QuizAttempt({
      user: user1Id,
      quizTitleSnapshot: 'BST Assessment 1',
      subject: subject1Id,
      score: 2,
      totalQuestions: 3,
      correctAnswers: 2,
      incorrectAnswers: 1,
      unansweredCount: 0,
      percentage: 67,
      results: [
        {
          questionId: new mongoose.Types.ObjectId(),
          questionText: 'BST Insertion Complexity?',
          topic: topic1Id,
          options: [{ id: 'a', text: 'O(log n)' }],
          selectedOptionId: 'a',
          correctOptionId: 'a',
          isCorrect: true,
        },
        {
          questionId: new mongoose.Types.ObjectId(),
          questionText: 'BST Inorder Traversal Output?',
          topic: topic1Id,
          options: [{ id: 'b', text: 'Sorted order' }],
          selectedOptionId: 'b',
          correctOptionId: 'b',
          isCorrect: true,
        },
        {
          questionId: new mongoose.Types.ObjectId(),
          questionText: 'Worst case BST Search?',
          topic: topic1Id,
          options: [{ id: 'c', text: 'O(n)' }, { id: 'd', text: 'O(1)' }],
          selectedOptionId: 'd',
          correctOptionId: 'c',
          isCorrect: false,
        },
      ],
      completedAt: new Date(Date.now() - 86400000), // yesterday
    });
    await attempt1.save();

    // Attempt 2: 2 questions, 2 correct, 100%
    const attempt2 = new QuizAttempt({
      user: user1Id,
      quizTitleSnapshot: 'BST Assessment 2',
      subject: subject1Id,
      score: 2,
      totalQuestions: 2,
      correctAnswers: 2,
      incorrectAnswers: 0,
      unansweredCount: 0,
      percentage: 100,
      results: [
        {
          questionId: new mongoose.Types.ObjectId(),
          questionText: 'Balanced BST Height?',
          topic: topic1Id,
          options: [{ id: 'a', text: 'log n' }],
          selectedOptionId: 'a',
          correctOptionId: 'a',
          isCorrect: true,
        },
        {
          questionId: new mongoose.Types.ObjectId(),
          questionText: 'AVL Rotation?',
          topic: topic1Id,
          options: [{ id: 'b', text: 'Left-Right' }],
          selectedOptionId: 'b',
          correctOptionId: 'b',
          isCorrect: true,
        },
      ],
      completedAt: new Date(), // today
    });
    await attempt2.save();

    // Seed 1 Mistake needing review for User 1
    const mistake1 = new Mistake({
      user: user1Id,
      subject: subject1Id,
      topic: topic1Id,
      questionSnapshot: 'Worst case BST Search?',
      optionsSnapshot: [{ id: 'c', text: 'O(n)' }, { id: 'd', text: 'O(1)' }],
      selectedOptionId: 'd',
      correctOptionId: 'c',
      status: 'needs_review',
      incorrectCount: 1,
    });
    await mistake1.save();
  });

  after(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@m7test\.com$/i } }),
      Subject.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Topic.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Question.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Quiz.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      QuizAttempt.deleteMany({ user: { $in: [user1Id, user2Id] } }),
      Mistake.deleteMany({ user: { $in: [user1Id, user2Id] } }),
    ]);
    await mongoose.connection.close();
  });

  // --- OVERVIEW TESTS ---

  test('GET /api/analytics/overview rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/analytics/overview');
    assert.equal(res.status, 401);
  });

  test('GET /api/analytics/overview calculates accurate metrics from actual attempts', async () => {
    const res = await request(app).get('/api/analytics/overview').set('Cookie', [user1Cookie]);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const data = res.body.data;

    assert.equal(data.totalAttempts, 2);
    assert.equal(data.totalQuestions, 5);
    assert.equal(data.totalCorrect, 4);
    assert.equal(data.totalAnswered, 5);
    assert.equal(data.totalUnanswered, 0);
    assert.equal(data.overallAccuracy, 80); // 4 / 5 * 100 = 80%
    assert.equal(data.averageQuizPercentage, 84); // (67 + 100) / 2 = 83.5 -> 84%
    assert.equal(data.assessedSubjectsCount, 1);
    assert.equal(data.mistakesNeedingReview, 1);

    // Verify Bob (User 2) has genuine zero-data response without fabrications
    const bobRes = await request(app).get('/api/analytics/overview').set('Cookie', [user2Cookie]);
    assert.equal(bobRes.body.data.totalAttempts, 0);
    assert.equal(bobRes.body.data.totalQuestions, 0);
    assert.equal(bobRes.body.data.overallAccuracy, 0);
    assert.equal(bobRes.body.data.averageQuizPercentage, 0);
  });

  // --- SUBJECT PERFORMANCE TESTS ---

  test('GET /api/analytics/subjects accurately distinguishes assessed vs unassessed subjects', async () => {
    const res = await request(app).get('/api/analytics/subjects').set('Cookie', [user1Cookie]);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);

    const dsSub = res.body.data.find((s) => s.subjectId === subject1Id);
    assert.ok(dsSub);
    assert.equal(dsSub.isAssessed, true);
    assert.equal(dsSub.attemptsCount, 2);
    assert.equal(dsSub.accuracy, 80);
    assert.equal(dsSub.averagePercentage, 84);
    assert.equal(dsSub.mistakesNeedingReview, 1);

    const cloudSub = res.body.data.find((s) => s.subjectId === subject2Id);
    assert.ok(cloudSub);
    assert.equal(cloudSub.isAssessed, false);
    assert.equal(cloudSub.attemptsCount, 0);
    assert.equal(cloudSub.accuracy, null); // Null to avoid falsely labeling as 0% failure
  });

  // --- TOPIC PERFORMANCE TESTS ---

  test('GET /api/analytics/topics aggregates topic accuracy and readiness classification', async () => {
    const res = await request(app).get('/api/analytics/topics').set('Cookie', [user1Cookie]);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);

    const bstTopic = res.body.data[0];
    assert.equal(bstTopic.topicId, topic1Id);
    assert.equal(bstTopic.questionsAnswered, 5);
    assert.equal(bstTopic.correctAnswers, 4);
    assert.equal(bstTopic.accuracy, 80);
    assert.equal(bstTopic.readiness, 'Strong'); // >= 80% with >= 3 questions
    assert.equal(bstTopic.mistakesNeedingReview, 1);
  });

  // --- TRENDS TESTS ---

  test('GET /api/analytics/trends returns attempts in chronological order with actual dates', async () => {
    const res = await request(app).get('/api/analytics/trends').set('Cookie', [user1Cookie]);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);

    // Oldest first
    assert.equal(res.body.data[0].quizTitle, 'BST Assessment 1');
    assert.equal(res.body.data[0].percentage, 67);
    assert.equal(res.body.data[1].quizTitle, 'BST Assessment 2');
    assert.equal(res.body.data[1].percentage, 100);
  });

  // --- SMART RECOMMENDATIONS TESTS ---

  test('GET /api/analytics/recommendations returns explainable, data-driven recommendations', async () => {
    const res = await request(app).get('/api/analytics/recommendations').set('Cookie', [user1Cookie]);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);

    // Should include a recommendation for the 1 open mistake
    const mistakeRec = res.body.data.find((r) => r.category === 'Review Mistakes');
    assert.ok(mistakeRec, 'Must recommend reviewing open mistakes');
    assert.equal(mistakeRec.actionUrl, '/mistake-book');

    // Should include a recommendation to assess unassessed Subject 2 (Cloud Computing)
    const unassessedRec = res.body.data.find((r) => r.category === 'Take Assessment');
    assert.ok(unassessedRec, 'Must recommend taking an initial quiz for unassessed subjects');

    // Bob has zero attempts, should receive empty-data guidance
    const bobRes = await request(app).get('/api/analytics/recommendations').set('Cookie', [user2Cookie]);
    assert.equal(bobRes.body.data.length, 1);
    assert.equal(bobRes.body.data[0].category, 'Getting Started');
  });
});
