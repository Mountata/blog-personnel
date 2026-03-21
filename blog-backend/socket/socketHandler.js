const User = require('../models/User');

module.exports = (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  // ─── Helper : envoyer à un utilisateur spécifique ────────────
  const emitToUser = (userId, event, data) => {
    const socketId = onlineUsers.get(userId.toString());
    if (socketId) io.to(socketId).emit(event, data);
  };

  // ─── Helper : envoyer à tous les membres d'un cercle ─────────
  const emitToCircle = async (circleId, event, data, excludeUserId = null) => {
    const CircleMember = require('../models/CircleMember');
    const members = await CircleMember.find({
      circle: circleId,
      status: 'active',
    }).select('user');

    members.forEach(m => {
      const uid = m.user.toString();
      if (excludeUserId && uid === excludeUserId.toString()) return;
      const socketId = onlineUsers.get(uid);
      if (socketId) io.to(socketId).emit(event, data);
    });
  };

  io.on('connection', (socket) => {
    console.log('🔌 Utilisateur connecté:', socket.id);

    // ─────────────────────────────────────────────────────────
    // CONNEXION UTILISATEUR
    // ─────────────────────────────────────────────────────────
    socket.on('user_connected', async (userId) => {
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // ─────────────────────────────────────────────────────────
    // MESSAGES PRIVÉS (existant — non modifié)
    // ─────────────────────────────────────────────────────────
    socket.on('send_message', (data) => {
      const receiverSocket = onlineUsers.get(data.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('receive_message', data);
      }
    });

    // ─────────────────────────────────────────────────────────
    // NOTIFICATIONS GÉNÉRALES (existant — non modifié)
    // ─────────────────────────────────────────────────────────
    socket.on('send_notification', (data) => {
      const receiverSocket = onlineUsers.get(data.recipientId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('new_notification', data);
      }
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ CERCLES — Rejoindre la "room" d'un cercle
    // Le frontend appelle ceci quand l'utilisateur ouvre un cercle
    // ─────────────────────────────────────────────────────────
    socket.on('circle_join_room', (circleId) => {
      socket.join(`circle_${circleId}`);
      console.log(`👥 Socket ${socket.id} a rejoint la room circle_${circleId}`);
    });

    // Quitter la room quand l'utilisateur ferme le cercle
    socket.on('circle_leave_room', (circleId) => {
      socket.leave(`circle_${circleId}`);
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ NOUVEAU POST DANS UN CERCLE
    // Déclenché par le backend après création d'un post
    // ─────────────────────────────────────────────────────────
    socket.on('circle_new_post', async ({ circleId, post, authorId }) => {
      // Diffuser le post à tous les membres de la room du cercle
      socket.to(`circle_${circleId}`).emit('circle_post_received', { circleId, post });

      // Envoyer une notification push aux membres hors ligne
      try {
        await emitToCircle(circleId, 'new_notification', {
          type:    'circle_new_post',
          message: 'Nouveau post dans votre cercle',
          circleId,
          post,
        }, authorId);
      } catch (e) {
        console.error('circle_new_post error:', e.message);
      }
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ NOUVELLE RÉACTION SUR UN POST DE CERCLE
    // ─────────────────────────────────────────────────────────
    socket.on('circle_post_reaction', ({ circleId, postId, reactions, userId }) => {
      // Diffuser la mise à jour des réactions à toute la room
      socket.to(`circle_${circleId}`).emit('circle_reaction_updated', {
        postId,
        reactions,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ NOUVEAU COMMENTAIRE SUR UN POST DE CERCLE
    // ─────────────────────────────────────────────────────────
    socket.on('circle_new_comment', ({ circleId, postId, comment, authorId }) => {
      socket.to(`circle_${circleId}`).emit('circle_comment_received', {
        postId,
        comment,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ INVITATION À UN CERCLE
    // Notifier l'utilisateur invité en temps réel
    // ─────────────────────────────────────────────────────────
    socket.on('circle_invite_sent', ({ targetUserId, circle, invitedBy }) => {
      emitToUser(targetUserId, 'circle_invite_received', {
        type:      'circle_invite',
        circle,
        invitedBy,
        message:   `${invitedBy.fullName} vous a invité à rejoindre "${circle.name}"`,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ DEMANDE DE RETRAIT
    // Notifier les admins du cercle en temps réel
    // ─────────────────────────────────────────────────────────
    socket.on('circle_withdrawal_request', async ({ circleId, requester }) => {
      try {
        const CircleMember = require('../models/CircleMember');
        const admins = await CircleMember.find({
          circle: circleId,
          role:   { $in: ['creator', 'moderator'] },
          status: 'active',
        }).select('user');

        admins.forEach(a => {
          if (a.user.toString() !== requester._id?.toString()) {
            emitToUser(a.user, 'new_notification', {
              type:      'withdrawal_request',
              circleId,
              requester,
              message:   `${requester.fullName} souhaite quitter le cercle`,
            });
          }
        });
      } catch (e) {
        console.error('circle_withdrawal_request error:', e.message);
      }
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ RETRAIT APPROUVÉ
    // Notifier le membre que sa demande est acceptée
    // ─────────────────────────────────────────────────────────
    socket.on('circle_withdrawal_approved', ({ targetUserId, circleName }) => {
      emitToUser(targetUserId, 'circle_withdrawal_done', {
        type:    'withdrawal_approved',
        message: `Votre demande de retrait du cercle "${circleName}" a été approuvée`,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ MEMBRE BLOQUÉ DANS UN CERCLE
    // Notifier le membre bloqué
    // ─────────────────────────────────────────────────────────
    socket.on('circle_member_blocked', ({ targetUserId, circleName }) => {
      emitToUser(targetUserId, 'new_notification', {
        type:    'circle_blocked',
        message: `Vous avez été bloqué dans le cercle "${circleName}"`,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ MEMBRE DÉBLOQUÉ
    // ─────────────────────────────────────────────────────────
    socket.on('circle_member_unblocked', ({ targetUserId, circleName }) => {
      emitToUser(targetUserId, 'new_notification', {
        type:    'circle_unblocked',
        message: `Vous avez été débloqué dans le cercle "${circleName}"`,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ NOUVEAU SONDAGE DANS UN CERCLE
    // ─────────────────────────────────────────────────────────
    socket.on('circle_new_poll', ({ circleId, post }) => {
      socket.to(`circle_${circleId}`).emit('circle_post_received', {
        circleId,
        post,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ VOTE DANS UN SONDAGE
    // Mettre à jour le sondage en temps réel pour tous les membres
    // ─────────────────────────────────────────────────────────
    socket.on('circle_poll_voted', ({ circleId, pollId, poll }) => {
      socket.to(`circle_${circleId}`).emit('circle_poll_updated', {
        pollId,
        poll,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ NOUVEL ÉVÉNEMENT DANS UN CERCLE
    // ─────────────────────────────────────────────────────────
    socket.on('circle_new_event', ({ circleId, post }) => {
      socket.to(`circle_${circleId}`).emit('circle_post_received', {
        circleId,
        post,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ RÉPONSE À UN ÉVÉNEMENT (going/maybe/notGoing)
    // ─────────────────────────────────────────────────────────
    socket.on('circle_event_attend', ({ circleId, eventId, event }) => {
      socket.to(`circle_${circleId}`).emit('circle_event_updated', {
        eventId,
        event,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ RÔLE CHANGÉ DANS UN CERCLE
    // Notifier l'utilisateur promu/rétrogradé
    // ─────────────────────────────────────────────────────────
    socket.on('circle_role_changed', ({ targetUserId, circleName, newRole }) => {
      const messages = {
        moderator: `Vous avez été nommé modérateur dans "${circleName}"`,
        member:    `Votre rôle a été changé en membre dans "${circleName}"`,
      };
      emitToUser(targetUserId, 'new_notification', {
        type:    'circle_role_changed',
        message: messages[newRole] || `Votre rôle a changé dans "${circleName}"`,
      });
    });

    // ─────────────────────────────────────────────────────────
    // ⭕ POST ÉPINGLÉ
    // Notifier tous les membres de la room
    // ─────────────────────────────────────────────────────────
    socket.on('circle_post_pinned', ({ circleId, postId }) => {
      socket.to(`circle_${circleId}`).emit('circle_pin_updated', { postId });
    });

    // ─────────────────────────────────────────────────────────
    // DÉCONNEXION (existant — mis à jour)
    // ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: Date.now(),
          });
          break;
        }
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });
};