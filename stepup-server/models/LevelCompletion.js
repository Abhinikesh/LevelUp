const mongoose = require('mongoose');

const levelCompletionSchema = new mongoose.Schema(
  {
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
      required: [true, 'Level ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: [true, 'Roadmap ID is required'],
    },
    proofUrl: {
      type: String,
      default: '',
    },
    proofType: {
      type: String,
      enum: ['quiz', 'photo', 'code', 'voice', 'timer', 'screenshot'],
      required: [true, 'Proof type is required'],
    },
    // Raw proof data (quiz answers, timer duration, code snippet, etc.)
    proofData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    aiVerified: {
      type: Boolean,
      default: false,
    },
    aiVerificationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    aiVerificationNotes: {
      type: String,
      default: '',
    },
    xpEarned: {
      type: Number,
      required: [true, 'XP earned is required'],
      min: 0,
    },
    // Bonus XP from streak or speed bonuses
    bonusXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // How long the user spent (in minutes)
    timeSpentMinutes: {
      type: Number,
      default: null,
      min: 0,
    },
    // Attempt number (for retry tracking)
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total XP including bonus
levelCompletionSchema.virtual('totalXp').get(function () {
  return (this.xpEarned || 0) + (this.bonusXp || 0);
});

// Compound index for analytics queries
levelCompletionSchema.index({ userId: 1, completedAt: -1 });
levelCompletionSchema.index({ roadmapId: 1, completedAt: -1 });
levelCompletionSchema.index({ userId: 1, roadmapId: 1 });

// Prevent duplicate completions (one record per level per user per attempt)
levelCompletionSchema.index(
  { levelId: 1, userId: 1, attemptNumber: 1 },
  { unique: true }
);

const LevelCompletion = mongoose.model('LevelCompletion', levelCompletionSchema);

module.exports = LevelCompletion;
