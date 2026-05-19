import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚙️' },
  { value: 'html', label: 'HTML/CSS', icon: '🌐' },
  { value: 'sql', label: 'SQL', icon: '🗄️' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'other', label: 'Diğer', icon: '📝' },
];

const STATUS_MAP = {
  waiting:  { label: 'Bekliyor',    color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  active:   { label: 'Aktif',       color: '#059669', bg: '#d1fae5', icon: '🟢' },
  ended:    { label: 'Tamamlandı',  color: '#64748b', bg: '#f1f5f9', icon: '✅' },
};

export default function Lessons() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', code_language: 'python' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSessions();
  }, [user]); // eslint-disable-line

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await API.get('/lessons/');
      setSessions(res.data);
    } catch {
      // sessizce geç
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) { setCreateError('Ders başlığı gereklidir.'); return; }
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await API.post('/lessons/', createForm);
      setSessions(prev => [res.data, ...prev]);
      setCreateForm({ title: '', code_language: 'python' });
      setShowCreate(false);
      navigate(`/lessons/room/${res.data.room_code}`);
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Ders oluşturulamadı.');
    } finally {
      setCreateLoading(false);
    }
  };

  const joinSession = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) { setJoinError('Ders kodu gereklidir.'); return; }
    setJoinLoading(true);
    setJoinError('');
    try {
      await API.post(`/lessons/${code}/join/`);
      navigate(`/lessons/room/${code}`);
    } catch (err) {
      setJoinError(err.response?.data?.detail || 'Derse katılınamadı. Kodu kontrol edin.');
    } finally {
      setJoinLoading(false);
    }
  };

  const enterRoom = async (code) => {
    try {
      await API.post(`/lessons/${code}/join/`);
    } catch {
      // zaten katılmış olabilir
    }
    navigate(`/lessons/room/${code}`);
  };

  const isMentor = user?.role === 'mentor';

  return (
    <div style={s.page}>
      <Navbar />

      {/* Hero */}
      <section className="hero-gradient" style={s.hero}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>📚 Ders Ortamı</h1>
          <p style={s.heroSub}>
            {isMentor
              ? 'Ders oluşturun, öğrencilerinizle canlı video, kod ve not paylaşın.'
              : 'Mentor kodunu girerek canlı derse katılın.'}
          </p>
        </div>
      </section>

      <div style={s.body}>

        {/* Aksiyon paneli */}
        <div style={s.actionRow}>
          {isMentor ? (
            <button
              className="btn-hover"
              style={s.primaryBtn}
              onClick={() => setShowCreate(o => !o)}
            >
              {showCreate ? '✕ İptal' : '+ Yeni Ders Oluştur'}
            </button>
          ) : (
            <form onSubmit={joinSession} style={s.joinForm}>
              <div style={s.joinInputWrap}>
                <span style={s.joinInputIcon}>🔑</span>
                <input
                  style={s.joinInput}
                  placeholder="Ders kodunu girin (örn: A1B2C3D4)"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value); setJoinError(''); }}
                  maxLength={8}
                />
              </div>
              <button
                className="btn-hover"
                style={s.primaryBtn}
                type="submit"
                disabled={joinLoading}
              >
                {joinLoading ? 'Katılınıyor...' : '→ Derse Katıl'}
              </button>
              {joinError && <p style={s.errorMsg}>⚠️ {joinError}</p>}
            </form>
          )}
        </div>

        {/* Ders oluşturma formu (mentor) */}
        {showCreate && isMentor && (
          <div style={s.createCard} className="animate-fade-in-up">
            <h3 style={s.createTitle}>Yeni Ders Oluştur</h3>
            {createError && <div style={s.errorBox}>⚠️ {createError}</div>}
            <form onSubmit={createSession}>
              <div style={s.group}>
                <label style={s.label}>Ders Başlığı *</label>
                <input
                  style={s.input}
                  placeholder="Örn: Python'a Giriş — Değişkenler ve Döngüler"
                  value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div style={s.group}>
                <label style={s.label}>Kod Dili</label>
                <div style={s.langGrid}>
                  {LANGUAGES.map(l => (
                    <div
                      key={l.value}
                      style={{
                        ...s.langCard,
                        ...(createForm.code_language === l.value ? s.langCardActive : {}),
                      }}
                      onClick={() => setCreateForm(f => ({ ...f, code_language: l.value }))}
                    >
                      <span style={{ fontSize: '20px' }}>{l.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => { setShowCreate(false); setCreateError(''); }}
                >
                  İptal
                </button>
                <button
                  className="btn-hover"
                  style={{ ...s.primaryBtn, flex: 1, marginTop: 0 }}
                  type="submit"
                  disabled={createLoading}
                >
                  {createLoading ? 'Oluşturuluyor...' : '🚀 Dersi Oluştur ve Gir'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Oturumlar listesi */}
        <div style={s.listHeader}>
          <h2 style={s.listTitle}>
            {isMentor ? 'Oluşturduğum Dersler' : 'Katıldığım Dersler'}
          </h2>
          <button style={s.refreshBtn} onClick={fetchSessions}>↻ Yenile</button>
        </div>

        {loading ? (
          <div style={s.empty}>Yükleniyor...</div>
        ) : sessions.length === 0 ? (
          <div style={s.emptyCard}>
            <div style={{ fontSize: '52px', marginBottom: '1rem' }}>📭</div>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              {isMentor ? 'Henüz ders oluşturmadınız.' : 'Henüz hiçbir derse katılmadınız.'}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {sessions.map(s_ => {
              const st = STATUS_MAP[s_.status] || STATUS_MAP.waiting;
              const lang = LANGUAGES.find(l => l.value === s_.code_language);
              return (
                <div key={s_.id} style={s.card} className="animate-fade-in-up">
                  <div style={s.cardTop}>
                    <div style={{ ...s.statusBadge, color: st.color, background: st.bg }}>
                      {st.icon} {st.label}
                    </div>
                    <div style={s.langBadge}>
                      {lang?.icon} {lang?.label || s_.code_language}
                    </div>
                  </div>

                  <h3 style={s.cardTitle}>{s_.title}</h3>

                  <div style={s.cardMeta}>
                    <span>👨‍💼 {s_.mentor_name}</span>
                    <span>{s_.student_name ? `🎓 ${s_.student_name}` : '🎓 Öğrenci bekleniyor'}</span>
                  </div>

                  <div style={s.codeRow}>
                    <span style={s.codeLabel}>Oda kodu:</span>
                    <code style={s.codeBox}>{s_.room_code}</code>
                    <button
                      style={s.copyBtn}
                      onClick={() => navigator.clipboard.writeText(s_.room_code)}
                      title="Kopyala"
                    >
                      📋
                    </button>
                  </div>

                  {s_.ended_at && (
                    <div style={s.timeInfo}>
                      ✅ {new Date(s_.ended_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}

                  {s_.status !== 'ended' && (
                    <button
                      className="btn-hover"
                      style={s.enterBtn}
                      onClick={() => enterRoom(s_.room_code)}
                    >
                      {s_.status === 'active' ? '🔴 Derse Devam Et' : '▶ Derse Gir'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  hero: { padding: '3rem 2rem' },
  heroInner: { maxWidth: '900px', margin: '0 auto' },
  heroTitle: { fontSize: '2rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.5px' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: '15px' },

  body: { maxWidth: '960px', margin: '0 auto', padding: '2rem' },

  actionRow: { marginBottom: '1.5rem' },
  joinForm: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' },
  joinInputWrap: { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff', flex: 1, minWidth: '240px' },
  joinInputIcon: { padding: '0 12px', fontSize: '16px', background: '#f8fafc', borderRight: '1.5px solid #e2e8f0', alignSelf: 'stretch', display: 'flex', alignItems: 'center' },
  joinInput: { flex: 1, padding: '0.75rem 1rem', border: 'none', outline: 'none', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', background: 'transparent', textTransform: 'uppercase', letterSpacing: '2px' },
  primaryBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 14px rgba(79,70,229,0.3)', whiteSpace: 'nowrap' },
  errorMsg: { width: '100%', color: '#dc2626', fontSize: '13px', margin: '0.25rem 0 0' },

  createCard: { background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: '2rem', border: '1px solid #e2e8f0' },
  createTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '14px', marginBottom: '1rem' },
  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '0.75rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', background: '#fff', boxSizing: 'border-box', outline: 'none' },
  langGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  langCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0.6rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', background: '#f8fafc', minWidth: '72px', transition: 'all 0.15s' },
  langCardActive: { borderColor: '#4f46e5', background: '#eef2ff' },
  cancelBtn: { padding: '0.75rem 1.25rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },

  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
  listTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  refreshBtn: { background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '3rem', fontSize: '15px' },
  emptyCard: { background: '#fff', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', border: '1px solid #e2e8f0' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  card: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' },
  statusBadge: { fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' },
  langBadge: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
  cardTitle: { fontSize: '15px', fontWeight: '800', color: '#1e293b', lineHeight: '1.4', margin: 0 },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px', color: '#64748b' },
  codeRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  codeLabel: { fontSize: '12px', color: '#94a3b8' },
  codeBox: { fontSize: '13px', fontWeight: '700', color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '6px', letterSpacing: '1px' },
  copyBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px' },
  timeInfo: { fontSize: '12px', color: '#94a3b8' },
  enterBtn: { padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif", marginTop: 'auto', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' },
};
