import { useState, useCallback, useRef, useEffect } from 'react';
import { processMessage, getQuickReplies, getTypingDelay } from './sahayakBrain';
import api from '../services/api';

const STORAGE_KEY = 'sahayak_session';

const buildBotMessage = (text, quickReplies = []) => ({
  id: Date.now() + Math.random(),
  role: 'bot',
  text,
  quickReplies,
  timestamp: new Date(),
});

const buildUserMessage = (text) => ({
  id: Date.now() + Math.random(),
  role: 'user',
  text,
  timestamp: new Date(),
});

export default function useSahayak({ user, page }) {
  const [isOpen, setIsOpen]       = useState(false);
  const [isTyping, setIsTyping]   = useState(false);
  const [messages, setMessages]   = useState([]);
  const [unreadCount, setUnread]  = useState(0);
  const [liveData, setLiveData]   = useState({});
  const sessionInit               = useRef(false);
  const fetchedData               = useRef(false);

  // ── Fetch live data from backend ──────────────────────────────────────
  const fetchLiveData = useCallback(async () => {
    if (fetchedData.current) return;
    fetchedData.current = true;
    try {
      const [goalsRes, notifRes] = await Promise.allSettled([
        api.get('/goals/my').catch(() => null),
        api.get('/notifications/', { params: { unread_only: true } }).catch(() => null),
      ]);

      const goals = goalsRes.status === 'fulfilled' && goalsRes.value?.data
        ? goalsRes.value.data
        : (goalsRes.status === 'fulfilled' ? goalsRes.value : null);

      const notifs = notifRes.status === 'fulfilled' && notifRes.value?.data
        ? notifRes.value.data
        : (notifRes.status === 'fulfilled' ? notifRes.value : null);

      const goalsArray = Array.isArray(goals) ? goals : (goals?.data || []);
      const notifsArray = Array.isArray(notifs) ? notifs : (notifs?.data || []);

      setLiveData({
        goals: {
          total:       goalsArray.length,
          pending:     goalsArray.filter(g => g.status === 'pending').length,
          in_progress: goalsArray.filter(g => g.status === 'in_progress' || g.status === 'active').length,
          completed:   goalsArray.filter(g => g.status === 'completed').length,
        },
        notifications: notifsArray.length,
      });
    } catch {
      // Silently fail – live data is supplementary
    }
  }, []);

  // ── Init welcome message ──────────────────────────────────────────────
  useEffect(() => {
    if (sessionInit.current || !user) return;
    sessionInit.current = true;

    const name = user?.name || user?.email?.split('@')[0] || 'there';
    const welcomeText = `👋 Hi **${name}**! I'm **Sahayak**, your PerformPro assistant.\n\nI can help you with goals, appraisals, analytics, navigation and much more. Try asking me anything!`;
    setMessages([buildBotMessage(welcomeText, getQuickReplies(page, 'greeting'))]);
    fetchLiveData();
  }, [user, page, fetchLiveData]);

  // ── Re-fetch live data when panel opens ──────────────────────────────
  useEffect(() => {
    if (isOpen) {
      fetchedData.current = false;
      fetchLiveData();
    }
  }, [isOpen, fetchLiveData]);

  // ── Track unread when panel is closed ────────────────────────────────
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'bot') setUnread(u => u + 1);
    }
    if (isOpen) setUnread(0);
  }, [messages, isOpen]);

  // ── Send a message ────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = buildUserMessage(text);
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Process through brain
    const result = processMessage(text, { user, page, liveData });
    const delay  = getTypingDelay(result.text);

    await new Promise(r => setTimeout(r, delay));
    setIsTyping(false);
    const botMsg = buildBotMessage(result.text, result.quickReplies);
    setMessages(prev => [...prev, botMsg]);
  }, [user, page, liveData]);

  // ── Clear chat ────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    const name = user?.name || 'there';
    const resetText = `Chat cleared! 🧹 I'm still here, **${name}**. What can I help you with?`;
    setMessages([buildBotMessage(resetText, getQuickReplies(page, 'greeting'))]);
  }, [user, page]);

  const openWidget  = useCallback(() => { setIsOpen(true);  setUnread(0); }, []);
  const closeWidget = useCallback(() => setIsOpen(false), []);
  const toggleWidget= useCallback(() => setIsOpen(o => { if (o) return false; setUnread(0); return true; }), []);

  return {
    isOpen, isTyping, messages, unreadCount,
    sendMessage, clearChat,
    openWidget, closeWidget, toggleWidget,
  };
}
