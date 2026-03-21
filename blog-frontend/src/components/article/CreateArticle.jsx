import { useState } from 'react';
import {
  PhotoIcon, TagIcon, LockClosedIcon, GlobeAltIcon,
  SparklesIcon, XMarkIcon, ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import API from '../../utils/axios';
import toast from 'react-hot-toast';

/* ── Helper embed ── */
const getEmbedUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

/* ── AIChat ── */
const AIChat = ({ onClose, onInsert }) => {
  const [messages, setMessages] = useState([{
    text: "Bonjour ! 👋 Je suis ton assistant IA. Je peux t'aider à écrire, améliorer ou structurer ton article. Que veux-tu faire ?",
    isUser: false,
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { text: input, isUser: true }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await API.post('/ai/chat', { message: input, history: messages });
      setMessages(prev => [...prev, { text: data.reply, isUser: false }]);
    } catch {
      setMessages(prev => [...prev, { text: "Désolé, une erreur s'est produite 😕", isUser: false }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col z-50">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-white" />
          <div>
            <p className="text-white font-bold text-sm">Assistant IA</p>
            <p className="text-purple-200 text-xs">🟢 En ligne</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-purple-200 transition">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              msg.isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {!msg.isUser && i > 0 && (
                <button onClick={() => onInsert(msg.text)} className="mt-1 text-xs text-blue-500 hover:underline font-semibold">
                  + Insérer dans l'article
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                {[0, 100, 200].map(d => (
                  <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t flex items-center gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Demande quelque chose à l'IA..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" disabled={loading} />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/* ── CreateArticle ── */
const CreateArticle = ({ onArticleCreated }) => {
  const { user } = useAuthStore();

  const [isOpen,        setIsOpen]        = useState(false);
  const [title,         setTitle]         = useState('');
  const [content,       setContent]       = useState('');
  const [tags,          setTags]          = useState('');
  const [isPublic,      setIsPublic]      = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [images,        setImages]        = useState([]);
  const [previews,      setPreviews]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [tagsLoading,   setTagsLoading]   = useState(false);
  const [showChat,      setShowChat]      = useState(false);
  const [showStyles,    setShowStyles]    = useState(false);
  const [suggestions,   setSuggestions]   = useState([]);
  const [alternatives,  setAlternatives]  = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ✅ States vidéo
  const [videoMode,    setVideoMode]    = useState('none'); // 'none' | 'upload' | 'url'
  const [videoFile,    setVideoFile]    = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoUrl,     setVideoUrl]     = useState('');

  const getAvatar = () => user?.avatar
    ? `http://localhost:5000${user.avatar}`
    : `https://ui-avatars.com/api/?name=${user?.fullName}&background=1877f2&color=fff`;

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages(prev   => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleVideoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error('Vidéo trop lourde (max 200 MB)'); return; }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setVideoMode('upload');
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setVideoUrl('');
    setVideoMode('none');
  };

  const generateWithAI = async () => {
    if (!title.trim()) { toast.error("Entre un titre d'abord !"); return; }
    setAiLoading(true);
    try {
      const { data } = await API.post('/ai/generate', { title });
      setContent(data.content);
      setSuggestions(data.suggestions || []);
      setShowStyles(true);
      toast.success("✨ Article généré par l'IA !");
    } catch (e) { toast.error('Erreur IA : ' + e.message); }
    setAiLoading(false);
  };

  const improveWithStyle = async (style, styleLabel) => {
    if (!content.trim()) { toast.error("Entre du contenu d'abord !"); return; }
    setAiLoading(true);
    try {
      const { data } = await API.post('/ai/improve', { content, style });
      setContent(data.content);
      setAlternatives(data.alternatives || []);
      toast.success(`✨ Style ${styleLabel} appliqué !`);
    } catch { toast.error('Erreur IA'); }
    setAiLoading(false);
  };

  const improveGeneral = async () => {
    if (!content.trim()) { toast.error("Entre du contenu d'abord !"); return; }
    setAiLoading(true);
    try {
      const { data } = await API.post('/ai/improve', { content });
      setContent(data.content);
      setAlternatives(data.alternatives || []);
      toast.success('✨ Texte amélioré !');
    } catch { toast.error('Erreur IA'); }
    setAiLoading(false);
  };

  const suggestTags = async () => {
    setTagsLoading(true);
    try {
      const { data } = await API.post('/ai/tags', { title, content });
      setTags(data.tags.join(', '));
      toast.success('✨ Tags suggérés !');
    } catch { toast.error('Service IA indisponible. Réessayez.'); }
    setTagsLoading(false);
  };

  const handleSubmit = async (draft = false) => {
    if (!title.trim() || !content.trim()) { toast.error('Titre et contenu obligatoires'); return; }
    setLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title',         title);
      formData.append('content',       content);
      formData.append('tags',          JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      formData.append('isPublic',      isPublic.toString());
      formData.append('allowComments', allowComments.toString());
      formData.append('isDraft',       draft.toString());

      images.forEach(img => formData.append('images', img));

      // ✅ Vidéo
      if (videoMode === 'upload' && videoFile) {
        formData.append('video', videoFile);
      } else if (videoMode === 'url' && videoUrl.trim()) {
        formData.append('videoUrl', videoUrl.trim());
      }

      const { data } = await API.post('/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });

      toast.success(draft ? '💾 Brouillon sauvegardé !' : '🎉 Article publié !');
      if (onArticleCreated) onArticleCreated(data);

      // Reset
      setTitle(''); setContent(''); setTags('');
      setImages([]); setPreviews([]);
      setSuggestions([]); setAlternatives([]);
      setShowStyles(false);
      removeVideo();
      setIsOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
    setLoading(false);
    setUploadProgress(0);
  };

  const embedUrl = videoMode === 'url' ? getEmbedUrl(videoUrl) : null;

  return (
    <>
      <div className="bg-white rounded-xl shadow mb-4 p-4">
        {!isOpen ? (
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsOpen(true)}>
            <img src={getAvatar()} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-500 hover:bg-gray-200 transition text-sm">
              Quoi de neuf, {user?.fullName?.split(' ')[0]} ? ✍️
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg">✍️ Créer un article</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Titre */}
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="💡 Titre de ton article..."
              className="w-full border-b-2 border-gray-200 pb-2 mb-4 outline-none font-semibold text-gray-800 text-lg focus:border-blue-500 transition" />

            {/* Boutons IA */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={generateWithAI} disabled={aiLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50">
                <SparklesIcon className="w-4 h-4" />
                {aiLoading ? '⏳ Génération...' : '✨ Générer avec IA'}
              </button>
              <button onClick={improveGeneral} disabled={aiLoading || !content}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50">
                <SparklesIcon className="w-4 h-4" />
                {aiLoading ? '⏳ Amélioration...' : '🔧 Améliorer'}
              </button>
              <button onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                💬 Chat IA
              </button>
            </div>

            {/* Styles IA */}
            {showStyles && suggestions.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm font-semibold text-purple-700 mb-2">🎨 Choisir un style :</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(style => (
                    <button key={style.id} onClick={() => improveWithStyle(style.id, style.label)}
                      disabled={aiLoading}
                      className="text-xs bg-white border border-purple-300 text-purple-700 font-semibold px-3 py-1.5 rounded-full hover:bg-purple-100 transition disabled:opacity-50">
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives IA */}
            {alternatives.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-blue-700 mb-2">💡 Alternatives :</p>
                {alternatives.map((alt, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <p className="text-xs font-semibold text-blue-600 mb-1">{alt.label}</p>
                    <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border line-clamp-2">{alt.text}</p>
                    <button onClick={() => setContent(alt.text)} className="text-xs text-blue-500 font-semibold hover:underline mt-1">
                      Utiliser ce texte →
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Contenu */}
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="✍️ Écrivez votre article ici... ou utilisez l'IA !"
              className="w-full outline-none text-gray-700 text-sm resize-none min-h-40 mb-3" rows={6} />

            {/* Aperçu images */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} className="w-full h-24 object-cover rounded-lg" alt="" />
                    <button onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ✅ Section vidéo */}
            {videoMode === 'none' ? (
              <div className="flex gap-2 mb-3">
                <button onClick={() => setVideoMode('upload')}
                  className="flex items-center gap-2 text-sm text-purple-600 font-semibold bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition">
                  🎬 Uploader une vidéo
                </button>
                <button onClick={() => setVideoMode('url')}
                  className="flex items-center gap-2 text-sm text-red-500 font-semibold bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition">
                  ▶️ Lien YouTube / Vimeo
                </button>
              </div>
            ) : (
              <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {videoMode === 'upload' ? '🎬 Vidéo uploadée' : '▶️ Lien vidéo'}
                  </span>
                  <button onClick={removeVideo} className="text-xs text-red-400 hover:text-red-600 font-semibold">
                    ✕ Supprimer
                  </button>
                </div>

                {videoMode === 'upload' && (
                  videoPreview ? (
                    <video src={videoPreview} controls className="w-full rounded-lg max-h-52 bg-black" />
                  ) : (
                    <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition">
                      <span className="text-2xl mb-1">🎬</span>
                      <span className="text-xs text-purple-600 font-semibold">Cliquer pour choisir une vidéo</span>
                      <span className="text-xs text-gray-400">MP4, MOV, AVI, MKV — max 200 MB</span>
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
                    </label>
                  )
                )}

                {videoMode === 'url' && (
                  <div>
                    <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition mb-2" />
                    {embedUrl && (
                      <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                        <iframe src={embedUrl} className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen title="Aperçu vidéo" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2 mb-4 border-t pt-3">
              <TagIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="Tags séparés par des virgules..."
                className="flex-1 outline-none text-sm text-gray-600" />
              <button onClick={suggestTags} disabled={tagsLoading}
                className="flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline disabled:opacity-50 shrink-0">
                <SparklesIcon className="w-3 h-3" />
                {tagsLoading ? '...' : 'IA'}
              </button>
            </div>

            <hr className="mb-4" />

            {/* Options */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-green-600 font-semibold cursor-pointer hover:bg-green-50 px-3 py-1.5 rounded-lg transition">
                <PhotoIcon className="w-5 h-5" /> 📷 Photos
                <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
              </label>
              <button onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition
                  ${isPublic ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100'}`}>
                {isPublic
                  ? <><GlobeAltIcon className="w-5 h-5" /> 🌍 Public</>
                  : <><LockClosedIcon className="w-5 h-5" /> 🔒 Privé</>}
              </button>
              <button onClick={() => setAllowComments(!allowComments)}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition
                  ${allowComments ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100'}`}>
                {allowComments ? '💬 Commentaires ON' : '🚫 Commentaires OFF'}
              </button>
            </div>

            {/* Barre de progression */}
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Upload en cours…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => handleSubmit(true)} disabled={loading}
                className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-50">
                💾 Brouillon
              </button>
              <button onClick={() => handleSubmit(false)} disabled={loading || !title.trim() || !content.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50">
                {loading
                  ? `⏳ ${uploadProgress > 0 ? uploadProgress + '%' : 'Publication...'}`
                  : '🚀 Publier'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showChat && (
        <AIChat
          onClose={() => setShowChat(false)}
          onInsert={(text) => {
            setContent(prev => prev + '\n\n' + text);
            toast.success("Texte inséré !");
          }}
        />
      )}
    </>
  );
};

export default CreateArticle;