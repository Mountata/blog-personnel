import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import {
  ArrowLeftIcon, LinkIcon, ClipboardDocumentIcon,
  ArrowPathIcon, CheckIcon, XMarkIcon,
  TrashIcon, PhotoIcon,
} from '@heroicons/react/24/outline';

// Suppression de useAuthStore car user n'est pas utilisé ici
const avatarUrl = (u) => u?.avatar
  ? `http://localhost:5000${u.avatar}`
  : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

const EMOJIS = ['⭕','🔵','🟣','🟢','🔴','⭐','💎','🔥','🌊','🎯','🚀','🎨'];

const CircleSettings = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [circle,       setCircle]       = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [activeTab,    setActiveTab]    = useState('general');

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [type,        setType]        = useState('private');
  const [tags,        setTags]        = useState('');
  const [emoji,       setEmoji]       = useState('⭕');
  const [cover,       setCover]       = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [token,       setToken]       = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/circles/${id}`);

      if (!['creator', 'moderator'].includes(data.myRole)) {
        navigate(`/circles/${id}`);
        return;
      }

      setCircle(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setType(data.type || 'private');
      setTags(data.tags?.join(', ') || '');
      setEmoji(data.emoji || '⭕');
      setToken(data.inviteToken || '');

      const { data: requests } = await API.get(`/circles/${id}/join-requests`);
      setJoinRequests(requests || []);
    } catch(e) {
      console.error(e);
      navigate(`/circles/${id}`);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',        name);
      fd.append('description', description);
      fd.append('type',        type);
      fd.append('emoji',       emoji);
      fd.append('tags',        JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      if (cover) fd.append('coverImage', cover);

      await API.put(`/circles/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Paramètres sauvegardés !');
      fetchAll();
    } catch(e) {
      alert(e.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const inviteLink = `${window.location.origin}/circles/invite/${token}`;
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateToken = async () => {
    if (!window.confirm("Générer un nouveau lien ? L'ancien ne fonctionnera plus.")) return;
    setTokenLoading(true);
    try {
      const { data } = await API.post(`/circles/${id}/regenerate-token`);
      setToken(data.inviteToken);
    } catch(e) { console.error(e); }
    finally { setTokenLoading(false); }
  };

  const acceptRequest = async (userId) => {
    try {
      await API.put(`/circles/${id}/join-requests/${userId}/accept`);
      setJoinRequests(prev => prev.filter(r => r.user._id !== userId));
      setCircle(prev => ({ ...prev, memberCount: (prev.memberCount || 1) + 1 }));
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const rejectRequest = async (userId) => {
    try {
      await API.delete(`/circles/${id}/join-requests/${userId}/reject`);
      setJoinRequests(prev => prev.filter(r => r.user._id !== userId));
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer définitivement le cercle "${circle?.name}" ? Cette action est irréversible.`)) return;
    try {
      await API.delete(`/circles/${id}`);
      navigate('/circles');
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  if (loading) return <Layout><Spinner size="lg" /></Layout>;
  if (!circle) return null;

  const isCreator = circle.myRole === 'creator';
  const tabs = [
    { id: 'general',  label: '⚙️ Général'       },
    { id: 'invite',   label: '🔗 Lien d\'invitation' },
    { id: 'requests', label: `📥 Demandes ${joinRequests.length > 0 ? `(${joinRequests.length})` : ''}` },
    ...(isCreator ? [{ id: 'danger', label: '🗑️ Danger' }] : []),
  ];

  return (
    <Layout>
      <div className="space-y-4">

        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
          <button onClick={() => navigate(`/circles/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-800">{circle.emoji} Paramètres — {circle.name}</h1>
            <p className="text-xs text-gray-500">{circle.memberCount} membre{circle.memberCount > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2
                  ${activeTab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">

            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Photo de couverture</label>
                  <div className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500 cursor-pointer group"
                    onClick={() => document.getElementById('settings-cover').click()}>
                    {(preview || circle.coverImage) && (
                      <img src={preview || `http://localhost:5000${circle.coverImage}`}
                        className="w-full h-full object-cover" alt="" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
                      <PhotoIcon className="w-7 h-7 text-white" />
                      <span className="text-white text-sm ml-2">Changer</span>
                    </div>
                    <input id="settings-cover" type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files[0]; if(f){ setCover(f); setPreview(URL.createObjectURL(f)); } }} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setEmoji(e)}
                        className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition
                          ${emoji === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Nom du cercle</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={50}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={300}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>

                {isCreator && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Visibilité</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: 'public',  l: '🌍 Public',  d: 'Visible par tous'  },
                        { v: 'private', l: '🔒 Privé',   d: 'Sur invitation'    },
                        { v: 'secret',  l: '🕵️ Secret',  d: 'Lien uniquement'   },
                      ].map(opt => (
                        <button key={opt.v} onClick={() => setType(opt.v)}
                          className={`p-2 rounded-lg border-2 text-left transition
                            ${type === opt.v ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="font-medium text-sm">{opt.l}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{opt.d}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">
                    Tags <span className="text-gray-400 font-normal">(séparés par des virgules)</span>
                  </label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                    placeholder="sport, tech, cuisine..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <button onClick={handleSave} disabled={saving || !name.trim()}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                  {saving ? 'Sauvegarde...' : '💾 Sauvegarder les modifications'}
                </button>
              </div>
            )}

            {activeTab === 'invite' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                  <LinkIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-blue-800">Lien d'invitation</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Partagez ce lien pour inviter des personnes directement dans le cercle.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-xl p-4 font-mono text-xs text-gray-700 break-all">
                  {inviteLink}
                </div>

                <div className="flex gap-3">
                  <button onClick={copyLink}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition
                      ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {copied
                      ? <><CheckIcon className="w-4 h-4" /> Copié !</>
                      : <><ClipboardDocumentIcon className="w-4 h-4" /> Copier le lien</>
                    }
                  </button>
                  {isCreator && (
                    <button onClick={regenerateToken} disabled={tokenLoading}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">
                      <ArrowPathIcon className={`w-4 h-4 ${tokenLoading ? 'animate-spin' : ''}`} />
                      Nouveau lien
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  ⚠️ Si vous générez un nouveau lien, l'ancien ne fonctionnera plus.
                </p>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-3">
                {joinRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="font-semibold text-gray-700">Aucune demande en attente</p>
                    <p className="text-sm text-gray-400 mt-1">Les demandes d'adhésion apparaîtront ici.</p>
                  </div>
                ) : (
                  joinRequests.map(req => (
                    <div key={req._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <img src={avatarUrl(req.user)} className="w-11 h-11 rounded-full object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800">{req.user?.fullName}</p>
                        <p className="text-xs text-gray-500">@{req.user?.username}</p>
                        {req.user?.bio && <p className="text-xs text-gray-400 mt-0.5 truncate">{req.user.bio}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => acceptRequest(req.user._id)}
                          className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition">
                          <CheckIcon className="w-3.5 h-3.5" /> Accepter
                        </button>
                        <button onClick={() => rejectRequest(req.user._id)}
                          className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200 transition">
                          <XMarkIcon className="w-3.5 h-3.5" /> Refuser
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'danger' && isCreator && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                    <TrashIcon className="w-5 h-5" /> Supprimer le cercle
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    Cette action est <strong>irréversible</strong>. Tous les posts, membres et données seront supprimés définitivement.
                  </p>
                  <button onClick={handleDelete}
                    className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition">
                    Supprimer définitivement "{circle.name}"
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CircleSettings;