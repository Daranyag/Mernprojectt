const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');
const { StudyMaterial } = require('../models/StudyMaterial');
const { Question } = require('../models/Question');
const { Mistake } = require('../models/Mistake');

function getApiKey() {
  return process.env.GEMINI_API_KEY || '';
}

function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
}

class DoubtSolverService {
  /**
   * Automatically resolve relevant academic context from student's enrolled subject, syllabus unit, and materials
   */
  async getStudentAcademicContext(userId, subjectId = null, topicId = null, unit = null) {
    let subject = null;
    let topic = null;
    let relevantMaterials = [];
    let syllabusTopics = [];

    // 1. Resolve Subject
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      subject = await Subject.findOne({ _id: subjectId, user: userId }).lean();
    } else {
      // Pick the most recently active or created subject
      subject = await Subject.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
    }

    if (subject) {
      // 2. Fetch Syllabus Topics under this subject
      syllabusTopics = await Topic.find({ subject: subject._id, user: userId })
        .sort({ order: 1, createdAt: 1 })
        .select('title unit status priority description')
        .limit(20)
        .lean();

      // 3. Resolve Topic
      if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
        topic = await Topic.findOne({ _id: topicId, user: userId }).lean();
      }

      // 4. Fetch relevant study notes or resources
      const materialFilter = { user: userId, subject: subject._id };
      if (topic) {
        materialFilter.topic = topic._id;
      }
      if (unit) {
        materialFilter.unit = new RegExp(unit.trim(), 'i');
      }

      relevantMaterials = await StudyMaterial.find(materialFilter)
        .sort({ isFavorite: -1, updatedAt: -1 })
        .select('title type content url unit tags')
        .limit(5)
        .lean();

      // If no topic-specific materials, grab general subject materials
      if (relevantMaterials.length === 0) {
        relevantMaterials = await StudyMaterial.find({ user: userId, subject: subject._id })
          .sort({ isFavorite: -1, updatedAt: -1 })
          .select('title type content url unit tags')
          .limit(4)
          .lean();
      }
    }

    return {
      subject,
      topic,
      syllabusTopics,
      relevantMaterials,
    };
  }

  /**
   * Provide step-by-step conceptual breakdown for 1-tap "Explain to Me" on a Quiz question or Mistake Book item
   */
  async explainConcept(userId, data) {
    const {
      questionText,
      options = [],
      userSelectedOption = '',
      correctOption = '',
      authorExplanation = '',
      subjectId = null,
      topicId = null,
      unit = null,
      studentQuery = '',
    } = data;

    if (!questionText || questionText.trim().length === 0) {
      const error = new Error('Question or concept text is required for explanation');
      error.statusCode = 400;
      throw error;
    }

    const context = await this.getStudentAcademicContext(userId, subjectId, topicId, unit);

    const materialsSnippets = context.relevantMaterials
      .map((m) => `- [${m.type.toUpperCase()}] ${m.title}: ${m.content ? m.content.slice(0, 300) : m.url}`)
      .join('\n');

    const prompt = `You are StudySense AI, an empathetic, highly structured academic professor and tutor.
Your goal is to provide a step-by-step conceptual breakdown to help a student master a concept and eliminate any confusion.

[CURRICULUM CONTEXT]
Subject: ${context.subject ? context.subject.name : 'Computer Science / MCA Curriculum'}
${context.topic ? `Topic: ${context.topic.title} (${context.topic.unit || 'General'})` : ''}
${materialsSnippets ? `Student's Saved Notes/Materials in this Subject:\n${materialsSnippets}` : ''}

[QUESTION / DOUBT DETAILS]
Question: "${questionText}"
${options.length > 0 ? `Available Options:\n${options.map((o) => `• ${typeof o === 'object' ? o.text || o.label : o}`).join('\n')}` : ''}
${userSelectedOption ? `Student's Chosen Option: "${userSelectedOption}"` : ''}
${correctOption ? `Verified Correct Answer: "${correctOption}"` : ''}
${authorExplanation ? `Original Answer Key Explanation: "${authorExplanation}"` : ''}
${studentQuery ? `Student's Specific Confusion / Query: "${studentQuery}"` : ''}

Please generate an empathetic, rigorous, step-by-step pedagogical explanation formatted in JSON adhering strictly to this schema:
{
  "summary": "1-2 sentence core takeaway answering the concept clearly",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Fundamental Concept / Definition",
      "explanation": "Clear explanation of the core theory or rule"
    },
    {
      "stepNumber": 2,
      "title": "Why the Correct Answer is Right",
      "explanation": "Concrete reasoning and real-world example or equation"
    },
    {
      "stepNumber": 3,
      "title": "Why Alternative / Misconceptions Occur",
      "explanation": "Explain why the student's chosen option or common misconception is flawed"
    }
  ],
  "commonPitfalls": "Key trap or exam mistake students frequently make with this topic",
  "memoryRule": "A mnemonic, formula, or mental trick to remember this permanently in exams",
  "relatedTopics": ["Related Topic 1", "Related Topic 2"]
}`;

    const apiKey = getApiKey();
    if (!apiKey) {
      return this.buildFallbackExplanation({
        questionText,
        userSelectedOption,
        correctOption,
        authorExplanation,
        context,
      });
    }

    try {
      const model = getModelName();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const dataJson = await response.json();
      const candidateText = dataJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText) {
        const parsed = JSON.parse(candidateText);
        return {
          ...parsed,
          subjectName: context.subject?.name || 'General Curriculum',
          topicName: context.topic?.title || 'Core Syllabus',
          referencedMaterialsCount: context.relevantMaterials.length,
        };
      }
    } catch (err) {
      console.warn('[DoubtSolverService] AI provider failed, returning structured pedagogical fallback:', err.message);
    }

    return this.buildFallbackExplanation({
      questionText,
      userSelectedOption,
      correctOption,
      authorExplanation,
      context,
    });
  }

  /**
   * Deterministic academic breakdown fallback if network or key is unavailable
   */
  buildFallbackExplanation({ questionText, userSelectedOption, correctOption, authorExplanation, context }) {
    return {
      summary: authorExplanation || `Here is a step-by-step conceptual walkthrough for "${questionText}".`,
      steps: [
        {
          stepNumber: 1,
          title: 'Core Concept Analysis',
          explanation: `In ${context.subject ? context.subject.name : 'the curriculum'}, this question targets foundational principles. Understanding the definition and operational mechanism ensures you evaluate all options methodically.`,
        },
        {
          stepNumber: 2,
          title: 'Correct Answer Rationale',
          explanation: correctOption
            ? `The verified correct answer is "${correctOption}". ${authorExplanation ? authorExplanation : 'This satisfies the primary criteria and standard academic specifications.'}`
            : 'Review the underlying criteria to see why this option matches the textbook definition.',
        },
        {
          stepNumber: 3,
          title: 'Deconstructing Misconceptions',
          explanation: userSelectedOption
            ? `Choosing "${userSelectedOption}" is a common exam mistake often caused by confusing adjacent terms or overlooking prerequisite conditions.`
            : 'Avoid common pitfalls by verifying unit boundary conditions and negative qualifier keywords (e.g. NOT, EXCEPT).',
        },
      ],
      commonPitfalls: 'Overlooking subtle qualifiers or mixing up theoretical definitions with practical implementations.',
      memoryRule: 'Break problems into (1) Given conditions, (2) Formula/Rule, and (3) Elimination of false distractors.',
      relatedTopics: context.syllabusTopics.slice(0, 3).map((t) => t.title),
      subjectName: context.subject?.name || 'General Curriculum',
      topicName: context.topic?.title || 'Core Syllabus',
      referencedMaterialsCount: context.relevantMaterials.length,
    };
  }

  /**
   * General interactive doubt query referencing student's active subject & notes
   */
  async solveDoubt(userId, data) {
    const { query, subjectId = null, topicId = null, unit = null } = data;

    if (!query || query.trim().length === 0) {
      const error = new Error('Student query is required');
      error.statusCode = 400;
      throw error;
    }

    const context = await this.getStudentAcademicContext(userId, subjectId, topicId, unit);
    const materialsSnippets = context.relevantMaterials
      .map((m) => `• ${m.title} (${m.type}): ${m.content ? m.content.slice(0, 250) : m.url}`)
      .join('\n');

    const prompt = `You are StudySense Academic Assistant, an intelligent university tutor for MCA / Computer Science students.
