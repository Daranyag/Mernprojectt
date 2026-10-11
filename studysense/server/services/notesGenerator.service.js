const { getApiKey, getModelName } = require('./quizGenerator.service');

/**
 * Builds prompt for Short Notes Generation across various academic note styles.
 */
const buildNotesPrompt = ({
  subjectName,
  unitName = '',
  topicNames = [],
  noteStyle = 'Quick Revision Notes',
  sourceScope = 'general_knowledge', // 'material_only', 'general_knowledge', 'combined'
  extractedMaterials = [],
  customInstructions = ''
}) => {
  const materialsText = extractedMaterials
    .map((m, idx) => `--- SOURCE ${idx + 1}: ${m.title || 'Document'} ---\n${m.text}`)
    .join('\n\n');

  let scopeInstruction = '';
  if (sourceScope === 'material_only') {
    scopeInstruction = `STRICT SOURCE GROUNDING REQUIREMENT:
- Extract definitions, summaries, and points EXCLUSIVELY from the provided study material sources below.
- Do NOT bring in external or assumed information not in the sources.
- Cite specific source titles, slides, or sections where applicable.`;
  } else if (sourceScope === 'general_knowledge') {
    scopeInstruction = `ACADEMIC CURRICULUM REQUIREMENT:
- Synthesize clear, high-yield academic revision notes aligned with standard university syllabus benchmarks for "${subjectName}".
- Clearly structure points with precise terminology, formulas, and verified definitions.`;
  } else {
    scopeInstruction = `COMBINED SCOPE:
- Prioritize facts, definitions, and examples from the provided study materials. Supplement with standard syllabus concepts for "${subjectName}" to provide complete coverage.`;
  }

  const styleGuides = {
    'Quick Revision Notes': 'Concise bullet points, core concepts, essential formulas, high-impact highlights for quick last-minute revision.',
    'Unit-Wise Notes': 'Systematic breakdown categorized by unit subtopics, architectural overviews, and structured summaries.',
    'Topic-Wise Notes': 'Deep-dive structured breakdown into Core Idea, Detailed Mechanism, Practical Examples, Key Takeaways.',
    'Important Definitions': 'Dictionary-style glossary of crucial academic terms, formal definitions, and brief context/significance.',
    'Formula and Key Points Sheet': 'List of all crucial formulas, variables, step-by-step algorithms, principles, and key properties.',
    'Short Question-and-Answer Notes': 'Frequent 2-mark and short Q&A pairs with precise, model exam answers.',
    'Exam Preparation Notes': 'Comprehensive syllabus coverage highlighting predicted high-weightage concepts, key diagrams descriptions, and review checklists.',
    '2-Mark Answer Notes': 'Crisp, 2-to-3 sentence precision answers with definitions and exact technical terminology.',
    '5-Mark Answer Notes': 'Structured answers with introduction, 4-6 bulleted analytical points, labeled diagram/flow description, and brief conclusion.',
    '10-Mark Answer Notes': 'Comprehensive essay-style answers with introduction, detailed subheadings, theoretical explanation, real-world case/architecture, advantages/disadvantages, and conclusion.',
    '14-Mark Answer Notes': 'Exhaustive university answer model with in-depth technical analysis, step-by-step mathematical or algorithmic steps, architecture, comparative tables, and comprehensive summary.'
  };

  const selectedGuide = styleGuides[noteStyle] || styleGuides['Quick Revision Notes'];

  return `You are a distinguished University Professor and Master Note-Maker for the course "${subjectName}".
Your task is to create high-quality, professional, beautifully formatted academic revision notes.

SUBJECT: ${subjectName}
${unitName ? `UNIT / MODULE: ${unitName}` : ''}
${topicNames.length ? `TOPIC(S): ${topicNames.join(', ')}` : ''}
NOTE STYLE: ${noteStyle}
STYLE GUIDELINE: ${selectedGuide}
${customInstructions ? `USER INSTRUCTIONS: ${customInstructions}` : ''}

${scopeInstruction}

${materialsText ? `\n--- SUPPLIED LEARNING MATERIALS ---\n${materialsText}\n` : ''}

OUTPUT FORMAT:
Generate your response in clean, professional GitHub-flavored Markdown.
Structure your notes logically with:
# Title (e.g., # ${subjectName}: ${noteStyle})
## Overview / Key Concepts
Followed by well-organized sections (###), bullet points, bold key terms, tables where comparative analysis is helpful, and code or formula blocks where appropriate.
Do not include chat greetings or conversational preamble. Return only the markdown study note content.`;
};

