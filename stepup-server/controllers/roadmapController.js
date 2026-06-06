const Roadmap = require('../models/Roadmap');
const Level = require('../models/Level');

exports.createRoadmap = async (req, res) => {
  try {
    const { title, description, type, levels, 
            examMode, deadline } = req.body;
    
    const roadmap = await Roadmap.create({
      userId: req.user._id,
      title,
      description: description || '',
      type: type || 'custom',
      source: 'manual',
      totalLevels: levels ? levels.length : 0,
      examMode: examMode || false,
      deadline: deadline || null
    });
    
    if (levels && levels.length > 0) {
      const levelDocs = levels.map((level, index) => ({
        roadmapId: roadmap._id,
        levelNumber: index + 1,
        title: level.title,
        description: level.description || '',
        proofType: level.proofType || 'quiz',
        estimatedMinutes: level.estimatedMinutes || 60,
        xpReward: level.xpReward || 100,
        topics: level.topics || [],
        isLocked: index !== 0,
        isCompleted: false
      }));
      
      await Level.insertMany(levelDocs);
    }
    
    const populatedRoadmap = await Roadmap.findById(roadmap._id);
    const roadmapLevels = await Level.find({ 
      roadmapId: roadmap._id 
    }).sort({ levelNumber: 1 });
    
    res.status(201).json({
      success: true,
      message: `Roadmap "${populatedRoadmap.title}" created successfully! Let's level up! 🚀`,
      roadmap: populatedRoadmap,
      levels: roadmapLevels
    });
  } catch (error) {
    console.error('[createRoadmap]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }
    res.json({ success: true, message: 'Roadmap updated', roadmap });
  } catch (error) {
    console.error('[updateRoadmap]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ 
      userId: req.user._id 
    }).sort({ updatedAt: -1 });
    
    res.json({ success: true, roadmaps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!roadmap) {
      return res.status(404).json({ 
        message: 'Roadmap not found' 
      });
    }
    
    const levels = await Level.find({ 
      roadmapId: roadmap._id 
    }).sort({ levelNumber: 1 });
    
    res.json({ success: true, roadmap, levels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!roadmap) {
      return res.status(404).json({ 
        message: 'Roadmap not found' 
      });
    }
    
    await Level.deleteMany({ roadmapId: req.params.id });
    
    res.json({ success: true, message: 'Roadmap deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
