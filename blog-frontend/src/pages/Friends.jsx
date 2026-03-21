import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import { Link } from 'react-router-dom';
import API from '../utils/axios';
import toast from 'react-hot-toast';
import { UserPlusIcon, UserMinusIcon, CheckIcon, CloseIcon, SearchIcon } from '../Icons';

const Friends = () => {
  const [activeTab,    setActiveTab]    = useState('friends');
  const [friends,      setFriends]      = useState([]);
  const [requests,     setRequests]     = useState([]);
  const [sent,         setSent]         = useState([]);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        API.get('/friends'),
        API.get('/friends/requests'),
        API.get('/friends/sent')
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
      setSent(sentRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) { setSearchResult([]); return; }
    try {
      const { data } = await API.get(`/search/users?q=${q}`);
      setSearchResult(data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await API.post(`/friends/request/${userId}`);
      setSearchResult(prev => prev.filter(u => u._id !== userId));
      toast.success('Demande envoyée !');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await API.put(`/friends/accept/${friendshipId}`);
      setRequests(prev => prev.filter(r => r._id !== friendshipId));
      toast.success('Demande acceptée !');
      fetchAll();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const rejectRequest = async (friendshipId) => {
    try {
      await API.put(`/friends/reject/${friendshipId}`);
      setRequests(prev => prev.filter(r => r._id !== friendshipId));
      toast.success('Demande refusée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const cancelRequest = async (userId) => {
    try {
      await API.delete(`/friends/cancel/${userId}`);
      setSent(prev => prev.filter(r => r.recipient._id !== userId));
      toast.success('Demande annulée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const removeFriend = async (userId) => {
    if (!window.confirm('Supprimer cet ami ?')) return;
    try {
      await API.delete(`/friends/remove/${userId}`);
      setFriends(prev => prev.filter(f => f._id !== userId));
      toast.success('Ami supprimé');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getAvatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${u?.fullName}&background=1877f2&color=fff`;

  const tabs = [
    { id: 'friends',  label: 'Mes amis',         count: friends.length },
    { id: 'requests', label: 'Demandes reçues',   count: requests.length },
    { id: 'sent',     label: 'Demandes envoyées', count: sent.length },
    { id: 'search',   label: 'Rechercher',        count: 0 },
  ];

  if (loading) return <Layout><Spinner size="lg" /></Layout>;

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow mb-4">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Amis</h1>
        </div>

        <div className="flex overflow-x-auto border-b">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition
                ${activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* MES AMIS */}
          {activeTab === 'friends' && (
            friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-gray-500">Vous n'avez pas encore d'amis</p>
                <button onClick={() => setActiveTab('search')}
                  className="mt-3 text-primary font-semibold hover:underline text-sm">
                  Rechercher des personnes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {friends.map(friend => (
                  <div key={friend._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                    <Link to={`/profile/${friend._id}`} className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <img src={getAvatar(friend)} className="w-12 h-12 rounded-full object-cover" />
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{friend.fullName}</p>
                        <p className="text-sm text-gray-400">@{friend.username}</p>
                      </div>
                    </Link>
                    <button onClick={() => removeFriend(friend._id)}
                      className="flex items-center gap-1 text-sm text-red-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                      <UserMinusIcon className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* DEMANDES REÇUES */}
          {activeTab === 'requests' && (
            requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📬</p>
                <p className="text-gray-500">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {requests.map(req => (
                  <div key={req._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                    <Link to={`/profile/${req.requester._id}`} className="flex items-center gap-3 flex-1">
                      <img src={getAvatar(req.requester)} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-800">{req.requester.fullName}</p>
                        <p className="text-sm text-gray-400">@{req.requester.username}</p>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <button onClick={() => acceptRequest(req._id)}
                        className="flex items-center gap-1 text-sm bg-primary text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                        <CheckIcon className="w-4 h-4" />
                        Accepter
                      </button>
                      <button onClick={() => rejectRequest(req._id)}
                        className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                        <CloseIcon className="w-4 h-4" />
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* DEMANDES ENVOYÉES */}
          {activeTab === 'sent' && (
            sent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📤</p>
                <p className="text-gray-500">Aucune demande envoyée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sent.map(req => (
                  <div key={req._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                    <Link to={`/profile/${req.recipient._id}`} className="flex items-center gap-3 flex-1">
                      <img src={getAvatar(req.recipient)} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-800">{req.recipient.fullName}</p>
                        <p className="text-sm text-gray-400">@{req.recipient.username}</p>
                      </div>
                    </Link>
                    <button onClick={() => cancelRequest(req.recipient._id)}
                      className="text-sm bg-gray-100 text-gray-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* RECHERCHE */}
          {activeTab === 'search' && (
            <div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5 mb-4">
                <SearchIcon className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  type="text" value={searchQuery} onChange={handleSearch}
                  placeholder="Rechercher par nom d'utilisateur..."
                  className="bg-transparent outline-none flex-1 text-sm"
                  autoFocus
                />
              </div>

              {searchResult.length === 0 && searchQuery.length >= 2 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun résultat pour "{searchQuery}"</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {searchResult.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                    <Link to={`/profile/${u._id}`} className="flex items-center gap-3 flex-1">
                      <img src={getAvatar(u)} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-800">{u.fullName}</p>
                        <p className="text-sm text-gray-400">@{u.username}</p>
                        {u.bio && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{u.bio}</p>}
                      </div>
                    </Link>
                    <button onClick={() => sendRequest(u._id)}
                      className="flex items-center gap-1 text-sm bg-primary text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                      <UserPlusIcon className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Friends;