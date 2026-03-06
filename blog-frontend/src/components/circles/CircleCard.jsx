import { FriendsIcon, LockIcon, GlobeIcon } from '../../Icons';

const roleColors = {
  creator:   { label: 'Créateur',    bg: '#ede9fe', color: '#7c3aed' },
  moderator: { label: 'Modérateur',  bg: '#dbeafe', color: '#2563eb' },
  member:    { label: 'Membre',      bg: '#f3f4f6', color: '#6b7280' },
};

const typeConfig = {
  public:  { Icon: GlobeIcon, label: 'Public', color: '#22c55e' },
  private: { Icon: LockIcon,  label: 'Privé',  color: '#eab308' },
  secret:  { Icon: LockIcon,  label: 'Secret', color: '#ef4444' },
};

const CircleCard = ({ circle, myRole, onClick, showJoin = false, onJoin }) => {
  if (!circle || !circle._id) return null;

  const t        = typeConfig[circle?.type] ?? typeConfig.private;
  const TypeIcon = t.Icon;
  const role     = roleColors[myRole];

  const avatarSrc = circle.creator?.avatar
    ? `http://localhost:5000${circle.creator.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(circle.creator?.fullName || 'U')}&background=1877f2&color=fff&size=32`;

  return (
    <div
      onClick={onClick}
      className="card"
      style={{ cursor: 'pointer', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
    >
      {/* Cover */}
      <div style={{ position: 'relative', height: 64, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        {circle.coverImage && (
          <img src={`http://localhost:5000${circle.coverImage}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        )}
        <div style={{
          position: 'absolute', bottom: -20, left: 16,
          width: 40, height: 40, background: 'var(--bg-card)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, border: '2px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {circle.emoji || '⭕'}
        </div>
      </div>

      <div style={{ padding: '28px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {circle.name || 'Sans titre'}
              </h3>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: t.color }}>
                <TypeIcon size={11} /> {t.label}
              </span>
            </div>
            {circle.description && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {circle.description}
              </p>
            )}
            {circle.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {circle.tags.slice(0, 4).map(tag => (
                  <span key={tag} style={{ fontSize: 10, background: 'var(--bg-input)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 99 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {role && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: role.bg, color: role.color }}>
                {role.label}
              </span>
            )}
            {showJoin && (
              <button
                onClick={e => { e.stopPropagation(); onJoin && onJoin(circle); }}
                style={{ fontSize: 12, fontWeight: 600, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
              >
                Rejoindre
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <FriendsIcon size={14} />
            <span>{circle.memberCount || 1} membre{(circle.memberCount || 1) > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={avatarSrc} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} alt="" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{circle.creator?.fullName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleCard;