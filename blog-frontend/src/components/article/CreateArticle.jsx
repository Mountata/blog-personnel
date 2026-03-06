import { useState } from 'react';
import { 
  PhotoIcon,
  TagIcon,
  LockClosedIcon,
  GlobeAltIcon,
  SparklesIcon,
  XMarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import API from '../../utils/axios';
import toast from 'react-hot-toast';

const AIChat = ({ onClose, onInsert }) => {
  const [messages, setMessages] = useState([
    { 
      text: "Bonjour ! 👋 Je suis ton assistant IA. Je peux t'aider à écrire, améliorer ou structurer ton article. Que veux-tu faire ?", 
      isUser: false
    }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { text: input, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await API.post('/ai/chat', {
        message: input,
        history: messages
      });
      setMessages(prev => [...prev, { 
        text: data.reply,
        isUser: false
      }]);
    } catch (_e) {
      // ✅ _e : error non utilisée, on affiche un message fixe
      setMessages(prev => [...prev, { 
        text: "Désolé, une erreur s'est produite 😕", 
        isUser: false 
      }]);
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
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              msg.isUser 
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {!msg.isUser && index > 0 && (
                <button
                  onClick={() => onInsert(msg.text)}
                  className="mt-1 text-xs text-blue-500 hover:underline font-semibold"
                >
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
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Demande quelque chose à l'IA..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

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

  const getAvatar = () => user?.avatar
    ? `http://localhost:5000${user.avatar}`
    : `https://ui-avatars.com/api/?name=${user?.fullName}&background=1877f2&color=fff`;

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeImage = (index) => {
    setImages(prev   => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const generateWithAI = async () => {
    if (!title.trim()) {
      toast.error("Entre un titre d'abord !");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await API.post('/ai/generate', { title });
      setContent(data.content);
      setSuggestions(data.suggestions || []);
      setShowStyles(true);
      toast.success("✨ Article généré par l'IA !");
    } catch (error) {
      // ✅ error utilisé ici → pas d'avertissement
      toast.error('Erreur IA : ' + error.message);
    }
    setAiLoading(false);
  };

  const improveWithStyle = async (style, styleLabel) => {
    if (!content.trim()) {
      toast.error("Entre du contenu d'abord !");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await API.post('/ai/improve', { content, style });
      setContent(data.content);
      setAlternatives(data.alternatives || []);
      toast.success(`✨ Style ${styleLabel} appliqué !`);
    } catch (_e) {
      // ✅ _e : error non utilisée
      toast.error('Erreur IA');
    }
    setAiLoading(false);
  };

  const improveGeneral = async () => {
    if (!content.trim()) {
      toast.error("Entre du contenu d'abord !");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await API.post('/ai/improve', { content });
      setContent(data.content);
      setAlternatives(data.alternatives || []);
      toast.success('✨ Texte amélioré !');
    } catch (_e) {
      // ✅ _e : error non utilisée
      toast.error('Erreur IA');
    }
    setAiLoading(false);
  };

  const suggestTags = async () => {
    setTagsLoading(true);
    try {
      const { data } = await API.post('/ai/tags', { title, content });
      setTags(data.tags.join(', '));
      toast.success('✨ Tags suggérés !');
    } catch (_e) {
      // ✅ _e : error non utilisée
      toast.error('Le service IA est temporairement indisponible. Réessayez dans quelques minutes.');
    }
    setTagsLoading(false);
  };

  const handleSubmit = async (draft = false) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Titre et contenu obligatoires');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title',   title);
      formData.append('content', content);
      formData.append('tags', JSON.stringify(
        tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      ));
      formData.append('isPublic',      isPublic.toString());
      formData.append('allowComments', allowComments.toString());
      formData.append('isDraft',       draft.toString());
      images.forEach(img => formData.append('images', img));

      const { data } = await API.post('/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(draft ? '💾 Brouillon sauvegardé !' : '🎉 Article publié !');
      if (onArticleCreated) onArticleCreated(data);

      setTitle('');
      setContent('');
      setTags('');
      setImages([]);
      setPreviews([]);
      setSuggestions([]);
      setAlternatives([]);
      setShowStyles(false);
      setIsOpen(false);
    } catch (error) {
      // ✅ error utilisé ici → pas d'avertissement
      toast.error(error.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow mb-4 p-4">
        {!isOpen ? (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <img src={getAvatar()} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-500 hover:bg-gray-200 transition text-sm">
              Quoi de neuf, {user?.fullName?.split(' ')[0]} ? ✍️
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg">✍️ Créer un article</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="💡 Titre de ton article..."
              className="w-full border-b-2 border-gray-200 pb-2 mb-4 outline-none font-semibold text-gray-800 text-lg focus:border-primary transition"
            />

            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={generateWithAI}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                {aiLoading ? '⏳ Génération...' : '✨ Générer avec IA'}
              </button>
              <button
                onClick={improveGeneral}
                disabled={aiLoading || !content}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                {aiLoading ? '⏳ Amélioration...' : '🔧 Améliorer'}
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                💬 Chat IA
              </button>
            </div>

            {showStyles && suggestions.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm font-semibold text-purple-700 mb-2">🎨 Choisir un style :</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(style => (
                    <button
                      key={style.id}
                      onClick={() => improveWithStyle(style.id, style.label)}
                      disabled={aiLoading}
                      className="text-xs bg-white border border-purple-300 text-purple-700 font-semibold px-3 py-1.5 rounded-full hover:bg-purple-100 transition disabled:opacity-50"
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="✍️ Écrivez votre article ici... ou utilisez l'IA !"
              className="w-full outline-none text-gray-700 text-sm resize-none min-h-40 mb-3"
              rows={6}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} className="w-full h-24 object-cover rounded-lg" alt="" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 border-t pt-3">
              <TagIcon className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Tags séparés par des virgules..."
                className="flex-1 outline-none text-sm text-gray-600"
              />
              <button
                onClick={suggestTags}
                disabled={tagsLoading}
                className="flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline disabled:opacity-50 shrink-0"
              >
                <SparklesIcon className="w-3 h-3" />
                {tagsLoading ? '...' : 'IA'}
              </button>
            </div>

            <hr className="mb-4" />

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-green-600 font-semibold cursor-pointer hover:bg-green-50 px-3 py-1.5 rounded-lg transition">
                <PhotoIcon className="w-5 h-5" />
                📷 Photos
                <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
              </label>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg transition
                  ${isPublic ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100'}`}
              >
                {isPublic
                  ? <><GlobeAltIcon   className="w-5 h-5" /> 🌍 Public</>
                  : <><LockClosedIcon className="w-5 h-5" /> 🔒 Privé</>
                }
              </button>
              <button
                onClick={() => setAllowComments(!allowComments)}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition
                  ${allowComments ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100'}`}
              >
                {allowComments ? '💬 Commentaires ON' : '🚫 Commentaires OFF'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-50"
              >
                💾 Brouillon
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading || !title.trim() || !content.trim()}
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                {loading ? '⏳ Publication...' : '🚀 Publier'}
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
            toast.success("Texte inséré dans l'article !");
          }}
        />
      )}
    </>
  );
};

export default CreateArticle;