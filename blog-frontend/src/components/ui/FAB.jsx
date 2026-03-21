import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, ArrowLeftIcon, MoonIcon, SunIcon, EditIcon } from '../../Icons';

const FAB = ({ darkMode, onToggleDark }) => {
  const navigate = useNavigate();
  const [open,     setOpen]     = useState(false);
  // ✅ lazy initializer instead of useEffect + setPos
  const [pos,      setPos]      = useState(() => ({
    x: window.innerWidth  - 76,
    y: window.innerHeight - 96,
  }));
  const [dragging, setDragging] = useState(false);
  const dragStart  = useRef(null);
  const fabRef     = useRef(null);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    setDragging(false);

    const onMove = (ev) => {
      const dx = Math.abs(ev.clientX - dragStart.current.mx);
      const dy = Math.abs(ev.clientY - dragStart.current.my);
      if (dx > 4 || dy > 4) setDragging(true);
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - 58, dragStart.current.px + ev.clientX - dragStart.current.mx)),
        y: Math.max(0, Math.min(window.innerHeight - 58, dragStart.current.py + ev.clientY - dragStart.current.my)),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      setTimeout(() => setDragging(false), 50);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  const handleMainClick = () => { if (!dragging) setOpen(o => !o); };

  const actions = [
    { icon: <ArrowLeftIcon size={19} />, tip: 'Retour',            onClick: () => { navigate(-1); setOpen(false); } },
    { icon: darkMode ? <SunIcon size={19} /> : <MoonIcon size={19} />, tip: darkMode ? 'Mode clair' : 'Mode sombre', onClick: () => { onToggleDark(); setOpen(false); } },
    { icon: <EditIcon size={19} />,      tip: 'Nouvel article',    onClick: () => { navigate('/articles/new'); setOpen(false); } },
  ];

  return (
    <div
      ref={fabRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, userSelect: 'none', touchAction: 'none' }}
      onMouseDown={onMouseDown}
    >
      {/* Satellites */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, pointerEvents: open ? 'all' : 'none' }}>
        {actions.map((a, i) => {
          const positions = [
            { bottom: 68, right: 6  },
            { bottom: 52, right: 58 },
            { bottom: 6,  right: 68 },
          ];
          return (
            <button
              key={i}
              onClick={a.onClick}
              title={a.tip}
              style={{
                position: 'absolute',
                ...positions[i],
                width: 46, height: 46, borderRadius: '50%',
                background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transform: open ? 'scale(1)' : 'scale(0)',
                opacity: open ? 1 : 0,
                transition: `transform 0.3s cubic-bezier(.34,1.56,.64,1) ${i * 0.04}s, opacity 0.25s ${i * 0.04}s`,
              }}
              className="fab-sat"
            >
              {a.icon}
            </button>
          );
        })}
      </div>

      {/* Main button */}
      <button
        onClick={handleMainClick}
        style={{
          width: 58, height: 58, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(24,119,242,0.5)',
          position: 'relative', zIndex: 2,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        className="fab-main"
      >
        <PlusIcon size={24} style={{ transition: 'transform 0.25s', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }} />
      </button>

      <style>{`
        .fab-main:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(24,119,242,0.6) !important; }
        .fab-sat:hover { background: var(--primary-subtle) !important; color: var(--primary) !important; }
      `}</style>
    </div>
  );
};

export default FAB;
