const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  badgeType: {
    type: String,
    required: true,
  },
  badgeName: {
    type: String,
    required: true,
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
});

const friendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    xpTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    streakCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: {
      type: [badgeSchema],
      default: [],
    },
    friends: {
      type: [friendSchema],
      default: [],
    },
    fcmToken: {
      type: String,
      default: '',
    },
    notificationPrefs: {
      dailyStreakReminder: { type: Boolean, default: true },
      weeklyProgressReport: { type: Boolean, default: true },
      newFriendRequests: { type: Boolean, default: true },
      examUrgencyAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: XP level derived from xpTotal
userSchema.virtual('level').get(function () {
  return Math.floor(this.xpTotal / 500) + 1;
});

// Virtual: XP progress within current level
userSchema.virtual('xpInCurrentLevel').get(function () {
  return this.xpTotal % 500;
});

// Virtual: XP needed to reach next level
userSchema.virtual('xpToNextLevel').get(function () {
  return 500 - (this.xpTotal % 500);
});

// Index for leaderboard queries
userSchema.index({ xpTotal: -1 });
userSchema.index({ streakCount: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
