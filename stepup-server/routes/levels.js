const express = require('express');
const router = express.Router();
const {
  getLevelsByRoadmap,
  getLevelById,
  createLevel,
  completeLevel,
  getGymChallenge,
} = require('../controllers/levelController');
const { protect } = require('../middleware/auth');

// All level routes protected by auth
router.use(protect);

router.route('/')
  .get(getLevelsByRoadmap)
  .post(createLevel);

router.route('/:id')
  .get(getLevelById);

router.route('/:id/complete')
  .post(completeLevel);

router.route('/:id/gym')
  .get(getGymChallenge);

module.exports = router;
