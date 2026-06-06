const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const LevelCompletion = require('../models/LevelCompletion');
const Roadmap = require('../models/Roadmap');

router.use(auth);

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const completions = await LevelCompletion.find({
      userId: req.user._id
    })
    .populate('levelId', 'title levelNumber')
    .populate('roadmapId', 'title')
    .sort({ completedAt: -1 })
    .limit(20);
    
    res.json({ success: true, history: completions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/trophies', async (req, res) => {
  try {
    const trophies = await Roadmap.find({
      userId: req.user._id,
      isCompleted: true
    }).sort({ completedAt: -1 });
    
    res.json({ success: true, trophies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
