import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success('Connexion réussie !');
      navigate('/');
    } else {
      toast.error(result.message || 'Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8">

        {/* GAUCHE — Branding */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-primary font-bold text-6xl mb-4">MyBlog</h1>
          <p className="text-gray-700 text-2xl leading-snug">
            Partagez vos idées avec le monde entier.
          </p>
        </div>

        {/* DROITE — Formulaire */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Nom d'utilisateur"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-primary text-gray-800"
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mot de passe"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-primary text-gray-800"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-lg"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="border-t pt-4 text-center">
              <Link
                to="/register"
                className="bg-secondary text-white font-bold px-6 py-3 rounded-lg hover:bg-green-600 transition inline-block"
              >
                Créer un nouveau compte
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;