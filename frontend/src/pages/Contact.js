import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function Contact() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/contact/', {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero-gradient" style={s.hero}>
        <div style={s.decor1} />
        <div style={s.decor2} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '620px', margin: '0 auto' }}>
          <span className="animate-fade-in-up delay-1" style={s.badge}>İletişim</span>
          <h1 className="animate-fade-in-up delay-2" style={s.heroTitle}>
            Sizinle Konuşmaktan<br />Mutluluk Duyarız
          </h1>
          <p className="animate-fade-in-up delay-3" style={s.heroSub}>
            Sorularınız, önerileriniz veya iş birliği fikirleriniz için<br />bize yazın, en kısa sürede geri dönelim.
          </p>
        </div>
      </section>

      {/* ── Main content ── */}
      <section style={s.main}>
        <div style={s.inner}>
          <div style={s.grid}>

            {/* ── Contact info cards ── */}
            <div style={s.infoCol}>
              <h2 style={s.colTitle}>Bize Ulaşın</h2>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', marginBottom: '2rem' }}>
                Mentonnect ekibine aşağıdaki kanallar aracılığıyla ulaşabilir ya da formu doldurarak mesaj gönderebilirsiniz.
              </p>

              {[
                {
                  icon: '📧',
                  title: 'E-posta',
                  value: 'destek@mentonnect.com',
                  sub: 'Genellikle 24 saat içinde yanıt veririz',
                  color: '#eef2ff',
                  accent: '#4f46e5',
                },
                {
                  icon: '💬',
                  title: 'Canlı Destek',
                  value: 'Chatbot ile anında yardım',
                  sub: 'Sağ alttaki asistanı kullanabilirsiniz',
                  color: '#f0fdf4',
                  accent: '#059669',
                },
                {
                  icon: '📍',
                  title: 'Konum',
                  value: 'Malatya, Türkiye',
                  sub: 'Teknopark Istanbul Ofisi',
                  color: '#fdf4ff',
                  accent: '#7c3aed',
                },
                {
                  icon: '🕐',
                  title: 'Çalışma Saatleri',
                  value: 'Hafta içi 09:00 – 18:00',
                  sub: 'Hafta sonu bazen geç yanıt verebiliriz',
                  color: '#fffbeb',
                  accent: '#d97706',
                },
              ].map((c, i) => (
                <div key={i} className="animate-fade-in-up" style={{ ...s.infoCard, background: c.color, animationDelay: `${i * 0.1}s` }}>
                  <div style={{ ...s.infoIconWrap, color: c.accent }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: c.accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>{c.value}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.sub}</div>
                  </div>
                </div>
              ))}

              {/* Social / quick links */}
              <div style={s.faqHint}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <div>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', marginBottom: '3px' }}>Sıkça Sorulan Sorular</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Cevabınızı bulamadınız mı?{' '}
                    <span style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/about')}>
                      Hakkımızda sayfamızı
                    </span>{' '}
                    inceleyin.
                  </div>
                </div>
              </div>
            </div>

            {/* ── Form ── */}
            <div style={s.formCol}>
              {sent ? (
                <div className="animate-scale-in" style={s.successBox}>
                  <div style={s.successIcon}>✅</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Mesajınız Alındı!
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                    En kısa sürede size geri döneceğiz.<br />İlginiz için teşekkür ederiz.
                  </p>
                  <button
                    className="btn-hover"
                    style={s.primaryBtn}
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  >
                    Yeni Mesaj Gönder
                  </button>
                </div>
              ) : (
                <div style={s.formCard}>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Mesaj Gönder
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '1.75rem' }}>
                    Formu doldurun, size en kısa sürede geri dönelim.
                  </p>

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1.25rem' }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <form onSubmit={submit}>
                    <div style={s.formRow}>
                      <div style={s.formGroup}>
                        <label style={s.label}>Adınız Soyadınız</label>
                        <input
                          style={s.input}
                          name="name"
                          placeholder="Ali Veli"
                          value={form.name}
                          onChange={handle}
                          required
                        />
                      </div>
                      <div style={s.formGroup}>
                        <label style={s.label}>E-posta Adresiniz</label>
                        <input
                          style={s.input}
                          name="email"
                          type="email"
                          placeholder="ali@ornek.com"
                          value={form.email}
                          onChange={handle}
                          required
                        />
                      </div>
                    </div>

                    <div style={s.formGroup}>
                      <label style={s.label}>Konu</label>
                      <select
                        style={s.input}
                        name="subject"
                        value={form.subject}
                        onChange={handle}
                        required
                      >
                        <option value="">Konu seçiniz...</option>
                        <option value="genel">Genel Soru</option>
                        <option value="mentor">Mentor Olmak İstiyorum</option>
                        <option value="teknik">Teknik Destek</option>
                        <option value="is">İş Birliği / Ortaklık</option>
                        <option value="oneri">Öneri / Geri Bildirim</option>
                        <option value="diger">Diğer</option>
                      </select>
                    </div>

                    <div style={s.formGroup}>
                      <label style={s.label}>Mesajınız</label>
                      <textarea
                        style={{ ...s.input, height: '140px', resize: 'vertical' }}
                        name="message"
                        placeholder="Mesajınızı buraya yazınız..."
                        value={form.message}
                        onChange={handle}
                        required
                      />
                    </div>

                    <button
                      className="btn-hover"
                      style={{ ...s.primaryBtn, width: '100%', opacity: loading ? 0.75 : 1 }}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={s.spinner} />
                          Gönderiliyor...
                        </span>
                      ) : (
                        'Mesajı Gönder →'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ ...s.main, background: '#fff', paddingTop: '4rem', paddingBottom: '5rem' }}>
        <div style={s.inner}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={s.pillDark}>SSS</span>
            <h2 style={s.sectionTitle}>Sıkça Sorulan Sorular</h2>
          </div>
          <div style={s.faqGrid}>
            {[
              { q: 'Platforma kayıt ücretsiz mi?', a: 'Evet, Mentonnect\'e kayıt olmak tamamen ücretsizdir. Hem öğrenci hem de mentor olarak ücretsiz hesap oluşturabilirsiniz.' },
              { q: 'Nasıl mentor olabilirim?', a: 'Kayıt olurken "Mentor" rolünü seçin, profilinizi oluşturun ve biyografinizi, uzmanlık alanlarınızı ekleyin. Doğrulanmış mentor rozeti için iletişime geçiniz.' },
              { q: 'Mentorlara nasıl mesaj gönderebilirim?', a: 'Platforma giriş yaptıktan sonra herhangi bir mentor profiline gidin ve mesaj kutusundan direkt iletişim kurabilirsiniz.' },
              { q: 'Doğrulanmış Mentor rozeti nedir?', a: 'Ekibimiz tarafından kimliği ve uzmanlığı onaylanan mentorlara verilen özel bir rozettir. Güvenilir mentor arayışında size yardımcı olur.' },
              { q: 'Yorum yapabilmek için giriş yapmam gerekiyor mu?', a: 'Evet, yorum yazmak için platforma giriş yapmanız gerekmektedir. Yorumları okumak için giriş gerekmez.' },
              { q: 'Bir sorunu nasıl bildirebilirim?', a: 'Bu sayfadaki formu doldurabilir ya da destek@mentonnect.com adresine e-posta gönderebilirsiniz.' },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerLogo}>Mentonnect</span>
          <div style={s.footerLinks}>
            {[['/', 'Mentorlar'], ['/about', 'Hakkımızda'], ['/contact', 'İletişim']].map(([path, label]) => (
              <span key={path} style={s.footerLink} onClick={() => navigate(path)}>{label}</span>
            ))}
          </div>
        </div>
        <div style={s.footerBottom}>
          © {new Date().getFullYear()} Mentonnect. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...s.faqCard, border: open ? '1.5px solid #c7d2fe' : '1.5px solid #e2e8f0' }}>
      <div style={s.faqQuestion} onClick={() => setOpen(o => !o)}>
        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{question}</span>
        <span style={{ ...s.faqChevron, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>
      {open && (
        <div className="animate-fade-in" style={s.faqAnswer}>
          {answer}
        </div>
      )}
    </div>
  );
}

