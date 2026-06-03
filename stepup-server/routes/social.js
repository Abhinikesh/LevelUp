const express = require('express');
const router = express.Router();
const {
  sendFriendRequest, acceptFriendRequest, removeFriend,
  getFriends, searchUsers, getLeaderboard,
} = require('../controllers/socialController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search',               searchUsers);
router.get('/friends',              getFriends);
router.post('/friends/add',         sendFriendRequest);
router.put('/friends/accept/:userId', acceptFriendRequest);
router.delete('/friends/:userId',   removeFriend);
router.get('/leaderboard',          getLeaderboard);

module.exports = router;
