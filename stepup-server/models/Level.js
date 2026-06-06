const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question:     { type: String, required: true },
  options:      [{ type: String }],
  correctIndex: { type: Number, default: 0 },
  explanation:  { type: String, default: '' },
}, { _id: false });

const levelSchema = new mongoose.Schema({
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
    index: true,
  },
  levelNumber:       { type: Number, required: true },
  title:             { type: String, required: true },
  description:       { type: String, default: '' },
  proofType: {
    type: String,
    enum: ['quiz', 'photo', 'code', 'voice', 'timer', 'screenshot', 'text', 'manual'],
    default: 'quiz',
  },
  estimatedMinutes:  { type: Number, default: 60 },
  isLocked:          { type: Boolean, default: true },
  isCompleted:       { type: Boolean, default: false },
  xpReward:          { type: Number, default: 100 },
  topics:            [{ type: String }],
  completedAt:       { type: Date, default: null },

  // Quiz questions — stored with level (used by quiz verification)
  quizQuestions:     [quizQuestionSchema],

  // Cached AI-generated quiz (raw format before normalisation)
  quizCache:         { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

// Compound index for fast roadmap+levelNumber lookups
levelSchema.index({ roadmapId: 1, levelNumber: 1 });

module.exports = mongoose.model('Level', levelSchema);
