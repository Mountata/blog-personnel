import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const CARDS = [
  { icon: '✍️', text: 'Nouvel article publié',    sub: 'il y a 2 min',  color: '#2563eb' },
  { icon: '❤️', text: '142 personnes ont aimé',   sub: 'il y a 5 min',  color: '#ef4444' },
  { icon: '💬', text: 'Nouveau commentaire',       sub: 'il y a 9 min',  color: '#10b981' },
  { icon: '👤', text: 'Nouvel abonné',             sub: 'il y a 14 min', color: '#f59e0b' },
  { icon: '🔁', text: 'Article partagé 89 fois',  sub: 'il y a 20 min', color: '#6366f1' },
  { icon: '🌟', text: 'Article en tendance',       sub: 'il y a 28 min', color: '#0ea5e9' },
];

const Login = () => {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [form,     setForm]     = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ identifier: form.identifier, password: form.password });
    if (result.success) { toast.success('Connexion réussie !'); navigate('/'); }
    else toast.error(result.message || 'Identifiants incorrects');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lg-root {
          min-height: 100vh;
          background: #f0f4ff;
          display: grid;
          grid-template-columns: 260px 1fr 320px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .lg-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image: radial-gradient(circle, #bfcfff 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        .lg-root::after {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 500px 400px at 5% 60%, rgba(219,234,254,0.8) 0%, transparent 65%),
            radial-gradient(ellipse 350px 300px at 95% 15%, rgba(209,250,229,0.6) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* LEFT */
        .left-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 11px;
          padding: 40px 14px 40px 24px;
          position: relative;
          z-index: 1;
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }

        @keyframes drift {
          0%   { opacity: 0; transform: translateY(28px); }
          12%  { opacity: 1; transform: translateY(0); }
          82%  { opacity: 1; transform: translateY(-16px); }
          100% { opacity: 0; transform: translateY(-44px); }
        }

        .act-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 14px;
          padding: 11px 13px;
          box-shadow: 0 2px 10px rgba(37,99,235,0.06);
          animation: drift linear infinite;
          opacity: 0;
        }
        .act-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .act-body { flex: 1; min-width: 0; }
        .act-body strong { display: block; font-size: 12px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-body span   { font-size: 10.5px; color: #94a3b8; }
        .act-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* CENTER */
        .center-col {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 20px;
          position: relative; z-index: 2;
        }

        .logo {
          font-family: 'Pacifico', cursive;
          font-size: 36px; color: #2563eb;
          margin-bottom: 28px;
          filter: drop-shadow(0 2px 10px rgba(37,99,235,0.18));
        }

        .form-card {
          width: 100%; max-width: 390px;
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 22px;
          padding: 34px 30px;
          box-shadow: 0 8px 40px rgba(37,99,235,0.07), 0 1px 4px rgba(0,0,0,0.04);
        }

        .form-title { font-size: 19px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .form-sub   { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }

        .field { position: relative; margin-bottom: 12px; }
        .f-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          font-size: 14px; color: #94a3b8; pointer-events: none; transition: color 0.2s;
        }
        .field.on .f-icon { color: #2563eb; }

        .yb-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 11px;
          padding: 13px 40px;
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a; outline: none;
          transition: all 0.18s;
        }
        .yb-input::placeholder { color: #c8d5e8; }
        .yb-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
        }

        .eye-btn {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; font-size: 14px; padding: 4px; line-height: 1;
        }
        .eye-btn:hover { color: #64748b; }

        .forgot {
          display: block; text-align: right;
          font-size: 12.5px; color: #2563eb; font-weight: 500;
          text-decoration: none; margin-top: -4px; margin-bottom: 18px;
          transition: color 0.15s;
        }
        .forgot:hover { color: #1d4ed8; text-decoration: underline; }

        .btn-login {
          width: 100%; padding: 13.5px;
          background: #2563eb; border: none; border-radius: 11px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          letter-spacing: 0.3px;
        }
        .btn-login:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37,99,235,0.36);
        }
        .btn-login:disabled { opacity: 0.55; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 10px;
          margin: 16px 0; color: #cbd5e1; font-size: 12px;
        }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e8edf5; }

        .btn-reg {
          width: 100%; padding: 13px;
          background: transparent;
          border: 1.5px solid #10b981; border-radius: 11px;
          color: #10b981; font-size: 13.5px; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; text-decoration: none;
          display: block; text-align: center;
          transition: all 0.18s;
        }
        .btn-reg:hover { background: #f0fdf4; border-color: #059669; color: #059669; }

        /* RIGHT */
        .right-col {
          position: relative; z-index: 1; overflow: hidden;
          background: linear-gradient(145deg, #1e40af 0%, #2563eb 40%, #0ea5e9 100%);
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
        }
        .right-col img {
          width: 90%; max-width: 300px;
          height: auto;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 24px 48px rgba(0,0,0,0.35));
          position: relative; z-index: 2;
        }
        .right-col::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(14,165,233,0.3) 0%, transparent 50%);
          z-index: 1;
        }
        .right-overlay { display: none; }
        .right-cap {
          position: absolute; bottom: 28px; left: 20px; right: 20px;
          color: #fff; z-index: 3; text-align: center;
        }
        .right-cap p { font-size: 16px; font-weight: 700; line-height: 1.45; margin-bottom: 5px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .right-cap em { font-style: normal; font-size: 12px; color: #bfdbfe; font-weight: 600; }
        .pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.18); backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.25); border-radius: 18px;
          padding: 4px 11px; font-size: 11px; color: #fff;
          margin-top: 9px; margin-right: 5px;
        }

        @media (max-width: 860px) {
          .lg-root { grid-template-columns: 1fr; }
          .left-col, .right-col { display: none; }
        }
      `}</style>

      <div className="lg-root">

        {/* LEFT */}
        <div className="left-col">
          {CARDS.map((c, i) => (
            <div key={i} className="act-card"
              style={{ animationDelay: `${i * 1.5}s`, animationDuration: '10s' }}>
              <div className="act-icon" style={{ background: `${c.color}18` }}>{c.icon}</div>
              <div className="act-body">
                <strong>{c.text}</strong>
                <span>{c.sub}</span>
              </div>
              <div className="act-dot" style={{ background: c.color }} />
            </div>
          ))}
        </div>

        {/* CENTER */}
        <div className="center-col">
          <div className="logo">Your'Blog</div>
          <div className="form-card">
            <h2 className="form-title">Bon retour 👋</h2>
            <p className="form-sub">Connectez-vous à votre espace</p>

            <form onSubmit={handleSubmit}>
              <div className={`field ${focused === 'id' ? 'on' : ''}`}>
                <span className="f-icon">📱</span>
                <input className="yb-input" type="text" name="identifier"
                  value={form.identifier} onChange={handleChange}
                  onFocus={() => setFocused('id')} onBlur={() => setFocused('')}
                  placeholder="Email ou numéro de téléphone" required />
              </div>

              <div className={`field ${focused === 'pw' ? 'on' : ''}`}>
                <span className="f-icon">🔒</span>
                <input className="yb-input"
                  type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
                  placeholder="Mot de passe" required />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              <Link to="/forgot-password" className="forgot">Mot de passe oublié ?</Link>

              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? '⏳ Connexion...' : 'SE CONNECTER'}
              </button>
            </form>

            <div className="divider">ou</div>
            <Link to="/register" className="btn-reg">Créer un nouveau compte</Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-col">
          <img src="/uploads/j.webp" alt="Your Blog community" />
          <div className="right-overlay" />
          <div className="right-cap">
            <p>Partage ton quotidien,<br />inspire ta ville !</p>
            <em>#VibeDeVille</em>
            <div>
              <span className="pill">✍️ 12K articles</span>
              <span className="pill">❤️ 48K likes</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;