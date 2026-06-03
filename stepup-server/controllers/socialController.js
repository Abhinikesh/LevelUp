const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const LevelCompletion = require('../models/LevelCompletion');
const mongoose = require('mongoose');

/**
 * POST /api/social/friends/add
 * Send a friend request by email or userId
 */
const sendFriendRequest = async (req, res) => {
  try {
    const { email, userId } = req.body;
    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email or userId is required' });
    }

    const target = email
      ? await User.findOne({ email: email.toLowerCase().trim() })
      : await User.findById(userId);

    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't add yourself" });
    }

    const me = await User.findById(req.user._id);

    // Check if already friends or pending
    const existing = me.friends.find((f) => f.userId.toString() === target._id.toString());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.status === 'accepted' ? 'Already friends' : 'Request already sent',
      });
    }

    // Add pending entry on both sides
    me.friends.push({ userId: target._id, status: 'pending' });
    await me.save();

    // Add incoming request to target (also pending, they see it as incoming)
    target.friends.push({ userId: req.user._id, status: 'pending' });
    await target.save();

    return res.status(200).json({ success: true, message: 'Friend request sent!' });
  } catch (err) {
    console.error('[sendFriendRequest]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send friend request' });
  }
};

/**
 * PUT /api/social/friends/accept/:userId
 * Accept a pending friend request
 */
const acceptFriendRequest = async (req, res) => {
  try {
    const senderId = req.params.userId;
    const me = await User.findById(req.user._id);
    const sender = await User.findById(senderId);

    if (!sender) return res.status(404).json({ success: false, message: 'User not found' });

    const myEntry     = me.friends.find((f) => f.userId.toString() === senderId);
    const senderEntry = sender.friends.find((f) => f.userId.toString() === req.user._id.toString());

    if (!myEntry) return res.status(404).json({ success: false, message: 'No pending request found' });

    myEntry.status     = 'accepted';
    senderEntry.status = 'accepted';
    await me.save();
    await sender.save();

    return res.status(200).json({ success: true, message: 'Friend request accepted!' });
  } catch (err) {
    console.error('[acceptFriendRequest]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
};

/**
 * DELETE /api/social/friends/:userId
 * Remove a friend or cancel/decline a request
 */
const removeFriend = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const me     = await User.findById(req.user._id);
    const target = await User.findById(targetId);

    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    me.friends     = me.friends.filter((f) => f.userId.toString() !== targetId);
    target.friends = target.friends.filter((f) => f.userId.toString() !== req.user._id.toString());
    await me.save();
    await target.save();

    return res.status(200).json({ success: true, message: 'Friend removed.' });
  } catch (err) {
    console.error('[removeFriend]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
};

/**
 * GET /api/social/friends
 * Get all accepted friends with their roadmap progress
 */
const getFriends = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const acceptedIds = me.friends
      .filter((f) => f.status === 'accepted')
      .map((f) => f.userId);

    const pendingIncoming = me.friends
      .filter((f) => f.status === 'pending')
      .map((f) => f.userId);

    const [friends, pending] = await Promise.all([
      User.find({ _id: { $in: acceptedIds } }).select('name email avatar xpTotal streakCount'),
      User.find({ _id: { $in: pendingIncoming } }).select('name email avatar'),
    ]);

    // Attach active roadmap progress for each friend
    const enriched = await Promise.all(
      friends.map(async (friend) => {
        const activeRoadmap = await Roadmap.findOne({
          userId: friend._id,
          isCompleted: false,
        }).sort({ updatedAt: -1 });

        const myActiveRoadmap = await Roadmap.findOne({
          userId: req.user._id,
          isCompleted: false,
        }).sort({ updatedAt: -1 });

        let relativeProgress = null;
        if (
          activeRoadmap && myActiveRoadmap &&
          activeRoadmap.title === myActiveRoadmap.title
        ) {
          relativeProgress = myActiveRoadmap.currentLevel - activeRoadmap.currentLevel;
        }

        return {
          ...friend.toObject(),
          level: Math.floor(friend.xpTotal / 500) + 1,
          activeRoadmap: activeRoadmap
            ? {
                title:         activeRoadmap.title,
                type:          activeRoadmap.type,
                currentLevel:  activeRoadmap.currentLevel,
                totalLevels:   activeRoadmap.totalLevels,
                progress:      activeRoadmap.totalLevels > 0
                  ? Math.round(((activeRoadmap.currentLevel - 1) / activeRoadmap.totalLevels) * 100)
                  : 0,
              }
            : null,
          relativeProgress,
        };
      })
    );

    return res.status(200).json({
      success: true,
      friends: enriched,
      pendingRequests: pending,
    });
  } catch (err) {
    console.error('[getFriends]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load friends' });
  }
};

