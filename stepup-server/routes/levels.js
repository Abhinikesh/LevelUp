const express = require('express');
const router = express.Router();
const {
  getLevelsByRoadmap,
  getLevelById,
  createLevel,
  completeLevel,
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

module.exports = router;
