const mongoose = require('mongoose');

const SOURCE_TYPES = [
  'text',
  'syllabus',
  'pdf',
  'pptx',
  'youtube',
  'chatgpt',
  'webpage',
  'study_material'
];

const PROCESSING_STATUSES = ['pending', 'processing', 'completed', 'failed'];

const quizSourceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner user is required'],
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
      index: true
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true
    },
    sourceType: {
      type: String,
      enum: {
        values: SOURCE_TYPES,
        message: '{VALUE} is not a valid source type'
      },
      required: [true, 'Source type is required']
    },
    title: {
      type: String,
      required: [true, 'Source title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    originalFilename: {
      type: String,
      trim: true,
      default: ''
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: ''
    },
    rawContent: {
      type: String,
      default: ''
    },
    extractedText: {
      type: String,
      default: ''
    },
    charCount: {
      type: Number,
      default: 0
    },
    wordCount: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: PROCESSING_STATUSES,
      default: 'completed'
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

quizSourceSchema.index({ user: 1, subject: 1, createdAt: -1 });

const QuizSource = mongoose.model('QuizSource', quizSourceSchema);

module.exports = {
  QuizSource,
  SOURCE_TYPES,
  PROCESSING_STATUSES
};
