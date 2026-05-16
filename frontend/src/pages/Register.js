import { useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    role: 'student', password: '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [extraNote, setExtraNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const goToStep2 = e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }
    setStep(2);
  };

  const submit = async e => {
    e.preventDefault();
    if (form.role === 'mentor' && !cvFile) {
      setError('Lütfen CV dosyanızı yükleyin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (cvFile) data.append('cv_file', cvFile);
      if (extraNote) data.append('extra_note', extraNote);
      await API.post('/auth/register/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const msgs = Object.values(detail).map(v => Array.isArray(v) ? v.join(' ') : v).join(' ');
        setError(msgs);
      } else {
        setError('Kayıt başarısız. Bilgileri kontrol edin veya bu kullanıcı adı zaten alınmış olabilir.');
      }
    } finally {
      setLoading(false);
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
          {step === 1 ? (
            <>
              <h2 style={s.panelTitle}>Topluluğumuza Katıl</h2>
              <p style={s.panelSub}>
                Ücretsiz hesap oluştur, alanında uzman mentorlarla hemen tanışmaya başla.
              </p>
              <div style={s.benefitList}>
                {[
                  '✅ Tamamen ücretsiz kayıt',
                  '✅ Yüzlerce uzman mentor',
                  '✅ Doğrulanmış mentor rozetleri',
                  '✅ Doğrudan mesajlaşma',
                  '✅ Puan & yorum sistemi',
                ].map(b => (
                  <div key={b} style={s.benefit}>{b}</div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 style={s.panelTitle}>CV Yükleme</h2>
              <p style={s.panelSub}>
                Mentor başvurunuzu tamamlamak için CV'nizi yükleyin. Admin onayından sonra profiliniz yayınlanacak.
              </p>
              <div style={s.benefitList}>
                {[
                  '📄 PDF veya Word formatında CV',
                  '🔍 Admin tarafından incelenecek',
                  '✅ Onay sonrası doğrulanmış rozet',
                  '⏱️ Genellikle 24-48 saat içinde',
                ].map(b => (
                  <div key={b} style={s.benefit}>{b}</div>
                ))}
              </div>
            </>
          )}

          {/* Adım göstergesi */}
          {form.role === 'mentor' && (
            <div style={s.stepIndicator}>
              <div style={{ ...s.stepDot, ...(step === 1 ? s.stepDotActive : s.stepDotDone) }}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div style={s.stepLine} />
              <div style={{ ...s.stepDot, ...(step === 2 ? s.stepDotActive : {}) }}>2</div>
            </div>
          )}
        </div>
      </div>

      {/* Sağ form paneli */}
      <div style={s.rightPanel}>
        <div style={s.formWrap} className="animate-fade-in-up">
          <div style={s.mobileLogo} onClick={() => navigate('/')}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '14px' }}>M</div>
            <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '17px' }}>Mentonnect</span>
          </div>

          {step === 1 ? (
            <>
              <h1 style={s.formTitle}>Hesap Oluştur</h1>
              <p style={s.formSub}>Platforma katılmak için bilgilerini gir.</p>

              {error && <div style={s.errorBox}><span>⚠️</span> {error}</div>}

              <form onSubmit={form.role === 'mentor' ? goToStep2 : submit}>
                <div style={s.row}>
                  <div style={s.group}>
                    <label style={s.label}>Ad</label>
                    <input style={s.input} name="first_name" placeholder="Adınız" onChange={handle} value={form.first_name} />
                  </div>
                  <div style={s.group}>
                    <label style={s.label}>Soyad</label>
                    <input style={s.input} name="last_name" placeholder="Soyadınız" onChange={handle} value={form.last_name} />
                  </div>
                </div>

                <div style={s.group}>
                  <label style={s.label}>Kullanıcı Adı <span style={s.required}>*</span></label>
                  <input style={s.input} name="username" placeholder="kullanici_adi" onChange={handle} value={form.username} required />
                </div>

                <div style={s.group}>
                  <label style={s.label}>E-posta <span style={s.required}>*</span></label>
                  <input style={s.input} name="email" type="email" placeholder="ornek@mail.com" onChange={handle} value={form.email} required />
                </div>

                <div style={s.group}>
                  <label style={s.label}>Rol <span style={s.required}>*</span></label>
                  <div style={s.roleRow}>
                    {[
                      { value: 'student', icon: '🎓', title: 'Öğrenci', desc: 'Mentor bulmak istiyorum' },
                      { value: 'mentor', icon: '👨‍💼', title: 'Mentor', desc: 'Öğrencilere rehberlik etmek istiyorum' },
                    ].map(r => (
                      <div
                        key={r.value}
                        style={{ ...s.roleCard, ...(form.role === r.value ? s.roleCardActive : {}) }}
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      >
                        <span style={{ fontSize: '22px' }}>{r.icon}</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: form.role === r.value ? '#4f46e5' : '#1e293b' }}>
                            {r.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.desc}</div>
                        </div>
                        {form.role === r.value && <span style={s.roleCheck}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={s.group}>
                  <label style={s.label}>Şifre <span style={s.required}>*</span></label>
                  <input style={s.input} name="password" type="password" placeholder="En az 6 karakter" onChange={handle} value={form.password} required minLength={6} />
                </div>

                <button
                  className="btn-hover"
                  style={{ ...s.submitBtn, opacity: loading ? 0.8 : 1 }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={s.spinner} /> İşleniyor...
                    </span>
                  ) : form.role === 'mentor' ? 'Devam Et → (CV Yükleme)' : 'Ücretsiz Kayıt Ol →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 style={s.formTitle}>CV Yükle</h1>
              <p style={s.formSub}>Mentor başvurunuzu tamamlamak için CV'nizi yükleyin.</p>

              {error && <div style={s.errorBox}><span>⚠️</span> {error}</div>}

              <div style={s.infoBox}>
                <strong>👤 {form.first_name || form.username}</strong> olarak mentor başvurusu yapıyorsunuz.
                CV'niz admin tarafından incelenecek ve onaylanacaktır.
              </div>

              <form onSubmit={submit}>
                <div style={s.group}>
                  <label style={s.label}>CV Dosyası <span style={s.required}>*</span></label>
                  <div
                    style={{
                      ...s.uploadArea,
                      ...(cvFile ? s.uploadAreaDone : {}),
                    }}
                    onClick={() => document.getElementById('cv-input').click()}
                  >
                    <input
                      id="cv-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={e => setCvFile(e.target.files[0] || null)}
                    />
                    {cvFile ? (
                      <>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                        <div style={{ fontWeight: '700', color: '#059669', fontSize: '14px' }}>{cvFile.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          {(cvFile.size / 1024).toFixed(0)} KB · Değiştirmek için tıklayın
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📄</div>
                        <div style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                          CV'nizi buraya tıklayarak seçin
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          PDF, DOC veya DOCX · Maks. 10 MB
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={s.group}>
                  <label style={s.label}>Ek Not <span style={{ color: '#94a3b8', fontWeight: '400' }}>(isteğe bağlı)</span></label>
                  <textarea
                    style={s.textarea}
                    placeholder="Kendiniz hakkında eklemek istediğiniz notlar, uzmanlık alanlarınız..."
                    value={extraNote}
                    onChange={e => setExtraNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    style={s.backBtn}
                    onClick={() => { setStep(1); setError(''); }}
                  >
                    ← Geri
                  </button>
                  <button
                    className="btn-hover"
                    style={{ ...s.submitBtn, flex: 1, marginTop: 0, marginBottom: 0, opacity: loading ? 0.8 : 1 }}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={s.spinner} /> Kayıt Oluşturuluyor...
                      </span>
                    ) : '✅ Başvuruyu Tamamla'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p style={s.switchText}>
            Zaten hesabın var mı?{' '}
            <Link to="/login" style={s.switchLink}>Giriş Yap</Link>
          </p>
          <div style={s.backLink} onClick={() => navigate('/')}>← Ana Sayfaya Dön</div>
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
  decor1: {
    position: 'absolute', top: '-70px', right: '-70px',
    width: '280px', height: '280px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.07)',
  },
  decor2: {
    position: 'absolute', bottom: '-60px', left: '-50px',
    width: '220px', height: '220px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
  },
  logoBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', cursor: 'pointer', marginBottom: '2rem',
  },
  logoIcon: {
    width: '38px', height: '38px',
    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
    color: '#fff', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', fontWeight: '900',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#fff' },
  panelTitle: { fontSize: '1.9rem', fontWeight: '900', color: '#fff', lineHeight: '1.25', marginBottom: '0.75rem' },
  panelSub: { color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.7', marginBottom: '2rem' },
  benefitList: { textAlign: 'left', display: 'inline-block' },
  benefit: { color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '0.6rem', fontWeight: '500' },

  stepIndicator: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0', marginTop: '2rem',
  },
  stepDot: {
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700',
    background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)',
  },
  stepDotActive: { background: '#fff', color: '#4f46e5' },
  stepDotDone: { background: '#a5f3a0', color: '#059669' },
  stepLine: { width: '40px', height: '2px', background: 'rgba(255,255,255,0.3)' },

  rightPanel: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem', background: '#fff', overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: '440px' },
  mobileLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1.75rem' },
  formTitle: { fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '0.4rem', letterSpacing: '-0.5px' },
  formSub: { color: '#94a3b8', fontSize: '14px', marginBottom: '1.5rem' },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', padding: '0.75rem 1rem',
    borderRadius: '10px', fontSize: '14px', marginBottom: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  infoBox: {
    background: '#eef2ff', border: '1px solid #c7d2fe',
    color: '#4338ca', padding: '0.85rem 1rem',
    borderRadius: '10px', fontSize: '13px', lineHeight: '1.6',
    marginBottom: '1.5rem',
  },

  row: { display: 'flex', gap: '1rem' },
  group: { flex: 1, marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  required: { color: '#ef4444' },
  input: {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', fontFamily: "'Inter', sans-serif",
    color: '#1e293b', background: '#fff', boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  textarea: {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', fontFamily: "'Inter', sans-serif",
    color: '#1e293b', background: '#fff', boxSizing: 'border-box',
    resize: 'vertical', outline: 'none',
  },
  uploadArea: {
    border: '2px dashed #c7d2fe', borderRadius: '12px',
    padding: '2rem 1rem', textAlign: 'center',
    cursor: 'pointer', background: '#f8fafc',
    transition: 'border-color 0.15s, background 0.15s',
  },
  uploadAreaDone: {
    border: '2px solid #6ee7b7', background: '#f0fdf4',
  },
  roleRow: { display: 'flex', gap: '0.75rem' },
  roleCard: {
    flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '0.75rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '10px',
    position: 'relative', transition: 'border-color 0.15s, background 0.15s',
  },
  roleCardActive: { borderColor: '#4f46e5', background: '#eef2ff' },
  roleCheck: { position: 'absolute', top: '6px', right: '8px', color: '#4f46e5', fontWeight: '900', fontSize: '13px' },
  submitBtn: {
    width: '100%', padding: '0.85rem',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
    marginTop: '0.5rem', marginBottom: '1.25rem',
  },
  backBtn: {
    padding: '0.85rem 1.25rem',
    background: '#f1f5f9', color: '#64748b',
    border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    marginTop: '0.5rem', marginBottom: '1.25rem',
  },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },
  switchText: { textAlign: 'center', fontSize: '14px', color: '#64748b', marginBottom: '0.75rem', marginTop: '1rem' },
  switchLink: { color: '#4f46e5', fontWeight: '700', textDecoration: 'none' },
  backLink: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' },
};
