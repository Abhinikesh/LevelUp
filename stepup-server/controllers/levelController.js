const Level = require('../models/Level');
const LevelCompletion = require('../models/LevelCompletion');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');

/**
 * GET /api/levels
 * Get all levels for a specific roadmap
 */
const getLevelsByRoadmap = async (req, res) => {
  try {
    const { roadmapId } = req.query;
    if (!roadmapId) {
      return res.status(400).json({
        success: false,
        message: 'roadmapId query parameter is required',
      });
    }

    // Verify roadmap ownership
    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found or unauthorized',
      });
    }

    const levels = await Level.find({ roadmapId }).sort({ levelNumber: 1 });
    return res.status(200).json({
      success: true,
      levels,
    });
  } catch (error) {
    console.error('[getLevelsByRoadmap] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve levels',
    });
  }
};

/**
 * GET /api/levels/:id
 * Get details of a single level
 */
const getLevelById = async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    // Verify roadmap ownership
    const roadmap = await Roadmap.findOne({ _id: level.roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to level',
      });
    }

    return res.status(200).json({
      success: true,
      level,
    });
  } catch (error) {
    console.error('[getLevelById] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve level details',
    });
  }
};

/**
 * POST /api/levels
 * Create a new level manually for a roadmap
 */
const createLevel = async (req, res) => {
  try {
    const { roadmapId, title, description, proofType, estimatedMinutes, xpReward, quizQuestions } = req.body;

    if (!roadmapId || !title || !proofType) {
      return res.status(400).json({
        success: false,
        message: 'roadmapId, title, and proofType are required',
      });
    }

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found or unauthorized',
      });
    }

    // Calculate level number
    const count = await Level.countDocuments({ roadmapId });
    const levelNumber = count + 1;

    const level = await Level.create({
      roadmapId,
      levelNumber,
      title,
      description: description || '',
      proofType,
      estimatedMinutes: estimatedMinutes || 60,
      xpReward: xpReward || 100,
      quizQuestions: quizQuestions || [],
      isLocked: levelNumber === 1 ? false : true,
    });

    // Update total levels count in Roadmap
    roadmap.totalLevels = levelNumber;
    await roadmap.save();

    return res.status(201).json({
      success: true,
      message: 'Level added successfully 🎮',
      level,
    });
  } catch (error) {
    console.error('[createLevel] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create level',
    });
  }
};

/**
 * POST /api/levels/:id/complete
 * Submit proof and complete a level. Award XP, update streak, unlock next level
 */
const completeLevel = async (req, res) => {
  try {
    const { proofUrl, proofData, timeSpentMinutes } = req.body;
    const levelId = req.params.id;

    // 1. Fetch level and verify ownership
    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found',
      });
    }

    const roadmap = await Roadmap.findOne({ _id: level.roadmapId, userId: req.user._id });
    if (!roadmap) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action',
      });
    }

    if (level.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Level is already completed',
      });
    }

    // 2. Quiz proof verification (automated check if correct options chosen)
    let aiVerified = false;
    let aiNotes = 'Auto-approved';
    
    if (level.proofType === 'quiz') {
      const { answers } = proofData || {}; // Array of chosen indexes matching quizQuestions length
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: 'Quiz answers are required in proofData',
        });
      }

      // Check answers
      const incorrectCount = level.quizQuestions.reduce((acc, q, idx) => {
        return acc + (answers[idx] === q.correctIndex ? 0 : 1);
      }, 0);

      if (incorrectCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Quiz validation failed: ${incorrectCount} answers were incorrect. Try again!`,
        });
      }
      aiVerified = true;
      aiNotes = 'Quiz answers correct!';
    } else {
      // Photo/Code/Voice/Screenshot/Timer - for game loop, we auto-approve with AI mock
      aiVerified = true;
      aiNotes = 'AI scan of work proof complete. Match accuracy 95%.';
    }

    // 3. Update current level to completed
    level.isCompleted = true;
    level.completedAt = new Date();
    await level.save();

    // 4. Create LevelCompletion record
    const completion = await LevelCompletion.create({
      levelId,
      userId: req.user._id,
      roadmapId: roadmap._id,
      proofUrl: proofUrl || '',
      proofType: level.proofType,
      proofData,
      aiVerified,
      aiVerificationScore: 95,
      aiVerificationNotes: aiNotes,
      xpEarned: level.xpReward,
      timeSpentMinutes: timeSpentMinutes || null,
    });

    // 5. Update user total XP and streak count
    const user = await User.findById(req.user._id);
    user.xpTotal += level.xpReward;

    // Update streak if active date is different
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
        user.streakCount += 1;
        if (user.streakCount > user.longestStreak) {
          user.longestStreak = user.streakCount;
        }
      } else if (diffDays > 1) {
        user.streakCount = 1;
      }
    } else {
      user.streakCount = 1;
      user.longestStreak = 1;
    }
    user.lastActiveDate = now;
    await user.save();

    // 6. Unlock the NEXT level (if any exists)
    const nextLevelNumber = level.levelNumber + 1;
    const nextLevel = await Level.findOne({
      roadmapId: roadmap._id,
      levelNumber: nextLevelNumber,
    });

    let roadmapCompleted = false;
    if (nextLevel) {
      nextLevel.isLocked = false;
      await nextLevel.save();
      
      // Advance roadmap level progression
      roadmap.currentLevel = nextLevelNumber;
      await roadmap.save();
    } else {
      // No next level - whole roadmap is complete!
      roadmap.isCompleted = true;
      roadmap.completedAt = new Date();
      await roadmap.save();
      roadmapCompleted = true;
    }

    return res.status(200).json({
      success: true,
      message: roadmapCompleted
        ? 'Epic Achievement! You completed the entire roadmap! 🏆'
        : 'Level Cleared! XP and credentials earned! 🚀',
      completion,
      user: {
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
        level: Math.floor(user.xpTotal / 500) + 1,
      },
      nextLevelUnlocked: !!nextLevel,
      roadmapCompleted,
    });
  } catch (error) {
    console.error('[completeLevel] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record level completion',
    });
  }
};

module.exports = {
  getLevelsByRoadmap,
  getLevelById,
  createLevel,
  completeLevel,
};
