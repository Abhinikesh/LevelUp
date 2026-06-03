const Roadmap = require('../models/Roadmap');
const Level = require('../models/Level');

/**
 * GET /api/roadmaps
 * Get all roadmaps for the logged-in user
 */
const getAllRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: roadmaps.length,
      roadmaps,
    });
  } catch (error) {
    console.error('[getAllRoadmaps] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve roadmaps',
    });
  }
};

/**
 * GET /api/roadmaps/:id
 * Get details of a single roadmap
 */
const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found',
      });
    }
    return res.status(200).json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error('[getRoadmapById] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve roadmap details',
    });
  }
};

/**
 * POST /api/roadmaps
 * Create a new roadmap (along with initial levels)
 */
const createRoadmap = async (req, res) => {
  try {
    const { title, type, source, deadline, levels } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and type are required',
      });
    }

    // 1. Create Roadmap
    const roadmap = await Roadmap.create({
      userId: req.user._id,
      title,
      type,
      source: source || 'manual',
      deadline: deadline || null,
      totalLevels: levels && levels.length ? levels.length : 0,
      currentLevel: 1,
    });

    // 2. If levels are provided, insert them
    let createdLevels = [];
    if (levels && levels.length > 0) {
      const levelsData = levels.map((lvl, index) => ({
        roadmapId: roadmap._id,
        levelNumber: index + 1,
        title: lvl.title || `Level ${index + 1}`,
        description: lvl.description || '',
        proofType: lvl.proofType || 'quiz',
        estimatedMinutes: lvl.estimatedMinutes || 60,
        isLocked: index === 0 ? false : true, // First level is unlocked by default
        xpReward: lvl.xpReward || 100,
        quizQuestions: lvl.quizQuestions || [],
      }));

      createdLevels = await Level.insertMany(levelsData);
    }

    return res.status(201).json({
      success: true,
      message: 'Roadmap created successfully! 🗺️',
      roadmap,
      levels: createdLevels,
    });
  } catch (error) {
    console.error('[createRoadmap] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create roadmap',
    });
  }
};

/**
 * PATCH /api/roadmaps/:id
 * Update a roadmap
 */
const updateRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Roadmap updated successfully',
      roadmap,
    });
  } catch (error) {
    console.error('[updateRoadmap] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update roadmap',
    });
  }
};

/**
 * DELETE /api/roadmaps/:id
 * Delete a roadmap and its levels
 */
const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found',
      });
    }

    // Delete associated levels and completions
    await Level.deleteMany({ roadmapId: roadmap._id });

    return res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully 🗑️',
    });
  } catch (error) {
    console.error('[deleteRoadmap] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete roadmap',
    });
  }
};

module.exports = {
  getAllRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
};
