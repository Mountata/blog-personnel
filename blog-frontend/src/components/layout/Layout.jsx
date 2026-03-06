import { useState, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import FAB from '../ui/FAB';
import useSocket from '../../hooks/useSocket';
import useNotificationStore from '../../store/notificationStore';
import useMessageStore from '../../store/messageStore';

/**
 * New Layout — sidebar pleine hauteur, pas de navbar séparée, FAB flottant.
 * Variables CSS définies ici et propagées via :root.
 */
const Layout = ({ children, showRight = true }) => {
  useSocket();

  const { unreadCount: notifCount, fetchNotifications } = useNotificationStore();
  const { unreadCount: msgCount,   fetchUnreadCount }   = useMessageStore();

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <>
      <style>{`
        /* ── Design Tokens ──────────────────────────────── */
        :root,
        [data-theme="light"] {
          --primary:        #1877f2;
          --primary-subtle: rgba(24, 119, 242, 0.08);
          --primary-hover:  #1461c8;

          --bg:         #f0f2f5;
          --bg-sidebar: #ffffff;
          --bg-card:    #ffffff;
          --bg-input:   #f3f4f6;
          --bg-hover:   #f3f4f6;

          --text:       #0f1419;
          --text-nav:   #444e5a;
          --text-muted: #8899a6;

          --border:     #e4e9ef;

          --sidebar-w:  256px;
          --right-w:    280px;
          --content-max: 680px;

          --font-display: 'Sora', 'Nunito', system-ui, sans-serif;
          --font-body:    'DM Sans', system-ui, sans-serif;
          --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

          --radius-card: 14px;
          --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
        }

        [data-theme="dark"] {
          --primary:        #4f9eff;
          --primary-subtle: rgba(79, 158, 255, 0.12);
          --primary-hover:  #3382e0;

          --bg:         #0d1117;
          --bg-sidebar: #161b22;
          --bg-card:    #1c2128;
          --bg-input:   #21262d;
          --bg-hover:   #21262d;

          --text:       #e6edf3;
          --text-nav:   #8b949e;
          --text-muted: #6e7681;

          --border:     #30363d;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: var(--font-body);
          background: var(--bg);
          color: var(--text);
          transition: background 0.3s, color 0.3s;
        }

        /* Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* Cards */
        .card {
          background: var(--bg-card);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          border: 1px solid var(--border);
        }

        /* Text utilities */
        .text-muted { color: var(--text-muted); }
        .text-primary { color: var(--primary); }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Left Sidebar */}
        <LeftSidebar
          darkMode={darkMode}
          unreadMsg={msgCount}
          unreadNotif={notifCount}
        />

        {/* Main content */}
        <main style={{
          flex: 1,
          marginLeft: 'var(--sidebar-w)',
          marginRight: showRight ? 'var(--right-w)' : 0,
          minHeight: '100vh',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: 'var(--content-max)' }}>
            {children}
          </div>
        </main>

        {/* Right Sidebar */}
        {showRight && <RightSidebar />}
      </div>

      {/* FAB */}
      <FAB darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
    </>
  );
};

export default Layout;