const mongoose = require('mongoose');

const practiceAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mistake: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mistake',
      required: true,
      index: true,
    },
    questionSnapshot: {
      type: String,
      required: true,
    },
    selectedOptionId: {
      type: String,
      required: true,
    },
    correctOptionId: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    explanationSnapshot: {
      type: String,
      default: '',
    },
    practicedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

practiceAttemptSchema.index({ user: 1, practicedAt: -1 });

const PracticeAttempt = mongoose.model('PracticeAttempt', practiceAttemptSchema);

module.exports = {
  PracticeAttempt,
};
