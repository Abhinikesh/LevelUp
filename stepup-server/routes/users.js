const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, getHistory, getBadges, getTrophies,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile',  getProfile);
router.put('/profile',  updateProfile);
router.get('/history',  getHistory);
router.get('/badges',   getBadges);
router.get('/trophies', getTrophies);

module.exports = router;
