const mongoose = require('mongoose');

const MISTAKE_STATUSES = ['needs_review', 'practicing', 'corrected'];

const mistakeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null,
      index: true,
    },
    sourceQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null,
    },
    sourceAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizAttempt',
      default: null,
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
    questionSnapshot: {
      type: String,
      required: [true, 'Question snapshot is required'],
      trim: true,
    },
    optionsSnapshot: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    selectedOptionId: {
      type: String,
      default: null, // option selected incorrectly in the original quiz
    },
    correctOptionId: {
      type: String,
      required: [true, 'Authoritative correct option ID is required'],
    },
    explanationSnapshot: {
      type: String,
      default: '',
    },
    personalNote: {
      type: String,
      trim: true,
      maxlength: [2000, 'Personal note cannot exceed 2000 characters'],
      default: '',
    },
    isMarkedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: MISTAKE_STATUSES,
      default: 'needs_review',
      index: true,
    },
    incorrectCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    correctPracticeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPracticedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user-scoped queries and filtering
mistakeSchema.index({ user: 1, subject: 1, topic: 1 });
mistakeSchema.index({ user: 1, status: 1 });
mistakeSchema.index({ user: 1, isMarkedForReview: 1 });
mistakeSchema.index({ user: 1, question: 1 });
mistakeSchema.index({ user: 1, createdAt: -1 });

// Method to return safe view for student practice (HIDES correctOptionId & explanation)
mistakeSchema.methods.toPracticeView = function () {
  return {
    _id: this._id,
    subject: this.subject,
    topic: this.topic,
    questionSnapshot: this.questionSnapshot,
    optionsSnapshot: this.optionsSnapshot.map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
    status: this.status,
    isMarkedForReview: this.isMarkedForReview,
    personalNote: this.personalNote,
  };
};

const Mistake = mongoose.model('Mistake', mistakeSchema);

module.exports = {
  Mistake,
  MISTAKE_STATUSES,
};
