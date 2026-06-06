const mongoose = require('mongoose');

const levelCompletionSchema = new mongoose.Schema({
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
    index: true,
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  proofType: {
    type: String,
    enum: ['quiz', 'photo', 'code', 'voice', 'timer', 'screenshot', 'manual', 'text'],
    default: 'manual',
  },
  proofUrl:                { type: String,  default: '' },
  proofData:               { type: mongoose.Schema.Types.Mixed, default: null },

  // AI verification fields
  aiVerified:              { type: Boolean, default: false },
  aiVerificationScore:     { type: Number,  default: 0    },
  aiVerificationNotes:     { type: String,  default: ''   },
  aiFeedback:              { type: String,  default: ''   },

  xpEarned:                { type: Number,  default: 0 },
  timeSpentMinutes:        { type: Number,  default: 0 },
  completedAt:             { type: Date,    default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LevelCompletion', levelCompletionSchema);
