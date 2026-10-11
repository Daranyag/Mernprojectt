/**
 * AI Provider abstraction for generating structured questions from study materials
 * using official Google Gemini REST API with schema enforcement and validation.
 */

const getApiKey = () => {
  return process.env.GEMINI_API_KEY || '';
};

const getModelName = () => {
  return process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
};

/**
 * Builds system prompt and instructions for quiz generation.
 */
const buildPrompt = ({
  subjectName,
  topicName,
  sourceScope, // 'material_only', 'general_knowledge', 'combined'
  extractedMaterials = [],
  difficulty = 'Medium', // Easy, Medium, Hard, Mixed
  marks = '1', // 1, 2, 5, 10, 14, mixed
  questionFormat = 'single_choice', // single_choice, short_answer, long_answer, mixed
  questionCount = 5
}) => {
  const materialsText = extractedMaterials
    .map((m, idx) => `--- SOURCE ${idx + 1}: ${m.title || 'Material'} ---\n${m.text}`)
    .join('\n\n');

  let scopeInstruction = '';
  if (sourceScope === 'material_only') {
    scopeInstruction = `STRICT GROUNDING REQUIREMENT:
- Base EVERY question exclusively and strictly on the provided study materials below.
- Do NOT introduce facts, external dates, or definitions not found in the text.
- If the study material is too short to support ${questionCount} high quality questions, produce as many accurate questions as the material justifies (do NOT invent information).
- For each question, populate "sourceReference" with the title or excerpt where the answer was found.`;
  } else if (sourceScope === 'general_knowledge') {
    scopeInstruction = `GENERAL CURRICULUM REQUIREMENT:
- Generate questions reflecting standard university MCA / CS curriculum knowledge for Subject: "${subjectName}"${
      topicName ? ` and Topic: "${topicName}"` : ''
    }.
- Label "sourceReference" as "General Subject Curriculum".`;
  } else {
    // combined
    scopeInstruction = `COMBINED SOURCE & CURRICULUM REQUIREMENT:
- Prioritize the provided study materials. If supplementary curriculum questions are needed to reach ${questionCount} questions, draw from standard "${subjectName}" knowledge.
- In "sourceReference", clearly label whether the question is derived from "[Source Title]" or "General Subject Curriculum".`;
  }

  let formatInstruction = '';
  if (questionFormat === 'single_choice') {
    formatInstruction = `FORMAT REQUIREMENT:
- Every question MUST be "single_choice" (Multiple Choice Question).
- Provide exactly 4 options with ids: "A", "B", "C", "D".
- "correctOptionId" MUST be exactly one of "A", "B", "C", "D".
- Provide an "explanation" justifying why that option is correct.`;
  } else if (questionFormat === 'short_answer') {
    formatInstruction = `FORMAT REQUIREMENT:
- Every question MUST be "short_answer".
- "options" should be an empty array [].
- "correctOptionId" should be empty "".
- Provide an "expectedAnswer" summarizing the key points or formula in 2-4 sentences.
- Provide a "rubric" array of grading criteria with allocated marks summing up to the question's marks.`;
  } else if (questionFormat === 'long_answer') {
    formatInstruction = `FORMAT REQUIREMENT:
- Every question MUST be "long_answer" (10-mark or 14-mark university exam style question).
- "options" should be an empty array [].
- "correctOptionId" should be empty "".
- Provide a structured "expectedAnswer" outline containing headings, key technical concepts, and architectural or procedural details.
- Provide a "rubric" array with specific component mark breakdown (e.g. Definition: 2 marks, Architecture: 4 marks, Working: 4 marks).`;
  } else {
    // mixed
    formatInstruction = `FORMAT REQUIREMENT:
- Provide a balanced mix of "single_choice" (1-2 marks), "short_answer" (2-5 marks), and "long_answer" (10-14 marks) questions.
- For single_choice, provide 4 options (A, B, C, D), correctOptionId, and explanation.
- For short_answer and long_answer, provide expectedAnswer and a rubric array.`;
  }

  let marksInstruction = '';
  const marksStr = String(marks || '1').toLowerCase();
  if (marksStr === 'mixed') {
    marksInstruction = `Allocate realistic marks per question: 2 marks for conceptual/short questions, and 14 marks for comprehensive university essay questions.`;
  } else if (marksStr === '2' || marksStr === '2m') {
    marksInstruction = `Every question MUST be a 2-mark conceptual question (Part A university exam format: concise definitions, key properties, comparative distinctions, or core theorem). Set "marks": 2 on every question.`;
  } else if (marksStr === '14' || marksStr === '14m') {
    marksInstruction = `Every question MUST be a 14-mark university exam comprehensive question (Part B/C detailed essay, architecture diagram explanation, algorithm analysis, or full case study). Include sub-questions (e.g., (a) 7 Marks, (b) 7 Marks). Set "marks": 14 on every question. Provide an extensive "expectedAnswer" and a detailed "rubric" summing to 14 marks.`;
  } else {
    marksInstruction = `Each question must have exactly ${parseInt(marks, 10) || 1} mark(s).`;
  }

  return `You are an expert university professor and examination board evaluator for the course "${subjectName}".
Your task is to generate exactly ${questionCount} rigorous, high-quality assessment questions.

SUBJECT: ${subjectName}
${topicName ? `TOPIC: ${topicName}` : ''}
DIFFICULTY: ${difficulty}
MARKS CONFIGURATION: ${marksInstruction}

${scopeInstruction}

${formatInstruction}

${materialsText ? `\n--- SUPPLIED STUDY MATERIALS ---\n${materialsText}\n` : ''}

CRITICAL JSON OUTPUT REQUIREMENT:
You MUST respond with valid JSON ONLY. Do not wrap in markdown or markdown backticks.
The JSON must adhere to this exact schema:
{
  "questions": [
    {
      "questionText": "Clear question stem",
      "questionType": "single_choice" | "short_answer" | "long_answer",
      "difficulty": "Easy" | "Medium" | "Hard",
      "marks": number,
      "options": [
        { "id": "A", "text": "Option A" },
        { "id": "B", "text": "Option B" },
        { "id": "C", "text": "Option C" },
        { "id": "D", "text": "Option D" }
      ],
      "correctOptionId": "A",
      "explanation": "Clear explanation of the correct answer",
      "expectedAnswer": "Model answer for descriptive questions",
      "rubric": [
        { "criterion": "Key point 1", "allocatedMarks": number }
      ],
      "sourceReference": "Source attribution label or quote",
      "tags": ["relevant", "keywords"]
    }
  ]
}`;
};

