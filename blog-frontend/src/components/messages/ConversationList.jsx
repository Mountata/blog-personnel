import { timeAgo } from '../../utils/timeAgo';
import useAuthStore from '../../store/authStore';

const ConversationList = ({ conversations, activeConv, onSelect }) => {
  const { user } = useAuthStore();

  const getAvatar = (u) =>
    u?.avatar
      ? `http://localhost:5000${u.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName)}&background=1877f2&color=fff`;

  return (
    <div className="w-80 border-r flex flex-col shrink-0 bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-xl text-gray-800">Messages</h2>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500 text-sm font-medium">Aucune conversation</p>
            <p className="text-gray-400 text-xs mt-1">
              Envoyez un message à un ami pour commencer
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeConv?.user._id === conv.user._id;
            const isMe     = conv.lastMessage?.sender?._id === user?._id;

            return (
              <div
                key={conv.user._id}
                onClick={() => onSelect(conv)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors
                  hover:bg-gray-50
                  ${isActive ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
              >
                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  <img
                    src={getAvatar(conv.user)}
                    alt={conv.user.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Text info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {conv.user.fullName}
                    </p>
                    <p className="text-xs text-gray-400 shrink-0">
                      {conv.lastMessage?.createdAt
                        ? timeAgo(conv.lastMessage.createdAt)
                        : ''}
                    </p>
                  </div>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      conv.unread > 0
                        ? 'text-gray-800 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {isMe ? 'Vous : ' : ''}
                    {conv.lastMessage?.text || '📷 Photo'}
                  </p>
                </div>

                {/* Unread badge */}
                {conv.unread > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shrink-0">
                    {conv.unread > 99 ? '99+' : conv.unread}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;