/**
 * GET /api/social/search?q=name_or_email
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email avatar xpTotal')
      .limit(10);

    const me = await User.findById(req.user._id);
    const friendIds = me.friends.map((f) => f.userId.toString());

    const results = users.map((u) => ({
      ...u.toObject(),
      level: Math.floor(u.xpTotal / 500) + 1,
      isFriend: friendIds.includes(u._id.toString()),
    }));

    return res.status(200).json({ success: true, users: results });
  } catch (err) {
    console.error('[searchUsers]', err.message);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
};

/**
 * GET /api/social/leaderboard/:roadmapId  (same roadmap)
 * GET /api/social/leaderboard/global       (all users by XP)
 * GET /api/social/leaderboard/friends      (friends by XP)
 */
const getLeaderboard = async (req, res) => {
  try {
    const { type = 'global', roadmapId } = req.query;
    let users = [];

    if (type === 'global') {
      users = await User.find({})
        .select('name email avatar xpTotal streakCount')
        .sort({ xpTotal: -1 })
        .limit(50);
    } else if (type === 'friends') {
      const me = await User.findById(req.user._id);
      const friendIds = me.friends
        .filter((f) => f.status === 'accepted')
        .map((f) => f.userId);
      friendIds.push(req.user._id);

      users = await User.find({ _id: { $in: friendIds } })
        .select('name email avatar xpTotal streakCount')
        .sort({ xpTotal: -1 });
    } else if (type === 'roadmap' && roadmapId) {
      // Find all users who have a roadmap with this title (same campaign)
      const targetRoadmap = await Roadmap.findOne({ _id: roadmapId, userId: req.user._id });
      if (!targetRoadmap) {
        return res.status(404).json({ success: false, message: 'Roadmap not found' });
      }

      const me = await User.findById(req.user._id);
      const friendIds = me.friends
        .filter((f) => f.status === 'accepted')
        .map((f) => f.userId);
      friendIds.push(req.user._id);

      // Find same-named roadmaps from friends
      const sameRoadmaps = await Roadmap.find({
        userId: { $in: friendIds },
        title: targetRoadmap.title,
      }).populate('userId', 'name email avatar xpTotal streakCount');

      users = sameRoadmaps.map((rm) => ({
        ...rm.userId.toObject(),
        roadmapProgress: {
          currentLevel: rm.currentLevel,
          totalLevels:  rm.totalLevels,
          isCompleted:  rm.isCompleted,
        },
      })).sort((a, b) => b.roadmapProgress.currentLevel - a.roadmapProgress.currentLevel);
    }

    const rankedUsers = users.map((u, idx) => ({
      ...u.toObject ? u.toObject() : u,
      rank:        idx + 1,
      level:       Math.floor((u.xpTotal || 0) / 500) + 1,
      isCurrentUser: u._id.toString() === req.user._id.toString(),
    }));

    return res.status(200).json({ success: true, leaderboard: rankedUsers });
  } catch (err) {
    console.error('[getLeaderboard]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load leaderboard' });
  }
};

module.exports = {
  sendFriendRequest, acceptFriendRequest, removeFriend,
  getFriends, searchUsers, getLeaderboard,
};
