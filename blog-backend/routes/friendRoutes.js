const express = require('express');
const router  = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getFriendRequests,
  getSentRequests,
  cancelRequest
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                         protect, getFriends);
router.get('/requests',                 protect, getFriendRequests);
router.get('/sent',                     protect, getSentRequests);
router.post('/request/:userId',         protect, sendFriendRequest);
router.put('/accept/:friendshipId',     protect, acceptFriendRequest);
router.put('/reject/:friendshipId',     protect, rejectFriendRequest);
router.delete('/remove/:userId',        protect, removeFriend);
router.delete('/cancel/:userId',        protect, cancelRequest);
router.put('/block/:userId',            protect, blockUser);
router.put('/unblock/:userId',          protect, unblockUser);

module.exports = router;