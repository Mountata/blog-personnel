import { useState, useCallback, useEffect, useRef } from 'react';
import API from '../../utils/axios';

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: "J'aime"  },
  { type: 'love',  emoji: '❤️', label: "J'adore" },
  { type: 'haha',  emoji: '😂', label: 'Haha'    },
  { type: 'wow',   emoji: '😮', label: 'Wow'     },
  { type: 'sad',   emoji: '😢', label: 'Triste'  },
  { type: 'angry', emoji: '😡', label: 'Grrr'    },
];

const Reactions = ({ articleId, vertical = false }) => {
  const [summary,    setSummary]    = useState({ total: 0 });
  const [myReaction, setMyReaction] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const hideTimer = useRef(null);

  const fetchReactions = useCallback(async () => {
    try {
      const { data } = await API.get(`/reactions/${articleId}`);
      setSummary(data.reactions || { total: 0 });
      setMyReaction(data.myReaction || null);
    } catch { /* silent */ }
  }, [articleId]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  const handleMouseEnter = () => {
    clearTimeout(hideTimer.current);
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setShowPicker(false), 300);
  };

  const handleReact = async (type) => {
    try {
      setShowPicker(false);
      clearTimeout(hideTimer.current);
      const { data } = await API.post(`/reactions/${articleId}`, { type });
      setSummary(data.reactions || { total: 0 });
      setMyReaction(data.reacted ? (data.myReaction ?? type) : null);
    } catch { /* silent */ }
  };

  const my    = REACTIONS.find(r => r.type === myReaction);
  const total = summary.total || 0;
  const nonEmpty = REACTIONS.filter(r => (summary[r.type] || 0) > 0);

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center',
      gap: 4,
    }}>
      <button
        onClick={() => my ? handleReact(myReaction) : setShowPicker(p => !p)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, background: 'none', border: 'none', cursor: 'pointer',
          padding: vertical ? '8px 6px' : '6px 10px', borderRadius: 10,
          fontWeight: 600,
          color: my ? 'var(--primary, #1877f2)' : 'var(--text-muted, #888)',
          transition: 'background 0.15s',
          width: vertical ? 44 : 'auto',
        }}
        className="reaction-btn"
      >
        <span style={{ fontSize: vertical ? 22 : 16 }}>{my ? my.emoji : '👍'}</span>
        <span style={{ fontSize: 10 }}>{my ? my.label : 'Réagir'}</span>
        {total > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted, #888)' }}>{total}</span>
        )}
      </button>

      {!vertical && nonEmpty.length > 0 && (
        <div style={{ display: 'flex', gap: 3 }}>
          {nonEmpty.slice(0, 3).map(r => (
            <span key={r.type} style={{ fontSize: 14 }} title={`${summary[r.type]} ${r.label}`}>
              {r.emoji}
            </span>
          ))}
        </div>
      )}

      {showPicker && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            ...(vertical
              ? { right: '110%', top: 0, flexDirection: 'column' }
              : { bottom: '110%', left: 0, flexDirection: 'row' }
            ),
            background: 'var(--bg-card, #fff)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: vertical ? 12 : 99,
            padding: '6px 10px',
            display: 'flex', gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 200,
            animation: 'popIn 0.15s ease',
          }}
        >
          {REACTIONS.map(r => (
            <button
              key={r.type}
              onClick={() => handleReact(r.type)}
              title={r.label}
              style={{
                fontSize: 22, background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 3px', borderRadius: 8,
                transition: 'transform 0.15s',
                transform: myReaction === r.type ? 'scale(1.3)' : 'scale(1)',
              }}
              className="emoji-btn"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .reaction-btn:hover { background: var(--bg-hover, #f0f2f5) !important; }
        .emoji-btn:hover    { transform: scale(1.3) !important; }
        @keyframes popIn    { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Reactions;