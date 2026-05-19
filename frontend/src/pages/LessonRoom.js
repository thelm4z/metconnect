import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../AuthContext';

const LANGUAGES = {
  python: { label: 'Python', placeholder: '# Python kodu buraya...\nprint("Merhaba Dünya!")' },
  javascript: { label: 'JavaScript', placeholder: '// JavaScript kodu buraya...\nconsole.log("Merhaba Dünya!");' },
  java: { label: 'Java', placeholder: '// Java kodu buraya...\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Merhaba!");\n    }\n}' },
  cpp: { label: 'C++', placeholder: '// C++ kodu buraya...\n#include <iostream>\nint main() {\n    std::cout << "Merhaba!" << std::endl;\n    return 0;\n}' },
  html: { label: 'HTML/CSS', placeholder: '<!-- HTML kodu buraya... -->\n<!DOCTYPE html>\n<html>\n<head><title>Sayfa</title></head>\n<body>\n  <h1>Merhaba!</h1>\n</body>\n</html>' },
  sql: { label: 'SQL', placeholder: '-- SQL sorgusu buraya...\nSELECT * FROM users WHERE active = true;' },
  typescript: { label: 'TypeScript', placeholder: '// TypeScript kodu buraya...\nconst message: string = "Merhaba!";\nconsole.log(message);' },
  other: { label: 'Diğer', placeholder: '// Kod buraya...' },
};

const POLL_INTERVAL = 3000;
const SAVE_DEBOUNCE = 2000;

