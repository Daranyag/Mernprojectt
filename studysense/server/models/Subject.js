const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subject must belong to an authenticated user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [2, 'Subject name must be at least 2 characters long'],
      maxlength: [80, 'Subject name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description / Syllabus cannot exceed 2000 characters'],
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '#3b82f6', // Default brand blue
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Please provide a valid hex color code (e.g., #3b82f6)'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to ensure unique subject names per user (case-insensitive collation or clean handling)
subjectSchema.index({ user: 1, name: 1 }, { unique: true });

// Convert to safe JSON representation
subjectSchema.methods.toSafeObject = function (extra = {}) {
  return {
    id: this._id.toString(),
    user: this.user.toString(),
    name: this.name,
    description: this.description || '',
    color: this.color || '#3b82f6',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ...extra,
  };
};

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
