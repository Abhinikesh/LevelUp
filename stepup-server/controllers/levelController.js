const Level = require('../models/Level');
const Roadmap = require('../models/Roadmap');
const LevelCompletion = require('../models/LevelCompletion');
const User = require('../models/User');
const { checkAndAwardBadges } = require('./userController');

/**
 * GET /api/levels/roadmap/:roadmapId or GET /api/levels?roadmapId=...
 */
exports.getLevels = async (req, res) => {
  try {
    const roadmapId = req.params.roadmapId || req.query.roadmapId;
    if (!roadmapId) {
      return res.status(400).json({ success: false, message: 'roadmapId is required' });
    }
    const levels = await Level.find({
      roadmapId
    }).sort({ levelNumber: 1 });

    res.json({ success: true, levels });
  } catch (error) {
    console.error('[getLevels]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/levels/:id
 */
exports.getLevel = async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.json({ success: true, level });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/levels/:levelId/complete
 */
exports.completeLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { proofType, proofUrl, proofData, timeSpentMinutes } = req.body;

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }

    // Check if already completed by this user
    const alreadyDone = await LevelCompletion.findOne({
      levelId: level._id,
      userId: req.user._id
    });
    if (alreadyDone) {
      return res.status(400).json({ success: false, message: 'Level already completed' });
    }

    // Mark level complete on the Level document
    level.isCompleted = true;
    level.completedAt = new Date();
    await level.save();

    // Unlock the next level
    const nextLevel = await Level.findOneAndUpdate(
      { roadmapId: level.roadmapId, levelNumber: level.levelNumber + 1 },
      { isLocked: false },
      { new: true }
    );

    // Update roadmap progress
    const roadmap = await Roadmap.findById(level.roadmapId);
    let roadmapCompleted = false;
    if (roadmap) {
      roadmap.currentLevel = level.levelNumber + 1;

      const totalLevels     = await Level.countDocuments({ roadmapId: roadmap._id });
      const completedLevels = await Level.countDocuments({ roadmapId: roadmap._id, isCompleted: true });

      if (completedLevels >= totalLevels) {
        roadmap.isCompleted = true;
        roadmap.completedAt = new Date();
        roadmapCompleted = true;
      }

      await roadmap.save();
    }

    // Award XP to user
    const user = await User.findById(req.user._id);
    user.xpTotal += level.xpReward;

    // Update streak
    const today     = new Date().toDateString();
    const lastActive = user.lastActiveDate
      ? new Date(user.lastActiveDate).toDateString()
      : null;

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

    // Check and award badges
    const newBadges = await checkAndAwardBadges(user);

    // Save completion record
    await LevelCompletion.create({
      levelId:          level._id,
      roadmapId:        level.roadmapId,
      userId:           req.user._id,
      proofType:        proofType || 'manual',
      proofUrl:         proofUrl  || '',
      proofData:        proofData || null,
      aiVerified:       false,
      xpEarned:         level.xpReward,
      timeSpentMinutes: timeSpentMinutes || 0,
    });

    res.json({
      success: true,
      message: `Level "${level.title}" completed! +${level.xpReward} XP 🎉`,
      level,
      nextLevel,
      nextLevelUnlocked: !!nextLevel,
      xpEarned: level.xpReward,
      roadmapCompleted,
      user: {
        xpTotal:     user.xpTotal,
        streakCount: user.streakCount
      },
      newBadges,
    });
  } catch (error) {
    console.error('[completeLevel]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
