const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getHistory,
  getBadges,
  getTrophies,
} = require('../controllers/userController');

router.use(auth);

router.get('/profile',    getProfile);
router.put('/profile',    updateProfile);
router.get('/history',    getHistory);
router.get('/badges',     getBadges);
router.get('/trophies',   getTrophies);

module.exports = router;
