const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Roadmap title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: {
        values: ['study', 'gym', 'work', 'custom'],
        message: 'Type must be one of: study, gym, work, custom',
      },
      required: [true, 'Roadmap type is required'],
    },
    source: {
      type: String,
      enum: {
        values: ['manual', 'ai', 'ocr'],
        message: 'Source must be one of: manual, ai, ocr',
      },
      default: 'manual',
    },
    totalLevels: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    coverEmoji: {
      type: String,
      default: '🚀',
    },
    color: {
      type: String,
      enum: ['brand', 'coral', 'green', 'gold', 'yellow'],
      default: 'brand',
    },
    totalXpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Completion percentage
roadmapSchema.virtual('completionPercent').get(function () {
  if (this.totalLevels === 0) return 0;
  return Math.round(((this.currentLevel - 1) / this.totalLevels) * 100);
});

// Virtual: Days remaining until deadline
roadmapSchema.virtual('daysRemaining').get(function () {
  if (!this.deadline) return null;
  const diff = this.deadline - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Auto-set completedAt when isCompleted becomes true
roadmapSchema.pre('save', function (next) {
  if (this.isModified('isCompleted') && this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Compound index for user roadmap lookups
roadmapSchema.index({ userId: 1, createdAt: -1 });
roadmapSchema.index({ userId: 1, isCompleted: 1 });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