/**
 * Generates reliable fallback quiz questions based on academic curriculum when AI is unavailable.
 */
const generateFallbackQuestions = (config) => {
  const count = config.questionCount || 5;
  const topic = config.topicName || 'Core Foundations';
  const subject = config.subjectName || 'Course';
  const marksStr = String(config.marks || '1').toLowerCase();
  const assignedMarks = marksStr === '14' || marksStr === '14m' ? 14 : (marksStr === '2' || marksStr === '2m' ? 2 : 1);

  const questions = [];
  for (let i = 0; i < count; i++) {
    if (assignedMarks === 14 || config.questionFormat === 'long_answer') {
      questions.push({
        questionText: `(a) Discuss in detail the architectural foundation and operational mechanisms of ${topic} in ${subject}. (7 Marks)\n(b) Analyze the key design trade-offs, optimization strategies, and real-world failure modes for ${topic}. (7 Marks)`,
        questionType: 'long_answer',
        difficulty: config.difficulty || 'Medium',
        marks: 14,
        options: [],
        correctAnswer: `Part (a): 1. Architectural Foundation: Core components and state management.\n2. Operational Lifecycle: Execution workflow and synchronization.\nPart (b): 1. Trade-offs: Latency vs. Throughput.\n2. Real-world applications and failure prevention.`,
        explanation: `Comprehensive 14-mark university exam assessment for ${subject} (${topic}).`,
        rubric: [
          { criterion: 'Part (a) Architecture and Mechanics', allocatedMarks: 7 },
          { criterion: 'Part (b) Trade-offs and Case Analysis', allocatedMarks: 7 }
        ],
        sourceReference: 'University Curriculum Standard',
        sourceType: 'general_knowledge'
      });
    } else if (assignedMarks === 2 || config.questionFormat === 'short_answer') {
      questions.push({
        questionText: `Define ${topic} in the context of ${subject} and state its two primary operational objectives. [2 Marks]`,
        questionType: 'single_choice',
        difficulty: config.difficulty || 'Medium',
        marks: 2,
        options: [
          { id: 'A', text: `It acts as the core controller managing resource allocation and consistency.` },
          { id: 'B', text: `It only stores static lookup tables without runtime validation.` },
          { id: 'C', text: `It operates purely as an external diagnostic logging daemon.` },
          { id: 'D', text: `It replaces the underlying hardware architecture completely.` }
        ],
        correctAnswer: 'A',
        correctOptionId: 'A',
        explanation: `${topic} is fundamentally responsible for coordinating execution and enforcing consistency in ${subject}.`,
        sourceReference: 'University Curriculum Standard',
        sourceType: 'general_knowledge'
      });
    } else {
      questions.push({
        questionText: `Which of the following statements is most accurate regarding ${topic} in ${subject}? (Question ${i + 1})`,
        questionType: 'single_choice',
        difficulty: config.difficulty || 'Medium',
        marks: 1,
        options: [
          { id: 'A', text: `It coordinates primary operational workflows and lifecycle execution for ${topic}.` },
          { id: 'B', text: `It completely eliminates all external dependencies and hardware constraints.` },
          { id: 'C', text: `It is only applicable in legacy single-user architectures.` },
          { id: 'D', text: `It operates strictly without memory or runtime state management.` }
        ],
        correctAnswer: 'A',
        correctOptionId: 'A',
        explanation: `${topic} is a core conceptual building block in ${subject} responsible for coordinating system execution and consistency.`,
        sourceReference: 'University Curriculum Standard',
        sourceType: 'general_knowledge'
      });
    }
  }
  return questions;
};

