import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import CircleCard from '../components/circles/CircleCard';
import CreateCircleModal from '../components/circles/CreateCircleModal';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';
import { PlusIcon, SearchIcon } from '../Icons';

const Circles = () => {
  const navigate = useNavigate();

  const [tab,        setTab]        = useState('my');
  const [myCircles,  setMyCircles]  = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMyCircles(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'discover') fetchDiscover();
  }, [tab]);

  const fetchMyCircles = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/circles/my');
      setMyCircles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscover = async (q = '') => {
    try {
      setLoading(true);
      const { data } = await API.get(`/circles/discover?search=${q}`);
      setDiscovered(data.circles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (tab === 'discover') fetchDiscover(q);
  };

  const handleCircleCreated = (circle) => {
    setMyCircles(prev => [circle, ...prev]);
    setShowCreate(false);
    navigate(`/circles/${circle._id}`);
  };

  const filteredMy = myCircles.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-4">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">⭕ Cercles</h1>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <PlusIcon className="w-4 h-4" />
              Créer un cercle
            </button>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: 'my',       label: 'Mes cercles' },
              { id: 'discover', label: 'Découvrir'   },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                  ${tab === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
                {t.id === 'my' && myCircles.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {myCircles.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text" value={search} onChange={handleSearch}
              placeholder={tab === 'my' ? 'Rechercher dans mes cercles...' : 'Rechercher un cercle...'}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* ── Contenu ────────────────────────────────────────── */}
        {loading ? (
          <Spinner size="lg" />
        ) : tab === 'my' ? (
          <>
            {filteredMy.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-10 text-center">
                <p className="text-5xl mb-3">⭕</p>
                <p className="font-semibold text-gray-700 text-lg">Aucun cercle pour le moment</p>
                <p className="text-gray-400 text-sm mt-1 mb-4">Créez votre premier cercle ou rejoignez-en un !</p>
                <button onClick={() => setShowCreate(true)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  Créer un cercle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredMy.map(circle => (
                  <CircleCard key={circle._id} circle={circle} myRole={circle.myRole}
                    onClick={() => navigate(`/circles/${circle._id}`)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {discovered.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-10 text-center">
                <p className="text-5xl mb-3">🔍</p>
                <p className="font-semibold text-gray-700">Aucun cercle trouvé</p>
                <p className="text-gray-400 text-sm mt-1">Essayez un autre mot-clé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {discovered.map(circle => (
                  <CircleCard key={circle._id} circle={circle}
                    onClick={() => navigate(`/circles/${circle._id}`)}
                    showJoin onJoin={() => navigate(`/circles/${circle._id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateCircleModal onClose={() => setShowCreate(false)} onCreated={handleCircleCreated} />
      )}
    </Layout>
  );
};

export default Circles;