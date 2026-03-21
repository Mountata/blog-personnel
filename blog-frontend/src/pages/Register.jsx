import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Register = () => {
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '', username: '', email: '', phone: '', password: '', confirm: '',
  });
  const [avatar,   setAvatar]   = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [focused,  setFocused]  = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Nom complet requis');
    if (!form.username.trim()) return toast.error('Pseudo requis');
    if (!form.email && !form.phone) return toast.error('Email ou téléphone requis');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Les mots de passe ne correspondent pas');
    if (form.password.length < 6) return toast.error('Mot de passe trop court (min 6 caractères)');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (k !== 'confirm') fd.append(k, v); });
    if (avatar) fd.append('avatar', avatar);
    const result = await register(fd);
    if (result.success) { toast.success('Compte créé !'); navigate('/'); }
    else toast.error(result.message || "Erreur lors de l'inscription");
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /\d/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();
  const strColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const strLabels = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rg-root {
          min-height: 100vh;
          background: #f0f4ff;
          display: flex; align-items: center; justify-content: center;
          padding: 28px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        .rg-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image: radial-gradient(circle, #bfcfff 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.35; pointer-events: none; z-index: 0;
        }

        .rg-root::after {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 500px 400px at 10% 70%, rgba(219,234,254,0.7) 0%, transparent 65%),
            radial-gradient(ellipse 400px 300px at 90% 20%, rgba(209,250,229,0.5) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }

        .rg-card {
          width: 100%; max-width: 460px;
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 24px;
          padding: 38px 34px;
          box-shadow: 0 8px 40px rgba(37,99,235,0.08), 0 1px 4px rgba(0,0,0,0.04);
          position: relative; z-index: 1;
        }

        .rg-logo {
          font-family: 'Pacifico', cursive;
          font-size: 30px; color: #2563eb;
          text-align: center; margin-bottom: 3px;
          filter: drop-shadow(0 2px 8px rgba(37,99,235,0.15));
        }
        .rg-sub { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 22px; }

        /* step bar */
        .step-bar { display: flex; gap: 6px; margin-bottom: 26px; }
        .step-seg {
          flex: 1; height: 3px; border-radius: 2px;
          background: #e8edf5; transition: background 0.3s;
        }
        .step-seg.done   { background: #10b981; }
        .step-seg.active { background: #2563eb; }

        /* avatar */
        .av-wrap { display: flex; justify-content: center; margin-bottom: 22px; }
        .av-label { position: relative; cursor: pointer; }
        .av-circle {
          width: 82px; height: 82px; border-radius: 50%;
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; transition: border-color 0.2s;
        }
        .av-label:hover .av-circle { border-color: #2563eb; }
        .av-circle img { width: 100%; height: 100%; object-fit: cover; }
        .av-badge {
          position: absolute; bottom: 2px; right: 2px;
          width: 24px; height: 24px; background: #2563eb;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 11px;
          border: 2px solid #fff;
        }

        /* labels */
        .sec-label {
          font-size: 10.5px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.8px;
          margin-bottom: 9px; margin-top: 4px;
        }

        /* grid */
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }

        .field { position: relative; margin-bottom: 10px; }
        .field.no-mb { margin-bottom: 0; }
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
          padding: 12px 40px;
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a; outline: none; transition: all 0.18s;
        }
        .yb-input::placeholder { color: #c8d5e8; }
        .yb-input:focus {
          border-color: #2563eb; background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
        }

        .or-row {
          display: flex; align-items: center; gap: 10px;
          color: #cbd5e1; font-size: 11px; margin: 6px 0;
        }
        .or-row::before, .or-row::after { content: ''; flex: 1; height: 1px; background: #e8edf5; }

        .phone-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .prefix-input {
          width: 72px; background: #f8fafc;
          border: 1.5px solid #e2e8f0; border-radius: 11px;
          padding: 12px 8px; font-size: 13px; text-align: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #64748b; outline: none;
        }
        .prefix-input:focus { border-color: #2563eb; }

        /* strength */
        .str-row { display: flex; gap: 4px; margin-bottom: 4px; }
        .str-seg { flex: 1; height: 3px; border-radius: 2px; background: #e8edf5; transition: background 0.3s; }
        .str-label { font-size: 11px; margin-bottom: 10px; }

        .match-hint { font-size: 11.5px; margin-bottom: 8px; margin-top: -4px; }

        .eye-btn {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; font-size: 14px; padding: 4px; line-height: 1;
        }
        .eye-btn:hover { color: #64748b; }

        .btn-next {
          width: 100%; padding: 13.5px;
          background: #2563eb; border: none; border-radius: 11px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          margin-top: 4px;
        }
        .btn-next:hover { background: #1d4ed8; transform: translateY(-1px); }

        .btn-create {
          width: 100%; padding: 13.5px;
          background: #10b981; border: none; border-radius: 11px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(16,185,129,0.28);
          margin-top: 4px;
        }
        .btn-create:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
        .btn-create:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-back {
          width: 100%; padding: 12px;
          background: transparent;
          border: 1.5px solid #e2e8f0; border-radius: 11px;
          color: #64748b; font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.18s; margin-bottom: 10px;
        }
        .btn-back:hover { border-color: #94a3b8; color: #0f172a; }

        .login-hint { text-align: center; color: #94a3b8; font-size: 13px; margin-top: 18px; }
        .login-hint a { color: #2563eb; font-weight: 600; text-decoration: none; }
        .login-hint a:hover { text-decoration: underline; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .step-body { animation: slideIn 0.28s ease; }
      `}</style>

      <div className="rg-root">
        <div className="rg-card">
          <div className="rg-logo">Your'Blog</div>
          <p className="rg-sub">Créez votre compte</p>

          <div className="step-bar">
            <div className={`step-seg ${step > 1 ? 'done' : 'active'}`} />
            <div className={`step-seg ${step === 2 ? 'active' : ''}`} />
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="step-body">
              <div className="av-wrap">
                <label className="av-label">
                  <div className="av-circle">
                    {preview ? <img src={preview} alt="avatar" /> : '📷'}
                  </div>
                  <div className="av-badge">✏️</div>
                  <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
                </label>
              </div>

              <p className="sec-label">Identité</p>
              <div className="field-row">
                <div className={`field no-mb ${focused === 'fn' ? 'on' : ''}`}>
                  <span className="f-icon">👤</span>
                  <input className="yb-input" type="text" name="fullName"
                    value={form.fullName} onChange={handleChange}
                    onFocus={() => setFocused('fn')} onBlur={() => setFocused('')}
                    placeholder="Nom complet" />
                </div>
                <div className={`field no-mb ${focused === 'un' ? 'on' : ''}`}>
                  <span className="f-icon" style={{ fontSize: 13, fontWeight: 700 }}>@</span>
                  <input className="yb-input" type="text" name="username"
                    value={form.username} onChange={handleChange}
                    onFocus={() => setFocused('un')} onBlur={() => setFocused('')}
                    placeholder="Pseudo" />
                </div>
              </div>

              <p className="sec-label" style={{ marginTop: 12 }}>Contact</p>
              <div className={`field ${focused === 'em' ? 'on' : ''}`}>
                <span className="f-icon">✉️</span>
                <input className="yb-input" type="email" name="email"
                  value={form.email} onChange={handleChange}
                  onFocus={() => setFocused('em')} onBlur={() => setFocused('')}
                  placeholder="Adresse email" />
              </div>

              <div className="or-row">ou</div>

              <div className="phone-row">
                <input className="prefix-input" type="text" defaultValue="+221" />
                <div className={`field no-mb ${focused === 'ph' ? 'on' : ''}`} style={{ flex: 1 }}>
                  <span className="f-icon">📱</span>
                  <input className="yb-input" type="tel" name="phone"
                    value={form.phone} onChange={handleChange}
                    onFocus={() => setFocused('ph')} onBlur={() => setFocused('')}
                    placeholder="Numéro de téléphone" />
                </div>
              </div>

              <button className="btn-next" onClick={handleStep1}>
                Continuer →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="step-body">
              <p className="sec-label">Sécurité</p>

              <div className={`field ${focused === 'pw' ? 'on' : ''}`}>
                <span className="f-icon">🔒</span>
                <input className="yb-input"
                  type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
                  placeholder="Mot de passe (min 6 caractères)" required />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              {form.password && (
                <>
                  <div className="str-row">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="str-seg"
                        style={{ background: i <= strength ? strColors[strength] : undefined }} />
                    ))}
                  </div>
                  <p className="str-label" style={{ color: strColors[strength] }}>
                    {strLabels[strength]}
                  </p>
                </>
              )}

              <div className={`field ${focused === 'cf' ? 'on' : ''}`}>
                <span className="f-icon">🔑</span>
                <input className="yb-input"
                  type={showConf ? 'text' : 'password'} name="confirm"
                  value={form.confirm} onChange={handleChange}
                  onFocus={() => setFocused('cf')} onBlur={() => setFocused('')}
                  placeholder="Confirmer le mot de passe" required />
                <button type="button" className="eye-btn" onClick={() => setShowConf(!showConf)}>
                  {showConf ? '🙈' : '👁️'}
                </button>
              </div>

              {form.confirm && (
                <p className="match-hint" style={{ color: form.password === form.confirm ? '#10b981' : '#ef4444' }}>
                  {form.password === form.confirm ? '✓ Mots de passe identiques' : '✗ Ne correspondent pas'}
                </p>
              )}

              <button className="btn-back" onClick={() => setStep(1)}>← Retour</button>
              <button className="btn-create" onClick={handleSubmit} disabled={loading}>
                {loading ? '⏳ Création...' : 'CRÉER MON COMPTE'}
              </button>
            </div>
          )}

          <p className="login-hint">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;