/**
 * Calls Google Gemini REST API to generate structured questions with automatic curriculum fallback.
 * @param {object} config
 * @returns {Promise<Array<object>>}
 */
const generateQuestionsWithAI = async (config) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[QuizGen] No GEMINI_API_KEY found, using curriculum fallback generator.');
    return generateFallbackQuestions(config);
  }

  const model = getModelName();
  const prompt = buildPrompt(config);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3, // Low temperature for high factual accuracy and adherence
      responseMimeType: 'application/json' // Structured JSON output
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let candidateText = '';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });

    if (response.ok) {
      const data = await response.json();
      candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }
  } catch (err) {
    console.warn('[QuizGen] AI Provider failed, falling back to curriculum generator:', err.message);
    return generateFallbackQuestions(config);
  }

  if (!candidateText) {
    return generateFallbackQuestions(config);
  }

  // Parse JSON response safely
  let parsed;
  try {
    const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('[QuizGen] AI JSON parse error, falling back to curriculum generator:', err.message);
    return generateFallbackQuestions(config);
  }

  const rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return generateFallbackQuestions(config);
  }

  // Validate and sanitize each generated question structure
  const validatedQuestions = rawQuestions.map((q, idx) => {
    const type = ['single_choice', 'short_answer', 'long_answer'].includes(q.questionType)
      ? q.questionType
      : 'single_choice';

    const difficulty = ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : config.difficulty || 'Medium';
    const marks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1;

    let options = [];
    let correctOptionId = '';

    if (type === 'single_choice') {
      if (Array.isArray(q.options) && q.options.length >= 2) {
        options = q.options.map((opt, oIdx) => ({
          id: String(opt.id || String.fromCharCode(65 + oIdx)),
          text: String(opt.text || '').trim()
        }));
      } else {
        options = [
          { id: 'A', text: 'True' },
          { id: 'B', text: 'False' }
        ];
      }

      correctOptionId = String(q.correctOptionId || options[0].id).trim();
      const hasValidCorrectId = options.some((o) => o.id === correctOptionId);
      if (!hasValidCorrectId && options.length > 0) {
        correctOptionId = options[0].id;
      }
    }

    let rubric = [];
    if (Array.isArray(q.rubric)) {
      rubric = q.rubric.map((r) => ({
        criterion: String(r.criterion || 'Assessment criterion').trim(),
        allocatedMarks: Number(r.allocatedMarks || 1)
      }));
    }

    return {
      tempId: `gen_${Date.now()}_${idx}`,
      questionText: String(q.questionText || `Question ${idx + 1}`).trim(),
      questionType: type,
      difficulty,
      marks,
      options,
      correctOptionId,
      explanation: String(q.explanation || '').trim(),
      expectedAnswer: String(q.expectedAnswer || '').trim(),
      rubric,
      sourceReference: String(q.sourceReference || config.subjectName).trim(),
      tags: Array.isArray(q.tags) ? q.tags.slice(0, 5) : []
    };
  });

  return validatedQuestions;
};

module.exports = {
  buildPrompt,
  generateQuestionsWithAI,
  getApiKey,
  getModelName
};
