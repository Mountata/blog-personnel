import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import API from '../../utils/axios';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/timeAgo';
import { TrashIcon, SendIcon } from '../../Icons';

const EMOJIS = ['😀','😂','❤️','👍','🔥','🎉','😮','🙌','💡','✅','😢','👏','🤔','💬','📷','🌍'];

const ReplyItem = ({ reply, depth = 1, onReply, avatar }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    <img
      src={avatar(reply.author)}
      style={{ width: depth === 1 ? 24 : 20, height: depth === 1 ? 24 : 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }}
      alt=""
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ background: 'var(--bg-input)', borderRadius: '0 12px 12px 12px', padding: '6px 10px' }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--text)' }}>{reply.author?.fullName} </span>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>{reply.text}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, paddingLeft: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(reply.createdAt)}</span>
        <button onClick={() => onReply(reply._id, reply.author?.fullName)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, padding: 0 }}>
          ↩ Répondre
        </button>
      </div>
      {reply.replies?.length > 0 && (
        <div style={{ marginTop: 6, marginLeft: 8, borderLeft: '2px solid var(--border)', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reply.replies.map((r, i) => (
            <ReplyItem key={r._id || i} reply={r} depth={depth + 1} onReply={onReply} avatar={avatar} />
          ))}
        </div>
      )}
    </div>
  </div>
);

