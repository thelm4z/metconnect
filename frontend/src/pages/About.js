import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../AuthContext';

export default function About() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero-gradient" style={s.hero}>
        <div style={s.decor1} />
        <div style={s.decor2} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <span className="animate-fade-in-up delay-1" style={s.pill}>Hakkımızda</span>
          <h1 className="animate-fade-in-up delay-2" style={s.heroTitle}>
            Mentonnect Nedir?
          </h1>
          <p className="animate-fade-in-up delay-3" style={s.heroSub}>
            Öğrencileri alanında uzman mentorlarla buluşturan,<br />
            kariyerinizi şekillendirmenize yardımcı olan bir platform.
          </p>
        </div>
      </section>

      {/* ── Misyon ── */}
      <section style={s.section}>
        <div style={s.inner}>
          <div style={s.missionGrid}>
            <div className="animate-fade-in-up">
              <span style={s.pill}>Misyonumuz</span>
              <h2 style={{ ...s.h2, textAlign: 'left', marginTop: '0.75rem' }}>
                Bilgiye erişimi demokratikleştiriyoruz
              </h2>
              <p style={s.bodyText}>
                Mentonnect olarak inanıyoruz ki her öğrencinin, kariyer yolculuğunda
                kendisine rehberlik edecek bir mentora erişim hakkı vardır. Platformumuz,
                coğrafi ve ekonomik engelleri ortadan kaldırarak öğrencileri alanlarında
                yılların deneyimine sahip uzman mentorlarla buluşturur.
              </p>
              <p style={s.bodyText}>
                Her bağlantı, bir kariyeri dönüştürme potansiyeli taşır. Bu inançla
                Türkiye'nin en güçlü mentorluk ekosistemini kurmak için çalışıyoruz.
              </p>
              {!user && (
                <button
                  className="btn-hover"
                  style={s.primaryBtn}
                  onClick={() => navigate('/register')}
                >
                  Platforma Katıl →
                </button>
              )}
            </div>
            <div style={s.missionCards}>
              {[
                { icon: '🎯', title: 'Odaklı Mentorluk', desc: 'Her öğrencinin ihtiyacına özel mentor eşleşmesi.' },
                { icon: '🌱', title: 'Sürekli Büyüme', desc: 'Kariyer yolculuğunuzda kesintisiz destek ve gelişim.' },
                { icon: '🤝', title: 'Güçlü Topluluk', desc: 'Öğrenci ve mentorlardan oluşan canlı bir ekosistem.' },
                { icon: '🏆', title: 'Kalite Güvencesi', desc: 'Doğrulanmış mentorlar ve şeffaf değerlendirme sistemi.' },
              ].map((c, i) => (
                <div key={i} className="animate-scale-in" style={{ ...s.miniCard, animationDelay: `${i * 0.1}s` }}>
                  <span style={{ fontSize: '28px' }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '3px' }}>{c.title}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── İstatistikler ── */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={s.inner}>
          <div style={s.sectionHeader}>
            <span style={s.pill}>Rakamlarla Mentonnect</span>
            <h2 style={s.h2}>Büyüyen Bir Topluluk</h2>
          </div>
          <div style={s.statsRow}>
            {[
              { num: '20+', label: 'Aktif Mentor', color: '#4f46e5' },
              { num: '50+', label: 'Kayıtlı Öğrenci', color: '#7c3aed' },
              { num: '12+', label: 'Uzmanlık Alanı', color: '#059669' },
              { num: '%100', label: 'Ücretsiz Kayıt', color: '#d97706' },
            ].map((st, i) => (
              <div key={i} style={s.bigStatCard}>
                <div style={{ ...s.bigStatNum, color: st.color }}>{st.num}</div>
                <div style={s.bigStatLabel}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ── */}
      <section style={s.section}>
        <div style={s.inner}>
          <div style={s.sectionHeader}>
            <span style={s.pill}>Nasıl Çalışır?</span>
            <h2 style={s.h2}>Detaylı Rehber</h2>
            <p style={s.subText}>Platforma katılmaktan ilk mentorluk seansına kadar her adım</p>
          </div>

          <div style={s.timelineWrap}>
            {[
              {
                step: '01',
                icon: '📝',
                title: 'Ücretsiz Kayıt Ol',
                desc: 'Sadece kullanıcı adı, e-posta ve şifre ile saniyeler içinde hesabını oluştur. Öğrenci veya mentor rolünü seç.',
                color: '#4f46e5',
                bg: '#eef2ff',
              },
              {
                step: '02',
                icon: '🔍',
                title: 'Profil Oluştur',
                desc: 'Mentor iseniz biyografinizi, uzmanlık alanlarınızı ve deneyim yılınızı ekleyin. Öğrenci iseniz ilgi alanlarınızı paylaşın.',
                color: '#059669',
                bg: '#f0fdf4',
              },
              {
                step: '03',
                icon: '🧭',
                title: 'Mentoru Keşfet',
                desc: 'Arama ve filtreleme araçlarıyla alanındaki uzman mentorları bul. Profillerini, puan ve yorumlarını incele.',
                color: '#2563eb',
                bg: '#eff6ff',
              },
              {
                step: '04',
                icon: '💬',
                title: 'İletişime Geç',
                desc: 'Mentorlara direkt mesaj gönder. Deneyimini yorum olarak paylaş ve platforma değer kat.',
                color: '#7c3aed',
                bg: '#fdf4ff',
              },
              {
                step: '05',
                icon: '🚀',
                title: 'Kariyer Yolculuğunu Başlat',
                desc: 'Mentorununun rehberliği ile hedeflerine ulaş, kariyerinde hızla ilerle.',
                color: '#d97706',
                bg: '#fffbeb',
              },
            ].map((item, i) => (
              <div key={i} style={s.timelineItem}>
                <div style={{ ...s.timelineBadge, background: item.color }}>{item.step}</div>
                <div style={{ ...s.timelineCard, background: item.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '28px' }}>{item.icon}</span>
                    <h3 style={{ ...s.timelineTitle, color: item.color }}>{item.title}</h3>
                  </div>
                  <p style={s.timelineDesc}>{item.desc}</p>
                </div>
                {i < 4 && <div style={s.timelineConnector} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Değerlerimiz ── */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={s.inner}>
          <div style={s.sectionHeader}>
            <span style={s.pill}>Değerlerimiz</span>
            <h2 style={s.h2}>Bizi Biz Yapan Prensipler</h2>
          </div>
          <div style={s.valuesGrid}>
            {[
              { icon: '🌟', title: 'Mükemmellik', desc: 'Her detaydaki kaliteye olan bağlılığımız bizi öne çıkarır.' },
              { icon: '🔍', title: 'Şeffaflık', desc: 'Açık iletişim ve şeffaf süreçlere inanıyoruz.' },
              { icon: '🤝', title: 'İş Birliği', desc: 'Birlikte daha güçlüyüz; topluluk ruhu her şeyin üstünde.' },
              { icon: '💡', title: 'İnovasyon', desc: 'Sürekli gelişim ve yenilikçi çözümler arayışındayız.' },
              { icon: '❤️', title: 'Empati', desc: 'Öğrenci ve mentor deneyimini hep insanın merkezine koyarız.' },
              { icon: '🛡️', title: 'Güven', desc: 'Güvenli ve destekleyici bir ortam sağlamak önceliğimizdir.' },
            ].map((v, i) => (
              <div key={i} style={s.valueCard}>
                <div style={s.valueIcon}>{v.icon}</div>
                <h3 style={s.valueTitle}>{v.title}</h3>
                <p style={s.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hero-gradient" style={s.ctaSection}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={s.ctaTitle}>Sen de Aramıza Katıl</h2>
          <p style={s.ctaSub}>
            Öğrenci ya da mentor ol, Türkiye'nin en güçlü<br />
            mentorluk topluluğunun parçası olarak büyü.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user && (
              <button
                className="btn-hover"
                style={s.ctaWhite}
                onClick={() => navigate('/register')}
              >
                Ücretsiz Başla →
              </button>
            )}
            <button style={s.ctaOutline} onClick={() => navigate('/contact')}>
              Bizimle İletişime Geç
            </button>
          </div>
        </div>
        <div style={s.ctaDecor} />
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerLogo}>Mentonnect</span>
          <div style={s.footerLinks}>
            {[['/', 'Mentorlar'], ['/about', 'Hakkımızda'], ['/contact', 'İletişim'], ...(!user ? [['/register', 'Kayıt Ol']] : [])].map(([path, label]) => (
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

const s = {
  hero: {
    position: 'relative',
    padding: '5.5rem 2rem 4.5rem',
    overflow: 'hidden',
  },
  decor1: {
    position: 'absolute', top: '-70px', right: '-70px',
    width: '320px', height: '320px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
  },
  decor2: {
    position: 'absolute', bottom: '-80px', left: '-50px',
    width: '260px', height: '260px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
  },
  pill: {
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
    fontSize: '3rem',
    fontWeight: '900',
    color: '#fff',
    marginBottom: '1rem',
    lineHeight: '1.15',
    letterSpacing: '-1px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: '17px',
    lineHeight: '1.7',
  },

  section: { padding: '5rem 2rem', background: '#f8fafc' },
  inner: { maxWidth: '1100px', margin: '0 auto' },
  sectionHeader: { textAlign: 'center', marginBottom: '3rem' },
  h2: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.5rem',
    letterSpacing: '-0.5px',
    textAlign: 'center',
  },
  subText: { color: '#94a3b8', fontSize: '15px', textAlign: 'center' },
  bodyText: { color: '#4b5563', fontSize: '15px', lineHeight: '1.75', marginBottom: '1rem' },

  primaryBtn: {
    marginTop: '1.5rem',
    padding: '0.8rem 1.8rem',
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

  missionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
  },
  missionCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  miniCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },

  statsRow: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  bigStatCard: {
    flex: 1,
    minWidth: '160px',
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  bigStatNum: { fontSize: '2.6rem', fontWeight: '900', lineHeight: 1 },
  bigStatLabel: { fontSize: '13px', color: '#94a3b8', marginTop: '0.5rem', fontWeight: '600' },

  timelineWrap: { maxWidth: '680px', margin: '0 auto' },
  timelineItem: { position: 'relative', paddingLeft: '3rem', marginBottom: '1rem' },
  timelineBadge: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    borderRadius: '14px',
    padding: '1.25rem 1.5rem',
  },
  timelineTitle: { fontSize: '16px', fontWeight: '700', margin: 0 },
  timelineDesc: { fontSize: '14px', color: '#4b5563', lineHeight: '1.65', margin: 0 },
  timelineConnector: { display: 'none' },

  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  valueCard: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '1.75rem',
    textAlign: 'center',
  },
  valueIcon: { fontSize: '36px', marginBottom: '0.75rem' },
  valueTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' },
  valueDesc: { fontSize: '14px', color: '#64748b', lineHeight: '1.65' },

  ctaSection: {
    padding: '6rem 2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaDecor: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '300px', height: '300px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
  },
  ctaTitle: {
    fontSize: '2.6rem',
    fontWeight: '900',
    color: '#fff',
    marginBottom: '0.75rem',
    letterSpacing: '-0.5px',
  },
  ctaSub: { color: 'rgba(255,255,255,0.8)', fontSize: '16px', marginBottom: '2rem', lineHeight: '1.7' },
  ctaWhite: {
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
  ctaOutline: {
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
