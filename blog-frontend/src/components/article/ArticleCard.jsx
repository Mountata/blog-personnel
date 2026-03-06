import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChatIcon, ShareIcon, BookmarkIcon,
  DotsIcon, LockIcon,
  GlobeIcon, TrashIcon, EditIcon, EyeIcon,
  BookmarkSolidIcon,
} from '../../Icons';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/timeAgo';
import PhotoGrid from './PhotoGrid';
import Reactions from './Reactions';
import CommentSection from './CommentSection';
import API from '../../utils/axios';

const ArticleCard = ({ article, onDelete }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Guard : ne pas crasher si article est undefined
  if (!article || !article._id) return null;

  const [showComments, setShowComments] = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [isSaved,      setIsSaved]      = useState(article.savedBy?.includes(user?._id) ?? false);
  const [shares,       setShares]       = useState(article.shares || 0);
  const [showFullText, setShowFullText] = useState(false);
  const [views,        setViews]        = useState(article.views || 0);

  const isOwner = article.author?._id === user?._id;

  const getAvatar = (u) => u?.avatar
    ? `http://localhost:5000${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=1877f2&color=fff`;

  const goToArticle = () => {
    setViews(v => v + 1);
    navigate(`/articles/${article._id}`);
  };

  const handleSave = async () => {
    try {
      await API.post(`/articles/${article._id}/save`);
      setIsSaved(s => !s);
    } catch(e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      await API.post(`/articles/${article._id}/share`);
      setShares(s => s + 1);
      await navigator.clipboard.writeText(`${window.location.origin}/articles/${article._id}`);
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
    <div className="bg-white rounded-xl shadow mb-4 overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────── */}
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
              <p className="text-xs text-blue-500 font-medium leading-tight">{article.author.jobTitle}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <span>{timeAgo(article.createdAt)}</span>
              <span>·</span>
              {article.isPublic
                ? <GlobeIcon  className="w-3 h-3" />
                : <LockIcon className="w-3 h-3" />
              }
            </div>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition">
            <DotsIcon className="w-5 h-5 text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border p-1 z-10">
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

      {/* ── CONTENU ────────────────────────────────────────── */}
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
              <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {article.images?.length > 0 && (
        <div onClick={goToArticle} className="cursor-pointer">
          <PhotoGrid images={article.images} />
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
        <button onClick={goToArticle}
          className="flex items-center gap-1 hover:text-blue-500 transition">
          <EyeIcon className="w-4 h-4" />
          <span className="font-medium">{views.toLocaleString()} vue{views > 1 ? 's' : ''}</span>
        </button>
        <div className="flex items-center gap-3">
          {article.allowComments && (
            <button onClick={() => setShowComments(!showComments)} className="hover:text-blue-500 transition">
              {article.commentsCount || 0} commentaire{(article.commentsCount || 0) > 1 ? 's' : ''}
            </button>
          )}
          <span>{shares} partage{shares > 1 ? 's' : ''}</span>
        </div>
      </div>

      <hr className="mx-4 border-gray-100" />

      <div className="flex items-center px-2 py-1">
        <div className="flex-1 flex justify-center">
          <Reactions articleId={article._id} />
        </div>

        {article.allowComments && (
          <div className="flex-1 flex justify-center">
            <button onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-500 font-medium text-sm w-full justify-center">
              <ChatIcon className="w-5 h-5" />
              Commenter
            </button>
          </div>
        )}

        <div className="flex-1 flex justify-center">
          <button onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-500 font-medium text-sm w-full justify-center">
            <ShareIcon className="w-5 h-5" />
            Partager
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium text-sm w-full justify-center
              ${isSaved ? 'text-blue-600' : 'text-gray-500'}`}>
            {isSaved ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
            {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {showComments && article.allowComments && (
        <>
          <hr className="mx-4 border-gray-100" />
          <CommentSection articleId={article._id} articleTitle={article.title} />
        </>
      )}
    </div>
  );
};

export default ArticleCard;