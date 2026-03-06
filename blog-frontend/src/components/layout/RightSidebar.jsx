import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/axios';
import { UserPlusIcon } from '../../Icons';

const RightSidebar = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [friends,     setFriends]     = useState([]);

  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await API.get('/friends');
      setFriends((data || []).slice(0, 6));
    } catch { /* silent */ }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data } = await API.get('/search?q=a');
      const list = Array.isArray(data) ? data : (data.users || []);
      setSuggestions(list.slice(0, 5));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchSuggestions();
  }, [fetchFriends, fetchSuggestions]);

  const sendRequest = async (userId) => {
    try {
      await API.post(`/friends/request/${userId}`);
      setSuggestions(p => p.filter(u => u._id !== userId));
    } catch { /* silent */ }
  };

  const avatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  return (
    <aside style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 'var(--right-w)',
      background: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border)',
      overflowY: 'auto', overflowX: 'hidden',
      padding: '24px 16px',
    }}>

      {friends.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Contacts
          </h3>
          {friends.map(f => (
            <Link key={f._id} to={`/profile/${f._id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', textDecoration: 'none' }}
              className="sidebar-contact"
            >
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

      {suggestions.length > 0 && (
        <section>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Suggestions
          </h3>
          {suggestions.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
              <Link to={`/profile/${u._id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <img src={avatar(u)} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.fullName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                </div>
              </Link>
              <button onClick={() => sendRequest(u._id)} title="Ajouter" style={{
                flexShrink: 0, background: 'var(--primary-subtle)', border: 'none',
                color: 'var(--primary)', cursor: 'pointer', borderRadius: 8, padding: '5px 8px',
                display: 'flex', alignItems: 'center', transition: 'background 0.15s',
              }} className="add-friend-btn">
                <UserPlusIcon size={16} />
              </button>
            </div>
          ))}
        </section>
      )}

      <style>{`
        .sidebar-contact:hover span { color: var(--primary) !important; }
        .add-friend-btn:hover { background: var(--primary) !important; color: #fff !important; }
      `}</style>
    </aside>
  );
};

export default RightSidebar;
