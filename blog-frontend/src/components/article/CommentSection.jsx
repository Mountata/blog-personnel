import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/axios';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/timeAgo';
import { SendIcon, TrashIcon } from '../../Icons';

const CommentSection = ({ articleId }) => {
  const { user }       = useAuthStore();
  const [comments,    setComments]    = useState([]);
  const [newComment,  setNewComment]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/comments/${articleId}`);
      setComments(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [articleId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const { data } = await API.post(`/comments/${articleId}`, { content: newComment });
      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch { /* silent */ }
  };

  const avatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  return (
    <div style={{ padding: '12px 0' }}>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>Chargement…</p>
      ) : (
        comments.map(c => (
          <div key={c._id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <Link to={`/profile/${c.author?._id}`} style={{ flexShrink: 0 }}>
              <img src={avatar(c.author)} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} alt="" />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: 'var(--bg-input)', borderRadius: '0 12px 12px 12px', padding: '8px 12px' }}>
                <Link to={`/profile/${c.author?._id}`} style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', textDecoration: 'none' }}>
                  {c.author?.fullName}
                </Link>
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>{c.content}</p>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, paddingLeft: 4 }}>{timeAgo(c.createdAt)}</p>
            </div>
            {c.author?._id === user?._id && (
              <button onClick={() => deleteComment(c._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', alignSelf: 'flex-start', marginTop: 8 }}>
                <TrashIcon size={14} />
              </button>
            )}
          </div>
        ))
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <img src={avatar(user)} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
        <div style={{ flex: 1, display: 'flex', gap: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 12px' }}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
            placeholder="Écrire un commentaire…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)' }}
          />
          <button onClick={submitComment} disabled={!newComment.trim() || submitting} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', opacity: newComment.trim() ? 1 : 0.3,
          }}>
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
