const router = require('express').Router();
const {
  createRoadmap,
  getRoadmaps,
  getRoadmap,
  updateRoadmap,
  deleteRoadmap,
} = require('../controllers/roadmapController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',     getRoadmaps);
router.post('/',    createRoadmap);
router.get('/:id',  getRoadmap);
router.patch('/:id', updateRoadmap);
router.put('/:id',   updateRoadmap);
router.delete('/:id', deleteRoadmap);

module.exports = router;
