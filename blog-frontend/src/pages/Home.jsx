import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import CreateArticle from '../components/article/CreateArticle';
import ArticleCard from '../components/article/ArticleCard';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import { Link } from 'react-router-dom';
import { FireIcon, ClockIcon, UserPlusIcon, RefreshIcon, SparklesIcon } from '../Icons';

const UserSuggestion = ({ user }) => {
  const [sent, setSent] = useState(false);

  const avatarSrc = user?.avatar
    ? `http://localhost:5000${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=1877f2&color=fff`;

  const handleAdd = async () => {
    try { await API.post(`/friends/request/${user._id}`); setSent(true); }
    catch { /* silent */ }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <Link to={`/profile/${user._id}`} style={{ flexShrink: 0 }}>
        <img src={avatarSrc} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/profile/${user._id}`} style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.fullName}
        </Link>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.jobTitle || `@${user.username}`}
        </p>
      </div>
      <button onClick={handleAdd} disabled={sent} style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 8, border: 'none', cursor: sent ? 'default' : 'pointer',
        fontSize: 12, fontWeight: 600,
        background: sent ? '#f0fdf4' : 'var(--primary)', color: sent ? '#22c55e' : '#fff',
        transition: 'all 0.15s',
      }}>
        {sent ? '✓ Envoyé' : <><UserPlusIcon size={13} /> Ajouter</>}
      </button>
    </div>
  );
};

const SORT_OPTIONS = [
  { id: 'recent',  label: 'Récents',    Icon: ClockIcon },
  { id: 'popular', label: 'Populaires', Icon: FireIcon  },
];

const Home = () => {
  const [articles,    setArticles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [sortBy,      setSortBy]      = useState('recent');
  const [refreshing,  setRefreshing]  = useState(false);

  const fetchFeed = useCallback(async (p = 1, reset = false) => {
    try {
      if (p === 1 && reset) setLoading(true);
      else if (p === 1)     setRefreshing(true);
      else                  setLoadingMore(true);
      const { data } = await API.get(`/articles/feed?page=${p}`);
      const fetched = data.articles || data || [];
      setArticles(prev => (p === 1) ? fetched : [...prev, ...fetched]);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch {
      if (p === 1) setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data } = await API.get('/search?q=a');
      const list = Array.isArray(data) ? data : (data.users || []);
      setSuggestions(list.slice(0, 5));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchFeed(1, true); }, [sortBy, fetchFeed]);
  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const handleLoadMore       = () => { if (page < totalPages) fetchFeed(page + 1); };
  const handleRefresh        = () => fetchFeed(1, true);
  const handleArticleCreated = (a)  => setArticles(prev => [a, ...prev]);
  const handleArticleDeleted = (id) => setArticles(prev => prev.filter(a => a._id !== id));

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        <CreateArticle onArticleCreated={handleArticleCreated} />

        {/* Sort bar */}
        <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {SORT_OPTIONS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setSortBy(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: sortBy === id ? 'var(--primary)' : 'transparent',
              color: sortBy === id ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={handleRefresh} disabled={refreshing} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '6px 8px', borderRadius: 8, opacity: refreshing ? 0.5 : 1,
          }}>
            <RefreshIcon size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner size="lg" />
          </div>
        ) : articles.length === 0 ? (
          <>
            {suggestions.length > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SparklesIcon size={15} style={{ color: 'var(--primary)' }} /> Personnes à suivre
                </h3>
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {suggestions.map(u => <UserSuggestion key={u._id} user={u} />)}
                </div>
              </div>
            )}
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>📝</p>
              <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>Aucun article pour le moment</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Ajoutez des amis pour voir leur contenu, ou créez votre premier article !
              </p>
              <button onClick={handleRefresh} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
                padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
              }}>
                <RefreshIcon size={14} /> Actualiser
              </button>
            </div>
          </>
        ) : (
          <>
            {articles.map((article, idx) => (
              <div key={article._id}>
                <ArticleCard article={article} onDelete={handleArticleDeleted} />
                {idx === 3 && suggestions.length > 0 && (
                  <div className="card" style={{ padding: 16, marginTop: 12, background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}>
                    <h3 style={{ fontWeight: 700, fontSize: 13, color: '#3b82f6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SparklesIcon size={14} /> Personnes que vous pourriez connaître
                    </h3>
                    {suggestions.slice(0, 3).map(u => <UserSuggestion key={u._id} user={u} />)}
                  </div>
                )}
              </div>
            ))}

            {page < totalPages ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <button onClick={handleLoadMore} disabled={loadingMore} style={{
                  background: 'var(--bg-card)', color: 'var(--primary)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  padding: '10px 32px', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', opacity: loadingMore ? 0.6 : 1,
                }}>
                  {loadingMore ? '⏳ Chargement…' : "Voir plus d'articles"}
                </button>
              </div>
            ) : (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '16px 0' }}>
                ✓ Vous avez tout vu !
              </p>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
};

export default Home;
