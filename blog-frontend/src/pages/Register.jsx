import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { CameraIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email:    '',
    password: '',
    confirm:  ''
  });
  const [avatar,  setAvatar]  = useState(null);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Mot de passe trop court (min 6 caractères)');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', form.fullName);
    formData.append('username', form.username);
    formData.append('email',    form.email);
    formData.append('password', form.password);
    if (avatar) formData.append('avatar', avatar);

    const result = await register(formData);
    if (result.success) {
      toast.success('Compte créé avec succès !');
      navigate('/');
    } else {
      toast.error(result.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">

        <h1 className="text-primary font-bold text-3xl text-center mb-2">MyBlog</h1>
        <p className="text-gray-600 text-center mb-6">Créez votre compte</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Avatar upload */}
          <div className="flex justify-center mb-2">
            <label className="relative cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                {preview
                  ? <img src={preview} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <CameraIcon className="w-10 h-10 text-gray-400" />
                    </div>
                }
              </div>
              <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 shadow">
                <CameraIcon className="w-4 h-4 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatar}
                className="hidden"
              />
            </label>
          </div>

          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Nom complet"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-primary text-gray-800"
          />

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
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Adresse email"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-primary text-gray-800"
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mot de passe (min 6 caractères)"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-primary text-gray-800"
          />

          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Confirmer le mot de passe"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-primary text-gray-800"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 text-lg"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;