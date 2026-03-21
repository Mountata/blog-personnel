import { useState, useRef } from 'react';
import API from '../../utils/axios';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const CircleReactions = ({ circleId, postId, reactions = [], userId, isMember, onReacted }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer  = useRef(null);  // ✅ useRef instead of plain variable

  const myReaction = reactions.find(r => r.user === userId || r.user?._id === userId);

  const handleReact = async (emoji) => {
    if (!isMember) return;
    try {
      setShowPicker(false);
      const { data } = await API.post(`/circles/${circleId}/posts/${postId}/react`, { emoji });
      onReacted && onReacted(data.reactions);
    } catch { /* silent */ }
  };

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowPicker(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setShowPicker(false);
  };

  const grouped = EMOJIS.map(e => ({
    emoji: e,
    count: reactions.filter(r => r.emoji === e).length,
  })).filter(r => r.count > 0);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => isMember && setShowPicker(p => !p)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: isMember ? 'pointer' : 'default',
          padding: '4px 8px', borderRadius: 8,
          fontSize: 18, transition: 'background 0.15s',
        }}
        className="circle-react-btn"
      >
        {myReaction ? myReaction.emoji : '👍'}
        {reactions.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{reactions.length}</span>
        )}
      </button>

      {grouped.map(r => (
        <span key={r.emoji} style={{ fontSize: 14 }} title={`${r.count}`}>{r.emoji} {r.count}</span>
      ))}

      {showPicker && isMember && (
        <div
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 99, padding: '6px 10px',
            display: 'flex', gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
          }}
        >
          {EMOJIS.map(e => (
            <button key={e} onClick={() => handleReact(e)} style={{
              fontSize: 22, background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 3px', borderRadius: 8,
              transform: myReaction?.emoji === e ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.15s',
            }} className="c-emoji-btn">{e}</button>
          ))}
        </div>
      )}
      <style>{`.circle-react-btn:hover { background: var(--bg-hover) !important; } .c-emoji-btn:hover { transform: scale(1.3) !important; }`}</style>
    </div>
  );
};

export default CircleReactions;
