const mongoose = require('mongoose');

const quizSettingsSchema = new mongoose.Schema(
  {
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [2, 'Quiz title must be at least 2 characters'],
      maxlength: [150, 'Quiz title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    questionIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
      ],
      validate: {
        validator: function (questions) {
          return Array.isArray(questions) && questions.length > 0;
        },
        message: 'A quiz must contain at least one question',
      },
    },
    settings: {
      type: quizSettingsSchema,
      default: () => ({ shuffleQuestions: false, shuffleOptions: false }),
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
quizSchema.index({ user: 1, subject: 1 });
quizSchema.index({ user: 1, createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = {
  Quiz,
};
