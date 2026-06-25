const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// All notification routes are protected
router.use(protect);

/**
 * Shared helper — create a notification (exported for use by other controllers)
 */
const createNotification = async ({ userId, title, body, type, refId = null }) => {
  try {
    await Notification.create({ userId, title, body, type, refId });
  } catch (err) {
    // Non-fatal — log but don't throw
    console.error('[createNotification] Error:', err.message);
  }
};

/**
 * GET /api/notifications
 * Returns user's 50 most recent notifications, newest first
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('[notifications/get] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns unread notification count for the bell badge
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('[notifications/unread-count] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    console.error('[notifications/read] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark ALL notifications as read for this user
 */
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[notifications/read-all] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('[notifications/delete] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

/**
 * POST /api/notifications/token
 * Register FCM device token
 */
router.post('/token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM Token is required' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { fcmToken: token }, { new: true });
    return res.status(200).json({ success: true, message: 'FCM Token registered', fcmToken: user.fcmToken });
  } catch (error) {
    console.error('[notifications/token] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to register FCM token' });
  }
});

/**
 * GET /api/notifications/prefs
 */
router.get('/prefs', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPrefs');
    return res.status(200).json({
      success: true,
      notificationPrefs: user.notificationPrefs || {
        dailyStreakReminder: true,
        weeklyProgressReport: true,
        newFriendRequests: true,
        examUrgencyAlerts: true,
      },
    });
  } catch (error) {
    console.error('[notifications/getPrefs] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to get preferences' });
  }
});

/**
 * PUT /api/notifications/prefs
 */
router.put('/prefs', async (req, res) => {
  try {
    const { dailyStreakReminder, weeklyProgressReport, newFriendRequests, examUrgencyAlerts } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.notificationPrefs = {
      dailyStreakReminder: dailyStreakReminder !== undefined ? dailyStreakReminder : user.notificationPrefs?.dailyStreakReminder,
      weeklyProgressReport: weeklyProgressReport !== undefined ? weeklyProgressReport : user.notificationPrefs?.weeklyProgressReport,
      newFriendRequests: newFriendRequests !== undefined ? newFriendRequests : user.notificationPrefs?.newFriendRequests,
      examUrgencyAlerts: examUrgencyAlerts !== undefined ? examUrgencyAlerts : user.notificationPrefs?.examUrgencyAlerts,
    };
    await user.save();
    return res.status(200).json({ success: true, message: 'Preferences updated', notificationPrefs: user.notificationPrefs });
  } catch (error) {
    console.error('[notifications/updatePrefs] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
