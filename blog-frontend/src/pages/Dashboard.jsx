import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import {
  EyeIcon, UserGroupIcon, HeartIcon, ChatBubbleLeftIcon,
  DocumentTextIcon, BookmarkIcon, ShareIcon,
  ArrowUpIcon, ArrowDownIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

// ── Tooltip custom ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f172a', border: 'none', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
        {payload[0].value.toLocaleString()} vues
      </p>
    </div>
  );
};

// ── Carte stat principale ─────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, trend, accent = '#3b82f6' }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
    {/* Fond décoratif */}
    <div style={{
      position: 'absolute', top: -20, right: -20,
      width: 80, height: 80, borderRadius: '50%',
      background: accent + '0d',
      transition: 'transform 0.3s',
    }} className="group-hover:scale-150" />

    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div style={{
          background: accent + '15',
          borderRadius: 12, padding: 10,
          display: 'inline-flex',
        }}>
          <Icon style={{ width: 20, height: 20, color: accent }} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            color: trend > 0 ? '#10b981' : '#ef4444',
            background: trend > 0 ? '#10b98115' : '#ef444415',
            padding: '3px 8px', borderRadius: 99,
          }}>
            {trend > 0
              ? <ArrowUpIcon style={{ width: 10, height: 10 }} />
              : <ArrowDownIcon style={{ width: 10, height: 10 }} />}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 tabular-nums">
        {(value ?? 0).toLocaleString()}
      </p>
      <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">
        {label}
      </p>
      {sub && (
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <ArrowTrendingUpIcon style={{ width: 12, height: 12, color: '#10b981' }} />
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ── Barre de progression ──────────────────────────────────────
const ProgressBar = ({ label, value, max, color, icon: Icon }) => {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div style={{
        background: color + '15', borderRadius: 8, padding: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon style={{ width: 14, height: 14, color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <span className="text-xs font-bold text-gray-800">{value.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            borderRadius: 99, transition: 'width 1s ease',
          }} />
        </div>
      </div>
      <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct}%</span>
    </div>
  );
};

// ── Ligne top article ─────────────────────────────────────────
const TopArticleRow = ({ article, rank }) => {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <Link to={`/articles/${article._id}`}
      className="flex items-center gap-3 py-3 rounded-xl px-3 -mx-3 hover:bg-gray-50 transition group">
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: rank <= 3 ? '#fef3c7' : '#f9fafb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: rank <= 3 ? 14 : 11,
        fontWeight: 700, color: '#92400e',
        flexShrink: 0,
      }}>
        {rank <= 3 ? medals[rank - 1] : rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-blue-600 transition">
          {article.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(article.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {[
          { Icon: EyeIcon,            val: article.views,     color: '#3b82f6' },
          { Icon: HeartIcon,          val: article.reactions, color: '#ef4444' },
          { Icon: ChatBubbleLeftIcon, val: article.comments,  color: '#10b981' },
          { Icon: BookmarkIcon,       val: article.saved,     color: '#f59e0b' },
        ].map(({ Icon, val, color }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon style={{ width: 12, height: 12, color }} />
            <span className="text-xs font-medium text-gray-500">
              {(val || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
};

// ── Dashboard principal ───────────────────────────────────────
const Dashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('30');
  const [activeBar, setActiveBar] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/dashboard');
      setData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </Layout>
  );

  if (!data) return (
    <Layout>
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm mb-3">Impossible de charger les données</p>
        <button onClick={fetchDashboard} className="text-blue-600 text-sm font-medium hover:underline">
          Réessayer
        </button>
      </div>
    </Layout>
  );

  const { stats, viewsPerDay, topArticles } = data;

  const chartData = viewsPerDay
    .slice(period === '7' ? -7 : -30)
    .map(d => ({ date: d._id?.slice(5), vues: d.views || 0 }));

  const maxStat = Math.max(
    stats.totalViews, stats.totalReactions,
    stats.totalComments, stats.totalSaved, stats.totalShares, 1
  );

  const barData = [
    { name: 'Lun', vues: 0 },
    { name: 'Mar', vues: 0 },
    { name: 'Mer', vues: 0 },
    { name: 'Jeu', vues: 0 },
    { name: 'Ven', vues: 0 },
    { name: 'Sam', vues: 0 },
    { name: 'Dim', vues: 0 },
    ...chartData.slice(-7),
  ].slice(-7);

  return (
    <Layout>
      <div className="space-y-5 pb-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">Tableau de bord</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <button onClick={fetchDashboard}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm">
            <span>↻</span> Actualiser
          </button>
        </div>

        {/* ── Hero stat ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
          borderRadius: 20, padding: '24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Déco */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 150, height: 150, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: -40, right: 60,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          <div className="relative">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Vues totales
            </p>
            <p className="text-white text-4xl font-black tabular-nums mb-1">
              {(stats.totalViews || 0).toLocaleString()}
            </p>
            <p className="text-blue-200 text-sm">
              +{stats.viewsThisWeek || 0} cette semaine
            </p>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Articles',  value: stats.totalArticles  },
                { label: 'Réactions', value: stats.totalReactions },
                { label: 'Amis',      value: stats.totalFollowers },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '10px 12px',
                  backdropFilter: 'blur(10px)',
                }}>
                  <p className="text-white text-lg font-black tabular-nums">
                    {(item.value || 0).toLocaleString()}
                  </p>
                  <p className="text-blue-200 text-xs mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={HeartIcon}
            label="Réactions"
            value={stats.totalReactions}
            sub={`+${stats.reactionsThisWeek || 0} cette semaine`}
            accent="#ef4444"
          />
          <StatCard
            icon={ChatBubbleLeftIcon}
            label="Commentaires"
            value={stats.totalComments}
            sub={`+${stats.commentsThisWeek || 0} cette semaine`}
            accent="#10b981"
          />
          <StatCard
            icon={BookmarkIcon}
            label="Sauvegardes"
            value={stats.totalSaved}
            accent="#f59e0b"
          />
          <StatCard
            icon={ShareIcon}
            label="Partages"
            value={stats.totalShares}
            accent="#8b5cf6"
          />
        </div>

        {/* ── Graphique ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Évolution des vues</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {(stats.totalViews || 0).toLocaleString()} vues au total
              </p>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[{ v: '7', label: '7 jours' }, { v: '30', label: '30 jours' }].map(p => (
                <button key={p.v} onClick={() => setPeriod(p.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                    ${period === p.v
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-400 hover:text-gray-600'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center">
              <ArrowTrendingUpIcon className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-xs text-gray-400">Aucune donnée pour cette période</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}  />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="vues"
                  stroke="#3b82f6" strokeWidth={2}
                  fill="url(#grad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Répartition engagement ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Répartition de l'engagement</h2>
          <div className="space-y-1">
            <ProgressBar
              icon={EyeIcon}
              label="Vues"
              value={stats.totalViews || 0}
              max={maxStat}
              color="#3b82f6"
            />
            <ProgressBar
              icon={HeartIcon}
              label="Réactions"
              value={stats.totalReactions || 0}
              max={maxStat}
              color="#ef4444"
            />
            <ProgressBar
              icon={ChatBubbleLeftIcon}
              label="Commentaires"
              value={stats.totalComments || 0}
              max={maxStat}
              color="#10b981"
            />
            <ProgressBar
              icon={BookmarkIcon}
              label="Sauvegardes"
              value={stats.totalSaved || 0}
              max={maxStat}
              color="#f59e0b"
            />
            <ProgressBar
              icon={ShareIcon}
              label="Partages"
              value={stats.totalShares || 0}
              max={maxStat}
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* ── Métriques clés ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-gray-900">
              {stats.totalArticles || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Articles publiés</p>
            {stats.articlesThisMonth > 0 && (
              <p className="text-xs font-semibold mt-1.5" style={{ color: '#10b981' }}>
                +{stats.articlesThisMonth} ce mois
              </p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-gray-900">
              {stats.totalArticles > 0
                ? Math.round(stats.totalViews / stats.totalArticles).toLocaleString()
                : 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Vues / article</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black" style={{ color: '#3b82f6' }}>
              {stats.engagementRate || 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Engagement</p>
          </div>
        </div>

        {/* ── Top articles ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Articles populaires</h2>
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
              {[
                { Icon: EyeIcon,            color: '#3b82f6', label: 'Vues'    },
                { Icon: HeartIcon,          color: '#ef4444', label: 'Réact.'  },
                { Icon: ChatBubbleLeftIcon, color: '#10b981', label: 'Com.'    },
                { Icon: BookmarkIcon,       color: '#f59e0b', label: 'Sauv.'   },
              ].map(({ Icon, color, label }, i) => (
                <span key={i} className="flex items-center gap-1">
                  <Icon style={{ width: 11, height: 11, color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {!topArticles || topArticles.length === 0 ? (
            <div className="text-center py-10">
              <DocumentTextIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-xs text-gray-400 mb-3">
                Publiez votre premier article pour voir vos statistiques
              </p>
              <Link to="/" className="text-xs text-blue-600 font-semibold hover:underline">
                Créer un article →
              </Link>
            </div>
          ) : (
            topArticles.map((a, i) => (
              <TopArticleRow key={a._id} article={a} rank={i + 1} />
            ))
          )}
        </div>

        {/* ── Footer stats ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: 20, padding: '20px',
        }}>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
            Résumé global
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: DocumentTextIcon, label: 'Articles',     value: stats.totalArticles,  color: '#94a3b8' },
              { icon: EyeIcon,          label: 'Vues',         value: stats.totalViews,      color: '#3b82f6' },
              { icon: HeartIcon,        label: 'Réactions',    value: stats.totalReactions,  color: '#ef4444' },
              { icon: ChatBubbleLeftIcon, label: 'Commentaires', value: stats.totalComments, color: '#10b981' },
              { icon: BookmarkIcon,     label: 'Sauvegardes',  value: stats.totalSaved,      color: '#f59e0b' },
              { icon: ShareIcon,        label: 'Partages',     value: stats.totalShares,     color: '#8b5cf6' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '12px',
              }}>
                <Icon style={{ width: 16, height: 16, color, marginBottom: 8 }} />
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                  {(value || 0).toLocaleString()}
                </p>
                <p style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;