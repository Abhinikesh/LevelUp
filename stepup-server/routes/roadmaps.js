const express = require('express');
const router = express.Router();
const {
  getAllRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
} = require('../controllers/roadmapController');
const { protect } = require('../middleware/auth');

// All roadmap routes are protected by auth
router.use(protect);

router.route('/')
  .get(getAllRoadmaps)
  .post(createRoadmap);

router.route('/:id')
  .get(getRoadmapById)
  .patch(updateRoadmap)
  .delete(deleteRoadmap);

module.exports = router;
