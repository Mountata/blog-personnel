import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import API from '../utils/axios';

const CircleInvite = () => {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [status,  setStatus]  = useState('loading');
  const [message, setMessage] = useState('');
  const [circle,  setCircle]  = useState(null);

  const joinByToken = useCallback(async () => {
    try {
      const { data } = await API.get(`/circles/invite/${token}`);
      setCircle(data.circle);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setMessage(e.response?.data?.message || 'Lien invalide ou expiré.');
    }
  }, [token]);

  useEffect(() => { joinByToken(); }, [joinByToken]);

  if (status === 'loading') return <Layout><Spinner size="lg" /></Layout>;

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow p-10 text-center max-w-md mx-auto mt-10 space-y-4">
        {status === 'success' ? (
          <>
            <div className="text-5xl">{circle?.emoji || '⭕'}</div>
            <h2 className="font-bold text-xl text-gray-800">Vous avez rejoint</h2>
            <p className="text-lg font-semibold text-blue-600">{circle?.name}</p>
            <p className="text-sm text-gray-500">Bienvenue dans ce cercle !</p>
            <button
              onClick={() => navigate(`/circles/${circle?._id}`)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Accéder au cercle
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl">❌</div>
            <h2 className="font-bold text-xl text-gray-800">Lien invalide</h2>
            <p className="text-sm text-gray-500">{message}</p>
            <button
              onClick={() => navigate('/circles')}
              className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Retour aux cercles
            </button>
          </>
        )}
      </div>
    </Layout>
  );
};

export default CircleInvite;