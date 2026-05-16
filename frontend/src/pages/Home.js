import { useEffect, useState, useRef } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';

const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#059669', '#2563eb',
  '#d97706', '#dc2626', '#0891b2', '#db2777',
];
const getColor = (str) =>
  AVATAR_COLORS[(str ? str.charCodeAt(0) : 0) % AVATAR_COLORS.length];

/* Animated counter that starts when visible */
function StatCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const step = Math.max(1, Math.ceil(target / 40));
          let cur = 0;
          const timer = setInterval(() => {
            cur += step;
            if (cur >= target) { setCount(target); clearInterval(timer); }
            else setCount(cur);
          }, 28);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home() {
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const mentorGridRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchMentors = async (s, t) => {
    setLoading(true);
    try {
      const params = {};
      if (s) params.search = s;
      if (t) params.tag = t;
      const res = await API.get('/mentors/', { params });
      setMentors(res.data.results || res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors('', ''); }, []); // eslint-disable-line

  // Harf girilince 400ms bekle sonra ara (debounce)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMentors(val, tag);
    }, 400);
  };

  const handleTagChange = (e) => {
    const val = e.target.value;
    setTag(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMentors(search, val);
    }, 400);
  };

  const scrollToGrid = () => {
    mentorGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMentors(search, tag);
    scrollToGrid();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero-gradient" style={s.hero}>
        <div style={s.heroDecor1} />
        <div style={s.heroDecor2} />
        <div style={s.heroDecor3} />

        <div style={s.heroContent}>
          <div className="animate-fade-in-up delay-1" style={s.heroBadge}>
            <span style={{ marginRight: '6px' }}>🚀</span> Türkiye'nin Mentor Platformu
          </div>

          <h1 className="animate-fade-in-up delay-2" style={s.heroTitle}>
            Seni geliştirecek<br />
            <span style={s.heroTitleAccent}>mentoru bul</span>
          </h1>

          <p className="animate-fade-in-up delay-3" style={s.heroSub}>
            Alanında uzman mentorlarla bağlantı kur,<br />kariyerinde hızla ilerle
          </p>

          <form className="animate-fade-in-up delay-4" style={s.searchForm} onSubmit={handleSearch}>
            <div style={s.searchBox}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.searchInput}
                placeholder="Mentor ara (isim, alan, teknoloji...)"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); fetchMentors(search, tag); scrollToGrid(); } }}
              />
              <div style={s.searchDivider} />
              <span style={s.searchIcon}>🏷️</span>
              <input
                style={s.searchInput}
                placeholder="Etiket (python, react...)"
                value={tag}
                onChange={handleTagChange}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); fetchMentors(search, tag); scrollToGrid(); } }}
              />
              <button className="btn-hover" style={s.searchBtn} type="submit">Ara</button>
            </div>
          </form>

          <div className="animate-fade-in-up delay-5" style={s.heroCTA}>
            {!user && (
              <button
                style={s.ctaSecondary}
                onClick={() => navigate('/register')}
              >
                Ücretsiz Kayıt Ol →
              </button>
            )}
            <button
              style={s.ctaGhost}
              onClick={() => navigate('/about')}
            >
              Nasıl Çalışır?
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={s.statsSection}>
        {[
          { value: 20, suffix: '+', label: 'Aktif Mentor', icon: '👨‍💼' },
          { value: 50, suffix: '+', label: 'Kayıtlı Öğrenci', icon: '🎓' },
          { value: 12, suffix: '+', label: 'Uzmanlık Alanı', icon: '🎯' },
          { value: 98, suffix: '%', label: 'Memnuniyet', icon: '⭐' },
        ].map((st, i) => (
          <div key={i} style={{ ...s.statCard, borderRight: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={s.statIcon}>{st.icon}</div>
            <div style={s.statNum}><StatCounter target={st.value} suffix={st.suffix} /></div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </section>

      {/* ── How it works ── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionHeader}>
            <span style={s.pill}>Nasıl Çalışır?</span>
            <h2 style={s.sectionTitle}>3 Adımda Mentor Bul</h2>
            <p style={s.sectionSub}>
              Platforma katılmak ve mentor bulmak çok kolay
            </p>
          </div>

          <div style={s.stepsRow}>
            {[
              {
                icon: '👤',
                step: '01',
                title: 'Hesap Oluştur',
                desc: 'Ücretsiz kayıt ol. Öğrenci veya mentor olarak platforma katıl, profilini tamamla.',
                color: '#eef2ff',
                accent: '#4f46e5',
              },
              {
                icon: '🔍',
                step: '02',
                title: 'Mentoru Keşfet',
                desc: 'Uzmanlık alanına, deneyime ve puanlara göre mentorları filtrele, profillerini incele.',
                color: '#f0fdf4',
                accent: '#059669',
              },
              {
                icon: '💬',
                step: '03',
                title: 'Bağlantıya Geç',
                desc: 'Mentoruna direkt mesaj gönder, yorum yaz ve birlikte büyümeye başla.',
                color: '#fdf4ff',
                accent: '#7c3aed',
              },
            ].map((step, i) => (
              <div key={i} className="animate-scale-in" style={{ ...s.stepCard, background: step.color }}>
                <div style={{ ...s.stepNumBadge, background: step.accent }}>{step.step}</div>
                <div style={s.stepEmoji}>{step.icon}</div>
                <h3 style={{ ...s.stepTitle, color: step.accent }}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mentors grid ── */}
      <section style={{ ...s.section, background: '#fff' }} ref={mentorGridRef}>
        <div style={s.sectionInner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={s.pill}>Mentorlarımız</span>
              <h2 style={{ ...s.sectionTitle, textAlign: 'left', marginTop: '0.75rem' }}>
                {loading ? 'Yükleniyor...' : `${mentors.length} Mentor Sizi Bekliyor`}
              </h2>
            </div>
            {(search || tag) && (
              <button
                style={s.clearBtn}
                onClick={() => { setSearch(''); setTag(''); fetchMentors('', ''); }}
              >
                ✕ Filtreyi Temizle
              </button>
            )}
          </div>

          {loading ? (
            <div style={s.grid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={s.skeletonCard}>
                  <div className="skeleton" style={{ height: '120px', borderRadius: '12px 12px 0 0' }} />
                  <div style={{ padding: '1.25rem' }}>
                    <div className="skeleton" style={{ height: '18px', width: '65%', marginBottom: '0.6rem' }} />
                    <div className="skeleton" style={{ height: '13px', width: '100%', marginBottom: '0.4rem' }} />
                    <div className="skeleton" style={{ height: '13px', width: '80%', marginBottom: '0.75rem' }} />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <div className="skeleton" style={{ height: '22px', width: '56px', borderRadius: '20px' }} />
                      <div className="skeleton" style={{ height: '22px', width: '64px', borderRadius: '20px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🔍</div>
              <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Sonuç Bulunamadı</h3>
              <p style={{ color: '#94a3b8' }}>Farklı anahtar kelimeler ya da etiketlerle tekrar deneyin.</p>
            </div>
          ) : (
            <div style={s.grid}>
              {mentors.map((m) => (
                <div
                  key={m.id}
                  className="mentor-card"
                  style={s.card}
                  onClick={() => navigate('/mentors/' + m.id)}
                >
                  {/* Card top banner */}
                  <div style={{ ...s.cardBanner, background: getColor(m.full_name || m.username) }}>
                    <div style={s.cardAvatar}>
                      {(m.full_name || m.username || '?')[0].toUpperCase()}
                    </div>
                    {m.is_verified && (
                      <span style={s.verifiedBadge}>✓ Doğrulanmış</span>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={s.cardBody}>
                    <h3 style={s.cardName}>{m.full_name || m.username}</h3>
                    <p style={s.cardBio}>
                      {m.bio ? m.bio.slice(0, 90) + (m.bio.length > 90 ? '...' : '') : 'Biyografi paylaşılmamış.'}
                    </p>
                    <div style={s.tagRow}>
                      {(m.tags || []).slice(0, 3).map(t => (
                        <span key={t.id} style={s.tag}>{t.name}</span>
                      ))}
                      {(m.tags || []).length > 3 && (
                        <span style={s.tagMore}>+{m.tags.length - 3}</span>
                      )}
                    </div>
                    <div style={s.cardFooter}>
                      <span style={s.ratingLabel}>
                        ⭐ {m.avg_rating ? Number(m.avg_rating).toFixed(1) : '0.0'}
                      </span>
                      <span style={s.expLabel}>{m.years_experience} yıl deneyim</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionHeader}>
            <span style={s.pill}>Neden Mentonnect?</span>
            <h2 style={s.sectionTitle}>Platforma Katılmak İçin 3 Neden</h2>
          </div>
          <div style={s.stepsRow}>
            {[
              { icon: '🎯', title: 'Doğru Eşleşme', desc: 'Uzmanlık alanına ve deneyim seviyene göre filtreleyerek en uygun mentoru kolayca bul.' },
              { icon: '🔒', title: 'Güvenli Platform', desc: 'Doğrulanmış mentor rozeti ile yalnızca güvenilir uzmanlarla çalış.' },
              { icon: '🆓', title: 'Tamamen Ücretsiz', desc: 'Platforma kaydolmak ve mentorlara ulaşmak tamamen ücretsizdir.' },
            ].map((f, i) => (
              <div key={i} style={{ ...s.stepCard, background: '#fff' }}>
                <div style={{ fontSize: '42px', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={s.stepTitle}>{f.title}</h3>
                <p style={s.stepDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="hero-gradient" style={s.ctaBanner}>
        <div style={s.ctaDecor} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={s.ctaTitle}>Hazır Mısın?</h2>
          <p style={s.ctaSub}>Hemen üye ol, alanında uzman mentorlarla tanış</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user && (
              <button className="btn-hover" style={s.ctaWhiteBtn} onClick={() => navigate('/register')}>
                Ücretsiz Kayıt Ol →
              </button>
            )}
            <button style={s.ctaGhostBtn} onClick={() => navigate('/about')}>
              Daha Fazla Bilgi
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div>
            <div style={s.footerLogo}>Mentonnect</div>
            <p style={s.footerTagline}>
              Öğrencileri alanında uzman mentorlarla<br />buluşturan platform.
            </p>
          </div>
          <div>
            <div style={s.footerColTitle}>Platform</div>
            {[['/', 'Mentorlar'], ['/about', 'Hakkımızda'], ['/contact', 'İletişim']].map(([path, label]) => (
              <div key={path} style={s.footerLink} onClick={() => navigate(path)}>{label}</div>
            ))}
          </div>
          <div>
            <div style={s.footerColTitle}>Hesap</div>
            {(!user ? [['/login', 'Giriş Yap'], ['/register', 'Kayıt Ol']] : []).map(([path, label]) => (
              <div key={path} style={s.footerLink} onClick={() => navigate(path)}>{label}</div>
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

const s = {
  /* Hero */
  hero: {
    position: 'relative',
    padding: '6rem 2rem 5rem',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '380px', height: '380px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
  },
  heroDecor2: {
    position: 'absolute', bottom: '-100px', left: '-60px',
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
  },
  heroDecor3: {
    position: 'absolute', top: '40%', left: '10%',
    width: '180px', height: '180px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.03)',
  },
  heroContent: { position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    padding: '7px 18px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '1.5rem',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  heroTitle: {
    fontSize: '3.4rem',
    fontWeight: '900',
    color: '#fff',
    marginBottom: '1rem',
    lineHeight: '1.15',
    letterSpacing: '-1px',
  },
  heroTitleAccent: {
    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: '17px',
    lineHeight: '1.7',
    marginBottom: '2.5rem',
  },
  searchForm: { maxWidth: '660px', margin: '0 auto 2rem' },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '14px',
    padding: '6px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
    flexWrap: 'wrap',
    gap: '4px',
  },
  searchIcon: { padding: '0 6px', fontSize: '15px', flexShrink: 0 },
  searchDivider: { width: '1px', height: '22px', background: '#e2e8f0', flexShrink: 0 },
  searchInput: {
    flex: 1,
    minWidth: '130px',
    padding: '0.55rem 0.5rem',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    background: 'transparent',
    fontFamily: "'Inter', sans-serif",
    color: '#1e293b',
  },
  searchBtn: {
    padding: '0.65rem 1.5rem',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  heroCTA: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  ctaSecondary: {
    padding: '0.75rem 1.8rem',
    background: '#fff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    transition: 'transform 0.15s',
  },
  ctaGhost: {
    padding: '0.75rem 1.8rem',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.35)',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    backdropFilter: 'blur(4px)',
  },

  /* Stats */
  statsSection: {
    display: 'flex',
    justifyContent: 'center',
    background: '#fff',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '150px',
    padding: '1.8rem 1.5rem',
    textAlign: 'center',
  },
  statIcon: { fontSize: '26px', marginBottom: '0.5rem' },
  statNum: { fontSize: '2.2rem', fontWeight: '900', color: '#4f46e5', lineHeight: 1 },
  statLabel: { fontSize: '12px', color: '#94a3b8', marginTop: '0.4rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },

  /* Sections */
  section: { padding: '5rem 2rem', background: '#f8fafc' },
  sectionInner: { maxWidth: '1100px', margin: '0 auto' },
  sectionHeader: { textAlign: 'center', marginBottom: '3rem' },
  pill: {
    display: 'inline-block',
    background: '#eef2ff',
    color: '#4f46e5',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: '0.5rem',
    letterSpacing: '-0.5px',
  },
  sectionSub: { color: '#94a3b8', fontSize: '15px', textAlign: 'center' },

  /* Steps */
  stepsRow: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  stepCard: {
    flex: 1,
    minWidth: '240px',
    maxWidth: '340px',
    borderRadius: '20px',
    padding: '2.2rem 1.8rem',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  stepNumBadge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  stepEmoji: { fontSize: '44px', marginBottom: '1rem' },
  stepTitle: { fontSize: '17px', fontWeight: '700', marginBottom: '0.6rem' },
  stepDesc: { fontSize: '14px', color: '#64748b', lineHeight: '1.65' },

  /* Mentor grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardBanner: {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: '90px',
  },
  cardAvatar: {
    width: '62px',
    height: '62px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    fontWeight: '700',
    border: '3px solid rgba(255,255,255,0.55)',
  },
  verifiedBadge: {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(4px)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  cardBody: { padding: '1.25rem 1.5rem 1.5rem' },
  cardName: { fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '0.4rem' },
  cardBio: { fontSize: '13px', color: '#64748b', marginBottom: '0.8rem', lineHeight: '1.55' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.85rem' },
  tag: {
    background: '#eff6ff',
    color: '#3b82f6',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  tagMore: {
    background: '#f1f5f9',
    color: '#64748b',
    padding: '3px 9px',
    borderRadius: '20px',
    fontSize: '11px',
  },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' },
  ratingLabel: { fontSize: '13px', color: '#f59e0b', fontWeight: '700' },
  expLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },

  /* Skeleton */
  skeletonCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },

  /* Empty state */
  emptyState: { textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8' },
  emptyIcon: { fontSize: '52px', marginBottom: '1rem' },

  /* Filter clear */
  clearBtn: {
    padding: '0.5rem 1rem',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
  },

  /* CTA Banner */
  ctaBanner: {
    padding: '6rem 2rem',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaDecor: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: '280px', height: '280px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
  },
  ctaTitle: {
    fontSize: '2.6rem',
    fontWeight: '900',
    color: '#fff',
    marginBottom: '0.75rem',
    letterSpacing: '-0.5px',
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '16px',
    marginBottom: '2rem',
  },
  ctaWhiteBtn: {
    padding: '0.9rem 2.2rem',
    background: '#fff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  ctaGhostBtn: {
    padding: '0.9rem 2.2rem',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.35)',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },

  /* Footer */
  footer: { background: '#0f172a', padding: '4rem 2rem 0' },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    gap: '4rem',
    flexWrap: 'wrap',
    paddingBottom: '3rem',
  },
  footerLogo: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '0.75rem',
  },
  footerTagline: { color: '#64748b', fontSize: '13px', lineHeight: '1.7' },
  footerColTitle: {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '1rem',
  },
  footerLink: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '0.6rem',
    cursor: 'pointer',
    transition: 'color 0.15s',
  },
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
