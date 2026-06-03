const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Level = require('../models/Level');
const LevelCompletion = require('../models/LevelCompletion');

// ── Predefined badge definitions ─────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  { slug: 'first_level',   name: 'First Step',    icon: '👟', color: '#43E97B', condition: { type: 'levels',    threshold: 1  }, tier: 'bronze'   },
  { slug: 'level_5',       name: 'On a Roll',     icon: '🎯', color: '#6C63FF', condition: { type: 'levels',    threshold: 5  }, tier: 'silver'   },
  { slug: 'level_10',      name: 'Dedicated',     icon: '💪', color: '#FF6584', condition: { type: 'levels',    threshold: 10 }, tier: 'gold'     },
  { slug: 'level_25',      name: 'Champion',      icon: '🏆', color: '#FFB800', condition: { type: 'levels',    threshold: 25 }, tier: 'platinum' },
  { slug: 'streak_3',      name: 'Consistent',    icon: '🔥', color: '#FF6584', condition: { type: 'streak',    threshold: 3  }, tier: 'bronze'   },
  { slug: 'streak_7',      name: 'Week Warrior',  icon: '⚡', color: '#6C63FF', condition: { type: 'streak',    threshold: 7  }, tier: 'silver'   },
  { slug: 'streak_30',     name: 'Iron Will',     icon: '🦾', color: '#FFB800', condition: { type: 'streak',    threshold: 30 }, tier: 'gold'     },
  { slug: 'xp_500',        name: 'XP Earner',     icon: '⭐', color: '#43E97B', condition: { type: 'xp',        threshold: 500 }, tier: 'bronze'  },
  { slug: 'xp_2000',       name: 'XP Hunter',     icon: '🌟', color: '#6C63FF', condition: { type: 'xp',        threshold: 2000}, tier: 'silver'  },
  { slug: 'xp_5000',       name: 'XP Legend',     icon: '💎', color: '#FFB800', condition: { type: 'xp',        threshold: 5000}, tier: 'gold'    },
  { slug: 'roadmap_done',  name: 'Completionist', icon: '🎓', color: '#43E97B', condition: { type: 'roadmaps',  threshold: 1  }, tier: 'gold'     },
  { slug: 'code_ninja',    name: 'Code Ninja',    icon: '🥷', color: '#6C63FF', condition: { type: 'special',   threshold: 0  }, tier: 'silver'   },
];

/**
 * Check and award new badges to a user based on current stats
 * Returns array of newly awarded badge slugs
 */
const checkAndAwardBadges = async (user) => {
  const newBadges = [];
  const earnedSlugs = user.badges.map((b) => b.badgeType);

  const totalLevels = await LevelCompletion.countDocuments({ userId: user._id });
  const totalRoadmaps = await Roadmap.countDocuments({ userId: user._id, isCompleted: true });

  for (const def of BADGE_DEFINITIONS) {
    if (earnedSlugs.includes(def.slug)) continue;

    let earned = false;
    switch (def.condition.type) {
      case 'levels':   earned = totalLevels   >= def.condition.threshold; break;
      case 'streak':   earned = user.streakCount >= def.condition.threshold; break;
      case 'xp':       earned = user.xpTotal    >= def.condition.threshold; break;
      case 'roadmaps': earned = totalRoadmaps   >= def.condition.threshold; break;
      default: break;
    }

    if (earned) {
      user.badges.push({ badgeType: def.slug, badgeName: def.name });
      newBadges.push({ ...def });
    }
  }

  if (newBadges.length > 0) await user.save();
  return newBadges;
};

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const totalLevelsCompleted = await LevelCompletion.countDocuments({ userId: req.user._id });
    const completedRoadmaps = await Roadmap.find({ userId: req.user._id, isCompleted: true })
      .select('title type completedAt totalLevels createdAt')
      .sort({ completedAt: -1 });

    return res.status(200).json({
      success: true,
      user,
      stats: {
        totalLevelsCompleted,
        completedRoadmaps: completedRoadmaps.length,
        friends: user.friends.filter((f) => f.status === 'accepted').length,
      },
      completedRoadmaps,
    });
  } catch (err) {
    console.error('[getProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name)   updates.name = name.trim();
    if (avatar) updates.avatar = avatar.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    return res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    console.error('[updateProfile]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * GET /api/users/history?page=1&limit=20
 */
const getHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip  = (page - 1) * limit;

    const completions = await LevelCompletion.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('levelId', 'title levelNumber xpReward')
      .populate('roadmapId', 'title type');

    const total = await LevelCompletion.countDocuments({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      history: completions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[getHistory]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load history' });
  }
};

/**
 * GET /api/users/badges
 */
const getBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('badges xpTotal streakCount');
    const earnedSlugs = user.badges.map((b) => b.badgeType);

    const totalLevels = await LevelCompletion.countDocuments({ userId: req.user._id });
    const totalRoadmaps = await Roadmap.countDocuments({ userId: req.user._id, isCompleted: true });

    const allBadges = BADGE_DEFINITIONS.map((def) => {
      const isEarned = earnedSlugs.includes(def.slug);
      const earnedEntry = user.badges.find((b) => b.badgeType === def.slug);

      let progress = 0;
      switch (def.condition.type) {
        case 'levels':   progress = Math.min(totalLevels / def.condition.threshold, 1); break;
        case 'streak':   progress = Math.min(user.streakCount / def.condition.threshold, 1); break;
        case 'xp':       progress = Math.min(user.xpTotal / def.condition.threshold, 1); break;
        case 'roadmaps': progress = Math.min(totalRoadmaps / def.condition.threshold, 1); break;
        default: progress = isEarned ? 1 : 0;
      }

      return { ...def, isEarned, earnedAt: earnedEntry?.earnedAt || null, progress };
    });

    return res.status(200).json({ success: true, badges: allBadges });
  } catch (err) {
    console.error('[getBadges]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load badges' });
  }
};

/**
 * GET /api/users/trophies
 */
const getTrophies = async (req, res) => {
  try {
    const trophies = await Roadmap.find({ userId: req.user._id, isCompleted: true })
      .sort({ completedAt: -1 });

    const trophiesWithTime = await Promise.all(
      trophies.map(async (rm) => {
        const completions = await LevelCompletion.find({ roadmapId: rm._id, userId: req.user._id });
        const totalMinutes = completions.reduce((sum, c) => sum + (c.timeSpentMinutes || 0), 0);
        return { ...rm.toObject(), totalMinutes };
      })
    );

    return res.status(200).json({ success: true, trophies: trophiesWithTime });
  } catch (err) {
    console.error('[getTrophies]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load trophies' });
  }
};

module.exports = {
  getProfile, updateProfile, getHistory, getBadges, getTrophies, checkAndAwardBadges, BADGE_DEFINITIONS,
};
