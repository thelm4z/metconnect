import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const TABS = [
  { key: 'applications', label: '📋 Başvurular' },
  { key: 'users',        label: '👥 Kullanıcılar' },
  { key: 'settings',     label: '⚙️ Site Ayarları' },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user || !user.is_staff) navigate('/');
  }, [user, navigate]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  if (!user?.is_staff) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {toast && (
        <div style={{ ...s.toast, background: toast.type === 'success' ? '#059669' : '#dc2626' }}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}

      <section className="hero-gradient" style={s.hero}>
        <h1 style={s.heroTitle}>🛡️ Admin Paneli</h1>
        <p style={s.heroSub}>Platform yönetimi ve ayarları</p>
      </section>

      {/* Tab bar */}
      <div style={s.tabBar}>
        <div style={s.tabInner}>
          {TABS.map(t => (
            <button
              key={t.key}
              style={{ ...s.tabBtn, ...(activeTab === t.key ? s.tabBtnActive : {}) }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {activeTab === 'applications' && <ApplicationsTab showToast={showToast} />}
        {activeTab === 'users'        && <UsersTab showToast={showToast} />}
        {activeTab === 'settings'     && <SettingsTab showToast={showToast} />}
      </div>
    </div>
  );
}

/* ─── BAŞVURULAR SEKMESİ ──────────────────────────────────────────── */
function ApplicationsTab({ showToast }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/verification/');
      setVerifications(res.data.results || res.data);
    } catch {
      showToast('error', 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchVerifications(); }, [fetchVerifications]);

  const confirmAction = async () => {
    if (!modal) return;
    setProcessing(true);
    try {
      await API.patch(`/verification/${modal.id}/review/`, {
        action: modal.action,
        admin_note: adminNote,
      });
      showToast('success', modal.action === 'approve'
        ? `${modal.mentorName} onaylandı!`
        : `${modal.mentorName} reddedildi.`
      );
      fetchVerifications();
    } catch {
      showToast('error', 'İşlem başarısız.');
    } finally {
      setProcessing(false);
      setModal(null);
    }
  };

  const pending = verifications.filter(v => v.status === 'pending');
  const done    = verifications.filter(v => v.status !== 'pending');

  return (
    <>
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '1rem' }}>
              {modal.action === 'approve' ? '✅' : '❌'}
            </div>
            <h2 style={s.modalTitle}>
              {modal.action === 'approve' ? 'Onaylamak istediğine emin misin?' : 'Reddetmek istediğine emin misin?'}
            </h2>
            <p style={s.modalSub}>
              <strong>{modal.mentorName}</strong> için doğrulama başvurusu{' '}
              {modal.action === 'approve' ? 'onaylanacak' : 'reddedilecek'}.
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={s.modalLabel}>Admin Notu (isteğe bağlı)</label>
              <textarea style={s.modalTextarea} placeholder="Mentor'a iletilecek not..." value={adminNote}
                onChange={e => setAdminNote(e.target.value)} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={s.modalCancelBtn} onClick={() => setModal(null)}>Vazgeç</button>
              <button style={{ ...s.modalConfirmBtn, background: modal.action === 'approve' ? '#059669' : '#dc2626' }}
                onClick={confirmAction} disabled={processing}>
                {processing ? 'İşleniyor...' : modal.action === 'approve' ? 'Evet, Onayla' : 'Evet, Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionTitle icon="🕐" title="Bekleyen Başvurular" count={pending.length} />
      {loading ? <Empty msg="Yükleniyor..." /> : pending.length === 0 ? <Empty msg="Bekleyen başvuru yok." /> : (
        pending.map(v => (
          <VerificationCard key={v.id} v={v}
            onApprove={() => { setAdminNote(''); setModal({ id: v.id, action: 'approve', mentorName: v.mentor_username || v.mentor }); }}
            onReject={() => { setAdminNote(''); setModal({ id: v.id, action: 'reject', mentorName: v.mentor_username || v.mentor }); }}
          />
        ))
      )}

      {done.length > 0 && (
        <>
          <SectionTitle icon="📋" title="Tamamlanan Başvurular" count={done.length} mt />
          {done.map(v => <VerificationCard key={v.id} v={v} readOnly />)}
        </>
      )}
    </>
  );
}

function VerificationCard({ v, onApprove, onReject, readOnly }) {
  const statusMap = {
    pending:  { label: 'Bekliyor',   color: '#d97706', bg: '#fef3c7' },
    approved: { label: 'Onaylandı',  color: '#059669', bg: '#d1fae5' },
    rejected: { label: 'Reddedildi', color: '#dc2626', bg: '#fee2e2' },
  };
  const st = statusMap[v.status] || statusMap.pending;
  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div>
          <div style={s.cardName}>{v.mentor_username || `Mentor #${v.mentor}`}</div>
          <div style={s.cardMeta}>📅 {new Date(v.applied_at).toLocaleDateString('tr-TR')}</div>
          {v.cv_file && <a href={v.cv_file} target="_blank" rel="noreferrer" style={s.docLink}>📄 CV'yi Görüntüle</a>}
          {v.extra_note && <div style={s.notes}>📝 {v.extra_note}</div>}
          {v.admin_note && <div style={s.adminNote}>💬 Admin Notu: {v.admin_note}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
          <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>{st.label}</span>
          {!readOnly && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={s.approveBtn} onClick={onApprove}>✅ Onayla</button>
              <button style={s.rejectBtn} onClick={onReject}>❌ Reddet</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── KULLANICILAR SEKMESİ ──────────────────────────────────────────── */
function UsersTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { user: me } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/admin/users/');
      setUsers(res.data.results || res.data);
    } catch {
      showToast('error', 'Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const saveEdit = async () => {
    if (newPassword && newPassword.length < 6) {
      showToast('error', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        role: editModal.role,
        is_staff: editModal.is_staff,
        is_active: editModal.is_active,
      };
      if (newPassword) payload.new_password = newPassword;
      await API.patch(`/auth/admin/users/${editModal.id}/`, payload);
      showToast('success', `${editModal.username} güncellendi.`);
      fetchUsers();
      setEditModal(null);
      setNewPassword('');
    } catch {
      showToast('error', 'Güncelleme başarısız.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    setProcessing(true);
    try {
      await API.delete(`/auth/admin/users/${deleteModal.id}/`);
      showToast('success', `${deleteModal.username} silindi.`);
      fetchUsers();
      setDeleteModal(null);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Silme başarısız.');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = { mentor: '👨‍💼 Mentor', student: '🎓 Öğrenci', admin: '🛡️ Admin' };
  const roleBg    = { mentor: '#eff6ff', student: '#f0fdf4', admin: '#eef2ff' };
  const roleColor = { mentor: '#2563eb', student: '#059669', admin: '#4f46e5' };

  return (
    <>
      {editModal && (
        <div style={s.overlay} onClick={() => setEditModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>✏️ Kullanıcıyı Düzenle</h2>
            <p style={s.modalSub}><strong>@{editModal.username}</strong></p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={s.modalLabel}>Rol</label>
              <select style={s.select} value={editModal.role}
                onChange={e => setEditModal(m => ({ ...m, role: e.target.value }))}>
                <option value="student">🎓 Öğrenci</option>
                <option value="mentor">👨‍💼 Mentor</option>
                <option value="admin">🛡️ Admin</option>
              </select>
            </div>

            <div style={s.toggleRow}>
              <span style={s.toggleLabel}>Admin Yetkisi (is_staff)</span>
              <Toggle value={editModal.is_staff} onChange={v => setEditModal(m => ({ ...m, is_staff: v }))} />
            </div>
            <div style={{ ...s.toggleRow, marginTop: '0.75rem' }}>
              <span style={s.toggleLabel}>Hesap Aktif</span>
              <Toggle value={editModal.is_active} onChange={v => setEditModal(m => ({ ...m, is_active: v }))} />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label style={s.modalLabel}>Yeni Şifre <span style={{ color: '#94a3b8', fontWeight: 400 }}>(boş bırakılırsa değişmez)</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...s.select, paddingRight: '2.5rem' }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="En az 6 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button style={s.modalCancelBtn} onClick={() => { setEditModal(null); setNewPassword(''); }}>İptal</button>
              <button style={{ ...s.modalConfirmBtn, background: '#4f46e5' }} onClick={saveEdit} disabled={processing}>
                {processing ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div style={s.overlay} onClick={() => setDeleteModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '1rem' }}>🗑️</div>
            <h2 style={s.modalTitle}>Kullanıcıyı Sil</h2>
            <p style={s.modalSub}><strong>@{deleteModal.username}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={s.modalCancelBtn} onClick={() => setDeleteModal(null)}>İptal</button>
              <button style={{ ...s.modalConfirmBtn, background: '#dc2626' }} onClick={confirmDelete} disabled={processing}>
                {processing ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <SectionTitle icon="👥" title="Tüm Kullanıcılar" count={users.length} />
        <input style={{ ...s.searchInput, marginLeft: 'auto' }} placeholder="🔍 Kullanıcı ara..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Empty msg="Yükleniyor..." /> : filtered.length === 0 ? <Empty msg="Kullanıcı bulunamadı." /> : (
        <div style={s.table}>
          <div style={s.tableHead}>
            <div style={{ flex: 2 }}>Kullanıcı</div>
            <div style={{ flex: 2 }}>E-posta</div>
            <div style={{ flex: 1 }}>Rol</div>
            <div style={{ flex: 1 }}>Durum</div>
            <div style={{ flex: 1 }}>Katılım</div>
            <div style={{ flex: 1, textAlign: 'right' }}>İşlemler</div>
          </div>
          {filtered.map(u => (
            <div key={u.id} style={s.tableRow}>
              <div style={{ flex: 2 }}>
                <div style={s.userCell}>
                  <div style={{ ...s.userAvatar, background: u.is_staff ? '#4f46e5' : '#64748b' }}>
                    {(u.first_name || u.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                      {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{u.username}</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 2, fontSize: '13px', color: '#64748b', alignSelf: 'center' }}>{u.email}</div>
              <div style={{ flex: 1, alignSelf: 'center' }}>
                <span style={{ ...s.rolePill, background: roleBg[u.role] || '#f1f5f9', color: roleColor[u.role] || '#64748b' }}>
                  {roleLabel[u.role] || u.role}
                </span>
              </div>
              <div style={{ flex: 1, alignSelf: 'center' }}>
                <span style={{ ...s.statusBadge, color: u.is_active ? '#059669' : '#dc2626', background: u.is_active ? '#d1fae5' : '#fee2e2' }}>
                  {u.is_active ? 'Aktif' : 'Pasif'}
                </span>
                {u.is_staff && <span style={{ ...s.statusBadge, color: '#4f46e5', background: '#eef2ff', marginLeft: '4px' }}>Admin</span>}
              </div>
              <div style={{ flex: 1, fontSize: '12px', color: '#94a3b8', alignSelf: 'center' }}>
                {new Date(u.date_joined).toLocaleDateString('tr-TR')}
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', alignSelf: 'center' }}>
                <button style={s.editBtn} onClick={() => { setEditModal({ ...u }); setNewPassword(''); setShowPassword(false); }}>✏️</button>
                {u.id !== me?.id && (
                  <button style={s.deleteBtn} onClick={() => setDeleteModal({ id: u.id, username: u.username })}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── SİTE AYARLARI SEKMESİ ──────────────────────────────────────────── */
function SettingsTab({ showToast }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/auth/admin/settings/').then(res => {
      setForm(res.data);
      setLoading(false);
    }).catch(() => {
      showToast('error', 'Ayarlar yüklenemedi.');
      setLoading(false);
    });
  }, [showToast]);

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.patch('/auth/admin/settings/', form);
      showToast('success', 'Site ayarları kaydedildi.');
    } catch {
      showToast('error', 'Kaydetme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <Empty msg="Yükleniyor..." />;

  return (
    <div style={{ maxWidth: '680px' }}>
      <SectionTitle icon="⚙️" title="Site Ayarları" />

      <form onSubmit={save}>
        <div style={s.settingsCard}>
          <div style={s.settingsSection}>Genel Bilgiler</div>

          <div style={s.fieldGroup}>
            <label style={s.fieldLabel}>Site Başlığı</label>
            <input style={s.fieldInput} value={form.site_title}
              onChange={e => setForm(f => ({ ...f, site_title: e.target.value }))} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.fieldLabel}>Site Açıklaması</label>
            <textarea style={s.fieldTextarea} rows={3} value={form.site_description}
              onChange={e => setForm(f => ({ ...f, site_description: e.target.value }))} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.fieldLabel}>İletişim E-postası</label>
            <input style={s.fieldInput} type="email" value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              placeholder="iletisim@mentonnect.com" />
          </div>
        </div>

        <div style={{ ...s.settingsCard, marginTop: '1.25rem' }}>
          <div style={s.settingsSection}>Platform Durumu</div>

          <div style={s.toggleRow}>
            <div>
              <div style={s.toggleLabel}>Kayıt Açık</div>
              <div style={s.toggleDesc}>Kapalıysa yeni kullanıcılar kayıt olamaz.</div>
            </div>
            <Toggle value={form.registration_open} onChange={v => setForm(f => ({ ...f, registration_open: v }))} />
          </div>

          <div style={{ ...s.toggleRow, borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem' }}>
            <div>
              <div style={s.toggleLabel}>Bakım Modu</div>
              <div style={s.toggleDesc}>Açıksa ziyaretçilere bakım sayfası gösterilir.</div>
            </div>
            <Toggle value={form.maintenance_mode} onChange={v => setForm(f => ({ ...f, maintenance_mode: v }))} />
          </div>
        </div>

        {form.updated_at && (
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '0.75rem' }}>
            Son güncelleme: {new Date(form.updated_at).toLocaleString('tr-TR')}
          </p>
        )}

        <button className="btn-hover" style={s.saveBtn} type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : '💾 Ayarları Kaydet'}
        </button>
      </form>
    </div>
  );
}

/* ─── YARDIMCI BİLEŞENLER ──────────────────────────────────────────── */
function SectionTitle({ icon, title, count, mt }) {
  return (
    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: mt ? '2rem' : 0 }}>
      {icon} {title}
      {count !== undefined && (
        <span style={{ background: '#4f46e5', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>
          {count}
        </span>
      )}
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', background: '#fff', borderRadius: '16px' }}>{msg}</div>;
}

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      style={{ width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', padding: '3px', background: value ? '#4f46e5' : '#e2e8f0', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s', transform: value ? 'translateX(22px)' : 'translateX(0)' }} />
    </button>
  );
}

/* ─── STİLLER ──────────────────────────────────────────── */
const s = {
  hero: { padding: '3rem 2rem', textAlign: 'center' },
  heroTitle: { fontSize: '2rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: '15px' },

  tabBar: { background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: '64px', zIndex: 50 },
  tabInner: { maxWidth: '960px', margin: '0 auto', padding: '0 2rem', display: 'flex', gap: '0.25rem' },
  tabBtn: {
    padding: '0.85rem 1.4rem', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: '14px', fontWeight: '600', color: '#64748b', fontFamily: "'Inter', sans-serif",
    borderBottom: '2px solid transparent', transition: 'all 0.15s ease',
  },
  tabBtnActive: { color: '#4f46e5', borderBottomColor: '#4f46e5' },

  body: { maxWidth: '960px', margin: '0 auto', padding: '2rem' },

  toast: { position: 'fixed', top: '1.5rem', right: '1.5rem', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '12px', fontSize: '14px', fontWeight: '600', zIndex: 9999, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', fontFamily: "'Inter', sans-serif" },

  /* Cards */
  card: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
  cardName: { fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' },
  cardMeta: { fontSize: '13px', color: '#94a3b8', marginBottom: '6px' },
  docLink: { fontSize: '13px', color: '#4f46e5', fontWeight: '600', textDecoration: 'none', display: 'block', marginBottom: '4px' },
  notes: { fontSize: '13px', color: '#64748b', marginTop: '6px' },
  adminNote: { fontSize: '13px', color: '#7c3aed', marginTop: '4px', fontWeight: '500' },
  statusBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block' },
  approveBtn: { padding: '0.5rem 1rem', background: '#d1fae5', color: '#059669', border: '1.5px solid #6ee7b7', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  rejectBtn: { padding: '0.5rem 1rem', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },

  /* Table */
  table: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  tableHead: { display: 'flex', padding: '0.85rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '0.5rem' },
  tableRow: { display: 'flex', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', gap: '0.5rem', transition: 'background 0.1s' },
  userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: { width: '34px', height: '34px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  rolePill: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
  editBtn: { padding: '0.35rem 0.65rem', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  deleteBtn: { padding: '0.35rem 0.65rem', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  searchInput: { padding: '0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", outline: 'none', minWidth: '220px' },

  /* Settings */
  settingsCard: { background: '#fff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  settingsSection: { fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.25rem' },
  fieldGroup: { marginBottom: '1.25rem' },
  fieldLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  fieldInput: { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', boxSizing: 'border-box', outline: 'none' },
  fieldTextarea: { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', boxSizing: 'border-box', outline: 'none', resize: 'vertical' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
  toggleLabel: { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
  toggleDesc: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  saveBtn: { marginTop: '1.5rem', padding: '0.85rem 2rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 16px rgba(79,70,229,0.3)' },

  /* Modal */
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '20px', padding: '2.5rem', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: "'Inter', sans-serif" },
  modalTitle: { fontSize: '20px', fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: '0.5rem' },
  modalSub: { fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.6' },
  modalLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  modalTextarea: { width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  modalCancelBtn: { flex: 1, padding: '0.85rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  modalConfirmBtn: { flex: 1, padding: '0.85rem', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  select: { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: "'Inter', sans-serif", color: '#1e293b', background: '#fff', outline: 'none' },
};
