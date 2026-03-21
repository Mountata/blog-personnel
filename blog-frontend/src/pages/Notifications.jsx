import { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore';
import { timeAgo } from '../utils/timeAgo';
import { CheckIcon } from '../Icons';

const NOTIF_ICONS = {
  like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡',
  comment: '💬', reply: '↩️', comment_like: '👍',
  friend_request: '👥', friend_accepted: '✅', share: '🔗',
};

const NOTIF_TEXT = {
  like:            'a aimé votre article',
  love:            'adore votre article',
  haha:            'a trouvé votre article drôle',
  wow:             'est impressionné par votre article',
  sad:             'est triste pour votre article',
  angry:           'est en colère contre votre article',
  comment:         'a commenté votre article',
  reply:           'a répondu à votre commentaire',
  comment_like:    'a aimé votre commentaire',
  friend_request:  "vous a envoyé une demande d'ami",
  friend_accepted: "a accepté votre demande d'ami",
  share:           'a partagé votre article',
};

const Notifications = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const getAvatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${u?.fullName}&background=1877f2&color=fff`;

  return (
    <Layout>
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Notifications</h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{unreadCount} non lue(s)</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: 'var(--primary)',
              background: 'var(--primary-subtle)', border: 'none', cursor: 'pointer',
              padding: '6px 12px', borderRadius: 8,
            }}>
              <CheckIcon size={15} />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>🔔</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucune notification</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif._id}
              onClick={() => !notif.read && markAsRead(notif._id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: notif.read ? 'transparent' : 'var(--primary-subtle)',
                transition: 'background 0.15s',
              }}
              className="notif-row"
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Link to={`/profile/${notif.sender?._id}`}>
                  <img src={getAvatar(notif.sender)} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </Link>
                <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 16 }}>
                  {NOTIF_ICONS[notif.type]}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                  <Link to={`/profile/${notif.sender?._id}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                    {notif.sender?.fullName}
                  </Link>
                  {' '}{NOTIF_TEXT[notif.type]}
                  {notif.article && (
                    <Link to={`/articles/${notif.article._id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', marginLeft: 4 }}>
                      "{notif.article.title}"
                    </Link>
                  )}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{timeAgo(notif.createdAt)}</p>
              </div>

              {!notif.read && (
                <div style={{ width: 10, height: 10, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0 }} />
              )}
            </div>
          ))
        )}
      </div>
      <style>{`.notif-row:hover { background: var(--bg-hover) !important; }`}</style>
    </Layout>
  );
};

export default Notifications;