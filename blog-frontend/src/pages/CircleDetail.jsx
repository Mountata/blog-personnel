import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import useAuthStore from '../store/authStore';
import {
  FriendsIcon, ArrowLeftIcon, LockIcon, GlobeIcon,
  PhotoIcon, ChartIcon, CalendarIcon, MapPinIcon,
  DotsIcon, ChatIcon, CloseIcon, LinkIcon, CopyIcon,
  RefreshIcon, SettingsIcon, CheckIcon,
} from '../Icons';

// ── Helpers ──────────────────────────────────────────────────
const roleLabel = {
  creator:   { label: 'Créateur',   color: '#7c3aed', bg: '#ede9fe' },
  moderator: { label: 'Modérateur', color: '#2563eb', bg: '#dbeafe' },
  member:    { label: 'Membre',     color: '#6b7280', bg: '#f3f4f6' },
};
const typeConfig = {
  public:  { Icon: GlobeIcon,  label: 'Public',  color: '#22c55e' },
  private: { Icon: LockIcon,   label: 'Privé',   color: '#eab308' },
  secret:  { Icon: LockIcon,   label: 'Secret',  color: '#ef4444' },
};
const avatarUrl = (u) => u?.avatar
  ? `http://localhost:5000${u.avatar}`
  : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

const RoleBadge = ({ role }) => {
  const r = roleLabel[role];
  if (!r) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
};

