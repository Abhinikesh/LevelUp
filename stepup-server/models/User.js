const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true
  },
  password:       { type: String, required: true, minlength: 6 },
  avatar:         { type: String, default: '' },
  xpTotal:        { type: Number, default: 0 },
  streakCount:    { type: Number, default: 0 },
  longestStreak:  { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },

  badges: [{
    badgeType:  String,
    badgeName:  String,
    earnedAt:   { type: Date, default: Date.now }
  }],

  friends: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending'
    }
  }],

  // FCM push notifications token
  fcmToken: { type: String, default: '' },

  // Notification preferences
  notificationPrefs: {
    dailyStreakReminder:  { type: Boolean, default: true  },
    weeklyProgressReport: { type: Boolean, default: true  },
    newFriendRequests:    { type: Boolean, default: true  },
    examUrgencyAlerts:    { type: Boolean, default: true  },
  },

  // Auth settings
  bio:      { type: String, default: '' },
  website:  { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },

}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
