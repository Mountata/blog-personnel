import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  HeartIcon, ShareIcon, MapPinIcon,
  LinkIcon, BriefcaseIcon, SparklesIcon, PencilIcon,
  XMarkIcon, CheckIcon, EyeIcon, BookmarkIcon,
  UserPlusIcon, UserMinusIcon, NoSymbolIcon,
  ArrowTopRightOnSquareIcon, PlusIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

// ─── Helpers ─────────────────────────────────────────────────
const imgSrc = (path) => path ? `http://localhost:5000${path}` : null;
const avatarOf = (u) =>
  u?.avatar
    ? imgSrc(u.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff&size=200`;

// ─── Badge disponibilité ──────────────────────────────────────
const AvailBadge = ({ status }) => {
  if (!status || status === 'unavailable') return null;
  const cfg = {
    open:      { bg: 'bg-emerald-500', dot: 'bg-emerald-300', label: '🟢 Open to work'         },
    freelance: { bg: 'bg-amber-500',   dot: 'bg-amber-300',   label: '🟡 Freelance disponible' },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 ${c.bg} text-white text-xs font-bold px-3 py-1 rounded-full shadow`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
};

// ─── Pill stat ────────────────────────────────────────────────
const Pill = ({ value, label, color }) => {
  const colors = {
    blue:   'bg-blue-50   text-blue-600   border-blue-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:  'bg-amber-50  text-amber-600  border-amber-100',
    rose:   'bg-rose-50   text-rose-600   border-rose-100',
  };
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-2xl border ${colors[color]} min-w-[72px]`}>
      <span className="text-xl font-black tabular-nums">{value}</span>
      <span className="text-[11px] font-medium mt-0.5 opacity-75 text-center leading-tight">{label}</span>
    </div>
  );
};

// ─── Modal Recommander ────────────────────────────────────────
const RecommendModal = ({ userId, onClose }) => {
  const [friends,  setFriends]  = useState([]);
  const [sel,      setSel]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    API.get('/friends').then(({ data }) => {
      setFriends((data || []).filter(f => f._id !== userId));
      setLoading(false);
    });
  }, [userId]);

  const toggle = (id) =>
    setSel(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const send = async () => {
    if (!sel.length) return;
    setSending(true);
    try {
      await API.post(`/profile/${userId}/recommend`, { friendIds: sel });
      toast.success('Profil recommandé !');
      onClose();
    } catch (e) {
      toast.error('Erreur');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-bold text-gray-800">Recommander à un ami</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-3 space-y-1">
          {loading ? <Spinner /> : friends.length === 0
            ? <p className="text-center text-sm text-gray-400 py-6">Aucun ami disponible</p>
            : friends.map(f => (
              <button key={f._id} onClick={() => toggle(f._id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition
                  ${sel.includes(f._id) ? 'bg-blue-50 ring-2 ring-blue-400' : 'hover:bg-gray-50'}`}>
                <img src={avatarOf(f)} className="w-9 h-9 rounded-full object-cover" alt="" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{f.fullName}</p>
                  <p className="text-xs text-gray-400">@{f.username}</p>
                </div>
                {sel.includes(f._id) && <CheckIcon className="w-4 h-4 text-blue-500" />}
              </button>
            ))
          }
        </div>

        <div className="px-4 py-3 border-t">
          <button onClick={send} disabled={!sel.length || sending}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition">
            {sending ? 'Envoi…' : `Recommander${sel.length ? ` (${sel.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal édition profil ─────────────────────────────────────
const EditModal = ({ profile, onClose, onSaved }) => {
  const [tab,   setTab]   = useState('general');
  const [form,  setForm]  = useState({
    fullName:      profile.fullName      || '',
    bio:           profile.bio           || '',
    jobTitle:      profile.jobTitle      || '',
    location:      profile.location      || '',
    website:       profile.website       || '',
    currentGoal:   profile.currentGoal   || '',
    availability:  profile.availability  || 'unavailable',
    yearsExp:      profile.yearsExp      || 0,
    totalProjects: profile.totalProjects || 0,
    skills:        (profile.skills    || []).join(', '),
    languages:     (profile.languages || []).join(', '),
  });
  const [achievements, setAch]    = useState(profile.achievements || []);
  const [newAvatar,    setAvatar] = useState(null);
  const [newCover,     setCover]  = useState(null);
  const [saving,       setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.set('skills',       JSON.stringify(form.skills.split(',').map(s => s.trim()).filter(Boolean)));
      fd.set('languages',    JSON.stringify(form.languages.split(',').map(s => s.trim()).filter(Boolean)));
      fd.set('achievements', JSON.stringify(achievements));
      if (newAvatar) fd.append('avatar',     newAvatar);
      if (newCover)  fd.append('coverPhoto', newCover);

      const { data } = await API.put('/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profil mis à jour !');
      onSaved(data);
      onClose();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addAch = () => setAch(p => [...p, { icon: '🏆', title: '', description: '', link: '' }]);
  const updAch = (i, k, v) => setAch(p => p.map((a, j) => j === i ? { ...a, [k]: v } : a));
  const remAch = (i) => setAch(p => p.filter((_, j) => j !== i));

  const TABS = ['general', 'pro', 'réalisations'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">

        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-bold text-lg text-gray-800">Modifier le profil</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition border-b-2 capitalize
                ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Général ─────────────────────────────────────── */}
          {tab === 'general' && (
            <>
              {/* Photo de couverture */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Photo de couverture</p>
                <label className="block relative h-24 rounded-xl overflow-hidden cursor-pointer group
                  bg-gradient-to-br from-blue-400 to-purple-500">
                  {(newCover || profile.coverPhoto) && (
                    <img
                      src={newCover ? URL.createObjectURL(newCover) : imgSrc(profile.coverPhoto)}
                      className="w-full h-full object-cover" alt="" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition">
                    <span className="text-white text-sm font-semibold">Changer</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => setCover(e.target.files[0])} />
                </label>
              </div>

              {/* Avatar */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Photo de profil</p>
                <div className="flex items-center gap-4">
                  <img
                    src={newAvatar ? URL.createObjectURL(newAvatar) : avatarOf(profile)}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200" alt="" />
                  <label className="cursor-pointer text-sm text-blue-600 hover:underline font-medium">
                    Changer la photo
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => setAvatar(e.target.files[0])} />
                  </label>
                </div>
              </div>

              {/* Nom */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nom complet</label>
                <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
            </>
          )}

          {/* ── Professionnel ────────────────────────────────── */}
          {tab === 'pro' && (
            <>
              {[
                { k: 'jobTitle',    l: 'Poste / Titre',       ph: 'Lead Developer chez TechCorp' },
                { k: 'location',    l: 'Localisation',        ph: 'Paris, France' },
                { k: 'website',     l: 'Site / Portfolio',    ph: 'https://monsite.com' },
                { k: 'currentGoal', l: 'Objectif actuel',     ph: 'Je me forme sur l\'IA…' },
                { k: 'skills',      l: 'Compétences (virgules)', ph: 'React, Node.js, Python…' },
                { k: 'languages',   l: 'Langues (virgules)',  ph: 'Français, Anglais…' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{f.l}</label>
                  <input type="text" value={form[f.k]} placeholder={f.ph}
                    onChange={e => set(f.k, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: 'yearsExp',      l: "Années d'expérience" },
                  { k: 'totalProjects', l: 'Projets réalisés' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{f.l}</label>
                    <input type="number" min="0" value={form[f.k]}
                      onChange={e => set(f.k, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>

              {/* Disponibilité */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Disponibilité</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'open',        l: '🟢 Open to work'     },
                    { v: 'freelance',   l: '🟡 Freelance'         },
                    { v: 'unavailable', l: '⚫ Non dispo'         },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => set('availability', opt.v)}
                      className={`py-2 px-1 rounded-xl border-2 text-xs font-semibold text-center transition
                        ${form.availability === opt.v
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Réalisations ─────────────────────────────────── */}
          {tab === 'réalisations' && (
            <div className="space-y-3">
              {achievements.map((a, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-3 space-y-2 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <input value={a.icon} onChange={e => updAch(i, 'icon', e.target.value)}
                      className="w-12 text-center text-xl border border-gray-200 rounded-lg py-1 outline-none" />
                    <input value={a.title} placeholder="Titre" onChange={e => updAch(i, 'title', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none" />
                    <button onClick={() => remAch(i)} className="text-red-400 hover:text-red-600 transition">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <input value={a.description} placeholder="Description courte…"
                    onChange={e => updAch(i, 'description', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none" />
                  <input value={a.link} placeholder="Lien (optionnel)"
                    onChange={e => updAch(i, 'link', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none" />
                </div>
              ))}
              <button onClick={addAch}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-500
                  hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2">
                <PlusIcon className="w-4 h-4" /> Ajouter une réalisation
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────
const Profile = () => {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const { user: me, setUser } = useAuthStore();

  const [profile,       setProfile]       = useState(null);
  const [articles,      setArticles]      = useState([]);
  const [friendship,    setFriendship]    = useState(null); // null | 'pending' | 'accepted' | 'blocked'
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('articles');
  const [liked,         setLiked]         = useState(false);
  const [likesCount,    setLikesCount]    = useState(0);
  const [newComment,    setNewComment]    = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  const isMe = me?._id === id;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProfile(),
      fetchArticles(),
      !isMe && checkFriendship(),
    ]).finally(() => setLoading(false));
  }, [id]);

  const fetchProfile = async () => {
    const { data } = await API.get(`/profile/${id}`);
    setProfile(data);
    setLiked(data.stats?.isLiked || false);
    setLikesCount(data.stats?.profileLikesCount || 0);
  };

  const fetchArticles = async () => {
    try {
      const { data } = isMe
        ? await API.get('/articles/my')
        : await API.get(`/articles/user/${id}`);
      setArticles(data || []);
    } catch (_) {}
  };

  const checkFriendship = async () => {
    try {
      const { data } = await API.get('/friends');
      const found = (data || []).find(f => f._id === id);
      if (found) setFriendship('accepted');
    } catch (_) {}
  };

  // ── Actions amis ──────────────────────────────────────────
  const handleAddFriend = async () => {
    try {
      await API.post(`/friends/request/${id}`);
      setFriendship('pending');
      toast.success('Demande envoyée !');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await API.delete(`/friends/remove/${id}`);
      setFriendship(null);
      toast.success('Ami retiré');
    } catch (_) { toast.error('Erreur'); }
  };

  const handleBlock = async () => {
    if (!window.confirm('Bloquer cet utilisateur ?')) return;
    try {
      await API.put(`/friends/block/${id}`);
      setFriendship('blocked');
      toast.success('Utilisateur bloqué');
    } catch (_) { toast.error('Erreur'); }
  };

  // ── Like profil ───────────────────────────────────────────
  const handleLike = async () => {
    try {
      const { data } = await API.post(`/profile/${id}/like`);
      setLiked(data.liked);
      setLikesCount(data.count);
    } catch (_) {}
  };

  // ── Commentaires ─────────────────────────────────────────
  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await API.post(`/profile/${id}/comments`, { content: newComment });
      setProfile(p => ({ ...p, comments: [data, ...(p.comments || [])] }));
      setNewComment('');
    } catch (_) {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (cid) => {
    try {
      await API.delete(`/profile/${id}/comments/${cid}`);
      setProfile(p => ({ ...p, comments: p.comments.filter(c => c._id !== cid) }));
    } catch (_) {}
  };

  // ── Profil sauvegardé ─────────────────────────────────────
  const handleSaved = (updated) => {
    setProfile(p => ({ ...p, ...updated }));
    if (isMe) setUser(updated);
  };

  if (loading) return <Layout><Spinner size="lg" /></Layout>;
  if (!profile) return null;

  const cover  = profile.coverPhoto ? imgSrc(profile.coverPhoto) : null;
  const avatar = avatarOf(profile);

  // Taux de recommandation (calculé localement)
  const totalViews = profile.stats?.totalViews || 0;
  const recRate    = likesCount > 0
    ? Math.min(99, Math.round((likesCount / Math.max(totalViews, likesCount)) * 100))
    : 0;

  return (
    <Layout>
      <div className="space-y-4 pb-8">

        {/* ══ HEADER ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Couverture */}
          <div className="relative h-44">
            {cover
              ? <img src={cover} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600" />
            }
            {profile.availability && profile.availability !== 'unavailable' && (
              <div className="absolute top-3 right-3">
                <AvailBadge status={profile.availability} />
              </div>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar + boutons */}
            <div className="flex items-end justify-between -mt-12 mb-3 flex-wrap gap-2">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img src={avatar} alt={profile.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                {profile.isOnline && (
                  <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap pb-1">
                {isMe ? (
                  <button onClick={() => setShowEdit(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                    <PencilIcon className="w-4 h-4" /> Modifier le profil
                  </button>
                ) : (
                  <>
                    {/* Like profil */}
                    <button onClick={handleLike}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition
                        ${liked
                          ? 'bg-rose-50 border-rose-300 text-rose-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500'}`}>
                      {liked
                        ? <HeartSolid className="w-4 h-4 text-rose-500" />
                        : <HeartIcon  className="w-4 h-4" />}
                      <span>{likesCount > 0 ? likesCount : ''}</span>
                    </button>

                    {/* Amis */}
                    {friendship === 'accepted' ? (
                      <>
                        <button onClick={handleRemoveFriend}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition">
                          <UserMinusIcon className="w-4 h-4" /> Ami
                        </button>
                        <button onClick={handleBlock}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 text-red-500 hover:border-red-300 transition">
                          <NoSymbolIcon className="w-4 h-4" /> Bloquer
                        </button>
                      </>
                    ) : friendship === 'pending' ? (
                      <button disabled
                        className="px-3 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-400">
                        Demande envoyée
                      </button>
                    ) : friendship !== 'blocked' ? (
                      <button onClick={handleAddFriend}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">
                        <UserPlusIcon className="w-4 h-4" /> Ajouter
                      </button>
                    ) : null}

                    {/* Recommander */}
                    <button onClick={() => setShowRecommend(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition">
                      <ShareIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Recommander</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Identité */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">{profile.fullName}</h1>
              <p className="text-gray-400 text-sm font-medium">@{profile.username}</p>

              {profile.jobTitle && (
                <p className="flex items-center gap-1.5 text-gray-700 font-semibold text-sm">
                  <BriefcaseIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  {profile.jobTitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" /> {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline">
                    <LinkIcon className="w-4 h-4" /> Portfolio
                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  </a>
                )}
              </div>

              <AvailBadge status={profile.availability} />

              {profile.bio && (
                <p className="text-gray-700 text-sm leading-relaxed mt-2">{profile.bio}</p>
              )}

              {profile.currentGoal && (
                <div className="flex items-start gap-2 mt-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                  <SparklesIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-700 font-medium">{profile.currentGoal}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ CHIFFRES CLÉS ════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📊 Chiffres clés</p>
          <div className="flex flex-wrap gap-2">
            {profile.yearsExp > 0     && <Pill value={`${profile.yearsExp}+`}             label="Ans d'exp."   color="blue"   />}
            {profile.totalProjects > 0 && <Pill value={`${profile.totalProjects}+`}        label="Projets"      color="violet" />}
            {totalViews > 0           && <Pill value={totalViews.toLocaleString()}         label="Vues"         color="green"  />}
            <Pill value={profile.stats?.totalSaved    || 0} label="Sauvegardes" color="amber" />
            <Pill value={likesCount}                         label="Likes profil" color="rose"  />
            {profile.stats?.totalArticles > 0 && (
              <Pill value={profile.stats.totalArticles} label="Articles" color="blue" />
            )}
            {recRate > 0 && (
              <div className="flex flex-col items-center px-4 py-3 rounded-2xl border
                bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 min-w-[72px]">
                <span className="text-xl font-black text-emerald-600">{recRate}%</span>
                <span className="text-[11px] font-medium text-emerald-600 mt-0.5 text-center">Recommandé</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ COMPÉTENCES & LANGUES ════════════════════════════ */}
        {((profile.skills?.length > 0) || (profile.languages?.length > 0)) && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            {profile.skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">🏷️ Compétences</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <span key={i} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.languages?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">🌍 Langues</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((l, i) => (
                    <span key={i} className="bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ RÉALISATIONS ═════════════════════════════════════ */}
        {profile.achievements?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🏆 Réalisations</p>
            <div className="space-y-2">
              {profile.achievements.map((a, i) => (
                <div key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200
                    hover:bg-blue-50/30 transition group">
                  <span className="text-2xl shrink-0 leading-none">{a.icon || '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                  </div>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noreferrer"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition text-blue-400 hover:text-blue-600">
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ONGLETS Articles / Recommandations ═══════════════ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'articles',      label: `📝 Articles (${profile.stats?.totalArticles || articles.length || 0})` },
              { id: 'commentaires',  label: `💬 Recommandations (${profile.comments?.length || 0})` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-3.5 text-sm font-bold transition border-b-2
                  ${tab === t.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Articles ─────────────────────────────────────── */}
          {tab === 'articles' && (
            <div className="divide-y divide-gray-50">
              {articles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-gray-400 text-sm font-medium">Aucun article publié</p>
                </div>
              ) : articles.map(a => (
                <Link key={a._id} to={`/articles/${a._id}`}
                  className="flex gap-4 px-4 py-3.5 hover:bg-gray-50 transition group">
                  {a.coverImage && (
                    <img src={imgSrc(a.coverImage)} alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate group-hover:text-blue-600 transition">
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR',
                        { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3.5 h-3.5" /> {a.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookmarkIcon className="w-3.5 h-3.5" /> {a.savedBy?.length || 0}
                      </span>
                      {a.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── Recommandations ──────────────────────────────── */}
          {tab === 'commentaires' && (
            <div className="p-4 space-y-4">
              {/* Zone de saisie si pas moi */}
              {!isMe && (
                <div className="flex gap-3">
                  <img src={avatarOf(me)} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                  <div className="flex-1 space-y-2">
                    <textarea value={newComment} rows={2}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder={`Laisser une recommandation pour ${profile.fullName}…`}
                      className="w-full bg-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none resize-none
                        focus:bg-gray-200 transition placeholder:text-gray-400" />
                    <button onClick={handleComment} disabled={!newComment.trim() || submitting}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold
                        hover:bg-blue-700 disabled:opacity-40 transition">
                      {submitting ? 'Envoi…' : '💬 Publier'}
                    </button>
                  </div>
                </div>
              )}

              {(!profile.comments || profile.comments.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-gray-400 text-sm font-medium">Aucune recommandation pour le moment</p>
                </div>
              ) : profile.comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <Link to={`/profile/${c.author?._id}`} className="shrink-0">
                    <img src={avatarOf(c.author)} className="w-9 h-9 rounded-full object-cover" alt="" />
                  </Link>
                  <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${c.author?._id}`}
                          className="font-bold text-sm text-gray-800 hover:text-blue-600 transition">
                          {c.author?.fullName}
                        </Link>
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR',
                            { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {(isMe || c.author?._id === me?._id) && (
                        <button onClick={() => handleDeleteComment(c._id)}
                          className="text-gray-300 hover:text-red-400 transition ml-2">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEdit      && <EditModal      profile={profile}  onClose={() => setShowEdit(false)}      onSaved={handleSaved} />}
      {showRecommend && <RecommendModal userId={id}        onClose={() => setShowRecommend(false)} />}
    </Layout>
  );
};

export default Profile;