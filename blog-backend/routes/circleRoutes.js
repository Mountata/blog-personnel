const express = require('express');
const router  = express.Router();
const { protect }      = require('../middleware/authMiddleware');
const { uploadCircle } = require('../middleware/uploadMiddleware');

const {
  createCircle, getMyCircles, discoverCircles,
  getCircle, updateCircle, deleteCircle,
  pinPost, joinByInviteToken, regenerateInviteToken,
} = require('../controllers/circleController');

const {
  getMembers, inviteMember, acceptInvite, declineInvite,
  changeRole, blockMember, unblockMember, removeMember,
  requestWithdrawal, approveWithdrawal, getPendingWithdrawals,
} = require('../controllers/circleMemberController');

const {
  getPosts, createPost, deletePost, reactToPost, addComment,
  createPoll, votePoll, createEvent, attendEvent,
} = require('../controllers/circlePostController');

const {
  sendJoinRequest, getJoinRequests,
  acceptJoinRequest, rejectJoinRequest,
} = require('../controllers/circleJoinRequestController');

router.use(protect);

// CERCLES
router.get('/my',       getMyCircles);
router.get('/discover', discoverCircles);
router.post('/',        uploadCircle.single('coverImage'), createCircle);
router.get('/:id',      getCircle);
router.put('/:id',      uploadCircle.single('coverImage'), updateCircle);
router.delete('/:id',   deleteCircle);

// LIEN INVITATION
router.get('/invite/:token',         joinByInviteToken);
router.post('/:id/regenerate-token', regenerateInviteToken);

// MEMBRES
router.get('/:id/members',                   getMembers);
router.post('/:id/members/invite',           inviteMember);
router.put('/:id/members/invite/accept',     acceptInvite);
router.delete('/:id/members/invite/decline', declineInvite);
router.put('/:id/members/:userId/role',      changeRole);
router.put('/:id/members/:userId/block',     blockMember);
router.put('/:id/members/:userId/unblock',   unblockMember);
router.delete('/:id/members/:userId/remove', removeMember);

// RETRAIT
router.post('/:id/withdraw',                   requestWithdrawal);
router.put('/:id/withdraw/:requestId/approve', approveWithdrawal);
router.get('/:id/withdraw/pending',            getPendingWithdrawals);

// POSTS
router.get('/:id/posts',                  getPosts);
router.post('/:id/posts',                 uploadCircle.array('images', 5), createPost);
router.delete('/:id/posts/:postId',       deletePost);
router.post('/:id/posts/:postId/react',   reactToPost);
router.post('/:id/posts/:postId/comment', addComment);
router.post('/:id/pin/:postId',           pinPost);

// SONDAGES
router.post('/:id/polls',              createPoll);
router.post('/:id/polls/:pollId/vote', votePoll);

// ÉVÉNEMENTS
router.post('/:id/events',                uploadCircle.single('coverImage'), createEvent);
router.put('/:id/events/:eventId/attend', attendEvent);

// DEMANDES D'ADHÉSION (cercle privé)
router.post('/:id/join-request',                        sendJoinRequest);
router.get('/:id/join-requests',                        getJoinRequests);
router.put('/:id/join-requests/:userId/accept',         acceptJoinRequest);
router.delete('/:id/join-requests/:userId/reject',      rejectJoinRequest);

module.exports = router;