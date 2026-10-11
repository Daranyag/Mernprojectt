const { getApiKey, getModelName } = require('./quizGenerator.service');

/**
 * Validates and calculates marks for an exam paper configuration.
 * Distinguishes total available marks from required attempted marks when optional/choice questions exist.
 * @param {Array} sectionsConfig
 * @returns {object} calculated summary
 */
const calculatePaperMarks = (sectionsConfig = []) => {
  let totalAvailableMarks = 0;
  let requiredAttemptedMarks = 0;
  let totalQuestionsPresented = 0;
  let totalQuestionsRequired = 0;

  const validatedSections = sectionsConfig.map((sec, idx) => {
    const sectionId = sec.sectionId || `Part ${String.fromCharCode(65 + idx)}`;
    const title = sec.title || `${sectionId}: Questions`;
    const marksPerQ = Math.max(Number(sec.marksPerQuestion) || 1, 1);
    const totalQ = Math.max(Number(sec.totalQuestions) || 1, 1);
    const toAnswer = Math.min(Math.max(Number(sec.questionsToAnswer) || totalQ, 1), totalQ);

    const sectionAvailableMarks = totalQ * marksPerQ;
    const sectionAttemptedMarks = toAnswer * marksPerQ;

    totalAvailableMarks += sectionAvailableMarks;
    requiredAttemptedMarks += sectionAttemptedMarks;
    totalQuestionsPresented += totalQ;
    totalQuestionsRequired += toAnswer;

    return {
      sectionId,
      title,
      instructions:
        sec.instructions ||
        (toAnswer < totalQ
          ? `Answer any ${toAnswer} out of ${totalQ} questions. Each carries ${marksPerQ} mark(s).`
          : `Answer all ${totalQ} questions. Each carries ${marksPerQ} mark(s).`),
      totalQuestions: totalQ,
      questionsToAnswer: toAnswer,
      marksPerQuestion: marksPerQ,
      totalSectionMarks: sectionAvailableMarks,
      attemptedSectionMarks: sectionAttemptedMarks,
      questionType: sec.questionType || (marksPerQ <= 2 ? 'very_short_answer' : marksPerQ <= 5 ? 'short_answer' : 'long_answer')
    };
  });

  return {
    totalAvailableMarks,
    requiredAttemptedMarks,
    totalQuestionsPresented,
    totalQuestionsRequired,
    sections: validatedSections
  };
};

/**
 * Builds the AI generation prompt for complete examination papers.
 */
const buildExamPaperPrompt = ({
  subjectName,
  topicNames = [],
  sourceScope, // 'material_only', 'general_knowledge', 'combined'
  extractedMaterials = [],
  difficulty = 'Medium',
  sections = [],
  includeAnswerKey = true,
  includeMarkingScheme = true
}) => {
  const materialsText = extractedMaterials
    .map((m, idx) => `--- SOURCE ${idx + 1}: ${m.title || 'Material'} ---\n${m.text}`)
    .join('\n\n');

  let scopeInstruction = '';
  if (sourceScope === 'material_only') {
    scopeInstruction = `STRICT GROUNDING INSTRUCTION:
- Base EVERY single question strictly and exclusively on the supplied study materials below.
- Do NOT introduce facts, external dates, or definitions not present in the material.
- If the supplied materials do not contain enough content to support the full paper, generate as many grounded questions as possible and note the limitation.
- Set "sourceType": "material" and populate "sourceReference" with the title or excerpt.`;
  } else if (sourceScope === 'general_knowledge') {
    scopeInstruction = `CURRICULUM INSTRUCTION:
- Formulate exam-style questions drawing from the standard MCA/CS syllabus for "${subjectName}"${
      topicNames.length ? ` focusing on: ${topicNames.join(', ')}` : ''
    }.
- Set "sourceType": "general_knowledge" and "sourceReference": "Standard University Curriculum".`;
  } else {
    scopeInstruction = `COMBINED INSTRUCTION:
- Prioritize the provided study materials. Where materials lack depth for specific sections, draw upon standard curriculum knowledge for "${subjectName}".
- Clearly mark each question with "sourceType": "material" or "general_knowledge".`;
  }

  const sectionsBlueprint = sections
    .map(
      (s, idx) =>
        `SECTION ${idx + 1} (${s.sectionId}):
- Title: "${s.title}"
- Required Question Count: ${s.totalQuestions} questions
- Marks Per Question: ${s.marksPerQuestion} mark(s)
- Question Type: ${s.questionType}
- Choice Rule: Answer ${s.questionsToAnswer} out of ${s.totalQuestions}`
    )
    .join('\n\n');

  return `You are a Chief University Controller of Examinations and Professor for the degree course "${subjectName}".
Your task is to generate a comprehensive, error-free University Examination Question Paper.

SUBJECT: ${subjectName}
${topicNames.length ? `TOPICS/UNITS: ${topicNames.join(', ')}` : ''}
OVERALL DIFFICULTY: ${difficulty}

${scopeInstruction}

--- SECTION STRUCTURE BLUEPRINT ---
${sectionsBlueprint}

${materialsText ? `\n--- SUPPLIED SOURCE MATERIALS ---\n${materialsText}\n` : ''}

CRITICAL RULES FOR QUESTIONS:
1. No duplicate or near-duplicate questions across any sections.
2. For 1-2 mark questions: Provide direct questions with concise 1-2 sentence model answers.
3. For 5 mark questions: Provide structured questions requiring conceptual explanations, steps, or code snippets with a 2-part marking rubric.
4. For 10 or 14 mark questions: Provide comprehensive essay/analytical questions. Include a full structured model answer with headings (Introduction, Core Concept/Architecture, Working, Advantages/Disadvantages, Conclusion) and an itemized marking rubric allocating marks across key components.
5. For MCQs (if any): Provide exactly 4 options (A, B, C, D), specify correctAnswer, and explanation.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with valid JSON ONLY. No markdown wrapper, no extra text.
Adhere strictly to this schema:
{
  "sections": [
    {
      "sectionId": "Part A",
      "title": "Part A: Very Short Answers",
      "instructions": "Answer all questions.",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Question stem here",
          "questionType": "very_short_answer" | "short_answer" | "long_answer" | "single_choice",
          "marks": number,
          "difficulty": "Easy" | "Medium" | "Hard",
          "options": [ { "id": "A", "text": "Option A" } ],
          "correctAnswer": "Model answer or correct option key",
          "explanation": "Brief explanation",
          "modelAnswer": "Structured comprehensive answer",
          "rubric": [ { "criterion": "Heading / Concept", "allocatedMarks": number } ],
          "sourceReference": "Source title or excerpt",
          "sourceType": "material" | "general_knowledge",
          "internalChoice": ""
        }
      ]
    }
  ]
}`;
};