const s = {
  hero: {
    position: 'relative',
    padding: '5.5rem 2rem 4.5rem',
    overflow: 'hidden',
  },
  decor1: {
    position: 'absolute', top: '-70px', right: '-70px',
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
  },
  decor2: {
    position: 'absolute', bottom: '-80px', left: '-50px',
    width: '250px', height: '250px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '1.2rem',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  heroTitle: {
    fontSize: '2.8rem',
    fontWeight: '900',
    color: '#fff',
    marginBottom: '1rem',
    lineHeight: '1.15',
    letterSpacing: '-1px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: '16px',
    lineHeight: '1.7',
  },

  main: { padding: '5rem 2rem' },
  inner: { maxWidth: '1100px', margin: '0 auto' },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: '3.5rem',
    alignItems: 'start',
  },

  infoCol: {},
  colTitle: { fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' },
  infoCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '1.1rem 1.25rem',
    borderRadius: '14px',
    marginBottom: '1rem',
  },
  infoIconWrap: { fontSize: '24px', marginTop: '2px', flexShrink: 0 },

  faqHint: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginTop: '1.5rem',
  },

  formCol: {},
  formCard: {
    background: '#fff',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },

  formRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  formGroup: { flex: 1, minWidth: '200px', marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#1e293b',
    background: '#fff',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box',
  },

  primaryBtn: {
    padding: '0.85rem 2rem',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
  },

  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },

  successBox: {
    background: '#fff',
    borderRadius: '20px',
    padding: '3rem 2.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  successIcon: { fontSize: '52px', marginBottom: '1rem' },

  pillDark: {
    display: 'inline-block',
    background: '#eef2ff',
    color: '#4f46e5',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.9rem',
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },

  faqGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
    gap: '1rem',
  },
  faqCard: {
    background: '#f8fafc',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'border-color 0.15s ease',
  },
  faqQuestion: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.1rem 1.25rem',
    cursor: 'pointer',
    gap: '1rem',
  },
  faqChevron: {
    color: '#4f46e5',
    fontSize: '18px',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
  },
  faqAnswer: {
    padding: '0 1.25rem 1.1rem',
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.7',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '0.75rem',
  },

  footer: { background: '#0f172a', padding: '2.5rem 2rem 0' },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    paddingBottom: '2rem',
  },
  footerLogo: { fontSize: '18px', fontWeight: '800', color: '#fff' },
  footerLinks: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  footerLink: { color: '#64748b', fontSize: '14px', cursor: 'pointer' },
  footerBottom: {
    maxWidth: '1100px',
    margin: '0 auto',
    paddingTop: '1.5rem',
    paddingBottom: '1.5rem',
    borderTop: '1px solid #1e293b',
    color: '#475569',
    fontSize: '13px',
    textAlign: 'center',
  },
};