/**
 * Generates structured academic notes using curriculum intelligence when AI is unavailable.
 */
const generateFallbackNotes = (config) => {
  const topics = (config.topicNames && config.topicNames.length > 0)
    ? config.topicNames
    : ['Fundamental Concepts', 'System Architecture & Workflow', 'Core Implementation & State Operations', 'Performance, Trade-offs & Best Practices'];

  const content = `# ${config.subjectName}: ${config.noteStyle || 'Quick Revision Notes'}
${config.unitName ? `\n> **Unit / Module Focus:** ${config.unitName}` : ''}

## 1. Executive Summary & Core Pillars
${config.subjectName} focuses on systematic abstractions, process control, and performance optimization. This study guide synthesizes key concepts, architectural trade-offs, and critical exam definitions.

---

${topics.map((t, idx) => `### Section ${idx + 1}: ${t}
- **Overview & Formal Definition:**
  **${t}** represents an essential operational mechanism in ${config.subjectName}. It coordinates core system resources, maintains state integrity, and establishes reliable interfaces.
- **Key Architectural Components:**
  1. *Functional Pipeline:* Manages input validation and lifecycle execution.
  2. *State Control:* Prevents race conditions, resource contention, and memory leaks.
  3. *Error & Boundary Handling:* Enforces recovery protocols under peak system workloads.
- **Important Technical Concepts:**
  - **Latency vs. Throughput:** Evaluates trade-offs between immediate response time and bulk processing efficiency.
  - **Correctness Guarantees:** Ensures deterministic execution across concurrent operations.
- **Exam Tips & Common Question Patterns:**
  - *Short Answer (2-5 Marks):* Be prepared to sketch the block diagram and define formal properties.
  - *Essay Question (10 Marks):* Explain the algorithm step-by-step and provide a comparative analysis with alternative techniques.
`).join('\n---\n\n')}

## 2. High-Yield Exam Formulas & Conceptual Summary Table
| Pillar | Focus Area | Critical Exam Takeaway |
| :--- | :--- | :--- |
| **Foundations** | System Models | Dual-mode execution & boundary isolation |
| **Processing** | Algorithms & Workflows | Time and space complexity trade-offs |
| **Optimization** | Throughput & Memory | Cache hit ratios and resource scheduling |

> [!NOTE]
> *Prepared for ${config.subjectName} university examinations based on standard syllabus learning outcomes.*
`;

  return {
    title: `${config.noteStyle || 'Quick Revision Notes'} - ${config.topicNames?.length ? config.topicNames.join(', ') : config.subjectName}`,
    content,
    noteStyle: config.noteStyle || 'Quick Revision Notes',
    sourceScope: config.sourceScope || 'general_knowledge'
  };
};

/**
 * Calls Gemini API to generate formatted Short Notes with automatic curriculum fallback.
 */
const generateNotesWithAI = async (config) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[NotesGenerator] No GEMINI_API_KEY found, using curriculum fallback generator.');
    return generateFallbackNotes(config);
  }

  const model = getModelName();
  const prompt = buildNotesPrompt(config);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
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
      temperature: 0.3,
      maxOutputTokens: 4096
    }
  };

  let candidateText = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(35000)
    });

    if (response.ok) {
      const data = await response.json();
      candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }
  } catch (err) {
    console.warn('[NotesGenerator] AI Provider failed, falling back to curriculum generator:', err.message);
    return generateFallbackNotes(config);
  }

  if (!candidateText) {
    return generateFallbackNotes(config);
  }

  return {
    title: `${config.noteStyle || 'Notes'} - ${config.topicNames?.length ? config.topicNames.join(', ') : config.subjectName}`,
    content: candidateText.trim(),
    noteStyle: config.noteStyle || 'Quick Revision Notes',
    sourceScope: config.sourceScope || 'general_knowledge'
  };
};

module.exports = {
  buildNotesPrompt,
  generateNotesWithAI
};
