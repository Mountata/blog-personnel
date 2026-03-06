import { useState, useEffect, useRef, useMemo } from 'react';
import { PaperAirplaneIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/timeAgo';

const ChatWindow = ({ activeConv, messages, onSend }) => {
  const { user }        = useAuthStore();
  const [text, setText] = useState('');
  const [image, setImage]             = useState(null);
  const messagesEndRef                = useRef(null);
  const fileInputRef                  = useRef(null);

  // Dériver la preview directement depuis image (pas de useState supplémentaire)
  const preview = useMemo(() => {
    if (!image) return null;
    const url = URL.createObjectURL(image);
    return url;
  }, [image]);

  // Cleanup de l'URL objet quand image change
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAvatar = (u) =>
    u?.avatar
      ? `http://localhost:5000${u.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName)}&background=1877f2&color=fff`;

  const handleSend = async () => {
    if (!text.trim() && !image) return;
    await onSend(text, image);
    setText('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!activeConv) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl mb-4">💬</p>
          <p className="text-gray-700 font-semibold text-lg">Sélectionnez une conversation</p>
          <p className="text-gray-400 text-sm mt-1">Choisissez un ami pour commencer à discuter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">

      {/* ── Chat Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
        <div className="relative">
          <img
            src={getAvatar(activeConv.user)}
            alt={activeConv.user.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          {activeConv.user.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm leading-tight">{activeConv.user.fullName}</p>
          <p className="text-xs text-gray-400">
            {activeConv.user.isOnline ? '🟢 En ligne' : 'Hors ligne'}
          </p>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <img
              src={getAvatar(activeConv.user)}
              alt={activeConv.user.fullName}
              className="w-16 h-16 rounded-full object-cover mb-3"
            />
            <p className="font-semibold text-gray-700">{activeConv.user.fullName}</p>
            <p className="text-sm text-gray-400 mt-1">Dites bonjour 👋 pour commencer la discussion !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?._id;
            return (
              <div key={msg._id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <img
                    src={getAvatar(msg.sender)}
                    alt={msg.sender.fullName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mb-1"
                  />
                )}
                <div className={`flex flex-col max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                  {msg.image && (
                    <img
                      src={`http://localhost:5000${msg.image}`}
                      alt="attachment"
                      className="rounded-2xl max-w-full mb-1 shadow-sm"
                    />
                  )}
                  {msg.text && (
                    <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed
                      ${isMe
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                      }`}>
                      {msg.text}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    {timeAgo(msg.createdAt)}
                    {isMe && (
                      <span className={`ml-1 ${msg.read ? 'text-blue-400' : ''}`}>
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Image preview strip ── */}
      {preview && (
        <div className="px-4 pt-3 pb-0 bg-white border-t border-gray-100">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="preview"
              className="h-20 w-auto rounded-xl object-cover border border-gray-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5 hover:bg-red-500 transition"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="px-4 py-3 border-t bg-white flex items-center gap-2 shrink-0">
        <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition shrink-0">
          <PhotoIcon className="w-5 h-5 text-gray-500" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0] || null)}
            className="hidden"
          />
        </label>

        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() && !image}
          className="p-2.5 bg-blue-500 rounded-full hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <PaperAirplaneIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;