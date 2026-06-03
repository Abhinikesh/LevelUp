const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT for a given user ID.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Build the user response object (strip sensitive fields, add virtuals).
 */
const buildUserResponse = (user) => ({
  _id:            user._id,
  name:           user.name,
  email:          user.email,
  avatar:         user.avatar,
  xpTotal:        user.xpTotal,
  streakCount:    user.streakCount,
  longestStreak:  user.longestStreak,
  lastActiveDate: user.lastActiveDate,
  badges:         user.badges,
  friends:        user.friends,
  level:          user.level,
  xpInCurrentLevel: user.xpInCurrentLevel,
  xpToNextLevel:  user.xpToNextLevel,
  createdAt:      user.createdAt,
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new user account.
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Return created user + token
    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to STEPUP 🚀',
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('[register] Error:', error.message);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    // Handle duplicate key error (race condition on unique email)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user and explicitly select password (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      // Use generic message to prevent email enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update streak logic
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      const lastActiveDay = new Date(
        lastActive.getFullYear(),
        lastActive.getMonth(),
        lastActive.getDate()
      );
      const diffDays = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day — increment streak
        user.streakCount += 1;
        if (user.streakCount > user.longestStreak) {
          user.longestStreak = user.streakCount;
        }
      } else if (diffDays > 1) {
        // Streak broken
        user.streakCount = 1;
      }
      // diffDays === 0 means same day login, no change
    } else {
      // First login ever
      user.streakCount = 1;
      user.longestStreak = 1;
    }

    user.lastActiveDate = now;
    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! 🔥`,
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('[login] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user's data.
 */
const getMe = async (req, res) => {
  try {
    // req.user is attached by the protect middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('[getMe] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user data.',
    });
  }
};

/**
 * PATCH /api/auth/update-profile
 * Update name and/or avatar of the current user.
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const allowedUpdates = {};

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long.',
        });
      }
      allowedUpdates.name = name.trim();
    }

    if (avatar !== undefined) {
      allowedUpdates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('[updateProfile] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
};

/**
 * PATCH /api/auth/change-password
 * Change password for the current user.
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const saltRounds = 12;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    // Issue a fresh token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      token,
    });
  } catch (error) {
    console.error('[changePassword] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
    });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