const CommentSection = ({ articleId, cardRef, onClose, onCountChange }) => {
  const { user } = useAuthStore();
  const [comments,    setComments]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [text,        setText]        = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [pendingImgs, setPendingImgs] = useState([]);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [friends,     setFriends]     = useState([]);
  const [replyTo,     setReplyTo]     = useState(null);
  const [rect,        setRect]        = useState(null);

  const textRef = useRef(null);
  const fileRef = useRef(null);
  const listRef = useRef(null);

  const avatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  useEffect(() => {
    const updateRect = () => {
      if (cardRef?.current) {
        const r = cardRef.current.getBoundingClientRect();
        setRect({ left: r.left + window.scrollX, width: r.width });
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [cardRef]);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/comments/${articleId}`);
      setComments(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [articleId]);

  const fetchFriends = useCallback(async () => {
    try {
      const { data } = await API.get('/friends');
      setFriends(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchComments();
    fetchFriends();
    setTimeout(() => textRef.current?.focus(), 200);
  }, [fetchComments, fetchFriends]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    const atIdx = val.lastIndexOf('@');
    setShowMention(atIdx >= 0 && atIdx === val.length - 1);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const insertMention = (name) => {
    const atIdx = text.lastIndexOf('@');
    setText(text.slice(0, atIdx) + '@' + name + ' ');
    setShowMention(false);
    setTimeout(() => textRef.current?.focus(), 0);
  };

  const insertEmoji = (emoji) => {
    setText(prev => prev + emoji);
    setTimeout(() => textRef.current?.focus(), 0);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setPendingImgs(prev => [...prev, ...files.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
    e.target.value = '';
  };
  const removeImg = (i) => setPendingImgs(prev => prev.filter((_, idx) => idx !== i));

  const handleSetReply = (commentId, authorName, replyId = null) => {
    setReplyTo({ commentId, replyId, authorName });
    setText('');
    setTimeout(() => textRef.current?.focus(), 100);
  };

  const submitComment = async () => {
    if (!text.trim() && pendingImgs.length === 0) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      let newItem;
      if (replyTo) {
        const { data } = await API.post(`/comments/${replyTo.commentId}/reply`, { text, replyToId: replyTo.replyId || null });
        newItem = data;
        setComments(prev => prev.map(c =>
          c._id === replyTo.commentId ? { ...c, replies: [...(c.replies || []), newItem] } : c
        ));
      } else if (pendingImgs.length > 0) {
        const formData = new FormData();
        formData.append('text', text || ' ');
        pendingImgs.forEach(p => formData.append('images', p.file));
        const { data } = await API.post(`/comments/${articleId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        newItem = data;
        setComments(prev => [newItem, ...prev]);
        onCountChange?.(+1);
        setTimeout(() => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        const { data } = await API.post(`/comments/${articleId}`, { text });
        newItem = data;
        setComments(prev => [newItem, ...prev]);
        onCountChange?.(+1);
        setTimeout(() => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
      setText('');
      setPendingImgs([]);
      setReplyTo(null);
      setShowEmoji(false);
      setShowMention(false);
      if (textRef.current) textRef.current.style.height = 'auto';
    } catch(e) {
      console.error('Erreur:', e.response?.data || e.message);
    } finally { setSubmitting(false); }
  };

  const deleteComment = async (id) => {
    try {
      await API.delete(`/comments/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
      onCountChange?.(-1);
    } catch { /* silent */ }
  };

  const toggleLike = async (commentId) => {
    try {
      const { data } = await API.post(`/comments/${commentId}/like`);
      setComments(prev => prev.map(c =>
        c._id === commentId ? { ...c, likes: data.liked ? [...(c.likes || []), user._id] : (c.likes || []).filter(id => id !== user._id) } : c
      ));
    } catch { /* silent */ }
  };

  const renderText = (t) => {
    if (!t) return null;
    return t.split(/(@\S+)/g).map((part, i) =>
      part.startsWith('@') ? <span key={i} style={{ color: 'var(--primary)', fontWeight: 700 }}>{part}</span> : part
    );
  };

  const canSend = (text.trim().length > 0 || pendingImgs.length > 0) && !submitting;

  if (!rect) return null;

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.20)', zIndex: 998, cursor: 'pointer' }} />

      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', bottom: 0,
        left: rect.left, width: rect.width,
        zIndex: 999,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderBottom: 'none',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        maxHeight: '65vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Commentaires</span>
            <span style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 99 }}>
              {comments.length}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-input)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700 }}>
            ✕
          </button>
        </div>

        {/* Liste */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '24px 0' }}>Chargement…</p>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucun commentaire. Soyez le premier !</p>
            </div>
          ) : comments.map(c => (
            <div key={c._id} style={{ display: 'flex', gap: 8 }}>
              <Link to={`/profile/${c.author?._id}`} style={{ flexShrink: 0 }}>
                <img src={avatar(c.author)} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ background: 'var(--bg-input)', borderRadius: '0 16px 16px 16px', padding: '8px 12px' }}>
                  <Link to={`/profile/${c.author?._id}`} style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', textDecoration: 'none', display: 'block' }}>
                    {c.author?.fullName}
                  </Link>
                  <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 2, lineHeight: 1.5 }}>{renderText(c.text)}</p>
                  {c.images?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {c.images.map((img, i) => (
                        <img key={i} src={`http://localhost:5000${img}`}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                          alt="" onClick={() => window.open(`http://localhost:5000${img}`)} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 4 }}>
                  <button onClick={() => toggleLike(c._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0, color: c.likes?.includes(user?._id) ? '#ef4444' : 'var(--text-muted)' }}>
                    {c.likes?.includes(user?._id) ? '❤️' : '🤍'} {c.likes?.length || 0}
                  </button>
                  <button onClick={() => handleSetReply(c._id, c.author?.fullName)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, padding: 0 }}>
                    ↩ Répondre
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--border)' }}>{timeAgo(c.createdAt)}</span>
                  {c.author?._id === user?._id && (
                    <button onClick={() => deleteComment(c._id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border)', padding: 0 }}>
                      <TrashIcon size={12} />
                    </button>
                  )}
                </div>
                {c.replies?.length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 12, borderLeft: '2px solid var(--border)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {c.replies.map((r, i) => (
                      <ReplyItem key={r._id || i} reply={r} depth={1} avatar={avatar}
                        onReply={(replyId, authorName) => handleSetReply(c._id, authorName, replyId)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Compositeur */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px 12px', background: 'var(--bg-card)', flexShrink: 0 }}>
          {replyTo && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary-subtle)', borderRadius: 8, padding: '6px 12px', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>↩ Réponse à {replyTo.authorName}</span>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1 }}>✕</button>
            </div>
          )}

          {showMention && friends.length > 0 && (
            <div style={{ marginBottom: 8, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', maxHeight: 128, overflowY: 'auto', background: 'var(--bg-card)' }}>
              {friends.map(f => (
                <button key={f._id} onClick={() => insertMention(f.fullName)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                  <img src={avatar(f)} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.fullName}</span>
                </button>
              ))}
            </div>
          )}

          {pendingImgs.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {pendingImgs.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.url} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} alt="" />
                  <button onClick={() => removeImg(i)} style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {showEmoji && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, background: 'var(--bg-input)', borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => insertEmoji(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 2, borderRadius: 4 }}>{e}</button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <img src={avatar(user)} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginBottom: 2 }} alt="" />
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', background: 'var(--bg-input)', transition: 'border-color 0.15s' }}>
              <textarea
                ref={textRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                placeholder={replyTo ? `Répondre à ${replyTo.authorName}…` : 'Écrire un commentaire… (@nom pour taguer)'}
                rows={1}
                style={{ width: '100%', resize: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', background: 'transparent', lineHeight: 1.5, padding: '8px 12px 4px', minHeight: 34, maxHeight: 100, border: 'none', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 6px' }}>
                <button onClick={() => setShowEmoji(p => !p)} style={{ background: showEmoji ? 'var(--primary-subtle)' : 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 4px', borderRadius: 6 }}>😊</button>
                <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 4px', borderRadius: 6 }}>📷
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImages} />
                </button>
                <button onClick={() => { setText(t => t + '@'); setShowMention(true); setTimeout(() => textRef.current?.focus(), 0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', padding: '2px 4px', borderRadius: 6 }}>@</button>
                <button onClick={submitComment} disabled={!canSend} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: canSend ? 'var(--primary)' : 'var(--border)', color: canSend ? '#fff' : 'var(--text-muted)', border: 'none', cursor: canSend ? 'pointer' : 'default', borderRadius: 10, padding: '5px 14px', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}>
                  <SendIcon size={12} />
                  {submitting ? '…' : replyTo ? 'Répondre' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default CommentSection;