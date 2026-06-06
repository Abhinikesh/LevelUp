const mongoose = require('mongoose');

const levelCompletionSchema = new mongoose.Schema({
  levelId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Level' 
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap'
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  proofType: { type: String },
  proofUrl: { type: String, default: '' },
  aiVerified: { type: Boolean, default: false },
  xpEarned: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LevelCompletion', levelCompletionSchema);
