const router = require('express').Router();
const { getLevels, completeLevel } = 
  require('../controllers/levelController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/roadmap/:roadmapId', getLevels);
router.post('/:levelId/complete', completeLevel);

module.exports = router;
