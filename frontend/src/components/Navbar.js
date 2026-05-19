import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const res = await API.get('/messages/unread-count/');
      setUnreadCount(res.data.count || 0);
    } catch {
      // sessizce geç
    }
  };

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 15000);
    return () => clearInterval(intervalRef.current);
  }, [user]); // eslint-disable-line

  // Mesajlar okunduğunda anlık güncelle
  useEffect(() => {
    window.addEventListener('messages-read', fetchUnread);
    return () => window.removeEventListener('messages-read', fetchUnread);
  }, []); // eslint-disable-line

  const isActive = (path) => location.pathname === path;

  const NAV_LINKS = [
    ['/', 'Mentorlar'],
    ['/about', 'Hakkımızda'],
    ['/contact', 'İletişim'],
    ...(user ? [['/messages', '💬 Sohbetler', unreadCount]] : []),
    ...(user ? [['/lessons', '📚 Dersler']] : []),
    ...(user?.is_staff ? [['/admin-panel', '🛡️ Admin']] : []),
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo} onClick={() => navigate('/')}>
          <div style={styles.logoIcon}>M</div>
          <span style={styles.logoText}>Mentonnect</span>
        </div>

        {/* Desktop links */}
        <div style={styles.links}>
          {NAV_LINKS.map(([path, label, badge]) => (
            <span
              key={path}
              style={{ ...styles.link, ...(isActive(path) ? styles.linkActive : {}), position: 'relative' }}
              onClick={() => navigate(path)}
            >
              {label}
              {badge > 0 && (
                <span style={styles.badge}>{badge > 99 ? '99+' : badge}</span>
              )}
            </span>
          ))}
        </div>

        {/* Desktop actions */}
        <div style={styles.actions}>
          {user ? (
            <>
              <div style={{ ...styles.userChip, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                <div style={styles.userAvatar}>{(user.first_name || user.username || '?')[0].toUpperCase()}</div>
                <span style={styles.userName}>{user.first_name || user.username}</span>
              </div>
              <button
                style={styles.btnOutline}
                onClick={logout}
                onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <button
                style={styles.btnOutline}
                onClick={() => navigate('/login')}
                onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                Giriş
              </button>
              <button
                className="btn-hover"
                style={styles.btnFilled}
                onClick={() => navigate('/register')}
              >
                Kayıt Ol
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button style={styles.hamburger} onClick={() => setMenuOpen(o => !o)}>
          <span style={{ ...styles.bar, transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }} />
          <span style={{ ...styles.bar, opacity: menuOpen ? 0 : 1 }} />
          <span style={{ ...styles.bar, transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu} className="animate-fade-in">
          {NAV_LINKS.map(([path, label, badge]) => (
            <div
              key={path}
              style={{ ...styles.mobileLink, ...(isActive(path) ? styles.mobileLinkActive : {}), display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => { navigate(path); setMenuOpen(false); }}
            >
              {label}
              {badge > 0 && (
                <span style={styles.badge}>{badge > 99 ? '99+' : badge}</span>
              )}
            </div>
          ))}
          <div style={styles.mobileDivider} />
          {user ? (
            <div style={styles.mobileLink} onClick={() => { logout(); setMenuOpen(false); }}>Çıkış Yap</div>
          ) : (
            <>
              <div style={styles.mobileLink} onClick={() => { navigate('/login'); setMenuOpen(false); }}>Giriş Yap</div>
              <div style={{ ...styles.mobileLink, color: '#4f46e5', fontWeight: '600' }} onClick={() => { navigate('/register'); setMenuOpen(false); }}>Kayıt Ol</div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 1px 0 #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    fontFamily: "'Inter', sans-serif",
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
  },
  logoIcon: {
    width: '34px',
    height: '34px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
    fontWeight: '900',
    boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
  },
  logoText: {
    fontSize: '19px',
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: '-0.3px',
  },
  links: {
    display: 'flex',
    gap: '0.25rem',
  },
  link: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    padding: '6px 14px',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
  },
  linkActive: {
    color: '#4f46e5',
    background: '#eef2ff',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexShrink: 0,
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8fafc',
    padding: '4px 12px 4px 4px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
  },
  btnOutline: {
    padding: '0.45rem 1.1rem',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s ease',
  },
  btnFilled: {
    padding: '0.45rem 1.1rem',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  bar: {
    display: 'block',
    width: '22px',
    height: '2px',
    background: '#374151',
    borderRadius: '2px',
    transition: 'all 0.2s ease',
  },
  mobileMenu: {
    borderTop: '1px solid #f1f5f9',
    padding: '0.5rem',
    background: '#fff',
  },
  mobileLink: {
    padding: '0.75rem 1rem',
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    borderRadius: '8px',
  },
  mobileLinkActive: {
    color: '#4f46e5',
    background: '#eef2ff',
  },
  mobileDivider: {
    height: '1px',
    background: '#f1f5f9',
    margin: '0.5rem 0',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 5px',
    borderRadius: '9px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    lineHeight: 1,
  },
};