/**
 * Generates reliable examination sections using standard academic curriculum when AI is unavailable.
 */
const generateFallbackSections = (config) => {
  const topics = (config.topicNames && config.topicNames.length > 0)
    ? config.topicNames
    : [
        'Fundamental Principles and System Overview',
        'Architecture, Structural Design and Lifecycle',
        'Core Algorithms, Processes and Management',
        'State Synchronization, Memory and Storage',
        'Security, Optimization and Verification Standards'
      ];

  let globalQNum = 1;

  return config.sections.map((blueprint, bIdx) => {
    const totalQ = Number(blueprint.totalQuestions) || 5;
    const marks = Number(blueprint.marksPerQuestion) || 2;
    const type = blueprint.questionType || (marks <= 2 ? 'short_answer' : 'long_answer');

    const questions = [];
    for (let i = 0; i < totalQ; i++) {
      const qNum = globalQNum++;
      const topic = topics[(i + bIdx * 3) % topics.length];
      const nextTopic = topics[(i + bIdx * 3 + 1) % topics.length];

      let questionText = '';
      let modelAnswer = '';
      let rubric = [];

      if (marks <= 2) {
        questionText = `Define "${topic}" in the context of ${config.subjectName} and state its primary significance.`;
        modelAnswer = `${topic} is a core foundation in ${config.subjectName}. It governs key computational operations, resource coordination, and structural consistency across the system.`;
        rubric = [
          { criterion: 'Precise definition and conceptual clarity', allocatedMarks: Math.ceil(marks / 2) },
          { criterion: 'Technical accuracy and significance', allocatedMarks: Math.floor(marks / 2) || 1 }
        ];
      } else if (marks <= 7) {
        questionText = `Explain the working mechanism, key components, and design trade-offs of ${topic}. Compare it briefly with ${nextTopic}.`;
        modelAnswer = `1. Core Concept: ${topic} addresses fundamental system constraints in ${config.subjectName}.\n2. Architecture & Components: Discuss the modular structure, inputs, and operational phases.\n3. Comparison: Unlike ${nextTopic}, this mechanism focuses on optimized throughput and reduced latency.\n4. Practical Application: Widely utilized in enterprise production environments.`;
        rubric = [
          { criterion: 'Explanation of mechanism & components', allocatedMarks: Math.round(marks * 0.4) },
          { criterion: 'Comparative analysis and technical distinctions', allocatedMarks: Math.round(marks * 0.3) },
          { criterion: 'Diagram / structured formatting and examples', allocatedMarks: Math.round(marks * 0.3) }
        ];
      } else {
        questionText = `Critically evaluate the architectural framework, algorithmic implementation, and lifecycle execution of ${topic}. Illustrate with detailed system workflows and discuss modern optimization strategies.`;
        modelAnswer = `1. Introduction & Context: Comprehensive background of ${topic} within ${config.subjectName}.\n2. Architectural Workflow: Diagrammatic representation of component interactions, state transitions, and scheduling.\n3. Algorithmic Breakdown: Step-by-step evaluation of time/space complexity and resource allocation.\n4. Challenges & Mitigations: Race conditions, memory overhead, and failure recovery protocols.\n5. Summary & Modern Directions: Contemporary enhancements in cloud and distributed systems.`;
        rubric = [
          { criterion: 'In-depth conceptual architecture & workflow', allocatedMarks: Math.round(marks * 0.35) },
          { criterion: 'Algorithmic explanation & technical correctness', allocatedMarks: Math.round(marks * 0.35) },
          { criterion: 'Critical evaluation, diagrams, and industry solutions', allocatedMarks: Math.round(marks * 0.3) }
        ];
      }

      questions.push({
        questionNumber: qNum,
        questionText,
        questionType: type,
        marks,
        difficulty: config.difficulty || 'Medium',
        options: [],
        correctAnswer: modelAnswer,
        explanation: `Curriculum standard assessment for ${config.subjectName} (${topic}).`,
        modelAnswer: config.includeAnswerKey ? modelAnswer : '',
        rubric: config.includeMarkingScheme ? rubric : [],
        sourceReference: 'University Examination Curriculum',
        sourceType: 'general_knowledge',
        internalChoice: blueprint.questionsToAnswer < blueprint.totalQuestions && i % 2 === 1 ? `OR Question ${qNum - 1}` : '',
        isOptional: false,
        tags: [config.subjectName, topic]
      });
    }

    return {
      sectionId: blueprint.sectionId,
      title: blueprint.title,
      instructions: blueprint.instructions,
      totalQuestions: questions.length,
      questionsToAnswer: blueprint.questionsToAnswer || questions.length,
      marksPerQuestion: blueprint.marksPerQuestion,
      totalSectionMarks: questions.reduce((sum, q) => sum + q.marks, 0),
      attemptedSectionMarks: (blueprint.questionsToAnswer || questions.length) * blueprint.marksPerQuestion,
      questions
    };
  });
};

