const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get currently authenticated user
// @access  Protected
router.get('/me', protect, getMe);

// @route   PATCH /api/auth/update-profile
// @desc    Update name / avatar
// @access  Protected
router.patch('/update-profile', protect, updateProfile);

// @route   PATCH /api/auth/change-password
// @desc    Change password
// @access  Protected
router.patch('/change-password', protect, changePassword);

module.exports = router;