export default function LessonRoom() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('code');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved | error

  const [localCode, setLocalCode] = useState('');
  const [localNotes, setLocalNotes] = useState('');

  const jitsiRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const pollRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSyncRef = useRef({ code: '', notes: '' });
  const isEndedRef = useRef(false);

  // ── İlk yükleme: join + session fetch ──────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    initSession();
    return () => cleanup();
  }, [code]); // eslint-disable-line

  const cleanup = () => {
    clearInterval(pollRef.current);
    clearTimeout(saveTimerRef.current);
    disposeJitsi();
  };

  const disposeJitsi = () => {
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch { }
      jitsiApiRef.current = null;
    }
  };

  const initSession = async () => {
    setLoading(true);
    setError('');
    try {
      // Katıl (veya yeniden gir)
      const joinRes = await API.post(`/lessons/${code}/join/`);
      applySession(joinRes.data);

      // Polling başlat
      pollRef.current = setInterval(pollSession, POLL_INTERVAL);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Derse erişilemiyor.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const applySession = (data) => {
    setSession(data);
    // Sadece uzak değişiklik varsa yerel state'i güncelle
    if (data.shared_code !== lastSyncRef.current.code) {
      setLocalCode(data.shared_code || '');
      lastSyncRef.current.code = data.shared_code || '';
    }
    if (data.shared_notes !== lastSyncRef.current.notes) {
      setLocalNotes(data.shared_notes || '');
      lastSyncRef.current.notes = data.shared_notes || '';
    }
    if (data.status === 'ended' && !isEndedRef.current) {
      isEndedRef.current = true;
      clearInterval(pollRef.current);
    }
  };

  const pollSession = async () => {
    try {
      const res = await API.get(`/lessons/${code}/`);
      applySession(res.data);
    } catch {
      // bağlantı kopuksa sessizce geç
    }
  };

  // ── Jitsi ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || loading) return;
    if (session.status === 'ended') return;
    loadJitsiScript();
  }, [session?.room_code, loading]); // eslint-disable-line

  const loadJitsiScript = () => {
    const scriptId = 'jitsi-external-api';
    if (window.JitsiMeetExternalAPI) { mountJitsi(); return; }
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = mountJitsi;
    document.head.appendChild(script);
  };

  const mountJitsi = useCallback(() => {
    if (!jitsiRef.current || jitsiApiRef.current || !session) return;
    jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: `mentonnect-${session.room_code}`,
      parentNode: jitsiRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'raisehand', 'settings',
        ],
      },
      userInfo: {
        displayName: user?.first_name
          ? `${user.first_name} ${user.last_name || ''}`.trim()
          : user?.username || 'Kullanıcı',
      },
    });
  }, [session, user]);

  // ── Otomatik kaydetme ──────────────────────────────────────────────────────
  const scheduleSync = useCallback((field, value) => {
    clearTimeout(saveTimerRef.current);
    setSyncStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const payload = { [field]: value };
        const res = await API.patch(`/lessons/${code}/`, payload);
        lastSyncRef.current[field === 'shared_code' ? 'code' : 'notes'] = value;
        setSession(res.data);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch {
        setSyncStatus('error');
      }
    }, SAVE_DEBOUNCE);
  }, [code]);

  const handleCodeChange = (val) => {
    setLocalCode(val);
    scheduleSync('shared_code', val);
  };

  const handleNotesChange = (val) => {
    setLocalNotes(val);
    scheduleSync('shared_notes', val);
  };

  // Tab tuşu desteği kod editörü için
  const handleCodeKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newVal = localCode.substring(0, start) + '    ' + localCode.substring(end);
      setLocalCode(newVal);
      scheduleSync('shared_code', newVal);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      });
    }
  };

  // ── Dersi bitir ────────────────────────────────────────────────────────────
  const endSession = async () => {
    if (!window.confirm('Dersi bitirmek istediğinize emin misiniz? Tüm katılımcılar sayfadan çıkarılacak.')) return;
    try {
      await API.post(`/lessons/${code}/end/`);
      disposeJitsi();
      navigate('/lessons');
    } catch (err) {
      alert(err.response?.data?.detail || 'Ders bitirilemedi.');
    }
  };

  const isMentor = user && session && user.id === session.mentor_id;
  const langInfo = LANGUAGES[session?.code_language] || LANGUAGES.other;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div style={s.errorPage}>
        <div style={s.errorCard}>
          <div style={{ fontSize: '52px', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#1e293b', fontWeight: '800', marginBottom: '0.5rem' }}>Derse Erişilemiyor</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button style={s.backBtn} onClick={() => navigate('/lessons')}>← Derslerime Dön</button>
        </div>
      </div>
    );
  }

  if (session?.status === 'ended') {
    return (
      <div style={s.errorPage}>
        <div style={s.errorCard}>
          <div style={{ fontSize: '52px', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#1e293b', fontWeight: '800', marginBottom: '0.5rem' }}>Ders Tamamlandı</h2>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}><strong>{session.title}</strong></p>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '1.5rem' }}>
            Bu ders oturumu sona erdi.
          </p>
          <button style={s.backBtn} onClick={() => navigate('/lessons')}>← Derslerime Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.room}>

      {/* ── Top Bar ── */}
      <header style={s.topBar}>
        <div style={s.topLeft}>
          <button style={s.topBackBtn} onClick={() => navigate('/lessons')} title="Derslerime Dön">
            ←
          </button>
          <div>
            <div style={s.roomTitle}>{session?.title}</div>
            <div style={s.roomMeta}>
              <span style={s.statusDot(session?.status)} />
              <span style={s.metaText}>
                {session?.mentor_name} &amp; {session?.student_name || 'Öğrenci bekleniyor'}
              </span>
              <span style={s.codeChip}>{code}</span>
            </div>
          </div>
        </div>

        <div style={s.topRight}>
          <SyncIndicator status={syncStatus} />
          {isMentor && (
            <button style={s.endBtn} onClick={endSession}>
              ⏹ Dersi Bitir
            </button>
          )}
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={s.main}>

        {/* Video paneli */}
        <div style={s.videoPanel}>
          <div ref={jitsiRef} style={s.jitsiContainer} />
        </div>

        {/* Editör paneli */}
        <div style={s.editorPanel}>

          {/* Tab bar */}
          <div style={s.tabBar}>
            <button
              style={{ ...s.tab, ...(activeTab === 'code' ? s.tabActive : {}) }}
              onClick={() => setActiveTab('code')}
            >
              💻 Kod Editörü
            </button>
            <button
              style={{ ...s.tab, ...(activeTab === 'notes' ? s.tabActive : {}) }}
              onClick={() => setActiveTab('notes')}
            >
              📝 Notlar
            </button>

            {activeTab === 'code' && (
              <div style={s.langChip}>
                {langInfo.label}
              </div>
            )}
          </div>

          {/* Kod editörü */}
          {activeTab === 'code' && (
            <div style={s.editorWrap}>
              <div style={s.editorHeader}>
                <span style={s.editorFileName}>
                  {session?.code_language === 'python' ? 'main.py'
                    : session?.code_language === 'javascript' ? 'main.js'
                    : session?.code_language === 'typescript' ? 'main.ts'
                    : session?.code_language === 'java' ? 'Main.java'
                    : session?.code_language === 'cpp' ? 'main.cpp'
                    : session?.code_language === 'html' ? 'index.html'
                    : session?.code_language === 'sql' ? 'query.sql'
                    : 'code.txt'}
                </span>
                <button
                  style={s.clearBtn}
                  onClick={() => { if (window.confirm('Kodu temizle?')) handleCodeChange(''); }}
                >
                  🗑 Temizle
                </button>
              </div>
              <textarea
                style={s.codeEditor}
                value={localCode}
                onChange={e => handleCodeChange(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                placeholder={langInfo.placeholder}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          )}

          {/* Notlar */}
          {activeTab === 'notes' && (
            <div style={s.editorWrap}>
              <div style={s.editorHeader}>
                <span style={s.editorFileName}>📋 Paylaşımlı Notlar</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Her iki taraf da düzenleyebilir
                </span>
              </div>
              <textarea
                style={s.notesEditor}
                value={localNotes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="Ders notlarınızı buraya yazın...&#10;&#10;• Önemli noktalar&#10;• Ödevler&#10;• Kaynaklar&#10;• Sorular"
                spellCheck={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncIndicator({ status }) {
  const map = {
    idle:   { icon: '●', color: '#94a3b8', text: '' },
    saving: { icon: '↻', color: '#f59e0b', text: 'Kaydediliyor...' },
    saved:  { icon: '✓', color: '#059669', text: 'Kaydedildi' },
    error:  { icon: '✕', color: '#ef4444', text: 'Kayıt hatası' },
  };
  const m = map[status] || map.idle;
  if (!m.text) return null;
  return (
    <span style={{ fontSize: '12px', color: m.color, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: status === 'saving' ? '14px' : '12px' }}>{m.icon}</span>
      {m.text}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Derse bağlanılıyor...</p>
    </div>
  );
}

const statusColor = { waiting: '#f59e0b', active: '#10b981', ended: '#64748b' };
const s = {
  room: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },

  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.25rem', height: '54px', flexShrink: 0,
    background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  topBackBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  roomTitle: { fontSize: '14px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.2px' },
  roomMeta: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' },
  statusDot: (status) => ({ width: '7px', height: '7px', borderRadius: '50%', background: statusColor[status] || '#94a3b8', display: 'inline-block', flexShrink: 0 }),
  metaText: { fontSize: '12px', color: '#64748b' },
  codeChip: { fontSize: '11px', fontWeight: '700', color: '#818cf8', background: 'rgba(79,70,229,0.15)', padding: '1px 7px', borderRadius: '6px', letterSpacing: '1px' },
  topRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  endBtn: { padding: '0.4rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },

  main: { display: 'flex', flex: 1, overflow: 'hidden' },

  videoPanel: { flex: '0 0 42%', background: '#000', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' },
  jitsiContainer: { width: '100%', height: '100%' },

  editorPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1a1a2e' },

  tabBar: { display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  tab: { padding: '0.4rem 0.9rem', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderRadius: '8px', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' },
  tabActive: { color: '#e2e8f0', background: 'rgba(255,255,255,0.08)' },
  langChip: { marginLeft: 'auto', fontSize: '11px', color: '#818cf8', background: 'rgba(79,70,229,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' },

  editorWrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  editorHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', background: '#161625', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 },
  editorFileName: { fontSize: '12px', color: '#64748b', fontFamily: 'monospace' },
  clearBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },

  codeEditor: {
    flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none',
    background: '#0d1117', color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: '14px', lineHeight: '1.7', padding: '1rem',
    boxSizing: 'border-box', tabSize: 4,
  },
  notesEditor: {
    flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none',
    background: '#1a1a2e', color: '#e2e8f0',
    fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: '1.8',
    padding: '1.25rem',
    boxSizing: 'border-box',
  },

  errorPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  errorCard: { textAlign: 'center', background: '#fff', borderRadius: '20px', padding: '3rem 2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxWidth: '400px' },
  backBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
};
