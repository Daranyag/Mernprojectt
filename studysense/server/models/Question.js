const mongoose = require('mongoose');

const QUESTION_TYPES = ['single_choice', 'short_answer', 'long_answer'];
const QUESTION_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Option identifier is required'],
      trim: true,
    },
    text: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
      maxlength: [400, 'Option text cannot exceed 400 characters'],
    },
  },
  { _id: false }
);

const rubricItemSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: true,
      trim: true,
    },
    allocatedMarks: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [3000, 'Question text cannot exceed 3000 characters'],
    },
    questionType: {
      type: String,
      enum: QUESTION_TYPES,
      default: 'single_choice',
      required: true,
    },
    options: {
      type: [optionSchema],
      default: [],
      validate: {
        validator: function (opts) {
          if (this.questionType !== 'single_choice') return true;
          if (!Array.isArray(opts) || opts.length < 2) return false;
          const ids = new Set();
          for (const opt of opts) {
            if (!opt.id || !opt.text || opt.text.trim().length === 0) return false;
            if (ids.has(opt.id)) return false;
            ids.add(opt.id);
          }
          return true;
        },
        message: 'A single choice question must contain at least 2 non-empty options with unique IDs within the question',
      },
    },
    correctOptionId: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (val) {
          if (this.questionType !== 'single_choice') return true;
          if (!val) return false;
          if (!this.options || !Array.isArray(this.options)) return false;
          return this.options.some((opt) => opt.id === val);
        },
        message: 'Correct option ID must match one of the supplied options for single choice questions',
      },
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [3000, 'Explanation cannot exceed 3000 characters'],
      default: '',
    },
    difficulty: {
      type: String,
      enum: QUESTION_DIFFICULTIES,
      default: 'Medium',
    },
    marks: {
      type: Number,
      default: 1,
      min: [1, 'Marks must be at least 1'],
      max: [50, 'Marks cannot exceed 50'],
    },
    expectedAnswer: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Expected answer cannot exceed 5000 characters'],
    },
    rubric: {
      type: [rubricItemSchema],
      default: [],
    },
    sourceReference: {
      type: String,
      trim: true,
      default: '',
    },
    generatedFromSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizSource',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return !tags || tags.length <= 10;
        },
        message: 'Cannot exceed 10 tags per question',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user-scoped queries and filtering
questionSchema.index({ user: 1, subject: 1, topic: 1 });
questionSchema.index({ user: 1, difficulty: 1 });
questionSchema.index({ user: 1, createdAt: -1 });

// Helper to return question sanitized for quiz-taking (WITHOUT correctOptionId, expectedAnswer, or explanation)
questionSchema.methods.toStudentView = function () {
  return {
    _id: this._id,
    subject: this.subject,
    topic: this.topic,
    questionText: this.questionText,
    questionType: this.questionType,
    options: this.questionType === 'single_choice' ? this.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
    })) : [],
    difficulty: this.difficulty,
    marks: this.marks || 1,
    rubric: this.rubric || [],
    tags: this.tags,
  };
};

const Question = mongoose.model('Question', questionSchema);

module.exports = {
  Question,
  QUESTION_TYPES,
  QUESTION_DIFFICULTIES,
};
