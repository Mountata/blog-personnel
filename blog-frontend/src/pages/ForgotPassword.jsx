import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/* Mêmes cartes que Login */
const CARDS = [
  { icon: '✍️', text: 'Nouvel article publié',   sub: 'il y a 2 min',  color: '#2563eb' },
  { icon: '❤️', text: '142 personnes ont aimé',  sub: 'il y a 5 min',  color: '#ef4444' },
  { icon: '💬', text: 'Nouveau commentaire',      sub: 'il y a 9 min',  color: '#10b981' },
  { icon: '👤', text: 'Nouvel abonné',            sub: 'il y a 14 min', color: '#f59e0b' },
  { icon: '🔁', text: 'Article partagé 89 fois', sub: 'il y a 20 min', color: '#6366f1' },
  { icon: '🌟', text: 'Article en tendance',      sub: 'il y a 28 min', color: '#0ea5e9' },
];

const ForgotPassword = () => {
  const [step,       setStep]     = useState(1); // 1=email 2=otp 3=newpass 4=succès
  const [identifier, setId]       = useState('');
  const [otp,        setOtp]      = useState(['','','','','','']);
  const [newPass,    setNewPass]   = useState('');
  const [confirm,    setConfirm]  = useState('');
  const [showPass,   setShowPass] = useState(false);
  const [loading,    setLoading]  = useState(false);
  const [focused,    setFocused]  = useState('');

  const post = async (url, body) => {
    const res  = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur');
    return data;
  };

  /* Step 1 — envoyer OTP */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error('Entrez votre email');
    setLoading(true);
    try {
      await post('/api/auth/forgot-password', { identifier });
      toast.success('Code envoyé ! Vérifiez votre email.');
      setStep(2);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  /* Step 2 — saisie OTP */
  const handleOtpChange = (val, idx) => {
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Entrez les 6 chiffres');
    setLoading(true);
    try {
      await post('/api/auth/verify-otp', { identifier, otp: code });
      toast.success('Code vérifié !');
      setStep(3);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  /* Step 3 — nouveau mot de passe */
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) return toast.error('Les mots de passe ne correspondent pas');
    if (newPass.length < 6)  return toast.error('Mot de passe trop court (min 6 caractères)');
    setLoading(true);
    try {
      await post('/api/auth/reset-password', { identifier, otp: otp.join(''), newPassword: newPass });
      toast.success('Mot de passe mis à jour !');
      setStep(4);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  /* Force du mot de passe */
  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 6)  s++;
    if (newPass.length >= 10) s++;
    if (/[A-Z]/.test(newPass) && /\d/.test(newPass)) s++;
    if (/[^a-zA-Z0-9]/.test(newPass)) s++;
    return s;
  })();
  const strColor  = ['','#ef4444','#f59e0b','#3b82f6','#10b981'][strength];
  const strLabel  = ['','Faible','Moyen','Fort','Très fort'][strength];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          min-height: 100vh;
          background: #f0f4ff;
          display: grid;
          grid-template-columns: 260px 1fr 260px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative; overflow: hidden;
        }

        /* même fond que Login */
        .fp-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image: radial-gradient(circle, #bfcfff 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.35; pointer-events: none; z-index: 0;
        }
        .fp-root::after {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 500px 400px at 5% 60%, rgba(219,234,254,0.8) 0%, transparent 65%),
            radial-gradient(ellipse 350px 300px at 95% 15%, rgba(209,250,229,0.6) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }

        /* ── Colonnes latérales — cartes animées ── */
        .side-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 11px;
          padding: 40px 14px;
          position: relative; z-index: 1;
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }
        .side-col.right { padding: 40px 14px 40px 10px; }

        @keyframes drift {
          0%   { opacity: 0; transform: translateY(28px); }
          12%  { opacity: 1; transform: translateY(0); }
          82%  { opacity: 1; transform: translateY(-16px); }
          100% { opacity: 0; transform: translateY(-44px); }
        }

        .act-card {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1px solid #e8edf5;
          border-radius: 14px; padding: 11px 13px;
          box-shadow: 0 2px 10px rgba(37,99,235,0.06);
          animation: drift linear infinite; opacity: 0;
        }
        .act-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .act-body { flex: 1; min-width: 0; }
        .act-body strong { display: block; font-size: 12px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .act-body span   { font-size: 10.5px; color: #94a3b8; }
        .act-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Centre ── */
        .fp-center {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 20px; position: relative; z-index: 2;
        }

        .fp-logo {
          font-family: 'Pacifico', cursive;
          font-size: 36px; color: #2563eb; margin-bottom: 28px;
          filter: drop-shadow(0 2px 10px rgba(37,99,235,0.18));
        }

        .fp-card {
          width: 100%; max-width: 400px;
          background: #fff; border: 1px solid #e8edf5;
          border-radius: 22px; padding: 36px 32px;
          box-shadow: 0 8px 40px rgba(37,99,235,0.07), 0 1px 4px rgba(0,0,0,0.04);
        }

        /* progress bar */
        .prog { display: flex; gap: 6px; margin-bottom: 28px; }
        .prog-s {
          flex: 1; height: 3px; border-radius: 2px;
          background: #e8edf5; transition: background 0.3s;
        }
        .prog-s.done   { background: #10b981; }
        .prog-s.active { background: #2563eb; }

        /* step header */
        .step-icon  { font-size: 40px; text-align: center; margin-bottom: 10px; }
        .step-title { font-size: 18px; font-weight: 700; color: #0f172a; text-align: center; margin-bottom: 5px; }
        .step-hint  { font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 24px; line-height: 1.55; }

        /* fields */
        .field { position: relative; margin-bottom: 12px; }
        .f-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          font-size: 14px; color: #94a3b8; pointer-events: none; transition: color 0.2s;
        }
        .field.on .f-icon { color: #2563eb; }

        .yb-input {
          width: 100%; background: #f8fafc;
          border: 1.5px solid #e2e8f0; border-radius: 11px;
          padding: 13px 40px; font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a; outline: none; transition: all 0.18s;
        }
        .yb-input::placeholder { color: #c8d5e8; }
        .yb-input:focus {
          border-color: #2563eb; background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
        }

        /* OTP boxes */
        .otp-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 22px; }
        .otp-box {
          width: 48px; height: 54px;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 12px; text-align: center;
          color: #0f172a; font-size: 22px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none; transition: all 0.18s;
        }
        .otp-box:focus {
          border-color: #2563eb; background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
        }

        /* eye button */
        .eye-btn {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; font-size: 14px; padding: 4px; line-height: 1;
        }
        .eye-btn:hover { color: #64748b; }

        /* strength */
        .str-row { display: flex; gap: 4px; margin: 4px 0; }
        .str-seg { flex: 1; height: 3px; border-radius: 2px; background: #e8edf5; transition: background 0.3s; }
        .str-label { font-size: 11px; margin-bottom: 10px; }

        /* buttons */
        .btn-blue {
          width: 100%; padding: 13.5px;
          background: #2563eb; border: none; border-radius: 11px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
        }
        .btn-blue:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
        .btn-blue:disabled { opacity: 0.55; cursor: not-allowed; }

        .btn-green {
          width: 100%; padding: 13.5px;
          background: #10b981; border: none; border-radius: 11px;
          color: #fff; font-size: 14px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(16,185,129,0.28);
          text-decoration: none; display: block; text-align: center;
        }
        .btn-green:hover { background: #059669; transform: translateY(-1px); }

        .resend-btn {
          background: none; border: none; color: #2563eb;
          font-size: 12.5px; font-weight: 500; cursor: pointer;
          display: block; margin: 12px auto 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .resend-btn:hover { text-decoration: underline; }

        .back-link {
          display: block; text-align: center;
          color: #94a3b8; font-size: 13px;
          margin-top: 20px; text-decoration: none;
        }
        .back-link:hover { color: #64748b; }

        .match-hint { font-size: 11.5px; margin: -6px 0 10px; }

        /* success box */
        .success-box {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 14px; padding: 20px; text-align: center;
          margin-bottom: 20px;
        }
        .success-box p { font-size: 13.5px; color: #166534; line-height: 1.5; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-body { animation: slideIn 0.25s ease; }

        @media (max-width: 860px) {
          .fp-root { grid-template-columns: 1fr; }
          .side-col { display: none; }
        }
      `}</style>

      <div className="fp-root">

        {/* Colonne gauche */}
        <div className="side-col">
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

        {/* Centre — formulaire */}
        <div className="fp-center">
          <div className="fp-logo">Your'Blog</div>

          <div className="fp-card">
            {/* Barre de progression */}
            <div className="prog">
              {[1,2,3].map(i => (
                <div key={i} className={`prog-s ${step > i ? 'done' : step === i ? 'active' : ''}`} />
              ))}
            </div>

            {/* ── Step 1 — Email ── */}
            {step === 1 && (
              <div className="step-body">
                <div className="step-icon">🔐</div>
                <h2 className="step-title">Mot de passe oublié ?</h2>
                <p className="step-hint">
                  Entrez votre adresse email. Nous vous enverrons un code de vérification.
                </p>
                <form onSubmit={handleSend}>
                  <div className={`field ${focused === 'em' ? 'on' : ''}`}>
                    <span className="f-icon">✉️</span>
                    <input className="yb-input" type="email"
                      value={identifier} onChange={e => setId(e.target.value)}
                      onFocus={() => setFocused('em')} onBlur={() => setFocused('')}
                      placeholder="Votre adresse email" required />
                  </div>
                  <button className="btn-blue" type="submit" disabled={loading}>
                    {loading ? '⏳ Envoi en cours...' : 'Envoyer le code'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 2 — OTP ── */}
            {step === 2 && (
              <div className="step-body">
                <div className="step-icon">📧</div>
                <h2 className="step-title">Vérifiez votre email</h2>
                <p className="step-hint">
                  Code envoyé à<br />
                  <strong style={{ color: '#0f172a' }}>{identifier}</strong>
                </p>
                <form onSubmit={handleVerify}>
                  <div className="otp-row">
                    {otp.map((v, i) => (
                      <input key={i} id={`otp-${i}`} className="otp-box"
                        type="text" inputMode="numeric" maxLength={1} value={v}
                        onChange={e => handleOtpChange(e.target.value, i)}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0)
                            document.getElementById(`otp-${i - 1}`)?.focus();
                        }} />
                    ))}
                  </div>
                  <button className="btn-blue" type="submit" disabled={loading}>
                    {loading ? '⏳ Vérification...' : 'Vérifier le code'}
                  </button>
                  <button type="button" className="resend-btn"
                    onClick={() => { setStep(1); setOtp(['','','','','','']); }}>
                    Renvoyer le code
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 3 — Nouveau mot de passe ── */}
            {step === 3 && (
              <div className="step-body">
                <div className="step-icon">🔑</div>
                <h2 className="step-title">Nouveau mot de passe</h2>
                <p className="step-hint">Choisissez un mot de passe sécurisé.</p>
                <form onSubmit={handleReset}>
                  <div className={`field ${focused === 'np' ? 'on' : ''}`}>
                    <span className="f-icon">🔒</span>
                    <input className="yb-input"
                      type={showPass ? 'text' : 'password'}
                      value={newPass} onChange={e => setNewPass(e.target.value)}
                      onFocus={() => setFocused('np')} onBlur={() => setFocused('')}
                      placeholder="Nouveau mot de passe" required />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {newPass && (
                    <>
                      <div className="str-row">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="str-seg"
                            style={{ background: i <= strength ? strColor : undefined }} />
                        ))}
                      </div>
                      <p className="str-label" style={{ color: strColor }}>{strLabel}</p>
                    </>
                  )}

                  <div className={`field ${focused === 'cf' ? 'on' : ''}`}>
                    <span className="f-icon">✅</span>
                    <input className="yb-input"
                      type={showPass ? 'text' : 'password'}
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      onFocus={() => setFocused('cf')} onBlur={() => setFocused('')}
                      placeholder="Confirmer le mot de passe" required />
                  </div>

                  {confirm && (
                    <p className="match-hint"
                      style={{ color: newPass === confirm ? '#10b981' : '#ef4444' }}>
                      {newPass === confirm ? '✓ Mots de passe identiques' : '✗ Ne correspondent pas'}
                    </p>
                  )}

                  <button className="btn-blue" type="submit" disabled={loading}>
                    {loading ? '⏳ Mise à jour...' : 'Réinitialiser le mot de passe'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 4 — Succès ── */}
            {step === 4 && (
              <div className="step-body">
                <div className="step-icon">🎉</div>
                <h2 className="step-title">Mot de passe mis à jour !</h2>
                <div className="success-box">
                  <p>Votre mot de passe a été réinitialisé avec succès.<br />
                  Un email de confirmation vous a été envoyé.</p>
                </div>
                <Link to="/login" className="btn-green">
                  Se connecter maintenant
                </Link>
              </div>
            )}

            {step < 4 && (
              <Link to="/login" className="back-link">← Retour à la connexion</Link>
            )}
          </div>
        </div>

        {/* Colonne droite — mêmes cartes décalées */}
        <div className="side-col right">
          {[...CARDS].reverse().map((c, i) => (
            <div key={i} className="act-card"
              style={{ animationDelay: `${i * 1.3 + 0.7}s`, animationDuration: '10s' }}>
              <div className="act-icon" style={{ background: `${c.color}18` }}>{c.icon}</div>
              <div className="act-body">
                <strong>{c.text}</strong>
                <span>{c.sub}</span>
              </div>
              <div className="act-dot" style={{ background: c.color }} />
            </div>
          ))}
        </div>

      </div>
    </>
  );
};

export default ForgotPassword;