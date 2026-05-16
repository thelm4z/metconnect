import { useState, useRef, useEffect } from 'react';
import API from '../api';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ChatBot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Merhaba! Ben Mentonnect asistanıyım. Mentor bulmak veya platform hakkında sorularınız için buradayım.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = nextMessages.slice(1);
      const res = await API.post('/chatbot/', {
        message: text,
        history: history.slice(0, -1),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const errText = err.response?.data?.error || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      setMessages(prev => [...prev, { role: 'assistant', content: errText }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        style={styles.fab}
        onClick={() => {
          if (!user) { navigate('/login'); return; }
          setOpen(o => !o);
        }}
        aria-label="Chatbot aç/kapat"
        title={user ? 'Asistanı aç' : 'Chatbot için giriş yapın'}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && user && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerAvatar}>M</div>
              <div>
                <div style={styles.headerName}>Mentonnect Asistanı</div>
                <div style={styles.headerStatus}>Çevrimiçi</div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot),
                }}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.bubble, ...styles.bubbleBot }}>
                <span style={styles.typing}>● ● ●</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <textarea
              style={styles.textarea}
              placeholder="Bir şey sorun..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
              onClick={send}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s',
  },
  window: {
    position: 'fixed',
    bottom: '92px',
    right: '24px',
    width: '360px',
    maxHeight: '520px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 999,
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#4f46e5',
    color: '#fff',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
  },
  headerName: {
    fontWeight: '600',
    fontSize: '14px',
  },
  headerStatus: {
    fontSize: '11px',
    opacity: 0.8,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.8,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '360px',
    background: '#f7f8fc',
  },
  bubble: {
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    background: '#4f46e5',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  bubbleBot: {
    alignSelf: 'flex-start',
    background: '#fff',
    color: '#1a202c',
    border: '1px solid #e2e8f0',
    borderBottomLeftRadius: '4px',
  },
  typing: {
    color: '#a0aec0',
    letterSpacing: '3px',
    fontSize: '10px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid #e2e8f0',
    background: '#fff',
  },
  textarea: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    resize: 'none',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.4',
    maxHeight: '80px',
    overflowY: 'auto',
  },
  sendBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
