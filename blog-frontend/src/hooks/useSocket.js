import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import useMessageStore from '../store/messageStore';

let socket = null;

const useSocket = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { addMessage, activeUser } = useMessageStore();

  useEffect(() => {
    if (!user) return;

    // Connexion socket
    socket = io('http://localhost:5000');

    // Dire au serveur qu'on est connecté
    socket.emit('user_connected', user._id);

    // Recevoir un message
    socket.on('receive_message', (message) => {
      if (activeUser === message.sender._id) {
        addMessage(message);
      }
    });

    // Recevoir une notification
    socket.on('new_notification', (notification) => {
      addNotification(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const sendSocketMessage = (receiverId, message) => {
    if (socket) {
      socket.emit('send_message', { receiverId, ...message });
    }
  };

  const sendSocketNotification = (recipientId, notification) => {
    if (socket) {
      socket.emit('send_notification', { recipientId, ...notification });
    }
  };

  return { sendSocketMessage, sendSocketNotification };
};

export default useSocket;