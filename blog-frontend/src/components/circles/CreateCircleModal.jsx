import { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import API from '../../utils/axios';

const EMOJIS = ['⭕', '🔵', '🟣', '🟢', '🔴', '⭐', '💎', '🔥', '🌊', '🎯', '🚀', '🎨'];

const CreateCircleModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name:        '',
    description: '',
    type:        'private',
    tags:        '',
    emoji:       '⭕',
  });
  const [cover,   setCover]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCover(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return; }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name',        form.name);
      fd.append('description', form.description);
      fd.append('type',        form.type);
      fd.append('emoji',       form.emoji);
      fd.append('tags',        JSON.stringify(
        form.tags.split(',').map(t => t.trim()).filter(Boolean)
      ));
      if (cover) fd.append('coverImage', cover);

      const { data } = await API.post('/circles', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg text-gray-800">Créer un cercle</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Cover */}
          <div
            className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500 cursor-pointer group"
            onClick={() => document.getElementById('circle-cover').click()}
          >
            {preview && <img src={preview} className="w-full h-full object-cover" alt="cover" />}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
              <PhotoIcon className="w-8 h-8 text-white" />
              <span className="text-white text-sm ml-2 font-medium">Changer la photo</span>
            </div>
            <input id="circle-cover" type="file" accept="image/*" className="hidden" onChange={handleCover} />
          </div>

          {/* Emoji picker */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Emoji du cercle</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className={`w-9 h-9 text-xl rounded-lg flex items-center justify-center transition
                    ${form.emoji === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nom du cercle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Famille, Équipe dev, Amis proches..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="De quoi parle ce cercle ?"
              rows={2}
              maxLength={300}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Visibilité</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'public',  label: '🌍 Public',  desc: 'Visible par tous' },
                { value: 'private', label: '🔒 Privé',   desc: 'Sur invitation' },
                { value: 'secret',  label: '🕵️ Secret',  desc: 'Lien uniquement' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`p-2 rounded-lg border-2 text-left transition text-sm
                    ${form.type === opt.value
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Tags <span className="text-gray-400 font-normal">(séparés par des virgules)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="sport, technologie, cuisine, voyage..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Les tags servent à suggérer ton cercle aux bonnes personnes
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : `${form.emoji} Créer le cercle`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCircleModal;