import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../AuthContext';
import Navbar from '../components/Navbar';

const AVATAR_COLORS = ['#4f46e5','#7c3aed','#059669','#2563eb','#d97706','#dc2626','#0891b2','#db2777'];
const getColor = (str) => AVATAR_COLORS[(str ? str.charCodeAt(0) : 0) % AVATAR_COLORS.length];

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultWith = searchParams.get('with'); // mentor detaydan gelince ?with=userId

  const [conversations, setConversations] = useState([]); // benzersiz kişiler
  const [selectedUser, setSelectedUser] = useState(null);  // { id, username, full_name }
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadConversations();
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (selectedUser) loadMessages(selectedUser.id);
  }, [selectedUser]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await API.get('/messages/');
      const all = res.data.results || res.data;

      // Her mesajdan benzersiz konuşma kişilerini çıkar
      const map = {};
      all.forEach(m => {
        const other = String(m.sender) === String(user.id)
          ? { id: m.receiver, username: m.receiver_username }
          : { id: m.sender,   username: m.sender_username  };
        if (!map[other.id]) {
          map[other.id] = { ...other, lastMsg: m.content, lastTime: m.sent_at, unread: 0 };
        }
        if (!m.is_read && String(m.receiver) === String(user.id)) map[other.id].unread++;
      });

      const list = Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setConversations(list);

      // URL'den gelen kişiyi veya ilk kişiyi seç
      if (defaultWith) {
        const found = list.find(c => String(c.id) === String(defaultWith));
        if (found) setSelectedUser(found);
        else setSelectedUser(list[0] || null);
      } else {
        setSelectedUser(list[0] || null);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const res = await API.get(`/messages/?with=${userId}`);
      const msgs = res.data.results || res.data;
      setMessages(msgs);

      // Okunmamış mesaj varsa toplu okundu işaretle
      const hasUnread = msgs.some(m => !m.is_read && String(m.receiver) === String(user.id));
      if (hasUnread) {
        await API.post('/messages/mark-read/', { sender_id: userId });
        // Konuşma listesindeki unread sayısını sıfırla
        setConversations(prev => prev.map(c => String(c.id) === String(userId) ? { ...c, unread: 0 } : c));
        // Navbar'daki rozeti anlık güncelle
        window.dispatchEvent(new CustomEvent('messages-read'));
      }
    } catch {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const res = await API.post('/messages/', {
        receiver: selectedUser.id,
        content: newMsg.trim(),
      });
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
      // Konuşma listesini güncelle
      setConversations(prev => prev.map(c =>
        c.id === selectedUser.id ? { ...c, lastMsg: newMsg.trim(), lastTime: new Date().toISOString() } : c
      ));
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? Object.values(detail).flat().join(' ') : 'Mesaj gönderilemedi.';
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Şimdi';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
    if (diff < 86400) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={s.page}>
        {/* Sol — konuşma listesi */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <h2 style={s.sidebarTitle}>💬 Sohbetler</h2>
            <span style={s.convCount}>{conversations.length}</span>
          </div>

          {loading ? (
            <div style={s.sidebarEmpty}>Yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div style={s.sidebarEmpty}>
              <div style={{ fontSize: '40px', marginBottom: '0.75rem' }}>💬</div>
              <p>Henüz hiç sohbetin yok.</p>
              <p style={{ fontSize: '13px', marginTop: '0.5rem' }}>
                Bir mentörün profiline git ve mesaj gönder.
              </p>
            </div>
          ) : (
            conversations.map(c => (
              <div
                key={c.id}
                style={{
                  ...s.convItem,
                  ...(selectedUser?.id === c.id ? s.convItemActive : {}),
                }}
                onClick={() => setSelectedUser(c)}
              >
                <div style={{ ...s.convAvatar, background: getColor(c.username) }}>
                  {(c.username || '?')[0].toUpperCase()}
                </div>
                <div style={s.convInfo}>
                  <div style={s.convName}>{c.username}</div>
                  <div style={s.convLast}>{c.lastMsg?.slice(0, 35)}{c.lastMsg?.length > 35 ? '...' : ''}</div>
                </div>
                <div style={s.convRight}>
                  <div style={s.convTime}>{formatTime(c.lastTime)}</div>
                  {c.unread > 0 && <div style={s.unreadBadge}>{c.unread}</div>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sağ — mesaj ekranı */}
        <div style={s.chatArea}>
          {!selectedUser ? (
            <div style={s.chatEmpty}>
              <div style={{ fontSize: '64px', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Bir sohbet seç</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Sol taraftan bir sohbet seç veya mentor profilinden mesaj gönder.</p>
            </div>
          ) : (
            <>
              {/* Chat başlığı */}
              <div style={s.chatHeader}>
                <div style={{ ...s.chatHeaderAvatar, background: getColor(selectedUser.username) }}>
                  {(selectedUser.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={s.chatHeaderName}>{selectedUser.username}</div>
                  <div style={s.chatHeaderSub}>Mentonnect kullanıcısı</div>
                </div>
              </div>

              {/* Mesajlar */}
              <div style={s.msgList}>
                {messages.length === 0 ? (
                  <div style={s.chatEmpty}>
                    <div style={{ fontSize: '40px', marginBottom: '0.5rem' }}>👋</div>
                    <p style={{ color: '#94a3b8' }}>Sohbeti sen başlat!</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMe = String(m.sender) === String(user.id);
                    const showDate = i === 0 || new Date(m.sent_at).toDateString() !== new Date(messages[i-1].sent_at).toDateString();
                    return (
                      <div key={m.id}>
                        {showDate && (
                          <div style={s.dateDivider}>
                            {new Date(m.sent_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '0.5rem' }}>
                          {!isMe && (
                            <div style={{ ...s.msgAvatar, background: getColor(selectedUser.username) }}>
                              {(selectedUser.username || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div style={{ maxWidth: '65%' }}>
                            <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                              {m.content}
                            </div>
                            <div style={{ ...s.msgTime, textAlign: isMe ? 'right' : 'left' }}>
                              {formatTime(m.sent_at)}
                              {isMe && <span style={{ marginLeft: '4px' }}>{m.is_read ? ' ✓✓' : ' ✓'}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Mesaj gönderme kutusu */}
              <div style={s.inputArea}>
                <textarea
                  style={s.msgInput}
                  placeholder="Mesajınızı yazın... (Enter ile gönder)"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button
                  style={{ ...s.sendBtn, opacity: !newMsg.trim() || sending ? 0.6 : 1 }}
                  onClick={sendMessage}
                  disabled={!newMsg.trim() || sending}
                >
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' },

  // Sidebar
  sidebar: { width: '320px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sidebarTitle: { fontSize: '17px', fontWeight: '800', color: '#1e293b', margin: 0 },
  convCount: { background: '#eef2ff', color: '#4f46e5', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' },
  sidebarEmpty: { padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' },

  convItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' },
  convItemActive: { background: '#eef2ff' },
  convAvatar: { width: '44px', height: '44px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '700', flexShrink: 0 },
  convInfo: { flex: 1, minWidth: 0 },
  convName: { fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '3px' },
  convLast: { fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  convRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 },
  convTime: { fontSize: '11px', color: '#94a3b8' },
  unreadBadge: { background: '#4f46e5', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' },

  // Chat
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatEmpty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', padding: '2rem' },

  chatHeader: { padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' },
  chatHeaderAvatar: { width: '40px', height: '40px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' },
  chatHeaderName: { fontWeight: '700', fontSize: '15px', color: '#1e293b' },
  chatHeaderSub: { fontSize: '12px', color: '#94a3b8' },

  msgList: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' },

  dateDivider: { textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: '1rem 0', background: '#f1f5f9', borderRadius: '20px', padding: '3px 12px', display: 'inline-block', alignSelf: 'center' },

  msgAvatar: { width: '30px', height: '30px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', marginRight: '8px', flexShrink: 0, alignSelf: 'flex-end' },
  bubble: { padding: '0.6rem 1rem', borderRadius: '16px', fontSize: '14px', lineHeight: '1.55', wordBreak: 'break-word' },
  bubbleMe: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', borderBottomRightRadius: '4px' },
  bubbleThem: { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', borderBottomLeftRadius: '4px' },
  msgTime: { fontSize: '11px', color: '#94a3b8', marginTop: '3px', paddingLeft: '4px', paddingRight: '4px' },

  inputArea: { padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' },
  msgInput: { flex: 1, padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontFamily: "'Inter', sans-serif", resize: 'none', outline: 'none', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto' },
  sendBtn: { width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
