import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChatIcon, ShareIcon, BookmarkIcon,
  DotsIcon, LockIcon, GlobeIcon,
  TrashIcon, EditIcon, EyeIcon,
  BookmarkSolidIcon,
} from '../../Icons';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/timeAgo';
import PhotoGrid from './PhotoGrid';
import Reactions from './Reactions';
import CommentSection from './CommentSection';
import API from '../../utils/axios';

const getEmbedUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
};

const VideoPlayer = ({ article }) => {
  if (!article) return null;
  if (article.videoType === 'upload' && article.video) {
    return (
      <div style={{ background: '#000', width: '100%', aspectRatio: '16/9' }}>
        <video src={`http://localhost:5000${article.video}`} controls
          style={{ width: '100%', height: '100%', maxHeight: 360, display: 'block' }}
          preload="metadata" />
      </div>
    );
  }
  if (article.videoType === 'url' && article.videoUrl) {
    const embed = getEmbedUrl(article.videoUrl);
    if (!embed) return null;
    return (
      <div style={{ background: '#000', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
        <iframe src={embed}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title="Vidéo article" />
      </div>
    );
  }
  return null;
};

const ArticleCard = ({ article, onDelete }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const cardRef  = useRef(null);
  const viewTracked = useRef(false); // ✅ évite de tracker plusieurs fois

  if (!article || !article._id) return null;

  const [showComments,  setShowComments]  = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [isSaved,       setIsSaved]       = useState(
    Array.isArray(article.savedBy)
      ? article.savedBy.some(id => id?.toString() === user?._id?.toString())
      : false
  );
  const [commentsCount, setCommentsCount] = useState(article.commentsCount || 0);
  const [shares,        setShares]        = useState(article.shares || 0);
  const [showFullText,  setShowFullText]  = useState(false);
  const [views,         setViews]         = useState(article.views || 0);
  const [savedCount,    setSavedCount]    = useState(
    Array.isArray(article.savedBy) ? article.savedBy.length : 0
  );

  const isOwner = article.author?._id?.toString() === user?._id?.toString();

  // ✅ Tracker la vue en temps réel dès que la card est visible
  useEffect(() => {
    if (viewTracked.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !viewTracked.current) {
          viewTracked.current = true;
          observer.disconnect();
          try {
            const { data } = await API.post(`/articles/${article._id}/view`);
            if (data.views !== undefined) setViews(data.views);
          } catch { /* silent */ }
        }
      },
      { threshold: 0.5 } // visible à 50%
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [article._id]);

  const getAvatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  const goToArticle = () => navigate(`/articles/${article._id}`);

  const handleSave = async () => {
    try {
      const { data } = await API.post(`/articles/${article._id}/save`);
      setIsSaved(s => !s);
      if (data.count !== undefined) setSavedCount(data.count);
    } catch(e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/articles/${article._id}`);
      setShares(s => s + 1);
      alert('Lien copié !');
    } catch(e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet article ?')) return;
    try {
      await API.delete(`/articles/${article._id}`);
      if (onDelete) onDelete(article._id);
    } catch(e) { console.error(e); }
  };

  const truncatedContent = article.content?.length > 300 && !showFullText
    ? article.content.substring(0, 300) + '...'
    : article.content;

  return (
    <>
      <div ref={cardRef} className="bg-white rounded-xl shadow mb-4 overflow-visible relative">
        <div className="flex">

          {/* ── CORPS ── */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${article.author?._id}`}>
                  <img src={getAvatar(article.author)}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100" alt="" />
                </Link>
                <div>
                  <Link to={`/profile/${article.author?._id}`}
                    className="font-semibold text-gray-800 hover:underline text-sm block leading-tight">
                    {article.author?.fullName}
                  </Link>
                  {article.author?.jobTitle && (
                    <p className="text-xs text-blue-500 font-medium leading-tight">
                      {article.author.jobTitle}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span>{timeAgo(article.createdAt)}</span>
                    <span>·</span>
                    {article.isPublic
                      ? <GlobeIcon className="w-3 h-3" />
                      : <LockIcon  className="w-3 h-3" />}
                  </div>
                </div>
              </div>

              {/* Menu dots */}
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition">
                  <DotsIcon className="w-5 h-5 text-gray-500" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border p-1 z-30">
                    <button onClick={() => { goToArticle(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg text-sm text-gray-700">
                      <EyeIcon className="w-5 h-5" /> Voir l'article
                    </button>
                    {isOwner && (
                      <>
                        <Link to={`/articles/${article._id}/edit`} onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg text-sm text-gray-700">
                          <EditIcon className="w-5 h-5" /> Modifier
                        </Link>
                        <button onClick={() => { handleDelete(); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-red-50 rounded-lg text-sm text-red-500">
                          <TrashIcon className="w-5 h-5" /> Supprimer
                        </button>
                      </>
                    )}
                    <button onClick={() => { handleSave(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg text-sm text-gray-700">
                      <BookmarkIcon className="w-5 h-5" />
                      {isSaved ? 'Retirer des sauvegardes' : 'Sauvegarder'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contenu texte */}
            <div className="px-4 pb-3">
              <button onClick={goToArticle} className="text-left w-full group">
                <h2 className="font-bold text-gray-800 text-base mb-1 group-hover:text-blue-600 transition leading-snug">
                  {article.title}
                </h2>
              </button>
              <p className="text-gray-600 text-sm leading-relaxed">
                {truncatedContent}
                {article.content?.length > 300 && (
                  <button onClick={() => setShowFullText(!showFullText)}
                    className="text-blue-600 font-semibold ml-1 hover:underline">
                    {showFullText ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
              </p>
              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {article.tags.map(tag => (
                    <span key={tag}
                      className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            {article.images?.length > 0 && (
              <div onClick={goToArticle} className="cursor-pointer">
                <PhotoGrid images={article.images} />
              </div>
            )}

            {/* Vidéo */}
            <VideoPlayer article={article} />

            {/* ✅ Stats bar */}
            <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
              <div className="flex items-center gap-3">
                {/* Vues */}
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>{views.toLocaleString()}</span>
                </span>
                {/* Commentaires */}
                {article.allowComments && (
                  <button onClick={() => setShowComments(p => !p)}
                    className="flex items-center gap-1 hover:text-blue-500 transition">
                    <ChatIcon className="w-3.5 h-3.5" />
                    <span>{commentsCount}</span>
                  </button>
                )}
                {/* Sauvegardes */}
                <span className="flex items-center gap-1">
                  <BookmarkIcon className="w-3.5 h-3.5" />
                  <span>{savedCount}</span>
                </span>
              </div>
              {/* Partages */}
              <span className="flex items-center gap-1">
                <ShareIcon className="w-3.5 h-3.5" />
                <span>{shares}</span>
              </span>
            </div>

          </div>{/* fin CORPS */}

          {/* ── SIDEBAR DROITE ── */}
          <div className="w-14 border-l border-gray-100 bg-gray-50 flex flex-col items-center py-3 gap-1 shrink-0 rounded-r-xl">
            <Reactions articleId={article._id} vertical={true} />

            {article.allowComments && (
              <button onClick={() => setShowComments(p => !p)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white transition w-11
                  ${showComments ? 'text-blue-600 bg-white' : 'text-gray-500'}`}>
                <ChatIcon className="w-5 h-5" />
                <span className="text-xs font-medium">
                  {commentsCount > 0 ? commentsCount : ''}
                </span>
              </button>
            )}

            <button onClick={handleShare}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white transition text-gray-500 w-11">
              <ShareIcon className="w-5 h-5" />
              <span className="text-xs font-medium">
                {shares > 0 ? shares : ''}
              </span>
            </button>

            <button onClick={handleSave}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white transition w-11
                ${isSaved ? 'text-blue-600' : 'text-gray-500'}`}>
              {isSaved
                ? <BookmarkSolidIcon className="w-5 h-5" />
                : <BookmarkIcon      className="w-5 h-5" />}
              <span className="text-xs font-medium">
                {savedCount > 0 ? savedCount : ''}
              </span>
            </button>
          </div>

        </div>{/* fin flex */}
      </div>{/* fin card */}

      {showComments && article.allowComments && (
        <CommentSection
          articleId={article._id}
          cardRef={cardRef}
          onClose={() => setShowComments(false)}
          onCountChange={(delta) => setCommentsCount(c => Math.max(0, c + delta))}
        />
      )}
    </>
  );
};

export default ArticleCard;