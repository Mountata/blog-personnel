import { Link } from 'react-router-dom';
import useNotificationStore from '../../store/notificationStore';
import { timeAgo } from '../../utils/timeAgo';
import { CheckIcon } from '@heroicons/react/24/outline';

const NOTIF_ICONS = {
  like: '👍', love: '❤️', haha: '😂', wow: '😮',
  sad: '😢', angry: '😡', comment: '💬', reply: '↩️',
  friend_request: '👥', friend_accepted: '✅', share: '🔗',
};

const NOTIF_TEXT = {
  like:           'a aimé votre article',
  love:           'adore votre article',
  haha:           'a trouvé votre article drôle',
  wow:            'est impressionné par votre article',
  sad:            'est triste pour votre article',
  angry:          'est en colère',
  comment:        'a commenté votre article',
  reply:          'a répondu à votre commentaire',
  friend_request: 'vous a envoyé une demande d\'ami',
  friend_accepted:'a accepté votre demande d\'ami',
  share:          'a partagé votre article',
};

const NotifDropdown = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  const recent = notifications.slice(0, 8);

  const getAvatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${u?.fullName}&background=1877f2&color=fff`;

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-bold text-lg text-gray-800">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            <CheckIcon className="w-4 h-4" />
            Tout lire
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="max-h-96 overflow-y-auto">
        {recent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-gray-400 text-sm">Aucune notification</p>
          </div>
        ) : (
          recent.map(notif => (
            <div
              key={notif._id}
              onClick={() => !notif.read && markAsRead(notif._id)}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition
                ${!notif.read ? 'bg-blue-50' : ''}`}
            >
              <div className="relative shrink-0">
                <img
                  src={getAvatar(notif.sender)}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <span className="absolute -bottom-1 -right-1 text-base">
                  {NOTIF_ICONS[notif.type]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">
                  <span className="font-semibold">{notif.sender?.fullName}</span>
                  {' '}{NOTIF_TEXT[notif.type]}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              {!notif.read && (
                <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        to="/notifications"
        onClick={onClose}
        className="block text-center p-3 text-primary font-semibold text-sm hover:bg-gray-50 border-t transition"
      >
        Voir toutes les notifications
      </Link>
    </div>
  );
};

export default NotifDropdown;