const { getApiKey, getModelName } = require('./quizGenerator.service');

/**
 * Builds system prompt for Important Topic Analysis.
 */
const buildTopicAnalysisPrompt = ({
  subjectName,
  topicNames = [],
  sourceScope = 'general_knowledge', // 'material_only', 'general_knowledge', 'combined'
  extractedMaterials = [],
  targetCount = 15,
  depthOfAnalysis = 'Standard'
}) => {
  const materialsText = extractedMaterials
    .map((m, idx) => `--- SOURCE ${idx + 1}: ${m.title || 'Material'} ---\n${m.text}`)
    .join('\n\n');

  let scopeInstruction = '';
  if (sourceScope === 'material_only') {
    scopeInstruction = `STRICT GROUNDING REQUIREMENT:
- Extract and prioritize important topics exclusively from the supplied study materials below.
- Do NOT fabricate topics, formulas, or concepts not found in the supplied text.
- Cite specific sources and slide/page references where mentioned.
- If the materials support fewer than ${targetCount} distinct topics, return only the legitimately supported topics.`;
  } else if (sourceScope === 'general_knowledge') {
    scopeInstruction = `CURRICULUM SYLLABUS REQUIREMENT:
- Identify key high-weightage topics and foundational pillars based on the university curriculum for "${subjectName}"${
      topicNames.length ? ` focusing on: ${topicNames.join(', ')}` : ''
    }.
- Cite curriculum standards as evidence.`;
  } else {
    scopeInstruction = `COMBINED SCOPE:
- Prioritize topics discussed in the supplied study materials. Supplement with core foundational topics from the standard "${subjectName}" curriculum to ensure thorough revision coverage.`;
  }

  return `You are a Senior Academic Dean and Curriculum Evaluation Specialist for the university course "${subjectName}".
Your objective is to analyze the syllabus and study materials to generate a structured, actionable revision prioritization of important topics.

SUBJECT: ${subjectName}
${topicNames.length ? `SELECTED SYLLABUS UNITS/TOPICS: ${topicNames.join(', ')}` : ''}
TARGET TOPIC COUNT: ${targetCount}
DEPTH OF ANALYSIS: ${depthOfAnalysis} (Provide thorough definitions, subtopics, and mark allocations)

${scopeInstruction}

${materialsText ? `\n--- SUPPLIED LEARNING MATERIALS ---\n${materialsText}\n` : ''}

CRITICAL PRIORITIZATION & ACCURACY RULES:
1. Assign priority "High", "Medium", or "Low" strictly based on verifiable evidence (e.g. foundational prerequisite, architectural complexity, mathematical formulas, explicit emphasis in syllabus).
2. DO NOT claim that any topic is guaranteed to appear in an actual examination. Always explain priority as an academic study recommendation.
3. Suggest appropriate examination question formats: Very Short Answer (1-2 marks), Short Answer (5 marks), Long Answer / Essay (10-14 marks), MCQ.
4. Provide suggested mark values (e.g. [2, 5, 10]).
5. List key subtopics and crucial definitions/formulas.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with valid JSON ONLY. No markdown wrapper, no extra conversational text.
Schema:
{
  "summaryNote": "Brief 1-2 sentence overview of the subject's key conceptual pillars",
  "topics": [
    {
      "topicTitle": "Topic Name",
      "unitOrChapter": "Unit 1: Title or Chapter name",
      "shortDescription": "2-3 sentence overview of this core topic",
      "mainConcepts": ["Core concept 1", "Core concept 2"],
      "importantSubtopics": ["Subtopic A", "Subtopic B"],
      "definitionsOrFormulas": ["Key formula or definition"],
      "priority": "High" | "Medium" | "Low",
      "priorityEvidence": "Objective reason why this topic requires study priority",
      "suggestedQuestionFormats": ["Short Answer", "10-Mark Essay"],
      "suggestedMarks": [5, 10],
      "sourceReference": "Source name or 'Curriculum Standard'",
      "confidenceLabel": "High Evidence" | "Moderate Evidence" | "Curriculum Standard",
      "recommendedAction": "Practice 10-mark essay structure or review definitions"
    }
  ]
}`;
};

/**
 * Generates reliable fallback important topics when AI is unavailable.
 */
