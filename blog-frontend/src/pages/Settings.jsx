import { useState } from 'react';
import Layout from '../components/layout/Layout';
import useAuthStore from '../store/authStore';
import API from '../utils/axios';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, LockClosedIcon,
  TrashIcon, SunIcon, MoonIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user, updateUser, logout } = useAuthStore();

  const [activeTab,  setActiveTab]  = useState('profile');
  const [darkMode,   setDarkMode]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email:    user?.email    || '',
    bio:      user?.bio      || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: ''
  });

  const handleProfileChange  = (e) => setProfileForm({ ...profileForm,  [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put('/users/profile', profileForm);
      updateUser(data);
      toast.success('Profil mis à jour !');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mot de passe trop court (min 6 caractères)');
      return;
    }
    setLoading(true);
    try {
      await API.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword
      });
      toast.success('Mot de passe mis à jour !');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) return;
    if (!window.confirm('Cette action est irréversible ! Continuer ?'))       return;
    try {
      await API.delete('/users/delete');
      await logout();
      toast.success('Compte supprimé');
    } catch {
      toast.error('Erreur');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const tabs = [
    { id: 'profile',    label: 'Profil',       icon: UserCircleIcon },
    { id: 'password',   label: 'Mot de passe', icon: LockClosedIcon },
    { id: 'appearance', label: 'Apparence',    icon: SunIcon },
    { id: 'danger',     label: 'Danger',       icon: TrashIcon },
  ];

  return (
    <Layout>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Paramètres</h1>
        </div>

        <div className="flex">
          <div className="w-48 border-r p-2 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition mb-1
                  ${activeTab === tab.id ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-100'}
                  ${tab.id === 'danger' ? 'text-red-500 hover:bg-red-50' : ''}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6">

            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Modifier le profil</h2>

                {[
                  { name: 'fullName', label: 'Nom complet', type: 'text' },
                  { name: 'email',    label: 'Email',       type: 'email' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                    <input type={f.type} name={f.name} value={profileForm[f.name]}
                      onChange={handleProfileChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-sm" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                  <textarea name="bio" value={profileForm.bio} onChange={handleProfileChange}
                    maxLength={200} rows={3} placeholder="Parlez de vous en quelques mots..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-sm resize-none" />
                  <p className="text-xs text-gray-400 text-right">{profileForm.bio.length}/200</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom d'utilisateur</label>
                  <input type="text" value={user?.username} disabled
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">Le nom d'utilisateur ne peut pas être modifié</p>
                </div>

                <button type="submit" disabled={loading}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Changer le mot de passe</h2>

                {[
                  { name: 'currentPassword', label: 'Mot de passe actuel'           },
                  { name: 'newPassword',     label: 'Nouveau mot de passe'           },
                  { name: 'confirmPassword', label: 'Confirmer le nouveau mot de passe' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                    <input type="password" name={f.name} value={passwordForm[f.name]}
                      onChange={handlePasswordChange} required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-sm" />
                  </div>
                ))}

                <button type="submit" disabled={loading}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </form>
            )}

            {activeTab === 'appearance' && (
              <div className="max-w-md">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Apparence</h2>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center gap-3">
                    {darkMode
                      ? <MoonIcon className="w-6 h-6 text-gray-600" />
                      : <SunIcon  className="w-6 h-6 text-yellow-500" />
                    }
                    <div>
                      <p className="font-semibold text-gray-800">Mode sombre</p>
                      <p className="text-sm text-gray-400">{darkMode ? 'Activé' : 'Désactivé'}</p>
                    </div>
                  </div>
                  <button onClick={toggleDarkMode}
                    className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="max-w-md">
                <h2 className="font-bold text-red-500 text-lg mb-4">Zone de danger</h2>
                <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <h3 className="font-semibold text-gray-800 mb-1">Supprimer mon compte</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Cette action est irréversible. Tous vos articles, commentaires et données seront définitivement supprimés.
                  </p>
                  <button onClick={handleDeleteAccount}
                    className="flex items-center gap-2 bg-red-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-red-600 transition text-sm">
                    <TrashIcon className="w-4 h-4" />
                    Supprimer définitivement mon compte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;