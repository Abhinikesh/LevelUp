const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  roadmapId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Roadmap', required: true 
  },
  levelNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  proofType: {
    type: String,
    enum: ['quiz', 'photo', 'code', 'voice', 'timer', 'screenshot'],
    default: 'quiz'
  },
  estimatedMinutes: { type: Number, default: 60 },
  isLocked: { type: Boolean, default: true },
  isCompleted: { type: Boolean, default: false },
  xpReward: { type: Number, default: 100 },
  topics: [{ type: String }],
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Level', levelSchema);
