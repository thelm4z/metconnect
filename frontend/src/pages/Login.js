import { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ROLES = [
  { key: 'student', label: 'Öğrenci', icon: '🎓' },
  { key: 'mentor',  label: 'Mentor',  icon: '👨‍💼' },
  { key: 'admin',   label: 'Admin',   icon: '🛡️' },
];

export default function Login() {
  const location = useLocation();
  const verifiedMsg = location.state?.verified
    ? 'E-posta başarıyla doğrulandı! Artık giriş yapabilirsiniz.'
    : '';

  const [selectedRole, setSelectedRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Zaten giriş yapıldıysa ana sayfaya yönlendir
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Hata mesajını 6 saniye sonra otomatik kapat
  
  useEffect(() => {
    if (!error) return;
    setEmailNotVerified(false);
    const t = setTimeout(() => setError(''), 6000);
    return () => clearTimeout(t);
  }, [error]);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/login/', form);
      const me = await API.get('/auth/me/', {
        headers: { Authorization: 'Bearer ' + res.data.access },
      });

      // Seçilen rol ile gerçek rol eşleşmeli
      if (selectedRole === 'admin' && !me.data.is_staff) {
        setError('Bu hesabın admin yetkisi yok.');
        setFailCount(f => f + 1);
        return;
      }
      if (selectedRole === 'mentor' && me.data.role !== 'mentor') {
        setError('Bu hesap mentor değil. Lütfen doğru giriş türünü seçin.');
        setFailCount(f => f + 1);
        return;
      }
      if (selectedRole === 'student' && me.data.role !== 'student') {
        setError('Bu hesap öğrenci değil. Lütfen doğru giriş türünü seçin.');
        setFailCount(f => f + 1);
        return;
      }

      login(me.data, res.data.access, res.data.refresh);

      // Rol bazlı yönlendirme
      if (selectedRole === 'admin' && me.data.is_staff) {
        navigate('/admin-panel');
      } else if (me.data.role === 'mentor') {
        navigate('/profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      const data = err.response?.data;
      const detail = Array.isArray(data?.detail) ? data.detail[0] : data?.detail;
      const newFail = failCount + 1;
      setFailCount(newFail);
      let msg = typeof detail === 'string' ? detail : 'Kullanıcı adı veya şifre hatalı.';
      if (typeof detail === 'string' && detail.includes('doğrulanmamış')) {
        setEmailNotVerified(true);
      }
      if (newFail >= 3 && !detail?.includes('doğrulanmamış')) msg += ` (${newFail}. hatalı deneme — şifrenizi kontrol edin)`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Sol panel */}
      <div className="hero-gradient" style={s.leftPanel}>
        <div style={s.panelDecor1} />
        <div style={s.panelDecor2} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="animate-float" style={s.logoBox} onClick={() => navigate('/')}>
            <div style={s.logoIcon}>M</div>
            <span style={s.logoText}>Mentonnect</span>
          </div>
          <h2 style={s.panelTitle}>Mentorunu Bul,<br />Kariyerine Yön Ver</h2>
          <p style={s.panelSub}>
            Türkiye'nin önde gelen mentorluk platformuna<br />hoş geldiniz.
          </p>
          <div style={s.panelStats}>
            {[['20+', 'Uzman Mentor'], ['50+', 'Mutlu Öğrenci'], ['%100', 'Ücretsiz']].map(([n, l]) => (
              <div key={l} style={s.panelStat}>
                <div style={s.panelStatNum}>{n}</div>
                <div style={s.panelStatLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ form */}
      <div style={s.rightPanel}>
        <div style={s.formWrap} className="animate-fade-in-up">
          <div style={s.mobileLogo} onClick={() => navigate('/')}>
            <div style={{ ...s.logoIcon, width: '28px', height: '28px', fontSize: '14px' }}>M</div>
            <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '17px' }}>Mentonnect</span>
          </div>

          <h1 style={s.formTitle}>Tekrar Hoş Geldin!</h1>
          <p style={s.formSub}>Giriş türünü seç ve bilgilerini gir.</p>

          {/* Rol seçimi */}
          <div style={s.roleRow}>
            {ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                style={{ ...s.roleBtn, ...(selectedRole === r.key ? s.roleBtnActive : {}) }}
                onClick={() => setSelectedRole(r.key)}
              >
                <span style={{ fontSize: '20px' }}>{r.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.label}</span>
              </button>
            ))}
          </div>

          {verifiedMsg && (
            <div style={s.successBox}><span>✅</span> {verifiedMsg}</div>
          )}

          {error && (
            <div style={s.errorBox}>
              <span>⚠️</span>
              <span>
                {error}
                {emailNotVerified && (
                  <span>
                    {' '}&rarr;{' '}
                    <Link to="/verify-email" style={{ color: '#dc2626', fontWeight: '700' }}>
                      Doğrulama sayfasına git
                    </Link>
                  </span>
                )}
              </span>
            </div>
          )}

          <form onSubmit={submit}>
            <div style={s.group}>
              <label style={s.label}>Kullanıcı Adı</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>👤</span>
                <input
                  style={s.input}
                  name="username"
                  placeholder="kullanici_adi"
                  onChange={handle}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={s.group}>
              <label style={s.label}>Şifre</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>🔒</span>
                <input
                  style={s.input}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={handle}
                  required
                />
              </div>
            </div>

            <button
              className="btn-hover"
              style={{ ...s.submitBtn, opacity: loading ? 0.8 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={s.spinner} /> Giriş Yapılıyor...
                </span>
              ) : `${ROLES.find(r => r.key === selectedRole)?.icon} ${ROLES.find(r => r.key === selectedRole)?.label} Olarak Giriş Yap`}
            </button>
          </form>

          <p style={s.switchText}>
            Henüz hesabın yok mu?{' '}
            <Link to="/register" style={s.switchLink}>Ücretsiz Kayıt Ol</Link>
          </p>

          <div style={s.backLink} onClick={() => navigate('/')}>
            ← Ana Sayfaya Dön
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  leftPanel: {
    flex: '0 0 42%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '3rem 2rem', position: 'relative', overflow: 'hidden',
  },
  panelDecor1: { position: 'absolute', top: '-80px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' },
  panelDecor2: { position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
  logoBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '2.5rem' },
  logoIcon: { width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', border: '1px solid rgba(255,255,255,0.3)' },
  logoText: { fontSize: '22px', fontWeight: '800', color: '#fff' },
  panelTitle: { fontSize: '2rem', fontWeight: '900', color: '#fff', lineHeight: '1.25', marginBottom: '0.75rem', letterSpacing: '-0.5px' },
  panelSub: { color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.7', marginBottom: '2.5rem' },
  panelStats: { display: 'flex', gap: '1.5rem', justifyContent: 'center' },
  panelStat: { textAlign: 'center' },
  panelStatNum: { fontSize: '1.6rem', fontWeight: '900', color: '#fff' },
  panelStatLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: '#fff' },
  formWrap: { width: '100%', maxWidth: '420px' },
  mobileLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem' },

  formTitle: { fontSize: '26px', fontWeight: '900', color: '#1e293b', marginBottom: '0.4rem', letterSpacing: '-0.5px' },
  formSub: { color: '#94a3b8', fontSize: '14px', marginBottom: '1.5rem' },

  roleRow: { display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' },
  roleBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '0.75rem 0.5rem', borderRadius: '12px',
    border: '2px solid #e2e8f0', background: '#f8fafc',
    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease',
  },
  roleBtnActive: {
    borderColor: '#4f46e5', background: '#eef2ff', color: '#4f46e5',
  },

  successBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' },

  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  inputWrap: { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
  inputIcon: { padding: '0 12px', fontSize: '16px', background: '#f8fafc', borderRight: '1.5px solid #e2e8f0', alignSelf: 'stretch', display: 'flex', alignItems: 'center' },
  input: { flex: 1, padding: '0.75rem 1rem', border: 'none', outline: 'none', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', background: 'transparent' },

  submitBtn: { width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 16px rgba(79,70,229,0.3)', marginTop: '0.5rem', marginBottom: '1.25rem' },
  spinner: { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },

  switchText: { textAlign: 'center', fontSize: '14px', color: '#64748b', marginBottom: '1rem' },
  switchLink: { color: '#4f46e5', fontWeight: '700', textDecoration: 'none' },
  backLink: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', marginTop: '0.5rem' },
};
