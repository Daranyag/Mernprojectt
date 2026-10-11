const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const AdmZip = require('adm-zip');

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
const { QuizSource } = require('../models/QuizSource');
const {
  validatePublicUrl,
  normalizeText,
  extractTextFromPptx,
  extractTextFromPdf
} = require('../services/sourceIngestion.service');

describe('StudySense AI Quiz Generator API (Module 8)', () => {
  let user1Cookie;
  let user1Id;
  let user2Cookie;
  let user2Id;
  let user1SubjectId;
  let user1TopicId;

  const testUser1 = {
    name: 'AI Quiz Gen Student',
    email: `m8_alice_${Date.now()}@m8test.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  const testUser2 = {
    name: 'Other Student',
    email: `m8_bob_${Date.now()}@m8test.com`,
    password: 'Password456!',
    confirmPassword: 'Password456!'
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.LOCAL_MONGO_URI);
    }
    await User.deleteMany({ email: { $regex: /@m8test\.com$/i } });

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
        name: 'Cloud Computing & Distributed Systems',
        description: 'Semester 4 MCA Elective'
      });
    user1SubjectId = subRes.body.data.subject.id;

    // Create Topic for User 1
    const topRes = await request(app)
      .post(`/api/subjects/${user1SubjectId}/topics`)
      .set('Cookie', [user1Cookie])
      .send({
        title: 'Virtualization & Hypervisors',
        description: 'Type 1 and Type 2 Virtualization'
      });
    user1TopicId = topRes.body.data.topic.id;
  });

  after(async () => {
    if (user1Id) {
      await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
      await Subject.deleteMany({ user: { $in: [user1Id, user2Id] } });
      await Topic.deleteMany({ user: { $in: [user1Id, user2Id] } });
      await Question.deleteMany({ user: { $in: [user1Id, user2Id] } });
      await Quiz.deleteMany({ user: { $in: [user1Id, user2Id] } });
      await QuizSource.deleteMany({ user: { $in: [user1Id, user2Id] } });
    }
  });

  // Test 1: Authentication enforcement
  test('Quiz Generator endpoints reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/quiz-generator/sources');
    assert.equal(res.status, 401);
  });

  // Test 2: Pasted text ingestion
  test('POST /api/quiz-generator/sources/text ingests pasted study notes', async () => {
    const res = await request(app)
      .post('/api/quiz-generator/sources/text')
      .set('Cookie', [user1Cookie])
      .send({
        subjectId: user1SubjectId,
        topicId: user1TopicId,
        title: 'Virtualization Overview Notes',
        content:
          'Hypervisors manage virtual machines. A Type 1 hypervisor runs directly on hardware (bare-metal, e.g. VMware ESXi). A Type 2 hypervisor runs on a host OS (e.g. VirtualBox).',
        sourceType: 'text'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.sourceType, 'text');
    assert.ok(res.body.data.charCount > 50);
  });

  // Test 3: Rejects empty text
  test('POST /api/quiz-generator/sources/text rejects empty content with 400', async () => {
    const res = await request(app)
      .post('/api/quiz-generator/sources/text')
      .set('Cookie', [user1Cookie])
      .send({
        subjectId: user1SubjectId,
        title: 'Empty',
        content: '    '
      });

    assert.equal(res.status, 400);
  });

  // Test 4: SSRF protection unit check
  test('validatePublicUrl blocks localhost and private IP addresses', () => {
    assert.throws(() => validatePublicUrl('http://localhost:5000/secrets'), /prohibited/i);
    assert.throws(() => validatePublicUrl('http://127.0.0.1:8080/admin'), /prohibited/i);
    assert.throws(() => validatePublicUrl('http://169.254.169.254/latest/meta-data'), /prohibited/i);
    assert.throws(() => validatePublicUrl('http://192.168.1.1/router'), /prohibited/i);
    assert.throws(() => validatePublicUrl('ftp://example.com/file'), /Only HTTP and HTTPS/i);

    const valid = validatePublicUrl('https://en.wikipedia.org/wiki/Cloud_computing');
    assert.equal(valid.hostname, 'en.wikipedia.org');
  });

  // Test 5: PPTX parser unit check
  test('extractTextFromPptx correctly extracts slide text from OpenXML buffers', async () => {
    const zip = new AdmZip();
    const slide1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
      <p:cSld>
        <p:spTree>
          <p:sp><p:txBody><a:p><a:r><a:t>Introduction to Cloud Containers</a:t></a:r></a:p></p:txBody></p:sp>
          <p:sp><p:txBody><a:p><a:r><a:t>Docker uses OS level virtualization</a:t></a:r></a:p></p:txBody></p:sp>
        </p:spTree>
      </p:cSld>
    </p:sld>`;
    zip.addFile('ppt/slides/slide1.xml', Buffer.from(slide1Xml, 'utf8'));
    const buffer = zip.toBuffer();

    const result = await extractTextFromPptx(buffer);
    assert.equal(result.slidesCount, 1);
    assert.ok(result.text.includes('Introduction to Cloud Containers'));
    assert.ok(result.text.includes('Docker uses OS level virtualization'));
  });

  // Test 6: PDF parser handles empty or non-PDF buffers safely
  test('extractTextFromPdf rejects malformed or non-PDF buffers', async () => {
    await assert.rejects(
      async () => extractTextFromPdf(Buffer.from('not a pdf header')),
      /Invalid PDF format/i
    );
  });

  // Test 7: User data isolation for sources
  test('User isolation: User 2 cannot access or delete User 1 sources', async () => {
    // User 1 creates source
    const createRes = await request(app)
      .post('/api/quiz-generator/sources/text')
      .set('Cookie', [user1Cookie])
      .send({
        subjectId: user1SubjectId,
        title: 'User 1 Confidential Notes',
        content: 'Confidential material for User 1 exam study.',
        sourceType: 'text'
      });
    const sourceId = createRes.body.data._id;

    // User 2 attempts to delete User 1 source
    const delRes = await request(app)
      .delete(`/api/quiz-generator/sources/${sourceId}`)
      .set('Cookie', [user2Cookie]);
    assert.equal(delRes.status, 404);

    // Verify source still exists
    const checkSource = await QuizSource.findById(sourceId);
    assert.ok(checkSource);
  });

  // Test 8: Save generated questions and create quiz
  test('POST /api/quiz-generator/save saves questions and creates published quiz', async () => {
    const mockQuestions = [
      {
        questionText: 'Which hypervisor runs directly on physical hardware?',
        questionType: 'single_choice',
        difficulty: 'Medium',
        marks: 1,
        options: [
          { id: 'A', text: 'Type 1 Hypervisor' },
          { id: 'B', text: 'Type 2 Hypervisor' },
          { id: 'C', text: 'Container Engine' },
          { id: 'D', text: 'Virtual Host' }
        ],
        correctOptionId: 'A',
        explanation: 'Type 1 hypervisors run directly on bare metal without a host OS.',
        sourceReference: 'Virtualization Overview Notes'
      },
      {
        questionText: 'Explain the architectural differences between Type 1 and Type 2 hypervisors.',
        questionType: 'long_answer',
        difficulty: 'Hard',
        marks: 10,
        expectedAnswer:
          'Type 1 runs bare-metal directly on hardware providing lower latency. Type 2 runs on top of host OS.',
        rubric: [
          { criterion: 'Type 1 Architecture & Examples', allocatedMarks: 5 },
          { criterion: 'Type 2 Architecture & Overhead', allocatedMarks: 5 }
        ],
        sourceReference: 'Virtualization Overview Notes'
      }
    ];

    const res = await request(app)
      .post('/api/quiz-generator/save')
      .set('Cookie', [user1Cookie])
      .send({
        subjectId: user1SubjectId,
        topicId: user1TopicId,
        questions: mockQuestions,
        createQuiz: true,
        quizTitle: 'AI Generated Cloud Assessment'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.savedQuestionsCount, 2);
    assert.ok(res.body.data.quiz);
    assert.equal(res.body.data.quiz.title, 'AI Generated Cloud Assessment');
    assert.equal(res.body.data.quiz.questionIds.length, 2);
  });

  // Test 9: Saved single_choice questions are immediately takable in Quiz module
  test('Generated quiz can be loaded for taking and masks correctOptionId', async () => {
    const quizList = await Quiz.find({ user: user1Id });
    const quiz = quizList[0];
    assert.ok(quiz);

    const takeRes = await request(app)
      .get(`/api/quizzes/${quiz._id}/take`)
      .set('Cookie', [user1Cookie]);

    assert.equal(takeRes.status, 200);
    assert.ok(takeRes.body.data.questions.length >= 1);
    // Ensure correctOptionId is sanitized on taking view
    assert.equal(takeRes.body.data.questions[0].correctOptionId, undefined);
  });
});