The student has asked a question while studying.

[STUDENT CONTEXT]
Active Subject: ${context.subject ? context.subject.name : 'Computer Science & Engineering'}
Active Topic: ${context.topic ? context.topic.title : 'General'}
Student's Saved Reference Materials:
${materialsSnippets || 'No specific notes uploaded yet.'}

[STUDENT QUESTION]
"${query.trim()}"

Provide a clear, pedagogical answer structured in JSON adhering strictly to:
{
  "directAnswer": "Clear, concise direct answer to the student's question",
  "explanation": "In-depth explanation with step-by-step breakdown",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "examTip": "How this is typically tested in examinations",
  "suggestedFollowUps": ["Follow up question 1?", "Follow up question 2?"]
}`;

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const model = getModelName();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (response.ok) {
          const dataJson = await response.json();
          const candidateText = dataJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return {
              ...parsed,
              subjectName: context.subject?.name || 'General Curriculum',
              topicName: context.topic?.title || 'Core Syllabus',
              referencedMaterials: context.relevantMaterials.map((m) => m.title),
            };
          }
        }
      } catch (err) {
        console.warn('[DoubtSolverService] AI call error, falling back:', err.message);
      }
    }

    return {
      directAnswer: `Analysis for: "${query.trim()}".`,
      explanation: `Based on your curriculum in ${context.subject ? context.subject.name : 'this subject'}, understanding core principles and how they connect to practical application is key.`,
      keyConcepts: context.syllabusTopics.slice(0, 3).map((t) => t.title),
      examTip: 'Structure your answers using diagrams, key definitions, and bullet-pointed advantages/disadvantages.',
      suggestedFollowUps: [
        'Can you show a practical example or diagram of this?',
        'What are the most frequent exam questions on this topic?',
      ],
      subjectName: context.subject?.name || 'General Curriculum',
      topicName: context.topic?.title || 'Core Syllabus',
      referencedMaterials: context.relevantMaterials.map((m) => m.title),
    };
  }
}

module.exports = new DoubtSolverService();
