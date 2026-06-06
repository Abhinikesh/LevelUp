const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['study', 'gym', 'work', 'custom'],
    default: 'custom'
  },
  source: {
    type: String,
    enum: ['manual', 'ai', 'ocr'],
    default: 'manual'
  },
  totalLevels: { type: Number, default: 0 },
  currentLevel: { type: Number, default: 1 },
  isCompleted: { type: Boolean, default: false },
  examMode: { type: Boolean, default: false },
  deadline: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);