// ── JoinBanner ───────────────────────────────────────────────
const JoinBanner = ({ circle, onJoin, pending }) => (
  <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{circle.emoji || '⭕'}</div>
    <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>{circle.name}</h2>
    {circle.type === 'public' && (
      <>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Rejoignez ce cercle pour interagir avec les membres.</p>
        <button onClick={onJoin} style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
          Rejoindre
        </button>
      </>
    )}
    {circle.type === 'private' && (
      <>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Ce cercle est privé. Envoyez une demande pour rejoindre.</p>
        {pending
          ? <div style={{ background: '#fef9c3', color: '#854d0e', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>⏳ Demande en attente…</div>
          : <button onClick={onJoin} style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
              Demander à rejoindre
            </button>
        }
      </>
    )}
  </div>
);

// ── PollCard ─────────────────────────────────────────────────
const PollCard = ({ poll, circleId, userId, isMember }) => {
  const [p, setP] = useState(poll);
  const total    = p.options?.reduce((s, o) => s + (o.voters?.length || 0), 0);
  const hasVoted = p.options?.some(o => o.voters?.some(v => v === userId || v?._id === userId));

  const vote = async (idx) => {
    if (!isMember) return;
    try { const { data } = await API.post(`/circles/${circleId}/polls/${p._id}/vote`, { optionIndexes: [idx] }); setP(data); }
    catch (e) { console.error(e); }
  };

  return (
    <div style={{ background: '#eff6ff', borderRadius: 12, padding: 12 }}>
      <p style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <ChartIcon size={15} style={{ color: '#3b82f6' }} />{p.question}
      </p>
      {p.options?.map((opt, i) => {
        const pct   = total > 0 ? Math.round((opt.voters?.length || 0) / total * 100) : 0;
        const voted = opt.voters?.some(v => v === userId || v?._id === userId);
        return (
          <button key={i} onClick={() => vote(i)} disabled={!isMember} style={{
            width: '100%', textAlign: 'left', borderRadius: 8, overflow: 'hidden',
            border: `2px solid ${voted ? '#3b82f6' : '#e5e7eb'}`,
            background: 'none', cursor: isMember ? 'pointer' : 'default', marginBottom: 6,
          }}>
            <div style={{ position: 'relative', padding: '8px 12px' }}>
              {hasVoted && <div style={{ position: 'absolute', inset: 0, background: '#dbeafe', width: `${pct}%` }} />}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{opt.text}</span>
                {hasVoted && <span style={{ color: '#2563eb', fontWeight: 700 }}>{pct}%</span>}
              </div>
            </div>
          </button>
        );
      })}
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total} vote{total > 1 ? 's' : ''}{!isMember && ' · Rejoignez pour voter'}</p>
    </div>
  );
};

// ── EventCard ────────────────────────────────────────────────
const EventCard = ({ event, circleId, userId, isMember }) => {
  const [ev, setEv] = useState(event);
  const myStatus = ev.attendees?.find(a => a.user === userId || a.user?._id === userId)?.status;
  const going    = ev.attendees?.filter(a => a.status === 'going').length || 0;
  const maybe    = ev.attendees?.filter(a => a.status === 'maybe').length || 0;
  const notGoing = ev.attendees?.filter(a => a.status === 'notGoing').length || 0;

  const attend = async (status) => {
    if (!isMember) return;
    try { const { data } = await API.put(`/circles/${circleId}/events/${ev._id}/attend`, { status }); setEv(data); }
    catch (e) { console.error(e); }
  };

  return (
    <div style={{ background: '#fff7ed', borderRadius: 12, padding: 12 }}>
      <p style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <CalendarIcon size={15} style={{ color: '#f97316' }} />{ev.title}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        {new Date(ev.startDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
      </p>
      {ev.location && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <MapPinIcon size={12} />{ev.location}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: '#16a34a' }}>✅ {going}</span>
        <span style={{ color: '#ca8a04' }}>🤔 {maybe}</span>
        <span style={{ color: '#ef4444' }}>❌ {notGoing}</span>
      </div>
      {isMember && (
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ s: 'going', l: '✅ Je participe' }, { s: 'maybe', l: '🤔 Peut-être' }, { s: 'notGoing', l: '❌ Absent' }].map(b => (
            <button key={b.s} onClick={() => attend(b.s)} style={{
              flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: `2px solid ${myStatus === b.s ? 'var(--primary)' : '#e5e7eb'}`,
              background: myStatus === b.s ? 'var(--primary)' : '#fff',
              color: myStatus === b.s ? '#fff' : 'var(--text)',
            }}>{b.l}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── PostCard ─────────────────────────────────────────────────
const PostCard = ({ post, myRole, userId, circleId, isMember, onDelete, onReact, onComment, onInteractBlocked }) => {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment]           = useState('');
  const [showMenu, setShowMenu]         = useState(false);
  const canDelete  = post.author?._id === userId || ['creator', 'moderator'].includes(myRole);
  const myReaction = post.reactions?.find(r => r.user?._id === userId || r.user === userId);
  const EMOJIS     = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const handleReact   = (e) => { if (!isMember) { onInteractBlocked(); return; } onReact(post._id, e); };
  const handleComment = () => { if (!isMember) { onInteractBlocked(); return; } setShowComments(!showComments); };
  const submitComment = () => { if (!comment.trim()) return; onComment(post._id, comment); setComment(''); };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={avatarUrl(post.author)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{post.author?.fullName}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {post.isPinned && ' 📌'}
            </p>
          </div>
        </div>
        {canDelete && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8 }}>
              <DotsIcon size={18} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: 36, background: 'var(--bg-card)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid var(--border)', zIndex: 10, minWidth: 140 }}>
                <button onClick={() => { onDelete(post._id); setShowMenu(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10 }}>
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: post.images?.length ? 12 : 0 }}>{post.content}</p>

      {post.images?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: post.images.length > 1 ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 12 }}>
          {post.images.map((img, i) => <img key={i} src={`http://localhost:5000${img}`} style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 256 }} alt="" />)}
        </div>
      )}

      {post.type === 'poll'  && post.pollRef  && <div style={{ marginBottom: 12 }}><PollCard  poll={post.pollRef}   circleId={circleId} userId={userId} isMember={isMember} /></div>}
      {post.type === 'event' && post.eventRef && <div style={{ marginBottom: 12 }}><EventCard event={post.eventRef} circleId={circleId} userId={userId} isMember={isMember} /></div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => handleReact(e)} style={{
              fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6,
              transform: myReaction?.emoji === e ? 'scale(1.25)' : 'scale(1)', transition: 'transform 0.15s',
            }}>{e}</button>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          {post.reactions?.length > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.reactions.length} réaction{post.reactions.length > 1 ? 's' : ''}</span>}
          <button onClick={handleComment} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChatIcon size={15} />{post.comments?.length || 0}
          </button>
        </div>
      </div>

      {showComments && isMember && (
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 10 }}>
          {post.comments?.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <img src={avatarUrl(c.author)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
              <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '6px 12px', flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.author?.fullName}</p>
                <p style={{ fontSize: 13, color: 'var(--text)' }}>{c.content}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="text" value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Commenter…"
              style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 99, padding: '8px 14px', fontSize: 13, outline: 'none', color: 'var(--text)' }}
            />
            <button onClick={submitComment} disabled={!comment.trim()} style={{
              background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
              padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, opacity: comment.trim() ? 1 : 0.4,
            }}>Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── CreatePostBox ────────────────────────────────────────────
