import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/axios';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/timeAgo';
import { SendIcon, TrashIcon } from '../../Icons';

const CircleCommentSection = ({ circleId, postId }) => {
  const { user }     = useAuthStore();
  const [comments,   setComments]   = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await API.get(`/circles/${circleId}/posts/${postId}/comments`);
      setComments(data || []);
    } catch { /* silent */ }
  }, [circleId, postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const { data } = await API.post(`/circles/${circleId}/posts/${postId}/comment`, { content: newComment });
      setComments(data.comments || []);
      setNewComment('');
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  const avatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  return (
    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 8 }}>
      {comments.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Link to={`/profile/${c.author?._id}`} style={{ flexShrink: 0 }}>
            <img src={avatar(c.author)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ background: 'var(--bg-input)', borderRadius: '0 10px 10px 10px', padding: '6px 10px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{c.author?.fullName}</p>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>{c.content}</p>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 4 }}>{timeAgo(c.createdAt)}</p>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <img src={avatar(user)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
        <div style={{ flex: 1, display: 'flex', gap: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 99, padding: '5px 12px' }}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
            placeholder="Commenter…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)' }}
          />
          <button onClick={submitComment} disabled={!newComment.trim() || submitting} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', opacity: newComment.trim() ? 1 : 0.3,
          }}>
            <SendIcon size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CircleCommentSection;
