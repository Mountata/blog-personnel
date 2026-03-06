import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import {
  EyeIcon,
  UserGroupIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// Suppression du prop destructuring {icon: Icon} → on utilise directement `icon`
const StatCard = ({ icon: IconComponent, label, value, sub, trend, color = 'blue' }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   ring: 'bg-blue-100'   },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', ring: 'bg-purple-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  ring: 'bg-green-100'  },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', ring: 'bg-orange-100' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} rounded-xl p-4 flex items-center gap-4`}>
      <div className={`${c.ring} w-12 h-12 rounded-full flex items-center justify-center shrink-0`}>
        <IconComponent className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value?.toLocaleString()}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold shrink-0
          ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}
        >
          {trend >= 0
            ? <ArrowTrendingUpIcon   className="w-4 h-4" />
            : <ArrowTrendingDownIcon className="w-4 h-4" />
          }
          {Math.abs(trend)}
        </div>
      )}
    </div>
  );
};

const TopArticleRow = ({ article, rank }) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
      ${rank === 1 ? 'bg-yellow-100 text-yellow-600'
      : rank === 2 ? 'bg-gray-100 text-gray-500'
      : rank === 3 ? 'bg-orange-100 text-orange-500'
      : 'bg-gray-50 text-gray-400'}`}
    >
      {rank}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 truncate">{article.title}</p>
      <p className="text-xs text-gray-400">
        {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <EyeIcon className="w-3.5 h-3.5" /> {article.views}
      </span>
      <span className="flex items-center gap-1">
        <HeartIcon className="w-3.5 h-3.5" /> {article.saved}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('7');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/dashboard');
      setData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Spinner size="lg" /></Layout>;
  if (!data)   return <Layout><p className="text-center text-gray-500 mt-10">Erreur de chargement</p></Layout>;

  const { stats, viewsPerDay, topArticles } = data;

  const chartData = viewsPerDay.map(d => ({
    date: d._id,
    vues: d.views,
  }));

  return (
    <Layout>
      <div className="space-y-4">

        <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📊 Vue d'ensemble
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Vos statistiques et activités</p>
          </div>
          <button onClick={fetchDashboard} className="text-xs text-blue-600 hover:underline font-medium">
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={EyeIcon}          label="Vues totales"  value={stats.totalViews}     sub={`+${stats.viewsThisWeek} cette semaine`}     color="blue"   />
          <StatCard icon={UserGroupIcon}    label="Abonnés"       value={stats.totalFollowers}  sub={`+${stats.followersThisWeek} cette semaine`} trend={stats.followersTrend} color="purple" />
          <StatCard icon={HeartIcon}        label="Réactions"     value={stats.totalReactions}  sub={`+${stats.reactionsThisWeek} cette semaine`} color="orange" />
          <StatCard icon={ChatBubbleLeftIcon} label="Commentaires" value={stats.totalComments}  sub={`+${stats.commentsThisWeek} cette semaine`}  color="green"  />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <DocumentTextIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalArticles}</p>
            <p className="text-xs text-gray-500">Articles publiés</p>
            <p className="text-xs text-blue-500 mt-1">+{stats.articlesThisMonth} ce mois</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <FireIcon className="w-6 h-6 text-orange-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.engagementRate}%</p>
            <p className="text-xs text-gray-500">Taux d'engagement</p>
            <p className="text-xs text-gray-400 mt-1">réactions + commentaires / vues</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <span className="text-2xl block mb-1">⭕</span>
            <p className="text-2xl font-bold text-gray-800">{stats.myCircles}</p>
            <p className="text-xs text-gray-500">Cercles</p>
            <p className="text-xs text-blue-500 mt-1">+{stats.circlePostsThisWeek} posts cette semaine</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Évolution des vues</h2>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[{ v: '7', label: '7 jours' }, { v: '30', label: '30 jours' }].map(p => (
                <button key={p.v} onClick={() => setPeriod(p.v)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition
                    ${period === p.v ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Pas encore de données à afficher
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vuesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`${v} vues`, '']}
                />
                <Area type="monotone" dataKey="vues" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#vuesGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            🏆 Posts les plus populaires
          </h2>
          {topArticles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Publiez votre premier article pour voir les stats !
            </p>
          ) : (
            topArticles.map((a, i) => (
              <TopArticleRow key={a._id} article={a} rank={i + 1} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;