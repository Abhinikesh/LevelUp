const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { chatWithCoach } = require('../utils/aiCoach');
const Level = require('../models/Level');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');

// 20 requests per minute per user for coach chat
const coachLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please wait a moment before chatting again.' },
});

/**
 * POST /api/coach/chat
 * Chat with ARIA, the AI coach
 * Body: { messages: [{role, content}], levelId }
 */
router.post('/chat', protect, coachLimiter, async (req, res) => {
  try {
    const { messages, levelId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages array is required' });
    }

    // Limit history to last 20 messages to avoid token overflow
    const trimmedMessages = messages.slice(-20);

    // Build level context
    let levelContext = null;
    if (levelId) {
      const level = await Level.findById(levelId);
      if (level) {
        const roadmap = await Roadmap.findById(level.roadmapId);
        levelContext = {
          title: level.title,
          description: level.description,
          roadmapTitle: roadmap?.title || 'Your Roadmap',
          topics: level.topics || [],
          proofType: level.proofType,
        };
      }
    }

    // Default context if no level provided
    if (!levelContext) {
      levelContext = {
        title: 'General Study',
        description: 'General learning and productivity',
        roadmapTitle: 'STEPUP Journey',
        topics: [],
        proofType: 'quiz',
      };
    }

    // Build user context
    const user = await User.findById(req.user._id).select('name xpTotal streakCount');
    const userContext = {
      name: user?.name || 'Learner',
      xpTotal: user?.xpTotal || 0,
      streakCount: user?.streakCount || 0,
    };

    const { reply, suggestedActions } = await chatWithCoach(trimmedMessages, levelContext, userContext);

    return res.status(200).json({
      success: true,
      reply,
      suggestedActions,
      levelContext,
    });
  } catch (error) {
    console.error('[coach/chat] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Coach chat failed. Please try again.' });
  }
});

module.exports = router;
