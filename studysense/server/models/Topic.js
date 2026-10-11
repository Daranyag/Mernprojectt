const mongoose = require('mongoose');

const TOPIC_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Mastered'];
const TOPIC_PRIORITIES = ['Low', 'Medium', 'High'];

const topicSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Topic must belong to an authenticated user'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Topic must belong to a parent subject'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      minlength: [2, 'Topic title must be at least 2 characters long'],
      maxlength: [120, 'Topic title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Topic description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: TOPIC_STATUSES,
        message: '{VALUE} is not a valid status. Allowed: Not Started, In Progress, Completed, Mastered',
      },
      default: 'Not Started',
    },
    priority: {
      type: String,
      enum: {
        values: TOPIC_PRIORITIES,
        message: '{VALUE} is not a valid priority. Allowed: Low, Medium, High',
      },
      default: 'Medium',
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [120, 'Unit name cannot exceed 120 characters'],
      default: '',
    },
    subtopics: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for querying user's topics by subject
topicSchema.index({ user: 1, subject: 1 });

topicSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    user: this.user.toString(),
    subject: this.subject.toString(),
    title: this.title,
    description: this.description || '',
    status: this.status,
    priority: this.priority,
    unit: this.unit || '',
    subtopics: this.subtopics || [],
    order: this.order || 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Topic = mongoose.model('Topic', topicSchema);

module.exports = {
  Topic,
  TOPIC_STATUSES,
  TOPIC_PRIORITIES,
};
