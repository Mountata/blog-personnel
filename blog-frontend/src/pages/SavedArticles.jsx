import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import ArticleCard from '../components/article/ArticleCard';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import { BookmarkIcon } from '@heroicons/react/24/outline';

const SavedArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const { data } = await API.get('/articles/saved');
      setArticles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = (articleId) => {
    setArticles(prev => prev.filter(a => a._id !== articleId));
  };

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow mb-4 p-4 flex items-center gap-3">
        <BookmarkIcon className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Articles sauvegardés</h1>
          <p className="text-sm text-gray-400">{articles.length} article(s)</p>
        </div>
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-4xl mb-2">🔖</p>
          <p className="text-gray-600 font-semibold text-lg">
            Aucun article sauvegardé
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Sauvegardez des articles pour les retrouver ici
          </p>
        </div>
      ) : (
        articles.map(article => (
          <ArticleCard
            key={article._id}
            article={article}
            onDelete={handleUnsave}
          />
        ))
      )}
    </Layout>
  );
};

export default SavedArticles;