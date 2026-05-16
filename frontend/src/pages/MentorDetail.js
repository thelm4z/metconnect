import { useEffect, useState } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#059669', '#2563eb',
  '#d97706', '#dc2626', '#0891b2', '#db2777',
];
const getColor = (str) =>
  AVATAR_COLORS[(str ? str.charCodeAt(0) : 0) % AVATAR_COLORS.length];

export default function MentorDetail() {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [msgError, setMsgError] = useState('');
  const [activeTab, setActiveTab] = useState('hakkinda');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/mentors/' + id + '/').then(r => setMentor(r.data));
    API.get('/reviews/?mentor=' + id).then(r => setReviews(r.data.results || r.data));
  }, [id]);

  const sendReview = async e => {
    e.preventDefault();
    setReviewError('');
    try {
      await API.post('/reviews/', { mentor: id, rating, comment });
      setComment(''); setRating(5); setReviewSent(true);
      const r = await API.get('/reviews/?mentor=' + id);
      setReviews(r.data.results || r.data);
      setTimeout(() => setReviewSent(false), 3000);
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? Object.values(detail).flat().join(' ') : 'Yorum gönderilemedi.';
      setReviewError(msg);
    }
  };

  const sendMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (!msg.trim()) return;
    setMsgError('');
    try {
      await API.post('/messages/', { receiver: mentor.user_id, content: msg });
      setMsg(''); setMsgSent(true);
      setTimeout(() => {
        setMsgSent(false);
        navigate(`/messages?with=${mentor.user_id}`);
      }, 1500);
    } catch (err) {
      const detail = err.response?.data;
      const errMsg = typeof detail === 'object' ? Object.values(detail).flat().join(' ') : 'Mesaj gönderilemedi.';
      setMsgError(errMsg);
    }
  };

  if (!mentor) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={s.loading}>
        <div style={s.loadingSpinner} />
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Yükleniyor...</p>
      </div>
    </div>
  );

  const color = getColor(mentor.full_name || mentor.username);
  const avgRating = mentor.avg_rating ? Number(mentor.avg_rating).toFixed(1) : '0.0';
  const stars = Math.round(Number(mentor.avg_rating || 0));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* ── Banner ── */}
      <div style={{ ...s.banner, background: color }}>
        <div style={s.bannerDecor} />
        <div style={s.bannerInner}>
          <button style={s.backBtn} onClick={() => navigate('/')}>← Geri</button>
        </div>
      </div>

      {/* ── Profile card ── */}
      <div style={s.profileOuter}>
        <div style={s.profileCard} className="animate-fade-in-up">
          <div style={{ ...s.bigAvatar, background: color }}>
            {(mentor.full_name || mentor.username || '?')[0].toUpperCase()}
          </div>
          <div style={s.profileInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={s.profileName}>{mentor.full_name || mentor.username}</h1>
              {mentor.is_verified && (
                <span style={s.verifiedBadge}>✓ Doğrulanmış Mentor</span>
              )}
            </div>
            <div style={s.profileMeta}>
              <span style={s.metaItem}>⭐ {avgRating} / 5</span>
              <span style={s.metaDot} />
              <span style={s.metaItem}>💼 {mentor.years_experience} yıl deneyim</span>
              <span style={s.metaDot} />
              <span style={s.metaItem}>💬 {reviews.length} yorum</span>
            </div>
            <div style={s.tagRow}>
              {(mentor.tags || []).map(t => (
                <span key={t.id} style={s.tag}>{t.name}</span>
              ))}
            </div>
          </div>
          <div style={s.profileActions}>
            {mentor.linkedin_url && (
              <a href={mentor.linkedin_url} target="_blank" rel="noreferrer" style={s.linkedinBtn}>
                🔗 LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={s.mainOuter}>
        <div style={s.mainGrid}>

          {/* Left col */}
          <div style={s.leftCol}>
            {/* Tabs */}
            <div style={s.tabs}>
              {[['hakkinda', 'Hakkında'], ['yorumlar', `Yorumlar (${reviews.length})`]].map(([key, label]) => (
                <button
                  key={key}
                  style={{ ...s.tab, ...(activeTab === key ? s.tabActive : {}) }}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'hakkinda' && (
              <div style={s.card} className="animate-fade-in">
                {/* Bio */}
                <h3 style={s.cardTitle}>Biyografi</h3>
                <p style={s.bioText}>{mentor.bio || 'Biyografi paylaşılmamış.'}</p>

                {/* Experience */}
                <div style={s.infoGrid}>
                  <div style={s.infoItem}>
                    <div style={s.infoIcon}>💼</div>
                    <div>
                      <div style={s.infoLabel}>Deneyim</div>
                      <div style={s.infoValue}>{mentor.years_experience} yıl</div>
                    </div>
                  </div>
                  <div style={s.infoItem}>
                    <div style={s.infoIcon}>⭐</div>
                    <div>
                      <div style={s.infoLabel}>Ortalama Puan</div>
                      <div style={s.infoValue}>
                        {avgRating} / 5 {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                      </div>
                    </div>
                  </div>
                  <div style={s.infoItem}>
                    <div style={s.infoIcon}>📧</div>
                    <div>
                      <div style={s.infoLabel}>E-posta</div>
                      <div style={s.infoValue}>{mentor.email}</div>
                    </div>
                  </div>
                  <div style={s.infoItem}>
                    <div style={s.infoIcon}>💬</div>
                    <div>
                      <div style={s.infoLabel}>Toplam Yorum</div>
                      <div style={s.infoValue}>{reviews.length}</div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {(mentor.tags || []).length > 0 && (
                  <>
                    <h3 style={{ ...s.cardTitle, marginTop: '1.5rem' }}>Uzmanlık Alanları</h3>
                    <div style={s.tagRow}>
                      {(mentor.tags || []).map(t => (
                        <span key={t.id} style={s.tag}>{t.name}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'yorumlar' && (
              <div className="animate-fade-in">
                {reviews.length === 0 ? (
                  <div style={s.emptyReviews}>
                    <div style={{ fontSize: '40px', marginBottom: '0.75rem' }}>💬</div>
                    <p style={{ color: '#94a3b8' }}>Henüz yorum yok. İlk yorumu sen yap!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reviews.map(r => (
                      <div key={r.id} style={s.reviewCard}>
                        <div style={s.reviewHeader}>
                          <div style={{ ...s.reviewAvatar, background: getColor(r.student_username) }}>
                            {(r.student_username || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={s.reviewUser}>{r.student_username}</div>
                            <div style={s.reviewStars}>
                              {'★'.repeat(r.rating)}
                              <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - r.rating)}</span>
                              <span style={s.reviewRatingNum}> {r.rating}.0</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && <p style={s.reviewComment}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Review form */}
                {user ? (
                  <div style={s.reviewFormWrap}>
                    <h3 style={s.cardTitle}>Yorum Yaz</h3>
                    {reviewSent && (
                      <div style={s.successMsg}>✅ Yorumunuz başarıyla gönderildi!</div>
                    )}
                    {reviewError && (
                      <div style={s.errorMsg}>⚠️ {reviewError}</div>
                    )}
                    <form onSubmit={sendReview}>
                      <label style={s.label}>Puanınız</label>
                      <div style={s.starPicker}>
                        {[1,2,3,4,5].map(n => (
                          <span
                            key={n}
                            style={{ ...s.starBtn, color: n <= rating ? '#f59e0b' : '#e2e8f0' }}
                            onClick={() => setRating(n)}
                          >
                            ★
                          </span>
                        ))}
                        <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '8px' }}>{rating} / 5</span>
                      </div>
                      <label style={s.label}>Yorumunuz</label>
                      <textarea
                        style={s.textarea}
                        placeholder="Deneyiminizi paylaşın..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={4}
                      />
                      <button className="btn-hover" style={s.primaryBtn} type="submit">
                        Yorum Gönder
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={s.loginPrompt}>
                    <span style={{ fontSize: '22px' }}>💬</span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Yorum yazmak için giriş yap</div>
                      <span style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }} onClick={() => navigate('/login')}>
                        Giriş Yap →
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right col — message box */}
          <div style={s.rightCol}>
            <div style={s.msgCard}>
              <div style={{ ...s.msgCardTop, background: color }}>
                <div style={s.msgAvatar}>{(mentor.full_name || mentor.username || '?')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>
                    {mentor.full_name || mentor.username}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Mesaj gönder</div>
                </div>
              </div>
              <div style={s.msgCardBody}>
                {msgSent ? (
                  <div style={s.successMsg}>✅ Mesajınız başarıyla gönderildi!</div>
                ) : msgError ? (
                  <>
                    <div style={s.errorMsg}>⚠️ {msgError}</div>
                    <button style={s.outlineBtn} onClick={() => setMsgError('')}>Tekrar Dene</button>
                  </>
                ) : (
                  <>
                    <textarea
                      style={s.msgTextarea}
                      placeholder={user ? 'Mesajınızı buraya yazın...' : 'Mesaj göndermek için giriş yapın.'}
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      rows={4}
                      disabled={!user}
                    />
                    <button
                      className="btn-hover"
                      style={{ ...s.primaryBtn, width: '100%', opacity: !user || !msg.trim() ? 0.6 : 1 }}
                      onClick={sendMessage}
                      disabled={!user}
                    >
                      {user ? 'Mesaj Gönder →' : 'Mesaj İçin Giriş Yap'}
                    </button>
                    {!user && (
                      <button style={s.outlineBtn} onClick={() => navigate('/login')}>
                        Giris Yap
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div style={s.statsCard}>
              {[
                { icon: '⭐', label: 'Ortalama Puan', value: `${avgRating} / 5` },
                { icon: '💬', label: 'Toplam Yorum', value: reviews.length },
                { icon: '💼', label: 'Deneyim', value: `${mentor.years_experience} yil` },
              ].map((st, i) => (
                <div key={i} style={{ ...s.statRow, borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: '18px' }}>{st.icon}</span>
                  <span style={{ color: '#64748b', fontSize: '13px', flex: 1 }}>{st.label}</span>
                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{st.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  loading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '8rem 2rem',
  },
  loadingSpinner: {
    width: '40px', height: '40px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  banner: {
    height: '180px', position: 'relative', overflow: 'hidden',
  },
  bannerDecor: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: '250px', height: '250px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
  },
  bannerInner: {
    maxWidth: '1100px', margin: '0 auto',
    padding: '1.5rem 2rem',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff', borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: 'pointer', fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
  },
  profileOuter: {
    maxWidth: '1100px', margin: '0 auto',
    padding: '0 2rem',
    marginTop: '-64px',
  },
  profileCard: {
    background: '#fff',
    borderRadius: '20px',
    padding: '1.75rem 2rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  bigAvatar: {
    width: '88px', height: '88px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '36px', fontWeight: '800',
    border: '4px solid #fff',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  profileInfo: { flex: 1, minWidth: '200px' },
  profileName: {
    fontSize: '22px', fontWeight: '800', color: '#1e293b',
    marginBottom: '0.4rem', letterSpacing: '-0.3px',
  },
  verifiedBadge: {
    display: 'inline-flex', alignItems: 'center',
    background: '#f0fdf4', color: '#059669',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '700',
    border: '1px solid #bbf7d0',
  },
  profileMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', marginTop: '0.5rem' },
  metaItem: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  metaDot: { width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  tag: {
    background: '#eff6ff', color: '#3b82f6',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '600',
  },
  profileActions: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  linkedinBtn: {
    display: 'inline-flex', alignItems: 'center',
    padding: '0.5rem 1rem',
    background: '#0e76a8', color: '#fff',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    textDecoration: 'none',
  },

  mainOuter: { maxWidth: '1100px', margin: '2rem auto', padding: '0 2rem 4rem' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' },

  leftCol: {},
  tabs: {
    display: 'flex',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '1.25rem',
  },
  tab: {
    padding: '0.75rem 1.25rem',
    border: 'none', background: 'none',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    color: '#64748b', borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    fontFamily: "'Inter', sans-serif",
    transition: 'color 0.15s',
  },
  tabActive: { color: '#4f46e5', borderBottomColor: '#4f46e5' },

  card: {
    background: '#fff', borderRadius: '16px',
    padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '15px', fontWeight: '700', color: '#1e293b',
    marginBottom: '0.75rem',
  },
  bioText: { fontSize: '14px', color: '#4b5563', lineHeight: '1.75' },
  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '1rem', marginTop: '1.25rem',
  },
  infoItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#f8fafc', borderRadius: '10px', padding: '0.75rem',
  },
  infoIcon: { fontSize: '20px', flexShrink: 0 },
  infoLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', color: '#1e293b', fontWeight: '600', marginTop: '2px' },

  emptyReviews: {
    textAlign: 'center', padding: '3rem',
    background: '#fff', borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
  },
  reviewCard: {
    background: '#fff', borderRadius: '14px',
    padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' },
  reviewAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700',
  },
  reviewUser: { fontWeight: '700', fontSize: '14px', color: '#1e293b' },
  reviewStars: { color: '#f59e0b', fontSize: '14px', marginTop: '2px' },
  reviewRatingNum: { color: '#94a3b8', fontSize: '12px', fontWeight: '600' },
  reviewComment: { fontSize: '14px', color: '#4b5563', lineHeight: '1.65', margin: 0 },

  reviewFormWrap: {
    marginTop: '1.5rem', background: '#fff',
    borderRadius: '16px', padding: '1.75rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  starPicker: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' },
  starBtn: { fontSize: '28px', cursor: 'pointer', lineHeight: 1, transition: 'transform 0.1s' },
  textarea: {
    width: '100%', padding: '0.75rem',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', fontFamily: "'Inter', sans-serif",
    resize: 'vertical', marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
    transition: 'opacity 0.15s',
  },
  loginPrompt: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    background: '#eef2ff', borderRadius: '12px', padding: '1.1rem 1.25rem',
    marginTop: '1.5rem',
  },
  successMsg: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    color: '#059669', padding: '0.75rem 1rem',
    borderRadius: '10px', fontSize: '14px', fontWeight: '500',
    marginBottom: '0.75rem',
  },
  errorMsg: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', padding: '0.75rem 1rem',
    borderRadius: '10px', fontSize: '14px', fontWeight: '500',
    marginBottom: '0.75rem',
  },

  rightCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  msgCard: {
    background: '#fff', borderRadius: '16px',
    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  msgCardTop: {
    padding: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  msgAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: '700',
    border: '2px solid rgba(255,255,255,0.5)',
  },
  msgCardBody: { padding: '1.25rem' },
  msgTextarea: {
    width: '100%', padding: '0.75rem',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '13px', fontFamily: "'Inter', sans-serif",
    resize: 'none', marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  outlineBtn: {
    width: '100%', padding: '0.65rem',
    background: '#fff', color: '#4f46e5',
    border: '1.5px solid #c7d2fe', borderRadius: '10px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", marginTop: '0.5rem',
  },

  statsCard: {
    background: '#fff', borderRadius: '16px',
    padding: '0.5rem 1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '0.9rem 0',
  },
};
