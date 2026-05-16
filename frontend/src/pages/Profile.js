import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#059669', '#2563eb', '#d97706', '#dc2626', '#0891b2', '#db2777'];
const getColor = (str) => AVATAR_COLORS[(str ? str.charCodeAt(0) : 0) % AVATAR_COLORS.length];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [accountForm, setAccountForm] = useState({ first_name: '', last_name: '', email: '' });
  const [profileForm, setProfileForm] = useState({ bio: '', years_experience: '', linkedin_url: '', interests: '', tagInput: '', tags: [] });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const [accountMsg, setAccountMsg] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setAccountForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
    // Rol bazlı profil yükle
    const endpoint = user.role === 'mentor' ? '/mentors/my-profile/' : '/students/my-profile/';
    API.get(endpoint)
      .then(res => {
        const d = res.data;
        if (user.role === 'mentor') {
          setProfileForm({
            bio: d.bio || '',
            years_experience: d.years_experience || '',
            linkedin_url: d.linkedin_url || '',
            tagInput: '',
            tags: (d.tags || []).map(t => t.name),
            interests: '',
          });
        } else {
          setProfileForm({ bio: d.bio || '', interests: d.interests || '', years_experience: '', linkedin_url: '', tagInput: '', tags: [] });
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  const avatarColor = getColor(user.first_name || user.username);
  const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.username?.[0] || '?').toUpperCase();

  // ── Hesap bilgileri kaydet ────────────────────────────────────────────────
  const saveAccount = async (e) => {
    e.preventDefault();
    setLoadingAccount(true);
    setAccountMsg(null);
    try {
      const res = await API.patch('/auth/me/', accountForm);
      updateUser(res.data);
      setAccountMsg({ type: 'success', text: 'Hesap bilgileri başarıyla güncellendi.' });
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join(' ')
        : 'Güncelleme başarısız.';
      setAccountMsg({ type: 'error', text: msg });
    } finally {
      setLoadingAccount(false);
    }
  };

  // ── Profil bilgileri kaydet ───────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileMsg(null);
    try {
      const endpoint = user.role === 'mentor' ? '/mentors/my-profile/' : '/students/my-profile/';
      const payload = user.role === 'mentor'
        ? { bio: profileForm.bio, years_experience: profileForm.years_experience, linkedin_url: profileForm.linkedin_url, tag_names: profileForm.tags }
        : { bio: profileForm.bio, interests: profileForm.interests };
      await API.patch(endpoint, payload);
      setProfileMsg({ type: 'success', text: 'Profil başarıyla güncellendi.' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Profil güncellenemedi.' });
    } finally {
      setLoadingProfile(false);
    }
  };

  // ── Şifre değiştir ───────────────────────────────────────────────────────
  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }
    setLoadingPassword(true);
    try {
      await API.post('/auth/change-password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMsg({ type: 'success', text: 'Şifre başarıyla değiştirildi. Güvenlik için tekrar giriş yapmanız önerilir.' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? Object.values(detail).flat().join(' ') : 'Şifre değiştirilemedi.';
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setLoadingPassword(false);
    }
  };

  // ── Tag helpers ──────────────────────────────────────────────────────────
  const addTag = () => {
    const t = profileForm.tagInput.trim().toLowerCase();
    if (t && !profileForm.tags.includes(t) && profileForm.tags.length < 10) {
      setProfileForm(f => ({ ...f, tags: [...f.tags, t], tagInput: '' }));
    }
  };
  const removeTag = (tag) => setProfileForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const TABS = [
    { id: 'account', label: 'Hesap Bilgileri', icon: '👤' },
    { id: 'profile', label: user.role === 'mentor' ? 'Mentor Profili' : 'Öğrenci Profili', icon: user.role === 'mentor' ? '👨‍💼' : '🎓' },
    { id: 'password', label: 'Şifre Değiştir', icon: '🔒' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* ── Profil başlığı ── */}
      <section className="hero-gradient" style={s.heroBanner}>
        <div style={s.heroBannerInner}>
          <div style={{ ...s.avatarLarge, background: avatarColor }}>{initials}</div>
          <div>
            <h1 style={s.heroName}>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h1>
            <div style={s.heroMeta}>
              <span style={s.roleBadge}>{user.role === 'mentor' ? '👨‍💼 Mentor' : '🎓 Öğrenci'}</span>
              <span style={s.heroUsername}>@{user.username}</span>
              {user.is_email_verified && <span style={s.verifiedBadge}>✓ Doğrulandı</span>}
            </div>
          </div>
        </div>
      </section>

      <div style={s.pageBody}>
        {/* ── Sekmeler ── */}
        <div style={s.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={{ ...s.tabBtn, ...(activeTab === tab.id ? s.tabBtnActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div style={s.card}>

          {/* ── Hesap Bilgileri ── */}
          {activeTab === 'account' && (
            <form onSubmit={saveAccount}>
              <div style={s.sectionTitle}>Kişisel Bilgiler</div>
              <p style={s.sectionSub}>Ad, soyad ve e-posta adresinizi buradan güncelleyebilirsiniz.</p>

              {accountMsg && <Msg type={accountMsg.type} text={accountMsg.text} />}

              <div style={s.row}>
                <div style={s.group}>
                  <label style={s.label}>Ad</label>
                  <input style={s.input} value={accountForm.first_name} onChange={e => setAccountForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Adınız" />
                </div>
                <div style={s.group}>
                  <label style={s.label}>Soyad</label>
                  <input style={s.input} value={accountForm.last_name} onChange={e => setAccountForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Soyadınız" />
                </div>
              </div>

              <div style={s.group}>
                <label style={s.label}>E-posta</label>
                <input style={s.input} type="email" value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@mail.com" />
              </div>

              <div style={s.group}>
                <label style={s.label}>Kullanıcı Adı</label>
                <input style={{ ...s.input, background: '#f8fafc', color: '#94a3b8' }} value={user.username} readOnly />
                <span style={s.hint}>Kullanıcı adı değiştirilemez.</span>
              </div>

              <div style={s.group}>
                <label style={s.label}>Rol</label>
                <input style={{ ...s.input, background: '#f8fafc', color: '#94a3b8' }} value={user.role === 'mentor' ? 'Mentor' : 'Öğrenci'} readOnly />
              </div>

              <button className="btn-hover" style={{ ...s.submitBtn, opacity: loadingAccount ? 0.8 : 1 }} type="submit" disabled={loadingAccount}>
                {loadingAccount ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          )}

          {/* ── Profil Bilgileri ── */}
          {activeTab === 'profile' && (
            <form onSubmit={saveProfile}>
              <div style={s.sectionTitle}>{user.role === 'mentor' ? 'Mentor Profili' : 'Öğrenci Profili'}</div>
              <p style={s.sectionSub}>Profilinizde görünen bilgileri buradan düzenleyin.</p>

              {profileMsg && <Msg type={profileMsg.type} text={profileMsg.text} />}

              {profileLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Yükleniyor...</div>
              ) : (
                <>
                  <div style={s.group}>
                    <label style={s.label}>Hakkınızda (Biyografi)</label>
                    <textarea
                      style={{ ...s.input, height: '120px', resize: 'vertical' }}
                      value={profileForm.bio}
                      onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="Kendinizden kısaca bahsedin..."
                    />
                  </div>

                  {user.role === 'mentor' ? (
                    <>
                      <div style={s.row}>
                        <div style={s.group}>
                          <label style={s.label}>Yıl Deneyim</label>
                          <input
                            style={s.input}
                            type="number"
                            min={0}
                            max={50}
                            value={profileForm.years_experience}
                            onChange={e => setProfileForm(f => ({ ...f, years_experience: e.target.value }))}
                            placeholder="Örn: 5"
                          />
                        </div>
                        <div style={s.group}>
                          <label style={s.label}>LinkedIn URL</label>
                          <input
                            style={s.input}
                            type="url"
                            value={profileForm.linkedin_url}
                            onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))}
                            placeholder="https://linkedin.com/in/kullanici"
                          />
                        </div>
                      </div>

                      <div style={s.group}>
                        <label style={s.label}>Uzmanlık Etiketleri</label>
                        <div style={s.tagInputRow}>
                          <input
                            style={{ ...s.input, flex: 1 }}
                            value={profileForm.tagInput}
                            onChange={e => setProfileForm(f => ({ ...f, tagInput: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                            placeholder="Etiket ekle (Enter'a bas)"
                          />
                          <button type="button" style={s.tagAddBtn} onClick={addTag}>+ Ekle</button>
                        </div>
                        <div style={s.tagRow}>
                          {profileForm.tags.map(tag => (
                            <span key={tag} style={s.tag}>
                              {tag}
                              <span style={s.tagRemove} onClick={() => removeTag(tag)}>✕</span>
                            </span>
                          ))}
                          {profileForm.tags.length === 0 && <span style={{ color: '#94a3b8', fontSize: '13px' }}>Henüz etiket yok</span>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={s.group}>
                      <label style={s.label}>İlgi Alanları</label>
                      <input
                        style={s.input}
                        value={profileForm.interests}
                        onChange={e => setProfileForm(f => ({ ...f, interests: e.target.value }))}
                        placeholder="Örn: python, react, data science"
                      />
                      <span style={s.hint}>Virgülle ayırarak birden fazla alan yazabilirsiniz.</span>
                    </div>
                  )}
                </>
              )}

              <button className="btn-hover" style={{ ...s.submitBtn, opacity: loadingProfile ? 0.8 : 1 }} type="submit" disabled={loadingProfile || profileLoading}>
                {loadingProfile ? 'Kaydediliyor...' : 'Profili Güncelle'}
              </button>
            </form>
          )}

          {/* ── Şifre Değiştir ── */}
          {activeTab === 'password' && (
            <form onSubmit={savePassword}>
              <div style={s.sectionTitle}>Şifre Değiştir</div>
              <p style={s.sectionSub}>Hesabınızın güvenliği için güçlü bir şifre seçin.</p>

              {passwordMsg && <Msg type={passwordMsg.type} text={passwordMsg.text} />}

              <div style={s.group}>
                <label style={s.label}>Mevcut Şifre</label>
                <input
                  style={s.input}
                  type="password"
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={s.group}>
                <label style={s.label}>Yeni Şifre</label>
                <input
                  style={s.input}
                  type="password"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                />
              </div>

              <div style={s.group}>
                <label style={s.label}>Yeni Şifre (Tekrar)</label>
                <input
                  style={{
                    ...s.input,
                    borderColor: passwordForm.confirm_password && passwordForm.confirm_password !== passwordForm.new_password ? '#ef4444' : '#e2e8f0',
                  }}
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
                {passwordForm.confirm_password && passwordForm.confirm_password !== passwordForm.new_password && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>Şifreler eşleşmiyor</span>
                )}
              </div>

              <div style={s.passwordTips}>
                <div style={{ fontWeight: '600', color: '#374151', fontSize: '13px', marginBottom: '0.5rem' }}>💡 Güçlü şifre ipuçları:</div>
                {['En az 8 karakter kullanın', 'Büyük/küçük harf karışımı ekleyin', 'Rakam ve özel karakter kullanın', 'Kişisel bilgilerinizi kullanmayın'].map(tip => (
                  <div key={tip} style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.3rem' }}>• {tip}</div>
                ))}
              </div>

              <button className="btn-hover" style={{ ...s.submitBtn, opacity: loadingPassword ? 0.8 : 1 }} type="submit" disabled={loadingPassword}>
                {loadingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir 🔒'}
              </button>
            </form>
          )}

        </div>

        {/* Çıkış kutusu */}
        <div style={s.dangerCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Hesaptan Çıkış</div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>Bu cihazda oturumunuzu sonlandırır.</div>
            </div>
            <button
              style={s.dangerBtn}
              onClick={() => { logout(); navigate('/'); }}
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Msg({ type, text }) {
  const isSuccess = type === 'success';
  return (
    <div style={{
      background: isSuccess ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      color: isSuccess ? '#15803d' : '#dc2626',
      padding: '0.75rem 1rem',
      borderRadius: '10px',
      fontSize: '14px',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      {isSuccess ? '✅' : '⚠️'} {text}
    </div>
  );
}

const s = {
  heroBanner: { padding: '3rem 2rem', position: 'relative', overflow: 'hidden' },
  heroBannerInner: { maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 },
  heroName: { fontSize: '1.8rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.5px' },
  heroMeta: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  roleBadge: { background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.3)' },
  heroUsername: { color: 'rgba(255,255,255,0.75)', fontSize: '14px' },
  verifiedBadge: { background: 'rgba(5,150,105,0.3)', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },

  pageBody: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },

  tabBar: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tabBtn: { padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' },
  tabBtnActive: { borderColor: '#4f46e5', background: '#eef2ff', color: '#4f46e5', fontWeight: '700' },

  card: { background: '#fff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },

  sectionTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' },
  sectionSub: { color: '#94a3b8', fontSize: '14px', marginBottom: '1.75rem' },

  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  group: { flex: 1, minWidth: '200px', marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  hint: { color: '#94a3b8', fontSize: '12px', marginTop: '4px', display: 'block' },
  input: {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', fontFamily: "'Inter', sans-serif",
    color: '#1e293b', background: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    outline: 'none',
  },

  tagInputRow: { display: 'flex', gap: '8px', marginBottom: '0.75rem' },
  tagAddBtn: { padding: '0.7rem 1rem', background: '#eef2ff', color: '#4f46e5', border: '1.5px solid #c7d2fe', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '28px' },
  tag: { background: '#eef2ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  tagRemove: { cursor: 'pointer', color: '#818cf8', fontWeight: '900', lineHeight: 1 },

  passwordTips: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },

  submitBtn: {
    padding: '0.85rem 2rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
  },

  dangerCard: { background: '#fff', borderRadius: '16px', padding: '1.5rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #fee2e2' },
  dangerBtn: { padding: '0.6rem 1.5rem', background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
};
