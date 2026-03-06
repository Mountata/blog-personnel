import { useState, useCallback, useEffect } from 'react';
import API from '../../utils/axios';

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'J\'aime' },
  { type: 'love',  emoji: '❤️', label: 'J\'adore' },
  { type: 'haha',  emoji: '😂', label: 'Haha' },
  { type: 'wow',   emoji: '😮', label: 'Wow' },
  { type: 'sad',   emoji: '😢', label: 'Triste' },
  { type: 'angry', emoji: '😡', label: 'Grrr' },
];

const Reactions = ({ articleId }) => {
  const [reactions,  setReactions]  = useState([]);
  const [myReaction, setMyReaction] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const fetchReactions = useCallback(async () => {
    try {
      const { data } = await API.get(`/reactions/${articleId}`);
      // S'assure que reactions est toujours un tableau
      const list = Array.isArray(data.reactions) ? data.reactions : [];
      setReactions(list);
      setMyReaction(data.myReaction || null);
    } catch { /* silent */ }
  }, [articleId]);

  useEffect(() => { fetchReactions(); }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReact = async (type) => {
    try {
      setShowPicker(false);
      const { data } = await API.post(`/reactions/${articleId}`, { type });
      const list = Array.isArray(data.reactions) ? data.reactions : [];
      setReactions(list);
      setMyReaction(data.myReaction || null);
    } catch { /* silent */ }
  };

  const grouped = REACTIONS.map(r => ({
    ...r,
    count: reactions.filter(rx => rx?.type === r.type).length,
  })).filter(r => r.count > 0);

  const total = reactions.length;
  const my    = REACTIONS.find(r => r.type === myReaction);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {/* Bouton principal */}
      <button
        onClick={() => my ? handleReact(myReaction) : setShowPicker(p => !p)}
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 10px', borderRadius: 8,
          fontSize: 13, fontWeight: 600,
          color: my ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'background 0.15s',
        }}
        className="reaction-btn"
      >
        <span>{my ? my.emoji : '👍'}</span>
        <span>{my ? my.label : 'Réagir'}</span>
        {total > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total}</span>}
      </button>

      {/* Résumé des réactions */}
      {grouped.length > 0 && (
        <div style={{ display: 'flex', gap: 3 }}>
          {grouped.slice(0, 3).map(r => (
            <span key={r.type} style={{ fontSize: 14 }} title={`${r.count} ${r.label}`}>{r.emoji}</span>
          ))}
        </div>
      )}

      {/* Picker */}
      {showPicker && (
        <div
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
          style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 99, padding: '6px 10px',
            display: 'flex', gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            animation: 'popIn 0.15s ease',
          }}
        >
          {REACTIONS.map(r => (
            <button
              key={r.type}
              onClick={() => handleReact(r.type)}
              title={r.label}
              style={{
                fontSize: 22, background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 3px', borderRadius: 8,
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
        .reaction-btn:hover { background: var(--bg-hover) !important; }
        .emoji-btn:hover { transform: scale(1.3) !important; }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Reactions;