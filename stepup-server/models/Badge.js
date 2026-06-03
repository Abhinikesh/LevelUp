const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    // slug is the unique key e.g. 'first_level', 'streak_7'
    slug:        { type: String, required: true, unique: true, trim: true },
    name:        { type: String, required: true },
    description: { type: String, required: true },
    icon:        { type: String, default: '🏅' }, // emoji or icon name
    color:       { type: String, default: '#6C63FF' },
    condition:   {
      type:      { type: String, enum: ['xp', 'streak', 'levels', 'roadmaps', 'special'] },
      threshold: { type: Number, default: 0 },
    },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', badgeSchema);
