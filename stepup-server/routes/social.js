const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Friend = require('../models/Friend');
const LevelCompletion = require('../models/LevelCompletion');

router.use(auth);

// ── Search users by name or email ─────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }
    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      $or: [{ name: regex }, { email: regex }],
      _id: { $ne: req.user._id }
    })
      .select('name email avatar xpTotal streakCount')
      .limit(20);

    return res.json({ success: true, users });
  } catch (err) {
    console.error('[social/search]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const type   = req.query.type  || 'xp';   // 'xp' | 'streak' | 'levels'
    const period = req.query.period || 'all';  // 'all' | 'week' | 'month'
    const page   = parseInt(req.query.page  || '1',  10);
    const limit  = parseInt(req.query.limit || '20', 10);

    let sortField = 'xpTotal';
    if (type === 'streak') sortField = 'streakCount';

    if (type === 'levels') {
      // Aggregate by completion count
      const dateFilter = {};
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter.createdAt = { $gte: weekAgo };
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter.createdAt = { $gte: monthAgo };
      }

      const agg = await LevelCompletion.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            avatar: '$user.avatar',
            xpTotal: '$user.xpTotal',
            streakCount: '$user.streakCount',
            levelsCompleted: '$count'
          }
        }
      ]);

      return res.json({
        success: true,
        leaderboard: agg.map((u, i) => ({ ...u, rank: (page - 1) * limit + i + 1 }))
      });
    }

    // Standard sort by xp or streak
    const total = await User.countDocuments();
    const users = await User.find()
      .select('name email avatar xpTotal streakCount badges')
      .sort({ [sortField]: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const leaderboard = users.map((u, i) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      xpTotal: u.xpTotal,
      streakCount: u.streakCount,
      badgeCount: (u.badges || []).length,
      rank: (page - 1) * limit + i + 1,
      isCurrentUser: u._id.toString() === req.user._id.toString()
    }));

    return res.json({ success: true, leaderboard, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[social/leaderboard]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get friends list ──────────────────────────────────────────────────────────
router.get('/friends', async (req, res) => {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    }).populate('requester recipient', 'name email avatar xpTotal streakCount');

    const friendList = friends.map(f => {
      const friend = f.requester._id.toString() === req.user._id.toString()
        ? f.recipient
        : f.requester;
      return friend;
    });

    res.json({ success: true, friends: friendList });
  } catch (err) {
    console.error('[social/friends]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Send friend request ───────────────────────────────────────────────────────
router.post('/friends/add', async (req, res) => {
  try {
    const { email, userId } = req.body;
    let recipient;

    if (userId) {
      recipient = await User.findById(userId);
    } else if (email) {
      recipient = await User.findOne({ email });
    }

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself' });
    }

    const existing = await Friend.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id }
      ]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Friend request already exists' });
    }

    const friend = await Friend.create({
      requester: req.user._id,
      recipient: recipient._id,
      status: 'pending'
    });

    res.json({ success: true, message: 'Friend request sent', friend });
  } catch (err) {
    console.error('[social/friends/add]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Accept friend request ─────────────────────────────────────────────────────
router.put('/friends/accept/:friendId', async (req, res) => {
  try {
    const friend = await Friend.findByIdAndUpdate(
      req.params.friendId,
      { status: 'accepted' },
      { new: true }
    );
    res.json({ success: true, friend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Remove friend ─────────────────────────────────────────────────────────────
router.delete('/friends/:userId', async (req, res) => {
  try {
    await Friend.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.user._id }
      ]
    });
    res.json({ success: true, message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get pending friend requests ───────────────────────────────────────────────
router.get('/friends/pending', async (req, res) => {
  try {
    const pending = await Friend.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'name email avatar xpTotal');

    res.json({ success: true, pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
