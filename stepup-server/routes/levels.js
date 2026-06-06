const router = require('express').Router();
const { getLevels, getLevel, completeLevel } = require('../controllers/levelController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',                    getLevels);
router.get('/roadmap/:roadmapId',  getLevels);
router.get('/:id',                 getLevel);
router.post('/:levelId/complete',  completeLevel);

module.exports = router;
