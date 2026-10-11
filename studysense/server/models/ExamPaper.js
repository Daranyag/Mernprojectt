const mongoose = require('mongoose');

const rubricItemSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: true,
      trim: true
    },
    allocatedMarks: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const examQuestionSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    questionType: {
      type: String,
      enum: ['single_choice', 'very_short_answer', 'short_answer', 'long_answer', 'essay'],
      default: 'short_answer'
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [1, 'Marks must be at least 1']
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    options: {
      type: [optionSchema],
      default: []
    },
    correctAnswer: {
      type: String,
      default: ''
    },
    explanation: {
      type: String,
      default: ''
    },
    modelAnswer: {
      type: String,
      default: ''
    },
    rubric: {
      type: [rubricItemSchema],
      default: []
    },
    sourceReference: {
      type: String,
      default: ''
    },
    sourceType: {
      type: String,
      default: 'material' // 'material' or 'general_knowledge'
    },
    internalChoice: {
      type: String,
      default: '' // e.g. "OR with Question 4"
    },
    isOptional: {
      type: Boolean,
      default: false
    },
    tags: {
      type: [String],
      default: []
    }
  },
  { _id: true }
);

const examSectionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: true // 'Part A', 'Part B', 'Part C', etc.
    },
    title: {
      type: String,
      required: true // 'Part A: Very Short Answer Questions'
    },
    instructions: {
      type: String,
      default: 'Answer all questions.'
    },
    questions: {
      type: [examQuestionSchema],
      default: []
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    questionsToAnswer: {
      type: Number,
      default: 0
    },
    marksPerQuestion: {
      type: Number,
      default: 1
    },
    totalSectionMarks: {
      type: Number,
      default: 0
    },
    attemptedSectionMarks: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const examPaperSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Exam paper title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    institutionName: {
      type: String,
      trim: true,
      default: ''
    },
    courseCode: {
      type: String,
      trim: true,
      default: ''
    },
    examDuration: {
      type: String,
      default: '3 Hours'
    },
    generalInstructions: {
      type: [String],
      default: [
        'Read all questions carefully before answering.',
        'Answer the required number of questions from each section.',
        'Marks are indicated alongside each question.'
      ]
    },
    sourceScope: {
      type: String,
      enum: ['material_only', 'general_knowledge', 'combined'],
      default: 'material_only'
    },
    sourceReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizSource'
      }
    ],
    selectedTopics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
      }
    ],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Medium'
    },
    totalAvailableMarks: {
      type: Number,
      default: 0
    },
    requiredAttemptedMarks: {
      type: Number,
      default: 0
    },
    totalQuestionsPresented: {
      type: Number,
      default: 0
    },
    sections: {
      type: [examSectionSchema],
      default: []
    },
    hasAnswerKey: {
      type: Boolean,
      default: true
    },
    hasMarkingScheme: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Helper to calculate total marks across all sections accurately
examPaperSchema.methods.recalculateMarks = function () {
  let totalAvailable = 0;
  let totalAttempted = 0;
  let totalQuestions = 0;

  for (const section of this.sections) {
    let sectionAvailable = 0;
    const questionsCount = section.questions ? section.questions.length : 0;
    totalQuestions += questionsCount;

    for (const q of section.questions) {
      sectionAvailable += Number(q.marks) || 0;
    }

    section.totalQuestions = questionsCount;
    section.totalSectionMarks = sectionAvailable;

    // Calculate required attempted marks for this section
    const toAnswer = section.questionsToAnswer > 0 ? Math.min(section.questionsToAnswer, questionsCount) : questionsCount;
    section.questionsToAnswer = toAnswer;

    if (toAnswer < questionsCount && section.marksPerQuestion > 0) {
      section.attemptedSectionMarks = toAnswer * section.marksPerQuestion;
    } else {
      section.attemptedSectionMarks = sectionAvailable;
    }

    totalAvailable += sectionAvailable;
    totalAttempted += section.attemptedSectionMarks;
  }

  this.totalAvailableMarks = totalAvailable;
  this.requiredAttemptedMarks = totalAttempted;
  this.totalQuestionsPresented = totalQuestions;
};

examPaperSchema.index({ user: 1, subject: 1, createdAt: -1 });

const ExamPaper = mongoose.model('ExamPaper', examPaperSchema);

module.exports = {
  ExamPaper
};