const CreatePostBox = ({ circleId, onCreated, isBlocked }) => {
  const { user } = useAuthStore();
  const [textVal, setTextVal] = useState('');
  const [images,  setImages]  = useState([]);
  const [tab,     setTab]     = useState('post');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [options,  setOptions]  = useState(['', '']);
  const [evTitle,  setEvTitle]  = useState('');
  const [evDate,   setEvDate]   = useState('');
  const [evLoc,    setEvLoc]    = useState('');

  if (isBlocked) return <div className="card" style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#ef4444' }}>🚫 Vous êtes bloqué dans ce cercle.</div>;

  const avatarSrc = user?.avatar ? `http://localhost:5000${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=1877f2&color=fff`;

  const post = async () => {
    if (!textVal.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('content', textVal); images.forEach(img => fd.append('images', img));
      const { data } = await API.post(`/circles/${circleId}/posts`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(data); setTextVal(''); setImages([]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const poll = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;
    setLoading(true);
    try {
      const { data } = await API.post(`/circles/${circleId}/polls`, { question, options: options.filter(o => o.trim()), content: question });
      onCreated(data); setQuestion(''); setOptions(['', '']);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const event = async () => {
    if (!evTitle.trim() || !evDate) return;
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('title', evTitle); fd.append('startDate', evDate); fd.append('location', evLoc); fd.append('content', `Événement : ${evTitle}`);
      const { data } = await API.post(`/circles/${circleId}/events`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(data); setEvTitle(''); setEvDate(''); setEvLoc('');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const tabBtn = (id, Icon, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
      background: tab === id ? 'var(--bg-card)' : 'transparent', color: tab === id ? 'var(--primary)' : 'var(--text-muted)',
      boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    }}>
      <Icon size={14} /> {label}
    </button>
  );

  const inputStyle = { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', color: 'var(--text)', boxSizing: 'border-box' };
  const submitBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
      padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 13, opacity: (disabled || loading) ? 0.4 : 1,
    }}>{loading ? 'En cours…' : label}</button>
  );

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 4, borderRadius: 10, marginBottom: 12, width: 'fit-content' }}>
        {tabBtn('post', PhotoIcon, 'Post')}
        {tabBtn('poll', ChartIcon, 'Sondage')}
        {tabBtn('event', CalendarIcon, 'Événement')}
      </div>

      {tab === 'post' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <img src={avatarSrc} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
            <textarea value={textVal} onChange={e => setTextVal(e.target.value)} rows={3} placeholder="Quoi de neuf ?"
              style={{ ...inputStyle, resize: 'none', flex: 1 }} />
          </div>
          {submitBtn('Publier', post, !textVal.trim())}
        </div>
      )}

      {tab === 'poll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Votre question…" style={inputStyle} />
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }} placeholder={`Option ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
              {options.length > 2 && <button onClick={() => setOptions(options.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><CloseIcon size={16} /></button>}
            </div>
          ))}
          {options.length < 6 && <button onClick={() => setOptions([...options, ''])} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>+ Ajouter une option</button>}
          {submitBtn('Créer le sondage', poll, !question.trim() || options.filter(o => o.trim()).length < 2)}
        </div>
      )}

      {tab === 'event' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Titre de l'événement" style={inputStyle} />
          <input type="datetime-local" value={evDate} onChange={e => setEvDate(e.target.value)} style={inputStyle} />
          <input type="text" value={evLoc} onChange={e => setEvLoc(e.target.value)} placeholder="Lieu (optionnel)" style={inputStyle} />
          {submitBtn("Créer l'événement", event, !evTitle.trim() || !evDate)}
        </div>
      )}
    </div>
  );
};

// ── CircleSettingsModal ──────────────────────────────────────
const CircleSettingsModal = ({ circle, onClose, onUpdated }) => {
  const [copied,  setCopied]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [token,   setToken]   = useState(circle.inviteToken);
  const inviteLink = `${window.location.origin}/circles/invite/${token}`;

  const copyLink = () => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const regenerate = async () => {
    if (!window.confirm("Générer un nouveau lien ? L'ancien ne fonctionnera plus.")) return;
    setLoading(true);
    try { const { data } = await API.post(`/circles/${circle._id}/regenerate-token`); setToken(data.inviteToken); onUpdated({ ...circle, inviteToken: data.inviteToken }); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}><SettingsIcon size={18} /> Paramètres</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><CloseIcon size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          {(circle.type === 'secret' || circle.type === 'private') ? (
            <>
              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}><LinkIcon size={14} /> Lien d'invitation</p>
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 10 }}>{inviteLink}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyLink} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: copied ? '#22c55e' : 'var(--primary)', color: '#fff',
                }}>
                  <CopyIcon size={14} />{copied ? 'Copié !' : 'Copier'}
                </button>
                <button onClick={regenerate} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9,
                  border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                }}>
                  <RefreshIcon size={14} /> Nouveau lien
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Ce cercle est public — tout le monde peut le rejoindre librement.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── CircleDetail ─────────────────────────────────────────────
const CircleDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [circle,   setCircle]   = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('feed');
  const [myRole,   setMyRole]   = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [pending,  setPending]  = useState(false);
  const [showSettings,      setShowSettings]      = useState(false);
  const [showInteractAlert, setShowInteractAlert] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/circles/${id}`);
      setCircle(data); setMyRole(data.myRole); setMyStatus(data.myStatus); setIsMember(!!data.isMember);
      if (data.isMember) await Promise.all([fetchPosts(), fetchMembers()]);
      else if (data.type === 'public') await fetchPosts();
    } catch (e) { console.error(e); navigate('/circles'); }
    finally { setLoading(false); }
  };

  const fetchPosts   = async () => { try { const { data } = await API.get(`/circles/${id}/posts`); setPosts(data.posts || []); } catch (e) { console.error(e); } };
  const fetchMembers = async () => { try { const { data } = await API.get(`/circles/${id}/members`); setMembers(data || []); } catch (e) { console.error(e); } };

  const handleJoin = async () => {
    try {
      if (circle.type === 'public') { await API.post(`/circles/${id}/members/invite`, { userId: user._id }); await API.put(`/circles/${id}/members/invite/accept`); await fetchAll(); }
      else { await API.post(`/circles/${id}/members/invite`, { userId: user._id }); setPending(true); alert('Demande envoyée !'); }
    } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handlePostCreated = (p) => setPosts(prev => [p, ...prev]);
  const handleDeletePost  = async (pid) => { try { await API.delete(`/circles/${id}/posts/${pid}`); setPosts(prev => prev.filter(p => p._id !== pid)); } catch (e) { console.error(e); } };
  const handleReact       = async (pid, emoji) => { try { const { data } = await API.post(`/circles/${id}/posts/${pid}/react`, { emoji }); setPosts(prev => prev.map(p => p._id === pid ? { ...p, reactions: data.reactions } : p)); } catch (e) { console.error(e); } };
  const handleComment     = async (pid, content) => { try { const { data } = await API.post(`/circles/${id}/posts/${pid}/comment`, { content }); setPosts(prev => prev.map(p => p._id === pid ? { ...p, comments: data.comments } : p)); } catch (e) { console.error(e); } };
  const handleBlock       = async (uid) => { try { await API.put(`/circles/${id}/members/${uid}/block`);   fetchMembers(); } catch (e) { console.error(e); } };
  const handleUnblock     = async (uid) => { try { await API.put(`/circles/${id}/members/${uid}/unblock`); fetchMembers(); } catch (e) { console.error(e); } };
  const handleRole        = async (uid, role) => { try { await API.put(`/circles/${id}/members/${uid}/role`, { role }); fetchMembers(); } catch (e) { console.error(e); } };
  const handleRemove      = async (uid) => { if (!window.confirm('Retirer ce membre ?')) return; try { await API.delete(`/circles/${id}/members/${uid}/remove`); fetchMembers(); fetchAll(); } catch (e) { console.error(e); } };
  const handleWithdraw    = async () => { if (!window.confirm('Quitter ce cercle ?')) return; try { await API.post(`/circles/${id}/withdraw`, {}); navigate('/circles'); } catch (e) { alert(e.response?.data?.message || 'Erreur'); } };

  if (loading) return <Layout><div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner size="lg" /></div></Layout>;
  if (!circle) return null;

  const { Icon: TypeIcon, label: typeLabel, color: typeColor } = typeConfig[circle.type] || typeConfig.public;
  const isBlocked = myStatus === 'blocked';
  const isAdmin   = ['creator', 'moderator'].includes(myRole);
  const isCreator = myRole === 'creator';

  if (circle.type === 'secret' && !isMember) {
    return (
      <Layout>
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🕵️</p>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Cercle secret</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Vous avez besoin d'un lien d'invitation.</p>
          <button onClick={() => navigate('/circles')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>← Retour</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: 120, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {circle.coverImage && <img src={`http://localhost:5000${circle.coverImage}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
            <button onClick={() => navigate('/circles')} style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeftIcon size={16} style={{ color: '#374151' }} />
            </button>
            {isCreator && (
              <button onClick={() => navigate(`/circles/${id}/settings`)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <SettingsIcon size={16} style={{ color: '#374151' }} />
              </button>
            )}
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 36, marginTop: -28, background: 'var(--bg-card)', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {circle.emoji || '⭕'}
                </div>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{circle.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    <TypeIcon size={13} style={{ color: typeColor }} />
                    <span style={{ color: typeColor }}>{typeLabel}</span>
                    <span>·</span>
                    <FriendsIcon size={13} />
                    <span>{circle.memberCount} membre{circle.memberCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {myRole && <RoleBadge role={myRole} />}
                {isMember && myRole !== 'creator' && (
                  <button onClick={handleWithdraw} style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Quitter</button>
                )}
              </div>
            </div>
            {circle.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>{circle.description}</p>}
            {circle.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {circle.tags.map(t => <span key={t} style={{ fontSize: 11, background: 'var(--bg-input)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 99 }}>#{t}</span>)}
              </div>
            )}
          </div>

          {isMember && (
            <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
              {[{ id: 'feed', l: '📰 Fil' }, { id: 'members', l: '👥 Membres' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, padding: '12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'none',
                  borderBottom: `2px solid ${tab === t.id ? 'var(--primary)' : 'transparent'}`,
                  color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                }}>{t.l}</button>
              ))}
            </div>
          )}
        </div>

        {/* Non-member view */}
        {!isMember && <JoinBanner circle={circle} onJoin={handleJoin} pending={pending} />}
        {!isMember && circle.type === 'public' && posts.map(post => (
          <PostCard key={post._id} post={post} myRole={null} userId={user?._id} circleId={id}
            isMember={false} onDelete={() => {}} onReact={() => {}} onComment={() => {}}
            onInteractBlocked={() => setShowInteractAlert(true)} />
        ))}
        {showInteractAlert && !isMember && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#1d4ed8', textAlign: 'center' }}>
            👋 Rejoignez ce cercle pour réagir et commenter.{' '}
            <button onClick={handleJoin} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontWeight: 700, textDecoration: 'underline' }}>Rejoindre</button>
          </div>
        )}

        {/* Member feed */}
        {isMember && tab === 'feed' && (
          <>
            <CreatePostBox circleId={id} onCreated={handlePostCreated} isBlocked={isBlocked} />
            {posts.length === 0
              ? <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}><p style={{ fontSize: 36, marginBottom: 8 }}>💬</p><p style={{ fontWeight: 600, color: 'var(--text)' }}>Aucun post pour le moment</p></div>
              : posts.map(post => (
                  <PostCard key={post._id} post={post} myRole={myRole} userId={user?._id} circleId={id}
                    isMember={true} onDelete={handleDeletePost} onReact={handleReact} onComment={handleComment}
                    onInteractBlocked={() => {}} />
                ))
            }
          </>
        )}

        {/* Member list */}
        {isMember && tab === 'members' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            {members.map(m => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <img src={avatarUrl(m.user)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{m.user?.fullName}</p>
                    <RoleBadge role={m.role} />
                    {m.status === 'blocked' && <span style={{ fontSize: 11, background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Bloqué</span>}
                    {m.status === 'pending' && <span style={{ fontSize: 11, background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>En attente</span>}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{m.user?.username}</p>
                </div>
                {isAdmin && m.user?._id !== user?._id && m.role !== 'creator' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {m.status === 'blocked'
                      ? <button onClick={() => handleUnblock(m.user._id)} style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Débloquer</button>
                      : <button onClick={() => handleBlock(m.user._id)}   style={{ fontSize: 11, background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Bloquer</button>
                    }
                    {isCreator && <>
                      <button onClick={() => handleRole(m.user._id, m.role === 'moderator' ? 'member' : 'moderator')} style={{ fontSize: 11, background: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                        {m.role === 'moderator' ? '↓ Membre' : '↑ Modo'}
                      </button>
                      <button onClick={() => handleRemove(m.user._id)} style={{ fontSize: 11, background: 'var(--bg-input)', color: 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>Retirer</button>
                    </>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <CircleSettingsModal circle={circle} onClose={() => setShowSettings(false)}
          onUpdated={u => { setCircle(u); setShowSettings(false); }} />
      )}
    </Layout>
  );
};

export default CircleDetail;