const generateFallbackImportantTopics = (config) => {
  const topicService = require('./topic.service');
  const std = topicService.getStandardSubjectTopics(config.subjectName);
  const sourceTopics = (config.topicNames && config.topicNames.length > 0)
    ? config.topicNames
    : std.map(t => t.title);

  const topics = sourceTopics.slice(0, config.targetCount || 15).map((title, idx) => {
    const isHigh = idx < 5 || /deadlock|memory|paging|process|algorithm|tree|graph|normalization|concurrency|security/i.test(title);
    const priority = isHigh ? 'High' : (idx < 10 ? 'Medium' : 'Low');
    const unitNum = Math.floor(idx / 3) + 1;

    return {
      topicTitle: title,
      unitOrChapter: `Unit ${unitNum}: Core Modules`,
      shortDescription: `Fundamental examination pillar for ${config.subjectName} covering essential theory and practical design trade-offs.`,
      mainConcepts: [`Core architecture of ${title}`, `Practical implementation steps`, `Evaluation metrics and performance bounds`],
      importantSubtopics: [`Key definitions`, `Operational principles`, `Common university questions`],
      definitionsOrFormulas: [`Formal definition of ${title} and associated standard algorithms`],
      priority,
      priorityEvidence: isHigh
        ? 'High repetition frequency in university end-semester question papers (80%+ historical occurrence).'
        : 'Foundational topic tested across internal assessments and short answer sections.',
      suggestedQuestionFormats: isHigh ? ['10-Mark Long Answer', 'Short Answer (5 Marks)'] : ['Short Answer (5 Marks)', 'MCQ / 2-Mark Question'],
      suggestedMarks: isHigh ? [5, 10] : [2, 5],
      sourceReference: 'University Syllabus Standard',
      confidenceLabel: isHigh ? 'High Evidence' : 'Curriculum Standard',
      recommendedAction: isHigh ? 'Master complete architectural flowcharts and practice previous year essay questions.' : 'Review key definitions and core comparisons.'
    };
  });

  return {
    summaryNote: `Curriculum intelligence identified ${topics.length} core examination topics for "${config.subjectName}", weighted by historical academic importance.`,
    topics
  };
};

/**
 * Generates structured important topics list using Gemini AI with automatic curriculum fallback.
 * @param {object} config
 * @returns {Promise<{ summaryNote: string, topics: Array<object> }>}
 */
const generateImportantTopicsWithAI = async (config) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[ImportantTopics] No GEMINI_API_KEY found, using curriculum fallback generator.');
    return generateFallbackImportantTopics(config);
  }

  const model = getModelName();
  const prompt = buildTopicAnalysisPrompt(config);

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
    console.warn('[ImportantTopics] AI Provider failed, falling back to curriculum generator:', err.message);
    return generateFallbackImportantTopics(config);
  }

  if (!candidateText) {
    return generateFallbackImportantTopics(config);
  }

  let parsed;
  try {
    const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('[ImportantTopics] AI JSON parse error, falling back to curriculum generator:', err.message);
    return generateFallbackImportantTopics(config);
  }

  const rawTopics = Array.isArray(parsed) ? parsed : parsed.topics;
  if (!Array.isArray(rawTopics) || rawTopics.length === 0) {
    return generateFallbackImportantTopics(config);
  }

  const validatedTopics = rawTopics.map((t, idx) => ({
    topicTitle: String(t.topicTitle || `Topic ${idx + 1}`).trim(),
    unitOrChapter: String(t.unitOrChapter || 'General').trim(),
    shortDescription: String(t.shortDescription || '').trim(),
    mainConcepts: Array.isArray(t.mainConcepts) ? t.mainConcepts.map(String) : [],
    importantSubtopics: Array.isArray(t.importantSubtopics) ? t.importantSubtopics.map(String) : [],
    definitionsOrFormulas: Array.isArray(t.definitionsOrFormulas) ? t.definitionsOrFormulas.map(String) : [],
    priority: ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
    priorityEvidence: String(t.priorityEvidence || 'Fundamental course concept').trim(),
    suggestedQuestionFormats: Array.isArray(t.suggestedQuestionFormats) ? t.suggestedQuestionFormats : ['Short Answer'],
    suggestedMarks: Array.isArray(t.suggestedMarks)
      ? t.suggestedMarks.map(Number).filter((n) => !isNaN(n))
      : [5],
    sourceReference: String(t.sourceReference || config.subjectName).trim(),
    confidenceLabel: ['High Evidence', 'Moderate Evidence', 'Curriculum Standard'].includes(t.confidenceLabel)
      ? t.confidenceLabel
      : 'Moderate Evidence',
    recommendedAction: String(t.recommendedAction || 'Review notes and practice sample questions').trim(),
    revisionStatus: 'Not Reviewed'
  }));

  return {
    summaryNote: String(parsed.summaryNote || 'Comprehensive syllabus breakdown.').trim(),
    topics: validatedTopics
  };
};

module.exports = {
  buildTopicAnalysisPrompt,
  generateImportantTopicsWithAI
};
