import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, MessageCircle, Minus } from 'lucide-react';
import useSahayak from './useSahayak';
import { useLocation } from 'react-router-dom';

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={{ color: '#c4b5fd', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      // Italic *text*
      return part.split(/(\*[^*]+\*)/g).map((p, k) => {
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
          return <em key={k} style={{ color: '#94a3b8', fontStyle: 'italic' }}>{p.slice(1, -1)}</em>;
        }
        return <span key={k}>{p}</span>;
      });
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 12px rgba(99,102,241,0.5)',
      overflow: 'hidden',
    }}>
      <img src="/sahayak-logo.png" alt="Sahayak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '1rem 1rem 1rem 0.25rem',
      padding: '0.6rem 1rem',
      display: 'flex', gap: '0.3rem', alignItems: 'center',
    }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }}
        />
      ))}
    </div>
  </div>
);

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isBot = msg.role === 'bot';
  const time  = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'flex',
        flexDirection: isBot ? 'row' : 'row-reverse',
        alignItems: 'flex-end',
        gap: '0.5rem',
        marginBottom: '0.5rem',
      }}
    >
      {/* Avatar */}
      {isBot && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 12px rgba(99,102,241,0.45)`,
          alignSelf: 'flex-end', marginBottom: 2,
          overflow: 'hidden',
        }}>
          <img src="/sahayak-logo.png" alt="Sahayak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          padding: isBot ? '0.7rem 0.95rem' : '0.65rem 0.95rem',
          borderRadius: isBot ? '1rem 1rem 1rem 0.25rem' : '1rem 1rem 0.25rem 1rem',
          background: isBot
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))',
          border: isBot
            ? '1px solid rgba(255,255,255,0.07)'
            : '1px solid rgba(99,102,241,0.4)',
          fontSize: '0.82rem',
          lineHeight: 1.65,
          color: isBot ? '#dde4f0' : '#fff',
          backdropFilter: 'blur(10px)',
          boxShadow: isBot
            ? '0 2px 14px rgba(0,0,0,0.3)'
            : '0 2px 14px rgba(99,102,241,0.4)',
          wordBreak: 'break-word',
          fontFamily: 'var(--font-body, sans-serif)',
        }}>
          {isBot ? renderMarkdown(msg.text) : msg.text}
        </div>
        <p style={{
          margin: '0.2rem 0 0',
          fontSize: '0.62rem',
          color: '#3d4a63',
          textAlign: isBot ? 'left' : 'right',
          paddingLeft: isBot ? '0.25rem' : 0,
          paddingRight: isBot ? 0 : '0.25rem',
        }}>
          {time}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Quick Reply Chips ─────────────────────────────────────────────────────────
const QuickReplies = ({ chips, onSend }) => {
  if (!chips?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.4rem 0 0.2rem' }}
    >
      {chips.map((chip, i) => (
        <motion.button
          key={i}
          onClick={() => onSend(chip.replace(/^[^\w]+/, '').trim())}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#a5b4fc',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s',
            fontFamily: 'var(--font-body, sans-serif)',
            lineHeight: 1.4,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
          }}
        >
          {chip}
        </motion.button>
      ))}
    </motion.div>
  );
};

// ─── Main Widget ──────────────────────────────────────────────────────────────
const SahayakWidget = ({ user }) => {
  const location  = useLocation();
  const page      = location.pathname;

  const {
    isOpen, isTyping, messages, unreadCount,
    sendMessage, clearChat, toggleWidget, closeWidget,
  } = useSahayak({ user, page });

  const [input, setInput] = useState('');
  const messagesEndRef    = useRef(null);
  const inputRef          = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  }, [input, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Last bot message's quick replies
  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot');

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <motion.button
        id="sahayak-trigger"
        onClick={toggleWidget}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open Sahayak AI Assistant"
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          width: 56,
          height: 56,
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(99,102,241,0.55), 0 2px 8px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.25s',
        }}
      >
        {/* Pulsing ring when there are messages */}
        {unreadCount > 0 && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              position: 'absolute', inset: -3,
              borderRadius: '1.5rem',
              border: '2px solid #8b5cf6',
              pointerEvents: 'none',
            }}
          />
        )}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}
            >
              <X size={22} color="#fff" />
            </motion.div>
          ) : (
            <motion.div key="open"
            initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'flex' }}
          >
            <img src="/sahayak-logo.png" alt="Sahayak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
          )}
        </AnimatePresence>

        {/* Unread Badge */}
        {unreadCount > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: -4, right: -4,
              width: 20, height: 20, borderRadius: '50%',
              background: '#ef4444', border: '2px solid #06091a',
              fontSize: '0.6rem', fontWeight: 800, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="sahayak-panel"
            initial={{ opacity: 0, y: 24, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.93 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: 'fixed',
              bottom: '5.75rem',
              right: '1.75rem',
              width: 380,
              maxHeight: '78vh',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(10,14,30,0.97) 0%, rgba(7,10,24,0.99) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 60px rgba(99,102,241,0.12)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* ─ Header ─ */}
            <div style={{
              padding: '1rem 1.125rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0,
            }}>
              {/* Bot Icon */}
              <motion.div
                animate={{ boxShadow: ['0 0 12px rgba(99,102,241,0.5)', '0 0 24px rgba(139,92,246,0.7)', '0 0 12px rgba(99,102,241,0.5)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 40, height: 40, borderRadius: '0.875rem',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}
            >
              <img src="/sahayak-logo.png" alt="Sahayak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>

              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, color: '#f0f4ff', fontSize: '0.95rem', letterSpacing: '-0.01em', fontFamily: 'var(--font-display, sans-serif)' }}>
                  Sahayak
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                    {isTyping ? 'Thinking…' : 'Online · PerformPro AI Assistant'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={clearChat}
                  title="Clear chat"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d4a63', padding: '0.3rem', display: 'flex', borderRadius: '0.5rem', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#3d4a63'; e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={closeWidget}
                  title="Close"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d4a63', padding: '0.3rem', display: 'flex', borderRadius: '0.5rem', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#3d4a63'; e.currentTarget.style.background = 'none'; }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>

            {/* ─ Messages ─ */}
            <div
              id="sahayak-messages"
              style={{
                flex: 1, overflowY: 'auto', padding: '1rem',
                display: 'flex', flexDirection: 'column',
                gap: '0.1rem',
                scrollbarWidth: 'none',
              }}
            >
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* ─ Quick Replies ─ */}
            {lastBotMsg?.quickReplies?.length > 0 && !isTyping && (
              <div style={{ padding: '0 1rem', flexShrink: 0 }}>
                <QuickReplies
                  chips={lastBotMsg.quickReplies}
                  onSend={(text) => { sendMessage(text); }}
                />
              </div>
            )}

            {/* ─ Input ─ */}
            <div style={{
              padding: '0.875rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.02)',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '1rem',
                padding: '0.5rem 0.5rem 0.5rem 0.875rem',
                transition: 'all 0.2s',
              }}
                onFocusCapture={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlurCapture={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <textarea
                  ref={inputRef}
                  id="sahayak-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask Sahayak anything…"
                  rows={1}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#e2e8f0', fontSize: '0.835rem', resize: 'none',
                    fontFamily: 'var(--font-body, sans-serif)',
                    lineHeight: 1.5, maxHeight: 80,
                    overflowY: 'auto', scrollbarWidth: 'none',
                    caretColor: '#8b5cf6',
                    paddingTop: '0.15rem',
                  }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                  }}
                />
                <motion.button
                  id="sahayak-send"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  whileHover={input.trim() ? { scale: 1.06 } : {}}
                  whileTap={input.trim() ? { scale: 0.94 } : {}}
                  style={{
                    width: 34, height: 34, borderRadius: '0.75rem', flexShrink: 0,
                    background: input.trim()
                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                      : 'rgba(255,255,255,0.06)',
                    border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: input.trim() ? '0 4px 14px rgba(99,102,241,0.45)' : 'none',
                  }}
                >
                  <Send size={15} color={input.trim() ? '#fff' : '#3d4a63'} />
                </motion.button>
              </div>
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.6rem', color: '#2d3748', textAlign: 'center', letterSpacing: '0.02em' }}>
                Sahayak · PerformPro AI · Responses are role-aware
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SahayakWidget;
