import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/axios';
import { UserPlusIcon } from '../../Icons';

const SkeletonItem = () => (
  <div style={{ display: 'flex', gap: 10, padding: '10px 0', alignItems: 'center' }}>
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} className="skel" />
    <div style={{ flex: 1 }}>
      <div style={{ height: 10, borderRadius: 4, background: 'var(--border)', width: '65%', marginBottom: 6 }} className="skel" />
      <div style={{ height: 8,  borderRadius: 4, background: 'var(--border)', width: '80%', marginBottom: 6 }} className="skel" />
      <div style={{ height: 7,  borderRadius: 4, background: 'var(--border)', width: '45%' }} className="skel" />
    </div>
  </div>
);

const ScoreBar = ({ score }) => (
  <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
    <div style={{
      height: '100%', width: `${score}%`, borderRadius: 99,
      background: score > 70 ? '#22c55e' : score > 40 ? '#3b82f6' : '#94a3b8',
      transition: 'width 0.6s ease',
    }} />
  </div>
);

const SuggestionCard = ({ user, onAdd, onIgnore }) => {
  const [status, setStatus] = useState('idle');

  const avatar = user?.avatar
    ? `http://localhost:5000${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=1877f2&color=fff`;

  const handleAdd = async () => {
    setStatus('adding');
    await onAdd(user._id);
    setStatus('added');
  };

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Link to={`/profile/${user._id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
          <div style={{ position: 'relative' }}>
            <img src={avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid var(--border)' }} alt="" />
            {user.isOnline && (
              <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '2px solid var(--bg-sidebar)' }} />
            )}
          </div>
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/profile/${user._id}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.fullName}
            </div>
          </Link>
          {(user.jobTitle || user.username) && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.jobTitle || `@${user.username}`}
            </div>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, background: 'var(--primary-subtle)', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--primary)', maxWidth: '100%', overflow: 'hidden' }}>
            <span>{user.mainBadge?.emoji}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.mainBadge?.label}</span>
          </div>
          {user.badges?.length > 1 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {user.badges.slice(1, 4).map((b, i) => (
                <span key={i} style={{ background: 'var(--bg-input)', borderRadius: 99, padding: '1px 6px', fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--border)' }}>
                  {b.emoji} {b.label}
                </span>
              ))}
            </div>
          )}
          <ScoreBar score={user.normalScore} />
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {user.normalScore >= 70 ? '🔥 Très compatible' : user.normalScore >= 40 ? '👍 Compatible' : '🌱 À découvrir'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {status === 'added' ? (
            <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Envoyé</span>
          ) : (
            <button onClick={handleAdd} disabled={status === 'adding'} style={{ background: 'var(--primary)', border: 'none', color: '#fff', cursor: status === 'adding' ? 'default' : 'pointer', borderRadius: 8, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, opacity: status === 'adding' ? 0.6 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              <UserPlusIcon size={12} />
              {status === 'adding' ? '…' : 'Ajouter'}
            </button>
          )}
          <button onClick={() => onIgnore(user._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s', textAlign: 'center' }} className="ignore-btn">
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
};

const RightSidebar = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [friends,     setFriends]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [total,       setTotal]       = useState(0);

  const avatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await API.get('/friends');
      setFriends((data || []).slice(0, 6));
    } catch { /* silent */ }
  }, []);

  const fetchSuggestions = useCallback(async (p = 1, append = false) => {
    try {
      if (p === 1 && !append) setLoading(true);
      else                    setLoadingMore(true);

      const { data } = await API.get(`/users/suggestions?page=${p}`);
      console.log('Suggestions:', data?.suggestions?.length, 'total:', data?.total);

      setSuggestions(prev =>
        append ? [...prev, ...(data.suggestions || [])] : (data.suggestions || [])
      );
      setHasMore(data.hasMore  ?? false);
      setTotal(data.total      ?? 0);
      setPage(p);
    } catch (err) {
      console.error('Erreur suggestions:', err.response?.status, err.response?.data);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchSuggestions(1);
  }, [fetchFriends, fetchSuggestions]);

  const handleAdd = useCallback(async (userId) => {
    try {
      await API.post(`/friends/request/${userId}`);
      setTimeout(() => setSuggestions(prev => prev.filter(u => u._id !== userId)), 1500);
    } catch { /* silent */ }
  }, []);

  const handleIgnore = useCallback(async (userId) => {
    try {
      await API.post(`/users/suggestions/ignore/${userId}`);
      setSuggestions(prev => prev.filter(u => u._id !== userId));
    } catch { /* silent */ }
  }, []);

  return (
    <aside style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'var(--right-w)', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', overflowY: 'auto', overflowX: 'hidden', padding: '24px 16px' }}>

      {friends.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Contacts
          </h3>
          {friends.map(f => (
            <Link key={f._id} to={`/profile/${f._id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', textDecoration: 'none' }}
              className="sidebar-contact">
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={avatar(f)} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                {f.isOnline && (
                  <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, background: '#22c55e', borderRadius: '50%', border: '2px solid var(--bg-sidebar)' }} />
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.fullName}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'inline' }}>
              Suggestions
            </h3>
            {total > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                {total}
              </span>
            )}
          </div>
          <button onClick={() => fetchSuggestions(1)} disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--primary)', fontWeight: 600, opacity: loading ? 0.5 : 1, padding: '2px 4px' }}>
            ↻ Actualiser
          </button>
        </div>

        {loading ? (
          <><SkeletonItem /><SkeletonItem /><SkeletonItem /><SkeletonItem /></>
        ) : suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>🔍</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Complétez votre profil pour obtenir de meilleures suggestions
            </p>
          </div>
        ) : (
          <>
            {suggestions.map(u => (
              <SuggestionCard
                key={u._id}
                user={u}
                onAdd={handleAdd}
                onIgnore={handleIgnore}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => fetchSuggestions(page + 1, true)}
                disabled={loadingMore}
                style={{ width: '100%', marginTop: 10, background: 'var(--bg-input)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1, transition: 'all 0.15s' }}>
                {loadingMore ? '⏳ Chargement…' : `Voir plus (${total - suggestions.length} restants)`}
              </button>
            )}
          </>
        )}
      </section>

      <style>{`
        @keyframes skelPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .skel { animation: skelPulse 1.5s infinite; }
        .sidebar-contact:hover span { color: var(--primary) !important; }
        .ignore-btn:hover { color: var(--text) !important; background: var(--bg-input) !important; }
      `}</style>
    </aside>
  );
};

export default RightSidebar;