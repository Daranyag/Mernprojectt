const mongoose = require('mongoose');

const topicItemSchema = new mongoose.Schema(
  {
    topicTitle: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true
    },
    unitOrChapter: {
      type: String,
      trim: true,
      default: 'General'
    },
    shortDescription: {
      type: String,
      trim: true,
      default: ''
    },
    mainConcepts: {
      type: [String],
      default: []
    },
    importantSubtopics: {
      type: [String],
      default: []
    },
    definitionsOrFormulas: {
      type: [String],
      default: []
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    priorityEvidence: {
      type: String,
      trim: true,
      default: ''
    },
    suggestedQuestionFormats: {
      type: [String], // e.g. ['Very Short Answer', 'Short Answer', '10-Mark Essay', 'MCQ']
      default: ['Short Answer']
    },
    suggestedMarks: {
      type: [Number], // e.g. [2, 5, 10]
      default: [5]
    },
    sourceReference: {
      type: String,
      trim: true,
      default: ''
    },
    confidenceLabel: {
      type: String,
      enum: ['High Evidence', 'Moderate Evidence', 'Curriculum Standard'],
      default: 'Moderate Evidence'
    },
    recommendedAction: {
      type: String,
      default: 'Review concepts and practice questions'
    },
    revisionStatus: {
      type: String,
      enum: ['Not Reviewed', 'Need More Practice', 'Revised', 'Understood'],
      default: 'Not Reviewed'
    }
  },
  { _id: true }
);

const importantTopicAnalysisSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Analysis title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    sourceScope: {
      type: String,
      enum: ['material_only', 'general_knowledge', 'combined'],
      default: 'general_knowledge'
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
    targetTopicCount: {
      type: Number,
      default: 15
    },
    depthOfAnalysis: {
      type: String,
      enum: ['Basic', 'Standard', 'Detailed'],
      default: 'Standard'
    },
    topics: {
      type: [topicItemSchema],
      default: []
    },
    summaryNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

importantTopicAnalysisSchema.index({ user: 1, subject: 1, createdAt: -1 });

const ImportantTopicAnalysis = mongoose.model(
  'ImportantTopicAnalysis',
  importantTopicAnalysisSchema
);

module.exports = {
  ImportantTopicAnalysis
};