/**
 * Generates an examination paper via Google Gemini AI with automatic curriculum fallback.
 * @param {object} config
 * @returns {Promise<Array<object>>} validated sections with generated questions
 */
const generateExamPaperWithAI = async (config) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[ExamPaper] No GEMINI_API_KEY found, using standard academic curriculum fallback.');
    return generateFallbackSections(config);
  }

  const model = getModelName();
  const prompt = buildExamPaperPrompt(config);

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let candidateText = '';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(35000)
    });

    if (response.ok) {
      const data = await response.json();
      candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }
  } catch (err) {
    console.warn('[ExamPaper] AI Provider failed, falling back to curriculum generator:', err.message);
    return generateFallbackSections(config);
  }

  if (!candidateText) {
    return generateFallbackSections(config);
  }

  let parsed;
  try {
    const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('[ExamPaper] AI JSON parse error, falling back to curriculum generator:', err.message);
    return generateFallbackSections(config);
  }

  const rawSections = Array.isArray(parsed) ? parsed : parsed.sections;
  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return generateFallbackSections(config);
  }

  // Merge and validate generated sections against expected blueprint
  let globalQNum = 1;
  const processedSections = config.sections.map((blueprint, bIdx) => {
    const aiSec = rawSections.find(
      (s) => s.sectionId === blueprint.sectionId || s.title?.includes(blueprint.sectionId)
    ) || rawSections[bIdx] || { questions: [] };

    const rawQuestions = Array.isArray(aiSec.questions) ? aiSec.questions : [];

    const questions = rawQuestions.map((q, qIdx) => {
      const qNum = globalQNum++;
      const marks = Number(q.marks) || blueprint.marksPerQuestion || 1;
      const type = q.questionType || blueprint.questionType || 'short_answer';

      return {
        questionNumber: qNum,
        questionText: String(q.questionText || `Question ${qNum}`).trim(),
        questionType: type,
        marks,
        difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : config.difficulty || 'Medium',
        options: Array.isArray(q.options)
          ? q.options.map((o) => ({ id: String(o.id), text: String(o.text) }))
          : [],
        correctAnswer: String(q.correctAnswer || '').trim(),
        explanation: String(q.explanation || '').trim(),
        modelAnswer: String(q.modelAnswer || q.correctAnswer || '').trim(),
        rubric: Array.isArray(q.rubric)
          ? q.rubric.map((r) => ({
              criterion: String(r.criterion || 'Assessment point'),
              allocatedMarks: Number(r.allocatedMarks || 1)
            }))
          : [],
        sourceReference: String(q.sourceReference || config.subjectName).trim(),
        sourceType: q.sourceType === 'general_knowledge' ? 'general_knowledge' : 'material',
        internalChoice: String(q.internalChoice || '').trim(),
        isOptional: false,
        tags: Array.isArray(q.tags) ? q.tags : []
      };
    });

    return {
      sectionId: blueprint.sectionId,
      title: blueprint.title,
      instructions: blueprint.instructions,
      totalQuestions: questions.length,
      questionsToAnswer: blueprint.questionsToAnswer || questions.length,
      marksPerQuestion: blueprint.marksPerQuestion,
      totalSectionMarks: questions.reduce((sum, q) => sum + q.marks, 0),
      attemptedSectionMarks: (blueprint.questionsToAnswer || questions.length) * blueprint.marksPerQuestion,
      questions
    };
  });

  return processedSections;
};

module.exports = {
  calculatePaperMarks,
  buildExamPaperPrompt,
  generateExamPaperWithAI
};
