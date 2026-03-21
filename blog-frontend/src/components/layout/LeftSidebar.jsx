import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import {
  HomeIcon, FriendsIcon, ChatIcon, BellIcon,
  BookmarkIcon, CircleIcon, ChartIcon, SettingsIcon,
  SearchIcon, LogoutIcon,
} from '../../Icons';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/axios';

const LeftSidebar = ({ unreadMsg = 0, unreadNotif = 0 }) => {
  const { user, logout }  = useAuthStore();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState(null);
  

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length < 2) { setResults(null); return; }
    try {
      const { data } = await API.get(`/search?q=${q}`);
      setResults(data);
    } catch (err) { console.debug(err); }
  };

  const clearSearch = () => { setSearch(''); setResults(null); };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const nav = [
    { path: '/',             label: 'Accueil',       Icon: HomeIcon,     badge: 0 },
    { path: '/friends',      label: 'Amis',          Icon: FriendsIcon,  badge: 0 },
    { path: '/messages',     label: 'Messages',      Icon: ChatIcon,     badge: unreadMsg },
    { path: '/notifications',label: 'Notifications', Icon: BellIcon,     badge: unreadNotif },
    { path: '/saved',        label: 'Sauvegardés',   Icon: BookmarkIcon, badge: 0 },
    { path: '/circles',      label: 'Cercles',       Icon: CircleIcon,   badge: 0, isNew: true },
    { path: '/dashboard',    label: 'Statistiques',  Icon: ChartIcon,    badge: 0, isNew: true },
    { path: '/settings',     label: 'Paramètres',    Icon: SettingsIcon, badge: 0 },
  ];

  const avatarSrc = user?.avatar
    ? `http://localhost:5000${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=1877f2&color=fff`;

  return (
    <aside
      className="sidebar"
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 'var(--sidebar-w)',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
        zIndex: 100,
        transition: 'background 0.3s',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          textDecoration: 'none',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'var(--font-mono)' }}>M</span>
          </div>
          <span style={{
            fontWeight: 800, fontSize: 18,
            color: 'var(--text)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.5px',
          }}>
            MyBlog
          </span>
        </Link>
      </div>

      {/* ── Search ────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-input)',
          borderRadius: 10,
          padding: '8px 12px',
          border: '1px solid var(--border)',
        }}>
          <SearchIcon size={16} className="text-muted" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Rechercher…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              flex: 1, fontSize: 13,
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          />
          {search && (
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>

        {/* Résultats */}
        {results && (
          <div style={{
            position: 'absolute', top: '100%', left: 16, right: 16,
            background: 'var(--bg-card)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid var(--border)', zIndex: 200,
            maxHeight: 280, overflowY: 'auto',
          }}>
            {results.users?.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Personnes</div>
                {results.users.slice(0, 4).map(u => (
                  <Link key={u._id} to={`/profile/${u._id}`} onClick={clearSearch}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', textDecoration: 'none', transition: 'background 0.15s' }}
                    className="search-result-item"
                  >
                    <img src={u.avatar ? `http://localhost:5000${u.avatar}` : `https://ui-avatars.com/api/?name=${u.fullName}&background=1877f2&color=fff`}
                      style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.fullName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {results.articles?.length > 0 && (
              <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ padding: '4px 12px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Articles</div>
                {results.articles.slice(0, 3).map(a => (
                  <Link key={a._id} to={`/articles/${a._id}`} onClick={clearSearch}
                    style={{ display: 'block', padding: '8px 12px', textDecoration: 'none', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}
                    className="search-result-item"
                  >
                    {a.title}
                  </Link>
                ))}
              </div>
            )}
            {!results.users?.length && !results.articles?.length && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Aucun résultat</div>
            )}
          </div>
        )}
      </div>

      {/* ── Nav Links ─────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '4px 8px' }}>
        {nav.map(({ path, label, Icon, badge, isNew }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                color: isActive ? 'var(--primary)' : 'var(--text-nav)',
                background: isActive ? 'var(--primary-subtle)' : 'transparent',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              className={isActive ? '' : 'nav-link'}
            >
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icon size={20} />
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -7,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    borderRadius: '99px',
                    minWidth: 16, height: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>{badge > 9 ? '9+' : badge}</span>
                )}
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              {isNew && !isActive && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                  background: 'var(--primary)', color: '#fff',
                  padding: '2px 6px', borderRadius: 99,
                }}>new</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User profile strip ────────────────────────────── */}
      <div style={{
        padding: '12px 8px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Link to={`/profile/${user?._id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <img src={avatarSrc} style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--border)' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user?.username}</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, display: 'flex', transition: 'color 0.15s' }}
          className="logout-btn"
        >
          <LogoutIcon size={18} />
        </button>
      </div>

      <style>{`
        .nav-link:hover { background: var(--bg-hover) !important; color: var(--text) !important; }
        .search-result-item:hover { background: var(--bg-hover) !important; }
        .logout-btn:hover { color: #ef4444 !important; }
      `}</style>
    </aside>
  );
};

export default LeftSidebar;