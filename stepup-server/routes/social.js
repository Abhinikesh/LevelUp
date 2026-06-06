const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  searchUsers,
  getLeaderboard
} = require('../controllers/socialController');

router.use(auth);

router.get('/search', searchUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/friends', getFriends);
router.post('/friends/add', sendFriendRequest);
router.put('/friends/accept/:userId', acceptFriendRequest);
router.delete('/friends/:userId', removeFriend);

module.exports = router;
