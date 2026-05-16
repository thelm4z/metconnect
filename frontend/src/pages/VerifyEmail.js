import { useState, useRef, useEffect } from 'react';
import API from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Geri sayım
  useEffect(() => {
    if (resendCountdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const submit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) { setError('Lütfen 6 haneli kodu eksiksiz girin.'); return; }
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/verify-email/', { email, code });
      setSuccess('E-posta başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login', { state: { verified: true } }), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Doğrulama başarısız. Kodu kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!canResend) return;
    setResendLoading(true);
    setError('');
    try {
      await API.post('/auth/resend-verification/', { email });
      setCanResend(false);
      setResendCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Kod gönderilemedi.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Sol panel */}
      <div className="hero-gradient" style={s.leftPanel}>
        <div style={s.decor1} /><div style={s.decor2} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={s.logoBox} onClick={() => navigate('/')}>
            <div style={s.logoIcon}>M</div>
            <span style={s.logoText}>Mentonnect</span>
          </div>
          <div style={s.bigIcon}>📧</div>
          <h2 style={s.panelTitle}>E-posta Doğrulama</h2>
          <p style={s.panelSub}>
            Hesabınızın güvenliğini sağlamak için e-posta adresinizi doğrulamanız gerekmektedir.
          </p>
          <div style={s.stepList}>
            {[
              '1. Kayıt e-postanızı kontrol edin',
              '2. 6 haneli kodu girin',
              '3. Hesabınıza giriş yapın',
            ].map(step => (
              <div key={step} style={s.step}>{step}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ form */}
      <div style={s.rightPanel}>
        <div style={s.formWrap} className="animate-fade-in-up">
          <div style={s.mobileLogo} onClick={() => navigate('/')}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '14px' }}>M</div>
            <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '17px' }}>Mentonnect</span>
          </div>

          <div style={s.envelope}>✉️</div>
          <h1 style={s.formTitle}>Kodunuzu Girin</h1>
          <p style={s.formSub}>
            <strong>{email || 'e-posta adresinize'}</strong> gönderilen<br />
            6 haneli doğrulama kodunu girin.
          </p>

          {error && <div style={s.errorBox}><span>⚠️</span> {error}</div>}
          {success && <div style={s.successBox}><span>✅</span> {success}</div>}

          {!emailFromState && (
            <div style={s.group}>
              <label style={s.label}>E-posta Adresiniz</label>
              <input
                style={s.input}
                type="email"
                placeholder="ornek@mail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <form onSubmit={submit}>
            <div style={s.codeRow} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  style={{
                    ...s.codeInput,
                    borderColor: d ? '#4f46e5' : '#e2e8f0',
                    background: d ? '#eef2ff' : '#fff',
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              className="btn-hover"
              style={{ ...s.submitBtn, opacity: loading ? 0.8 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={s.spinner} /> Doğrulanıyor...
                </span>
              ) : 'E-postayı Doğrula →'}
            </button>
          </form>

          <div style={s.resendRow}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>Kod gelmedi mi?</span>
            {canResend ? (
              <button
                style={s.resendBtn}
                onClick={resend}
                disabled={resendLoading}
              >
                {resendLoading ? 'Gönderiliyor...' : 'Tekrar Gönder'}
              </button>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                {resendCountdown}s sonra tekrar gönder
              </span>
            )}
          </div>

          <div style={s.hint}>
            💡 Kodu göremiyorsanız spam / gereksiz klasörünü de kontrol edin.<br />
            Geliştirme ortamında kod sunucu terminalinde görünür.
          </div>

          <div style={s.backLink} onClick={() => navigate('/register')}>← Kayıt sayfasına dön</div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  leftPanel: {
    flex: '0 0 40%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '3rem 2.5rem',
    position: 'relative', overflow: 'hidden',
  },
  decor1: { position: 'absolute', top: '-70px', right: '-70px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' },
  decor2: { position: 'absolute', bottom: '-60px', left: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
  logoBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', marginBottom: '2rem' },
  logoIcon: { width: '38px', height: '38px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', border: '1px solid rgba(255,255,255,0.3)' },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#fff' },
  bigIcon: { fontSize: '64px', marginBottom: '1rem' },
  panelTitle: { fontSize: '1.7rem', fontWeight: '900', color: '#fff', marginBottom: '0.75rem' },
  panelSub: { color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.7', marginBottom: '2rem' },
  stepList: { textAlign: 'left', display: 'inline-block' },
  step: { color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '0.6rem', fontWeight: '500' },

  rightPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#fff', overflowY: 'auto' },
  formWrap: { width: '100%', maxWidth: '420px' },
  mobileLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1.75rem' },
  envelope: { fontSize: '52px', textAlign: 'center', marginBottom: '1rem' },
  formTitle: { fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '0.4rem', letterSpacing: '-0.5px', textAlign: 'center' },
  formSub: { color: '#64748b', fontSize: '14px', marginBottom: '1.75rem', textAlign: 'center', lineHeight: '1.6' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' },
  successBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' },
  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', background: '#fff', boxSizing: 'border-box' },

  codeRow: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.75rem' },
  codeInput: {
    width: '52px', height: '60px',
    textAlign: 'center', fontSize: '24px', fontWeight: '700',
    border: '2px solid #e2e8f0', borderRadius: '12px',
    fontFamily: "'Inter', sans-serif", color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  },
  submitBtn: { width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 16px rgba(79,70,229,0.3)', marginBottom: '1.25rem' },
  spinner: { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  resendRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.25rem' },
  resendBtn: { background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: 0 },
  hint: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '12px', color: '#64748b', lineHeight: '1.6', marginBottom: '1.25rem', textAlign: 'center' },
  backLink: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' },
};
