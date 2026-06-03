const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema(
  {
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: [true, 'Roadmap ID is required'],
      index: true,
    },
    levelNumber: {
      type: Number,
      required: [true, 'Level number is required'],
      min: [1, 'Level number must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Level title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    proofType: {
      type: String,
      enum: {
        values: ['quiz', 'photo', 'code', 'voice', 'timer', 'screenshot'],
        message: 'Proof type must be one of: quiz, photo, code, voice, timer, screenshot',
      },
      required: [true, 'Proof type is required'],
    },
    estimatedMinutes: {
      type: Number,
      default: 60,
      min: [1, 'Estimated time must be at least 1 minute'],
      max: [1440, 'Estimated time cannot exceed 1440 minutes (24 hours)'],
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    xpReward: {
      type: Number,
      default: 100,
      min: [0, 'XP reward cannot be negative'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Optional: quiz questions if proofType === 'quiz'
    quizQuestions: [
      {
        question: { type: String, required: true },
        options: [{ type: String }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    topics: [{ type: String }],
    quizCache: mongoose.Schema.Types.Mixed,
    // Optional: hints to help user complete level
    hints: [
      {
        type: String,
        maxlength: 300,
      },
    ],
    resources: [
      {
        label: { type: String },
        url:   { type: String },
      },
    ],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: estimated hours (human-readable)
levelSchema.virtual('estimatedHours').get(function () {
  if (this.estimatedMinutes < 60) return `${this.estimatedMinutes}m`;
  const h = Math.floor(this.estimatedMinutes / 60);
  const m = this.estimatedMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
});

// Auto-set completedAt when isCompleted becomes true
levelSchema.pre('save', function (next) {
  if (this.isModified('isCompleted') && this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
    this.isLocked = false;
  }
  next();
});

// Compound unique index: one level number per roadmap
levelSchema.index({ roadmapId: 1, levelNumber: 1 }, { unique: true });
levelSchema.index({ roadmapId: 1, isCompleted: 1 });

const Level = mongoose.model('Level', levelSchema);

module.exports = Level;
