const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Friend = require('../models/Friend');

router.use(auth);

// Get all friends
router.get('/friends', async (req, res) => {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 
      'name email avatar xpTotal streakCount');
    
    const friendList = friends.map(f => {
      const friend = f.requester._id.toString() === 
        req.user._id.toString() ? f.recipient : f.requester;
      return friend;
    });
    
    res.json({ success: true, friends: friendList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send friend request
router.post('/friends/add', async (req, res) => {
  try {
    const { email } = req.body;
    
    const recipient = await User.findOne({ email });
    if (!recipient) {
      return res.status(404).json({ 
        message: 'User not found with that email' 
      });
    }
    
    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'Cannot add yourself' 
      });
    }
    
    const existing = await Friend.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ 
        message: 'Friend request already exists' 
      });
    }
    
    const friend = await Friend.create({
      requester: req.user._id,
      recipient: recipient._id,
      status: 'pending'
    });
    
    res.json({ 
      success: true, 
      message: 'Friend request sent',
      friend 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept friend request
router.put('/friends/accept/:friendId', async (req, res) => {
  try {
    const friend = await Friend.findByIdAndUpdate(
      req.params.friendId,
      { status: 'accepted' },
      { new: true }
    );
    
    res.json({ success: true, friend });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending requests
router.get('/friends/pending', async (req, res) => {
  try {
    const pending = await Friend.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'name email avatar');
    
    res.json({ success: true, pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
