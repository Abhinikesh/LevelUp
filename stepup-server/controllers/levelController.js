const Level = require('../models/Level');
const Roadmap = require('../models/Roadmap');
const LevelCompletion = require('../models/LevelCompletion');
const User = require('../models/User');

exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find({ 
      roadmapId: req.params.roadmapId 
    }).sort({ levelNumber: 1 });
    
    res.json({ success: true, levels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { proofType, proofUrl } = req.body;
    
    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ 
        message: 'Level not found' 
      });
    }
    
    if (level.isCompleted) {
      return res.status(400).json({ 
        message: 'Level already completed' 
      });
    }
    
    // Mark level complete
    level.isCompleted = true;
    level.completedAt = new Date();
    await level.save();
    
    // Unlock next level
    const nextLevel = await Level.findOne({
      roadmapId: level.roadmapId,
      levelNumber: level.levelNumber + 1
    });
    
    if (nextLevel) {
      nextLevel.isLocked = false;
      await nextLevel.save();
    }
    
    // Update roadmap currentLevel
    const roadmap = await Roadmap.findById(level.roadmapId);
    if (roadmap) {
      roadmap.currentLevel = level.levelNumber + 1;
      
      // Check if all levels complete
      const totalLevels = await Level.countDocuments({ 
        roadmapId: roadmap._id 
      });
      const completedLevels = await Level.countDocuments({ 
        roadmapId: roadmap._id, isCompleted: true 
      });
      
      if (completedLevels === totalLevels) {
        roadmap.isCompleted = true;
        roadmap.completedAt = new Date();
      }
      
      await roadmap.save();
    }
    
    // Award XP to user
    const user = await User.findById(req.user._id);
    user.xpTotal += level.xpReward;
    
    // Check and award badges
    const newBadges = [];
    const completionCount = await LevelCompletion.countDocuments({
      userId: req.user._id
    });
    
    if (completionCount === 0) {
      const badge = { 
        badgeType: 'first_step', 
        badgeName: 'First Step' 
      };
      user.badges.push(badge);
      newBadges.push(badge);
    }
    
    await user.save();
    
    // Save completion record
    await LevelCompletion.create({
      levelId: level._id,
      roadmapId: level.roadmapId,
      userId: req.user._id,
      proofType: proofType || 'manual',
      proofUrl: proofUrl || '',
      aiVerified: false,
      xpEarned: level.xpReward
    });
    
    res.json({
      success: true,
      level,
      nextLevel,
      xpEarned: level.xpReward,
      totalXP: user.xpTotal,
      newBadges,
      roadmapCompleted: roadmap?.isCompleted || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
