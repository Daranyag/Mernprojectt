const mongoose = require('mongoose');

const MATERIAL_TYPES = ['note', 'resource', 'pdf'];

const studyMaterialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Material must belong to an authenticated user'],
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Material must be associated with a valid subject'],
      index: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
      index: true,
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [120, 'Unit name cannot exceed 120 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: {
        values: MATERIAL_TYPES,
        message: '{VALUE} is not a valid material type. Allowed: note, resource, pdf',
      },
      required: [true, 'Material type (note, resource, or pdf) is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    content: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20000, 'Content cannot exceed 20,000 characters'],
    },
    url: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (val) {
          if (!val) return true; // Optional for notes & pdfs
          return /^https?:\/\/.+/i.test(val);
        },
        message: 'Resource URL must be a valid HTTP or HTTPS web address',
      },
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
      set: function (tags) {
        if (!Array.isArray(tags)) return [];
        return Array.from(
          new Set(
            tags
              .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
              .filter((t) => t.length > 0 && t.length <= 30)
          )
        ).slice(0, 15);
      },
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    isReviewed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for user-scoped queries and filtering
studyMaterialSchema.index({ user: 1, subject: 1 });
studyMaterialSchema.index({ user: 1, type: 1 });
studyMaterialSchema.index({ user: 1, isFavorite: 1 });
studyMaterialSchema.index({ user: 1, isReviewed: 1 });
studyMaterialSchema.index({ user: 1, createdAt: -1 });

// Convert to clean safe JSON object
studyMaterialSchema.methods.toSafeObject = function (extra = {}) {
  const obj = {
    id: this._id.toString(),
    user: this.user ? this.user.toString() : null,
    subject: this.subject ? (typeof this.subject === 'object' && this.subject._id ? this.subject : this.subject.toString()) : null,
    topic: this.topic ? (typeof this.topic === 'object' && this.topic._id ? this.topic : this.topic.toString()) : null,
    unit: this.unit || '',
    type: this.type,
    title: this.title,
    content: this.content || '',
    url: this.url || '',
    fileName: this.fileName || '',
    fileSize: this.fileSize || 0,
    pageCount: this.pageCount || 0,
    tags: this.tags || [],
    isFavorite: Boolean(this.isFavorite),
    isReviewed: Boolean(this.isReviewed),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ...extra,
  };
  return obj;
};

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

module.exports = {
  StudyMaterial,
  MATERIAL_TYPES,
};
