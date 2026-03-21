import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import useAuthStore from '../store/authStore';
import useMessageStore from '../store/messageStore';
import useSocket from '../hooks/useSocket';
import ConversationList from '../components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';
import API from '../utils/axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Messages = () => {
  const { user }                                            = useAuthStore();
  const { conversations, messages, fetchConversations,
          fetchMessages, sendMessage }                      = useMessageStore();
  const { sendSocketMessage }                               = useSocket();
  const [activeConv,   setActiveConv]                       = useState(null);
  const [friends,      setFriends]                          = useState([]);
  const [showPicker,   setShowPicker]                       = useState(false);
  const [search,       setSearch]                           = useState('');

  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await API.get('/friends');
      setFriends(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, [fetchConversations, fetchFriends]);

  const handleSelectConv = async (conv) => {
    setActiveConv(conv);
    await fetchMessages(conv.user._id);
  };

  const handleStartConv = async (friend) => {
    setShowPicker(false);
    setSearch('');
    const existing = conversations.find(c => c.user._id === friend._id);
    if (existing) {
      handleSelectConv(existing);
      return;
    }
    const fakeConv = {
      user: friend,
      lastMessage: { text: '', createdAt: new Date(), sender: { _id: '' } },
      unread: 0
    };
    setActiveConv(fakeConv);
    await fetchMessages(friend._id);
  };

  const handleSend = async (text, image) => {
    if (!text.trim() && !image) return;
    const msg = await sendMessage(activeConv.user._id, text, image);
    sendSocketMessage(activeConv.user._id, msg);
    await fetchConversations();
  };

  const getAvatar = (u) =>
    u?.avatar
      ? `http://localhost:5000${u.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName)}&background=1877f2&color=fff`;

  const filteredFriends = friends.filter(f =>
    f.fullName.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  // Suprimer l'avertissement unused 'user' - utilisé implicitement par les stores
  void user;

  return (
    <Layout showRight={false}>
      <div className="bg-white rounded-xl shadow overflow-hidden flex h-[calc(100vh-100px)]">

        <div className="w-80 border-r flex flex-col shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-xl text-gray-800">Messages</h2>
            <button
              onClick={() => setShowPicker(!showPicker)}
              title="Nouveau message"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition text-lg"
            >
              ✏️
            </button>
          </div>

          {showPicker && (
            <div className="border-b p-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 mb-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un ami..."
                  className="bg-transparent outline-none text-sm flex-1"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredFriends.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Aucun ami trouvé</p>
                ) : (
                  filteredFriends.map(f => (
                    <button
                      key={f._id}
                      onClick={() => handleStartConv(f)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 transition text-left"
                    >
                      <img src={getAvatar(f)} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{f.fullName}</p>
                        <p className="text-xs text-gray-400">@{f.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <ConversationList
            conversations={conversations}
            activeConv={activeConv}
            onSelect={handleSelectConv}
          />
        </div>

        <ChatWindow
          activeConv={activeConv}
          messages={messages}
          onSend={handleSend}
        />
      </div>
    </Layout>
  );
};

export default Messages;