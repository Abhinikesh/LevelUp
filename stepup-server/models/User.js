const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, required: true, unique: true, 
    lowercase: true, trim: true 
  },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  xpTotal: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  badges: [{
    badgeType: String,
    badgeName: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  friends: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { 
      type: String, 
      enum: ['pending', 'accepted'], 
      default: 'pending' 
    }
  }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
