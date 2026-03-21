import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HomeIcon, FriendsIcon, BellIcon,
  ChatIcon, SearchIcon,
  SettingsIcon, LogoutIcon,
  BookmarkIcon, ChartIcon, CircleIcon,
} from '../../Icons';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useMessageStore from '../../store/messageStore';
import NotifDropdown from '../notification/NotifDropdown';
import API from '../../utils/axios';

const Navbar = () => {
  const { user, logout }                            = useAuthStore();
  const { unreadCount, fetchNotifications }         = useNotificationStore();
  const { unreadCount: msgCount, fetchUnreadCount } = useMessageStore();
  const navigate = useNavigate();

  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [activePage,    setActivePage]    = useState('home');

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults(null); return; }
    try {
      const { data } = await API.get(`/search?q=${q}`);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'home',      icon: HomeIcon,    path: '/'          },
    { id: 'friends',   icon: FriendsIcon, path: '/friends'   },
    { id: 'circles',   icon: CircleIcon,  path: '/circles'   },
    { id: 'dashboard', icon: ChartIcon,   path: '/dashboard' },
    { id: 'saved',     icon: BookmarkIcon,path: '/saved'     },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm h-14">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

        {/* ── LOGO + SEARCH ──────────────────────────────────── */}
        <div className="flex items-center gap-2 w-72">
          <Link to="/" className="text-primary font-bold text-2xl shrink-0">MyBlog</Link>

          <div className="relative flex-1">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 gap-2">
              <SearchIcon className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text" value={searchQuery} onChange={handleSearch}
                placeholder="Rechercher..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            {searchResults && (
              <div className="absolute top-10 left-0 w-80 bg-white rounded-xl shadow-xl border p-2 z-50">
                {searchResults.users?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 px-2 py-1">Personnes</p>
                    {searchResults.users.map(u => (
                      <Link key={u._id} to={`/profile/${u._id}`}
                        onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
                        <img
                          src={u.avatar ? `http://localhost:5000${u.avatar}` : `https://ui-avatars.com/api/?name=${u.fullName}&background=1877f2&color=fff`}
                          className="w-9 h-9 rounded-full object-cover" alt={u.fullName}
                        />
                        <div>
                          <p className="font-semibold text-sm">{u.fullName}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.articles?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 px-2 py-1 mt-1">Articles</p>
                    {searchResults.articles.map(a => (
                      <Link key={a._id} to={`/articles/${a._id}`}
                        onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
                        <BookmarkIcon className="w-8 h-8 text-gray-400" />
                        <p className="text-sm font-medium">{a.title}</p>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.users?.length === 0 && searchResults.articles?.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-3">Aucun résultat</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── NAV ICONS — centre ─────────────────────────────── */}
        <div className="flex items-center gap-1">
          {navItems.map(item => {
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id} to={item.path}
                onClick={() => setActivePage(item.id)}
                className={`relative flex items-center justify-center w-12 h-10 rounded-lg transition
                  ${isActive ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <item.icon className="w-6 h-6" />
              </Link>
            );
          })}
        </div>

        {/* ── DROITE — notifs + messages + profil ────────────── */}
        <div className="flex items-center gap-2 w-72 justify-end">

          <Link to="/messages" className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <ChatIcon className="w-5 h-5 text-gray-700" />
            {msgCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {msgCount > 9 ? '9+' : msgCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <BellIcon className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && <NotifDropdown onClose={() => setShowNotifs(false)} />}
          </div>

          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition">
              <img
                src={user?.avatar ? `http://localhost:5000${user.avatar}` : `https://ui-avatars.com/api/?name=${user?.fullName}&background=1877f2&color=fff`}
                className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                alt={user?.fullName}
              />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border p-2 z-50">
                <Link to={`/profile/${user?._id}`} onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition">
                  <img
                    src={user?.avatar ? `http://localhost:5000${user.avatar}` : `https://ui-avatars.com/api/?name=${user?.fullName}&background=1877f2&color=fff`}
                    className="w-12 h-12 rounded-full object-cover" alt={user?.fullName}
                  />
                  <div>
                    <p className="font-bold text-gray-800">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">@{user?.username}</p>
                  </div>
                </Link>

                <hr className="my-2" />

                <Link to="/circles" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition text-gray-700">
                  <CircleIcon className="w-6 h-6" />
                  <span>Mes cercles</span>
                </Link>

                <Link to="/dashboard" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition text-gray-700">
                  <ChartIcon className="w-6 h-6" />
                  <span>Vue d'ensemble</span>
                </Link>

                <hr className="my-2" />

                <Link to="/settings" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition text-gray-700">
                  <SettingsIcon className="w-6 h-6" />
                  <span>Paramètres</span>
                </Link>

                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition text-gray-700">
                  <LogoutIcon className="w-6 h-6" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;