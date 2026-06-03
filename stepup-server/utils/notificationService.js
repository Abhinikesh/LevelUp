const cron = require('node-cron');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Level = require('../models/Level');
const Notification = require('../models/Notification');
const { calculateExamSchedule } = require('./examScheduler');

/**
 * Send in-app notification and mock push notification to user
 */
async function sendNotification(userId, title, message, type = 'general') {
  try {
    // 1. Save to Database
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
    });

    // 2. Fetch User to check FCM token and preferences
    const user = await User.findById(userId);
    if (!user) return notif;

    // Check preferences
    const prefs = user.notificationPrefs || {};
    if (type === 'streak' && !prefs.dailyStreakReminder) return notif;
    if (type === 'progress' && !prefs.weeklyProgressReport) return notif;
    if (type === 'friend' && !prefs.newFriendRequests) return notif;
    if (type === 'alert' && !prefs.examUrgencyAlerts) return notif;

    // 3. Mock FCM Push Notification Send
    if (user.fcmToken) {
      console.log(`[MOCK PUSH] Sending push notification to token ${user.fcmToken}:`);
      console.log(`[MOCK PUSH] Title: ${title} | Message: ${message}`);
    } else {
      console.log(`[MOCK PUSH] No token registered for user ${user.name || userId}. Logged in database only.`);
    }

    return notif;
  } catch (error) {
    console.error('[notificationService] Failed to send notification:', error.message);
  }
}

/**
 * Cron Job: Check every day at 8 PM for users whose streak is about to break
 */
function startStreakCheckerCron() {
  // Run daily at 20:00 (8:00 PM)
  cron.schedule('0 20 * * *', async () => {
    console.log('[CRON] Running streak checker...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find users who have not completed anything today
      const users = await User.find({
        streakCount: { $gt: 0 },
        $or: [
          { lastActiveDate: { $lt: today } },
          { lastActiveDate: null }
        ]
      });

      for (const user of users) {
        await sendNotification(
          user._id,
          '🔥 Keep your streak alive!',
          `Hey ${user.name}, complete a level node today to maintain your ${user.streakCount}-day streak!`,
          'streak'
        );
      }
    } catch (err) {
      console.error('[CRON] Streak checker error:', err.message);
    }
  });
}

/**
 * Cron Job: Check every day at 9 AM for users with exam roadmaps
 */
function startExamAlertsCron() {
  // Run daily at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running exam urgency notifier...');
    try {
      const activeRoadmaps = await Roadmap.find({ examMode: true, isCompleted: false });
      
      for (const roadmap of activeRoadmaps) {
        const user = await User.findById(roadmap.userId);
        if (!user) continue;

        const levels = await Level.find({ roadmapId: roadmap._id }).sort({ levelNumber: 1 });
        const schedule = calculateExamSchedule(roadmap, levels, []);

        if (schedule.urgencyLevel === 'critical') {
          await sendNotification(
            roadmap.userId,
            '🚨 Exam Critical Warning!',
            `The exam for "${roadmap.title}" is in ${schedule.totalDays} days. You need to clear ${schedule.levelsNeededToday} levels today to stay on track!`,
            'alert'
          );
        } else if (schedule.urgencyLevel === 'urgent') {
          await sendNotification(
            roadmap.userId,
            '⚠️ Exam Urgency Alert',
            `Your "${roadmap.title}" exam is approaching. You need to clear ${schedule.levelsNeededToday} levels today.`,
            'alert'
          );
        }
      }
    } catch (err) {
      console.error('[CRON] Exam notifier error:', err.message);
    }
  });
}

// Start crons on startup
function initCronJobs() {
  startStreakCheckerCron();
  startExamAlertsCron();
  console.log('✅ Cron schedulers initialized (Streak alert, Exam warning)');
}

module.exports = {
  sendNotification,
  initCronJobs,
};
