const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Protect routes — verify JWT and attach user to req.user
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed token.',
      });
    }

    // 2. Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.',
        });
      }
      throw err;
    }

    // 3. Find the user from the token payload
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // 4. Attach user to request and continue
    req.user = user;
    next();
  } catch (error) {
    console.error('[auth middleware] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
    });
  }
};

/**
 * Optional middleware: Allow request through even without a token
 * (populates req.user if token is valid, otherwise continues as guest)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { protect, optionalAuth };
