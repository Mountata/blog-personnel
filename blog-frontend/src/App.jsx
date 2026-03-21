import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';  // ✅ ajout
import Profile        from './pages/Profile';
import Friends        from './pages/Friends';
import Messages       from './pages/Messages';
import Notifications  from './pages/Notifications';
import SavedArticles  from './pages/SavedArticles';
import Settings       from './pages/Settings';
import Circles        from './pages/Circles';
import CircleDetail   from './pages/CircleDetail';
import CircleSettings from './pages/CircleSettings';
import CircleInvite   from './pages/CircleInvite';
import Dashboard      from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuthStore();
  return !user ? children : <Navigate to="/" />;
};

const App = () => (
  <BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--card)',
          color: 'var(--t1)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md)',
          fontWeight: 500,
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />

    <Routes>
      {/* ── Publiques ── */}
      <Route path="/login"            element={<PublicRoute><Login          /></PublicRoute>} />
      <Route path="/register"         element={<PublicRoute><Register       /></PublicRoute>} />
      <Route path="/forgot-password"  element={<PublicRoute><ForgotPassword /></PublicRoute>} />  {/* ✅ ajout */}

      {/* ── Privées ── */}
      <Route path="/"              element={<PrivateRoute><Home          /></PrivateRoute>} />
      <Route path="/profile/:id"   element={<PrivateRoute><Profile       /></PrivateRoute>} />
      <Route path="/friends"       element={<PrivateRoute><Friends       /></PrivateRoute>} />
      <Route path="/messages"      element={<PrivateRoute><Messages      /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/saved"         element={<PrivateRoute><SavedArticles /></PrivateRoute>} />
      <Route path="/settings"      element={<PrivateRoute><Settings      /></PrivateRoute>} />
      <Route path="/dashboard"     element={<PrivateRoute><Dashboard     /></PrivateRoute>} />

      {/* ── Cercles ── */}
      <Route path="/circles"               element={<PrivateRoute><Circles        /></PrivateRoute>} />
      <Route path="/circles/invite/:token" element={<PrivateRoute><CircleInvite   /></PrivateRoute>} />
      <Route path="/circles/:id/settings"  element={<PrivateRoute><CircleSettings /></PrivateRoute>} />
      <Route path="/circles/:id"           element={<PrivateRoute><CircleDetail   /></PrivateRoute>} />

      {/* ── 404 ── */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>
);

export default App;