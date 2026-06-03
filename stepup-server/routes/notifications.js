const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// All notification routes are protected
router.use(protect);

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('[notifications/get] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('[notifications/read-all] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
router.post('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      notification: notif,
    });
  } catch (error) {
    console.error('[notifications/read] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

/**
 * POST /api/notifications/token
 * Register user's FCM device token
 */
router.post('/token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM Token is required' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { fcmToken: token }, { new: true });
    return res.status(200).json({
      success: true,
      message: 'FCM Token registered successfully',
      fcmToken: user.fcmToken,
    });
  } catch (error) {
    console.error('[notifications/token] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to register FCM token' });
  }
});

/**
 * GET /api/notifications/prefs
 * Get user's notification preferences
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
 * Update user's notification preferences
 */
router.put('/prefs', async (req, res) => {
  try {
    const { dailyStreakReminder, weeklyProgressReport, newFriendRequests, examUrgencyAlerts } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.notificationPrefs = {
      dailyStreakReminder: dailyStreakReminder !== undefined ? dailyStreakReminder : user.notificationPrefs.dailyStreakReminder,
      weeklyProgressReport: weeklyProgressReport !== undefined ? weeklyProgressReport : user.notificationPrefs.weeklyProgressReport,
      newFriendRequests: newFriendRequests !== undefined ? newFriendRequests : user.notificationPrefs.newFriendRequests,
      examUrgencyAlerts: examUrgencyAlerts !== undefined ? examUrgencyAlerts : user.notificationPrefs.examUrgencyAlerts,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      notificationPrefs: user.notificationPrefs,
    });
  } catch (error) {
    console.error('[notifications/updatePrefs] Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

module.exports = router;
