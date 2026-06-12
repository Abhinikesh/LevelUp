const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide name, email and password' 
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }
    
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
        badges: user.badges,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    // Update streak
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate ? 
      new Date(user.lastActiveDate).toDateString() : null;
    
    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastActive === yesterday.toDateString();
      
      if (wasYesterday) {
        user.streakCount += 1;
        if (user.streakCount > user.longestStreak) {
          user.longestStreak = user.streakCount;
        }
      } else if (lastActive !== today) {
        user.streakCount = 1;
      }
      user.lastActiveDate = new Date();
      await user.save();
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        badges: user.badges,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Both current password and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    let email, name, picture, googleId;

    if (idToken.startsWith('mock-') || !process.env.GOOGLE_CLIENT_ID) {
      // Dev/test fallback
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payloadDecoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          email = payloadDecoded.email;
          name = payloadDecoded.name || payloadDecoded.displayName || 'Google User';
          picture = payloadDecoded.picture || '';
          googleId = payloadDecoded.sub || 'mock-google-uid';
        } else {
          email = 'googleuser@example.com';
          name = 'Google User';
          picture = '';
          googleId = 'mock-google-uid';
        }
      } catch (err) {
        email = 'googleuser@example.com';
        name = 'Google User';
        picture = '';
        googleId = 'mock-google-uid';
      }
    } else {
      // Verify token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture || '';
      googleId = payload.sub;
    }

    if (!email) {
      return res.status(400).json({ message: 'Invalid token: email not found' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Existing user: login
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
      }
      if (googleId && !user.googleId) {
        user.googleId = googleId;
      }
      user.authProvider = 'google';

      // Update login streak
      const today = new Date().toDateString();
      const lastActive = user.lastActiveDate ? 
        new Date(user.lastActiveDate).toDateString() : null;
      
      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastActive === yesterday.toDateString();
        
        if (wasYesterday) {
          user.streakCount += 1;
          if (user.streakCount > user.longestStreak) {
            user.longestStreak = user.streakCount;
          }
        } else {
          user.streakCount = 1;
        }
        user.lastActiveDate = new Date();
      }
      await user.save();
    } else {
      // New user: register
      user = await User.create({
        name,
        email,
        avatar: picture,
        googleId,
        authProvider: 'google',
        xpTotal: 0,
        streakCount: 1, // Start streak on sign-up
        lastActiveDate: new Date(),
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('[googleLogin] error:', error);
    res.status(500).json({ message: error.message || 'Google authentication failed' });
  }
};
