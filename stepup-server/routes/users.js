const router = require('express').Router();
const auth = require('../middleware/auth');
const LevelCompletion = require('../models/LevelCompletion');
const {
  getProfile,
  updateProfile,
  getHistory,
  getBadges,
  getTrophies,
} = require('../controllers/userController');

router.use(auth);

// Alias /me → /profile (same data, simpler URL for the Flutter client)
router.get('/me', getProfile);

router.get('/profile',    getProfile);
router.put('/profile',    updateProfile);
router.get('/history',    getHistory);
router.get('/badges',     getBadges);
router.get('/trophies',   getTrophies);

/**
 * GET /api/users/activity-calendar?days=30
 * Returns an array of dates (ISO strings) on which the user completed at least one level.
 * Used to power the 30-day dot-grid on the dashboard.
 */
router.get('/activity-calendar', async (req, res) => {
  try {
    const days  = parseInt(req.query.days  || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const completions = await LevelCompletion.find({
      userId: req.user._id,
      createdAt: { $gte: since },
    }).select('createdAt');

    // De-duplicate by calendar date
    const dateSet = new Set(
      completions.map((c) => new Date(c.createdAt).toISOString().split('T')[0])
    );

    return res.status(200).json({ success: true, activeDates: [...dateSet] });
  } catch (err) {
    console.error('[activity-calendar]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to load activity calendar' });
  }
});

module.exports = router;
