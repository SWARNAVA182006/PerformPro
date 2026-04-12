import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Settings, Check, ChevronLeft, ChevronRight, Menu, Search, Activity, Target, X } from 'lucide-react';
import { notificationApi, searchApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';

const ROLE_COLORS = {
    Admin: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
    Manager: { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
    Employee: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
    Client: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
};

const Layout = () => {
  const { user, logout, hasRole } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Goals & Targets', href: '/goals', icon: Target, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Appraisals', href: '/appraisals', icon: FileText, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Directory', href: '/employees', icon: Users, roles: ['Admin', 'Manager'] },
    { name: 'Analytics', href: '/reports', icon: Activity, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'System Logs', href: '/logs', icon: Settings, roles: ['Admin'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));
  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.Employee;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      if (user) {
        const res = await notificationApi.getAll(true);
        if (res.success) setNotifications(res.data);
      }
    } catch (err) {}
  };

  const markAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {}
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(searchQuery);
        if (res?.success) {
          setSearchResults(res.data || []);
          setIsSearchOpen(true);
        }
      } catch (err) {}
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSearchClick = (res) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (res.type === 'Employee') navigate(`/employees/${res.id}`);
    else if (res.type === 'Goal') navigate('/goals');
    else if (res.type === 'Appraisal') navigate('/appraisals');
  };

  const SidebarContent = ({ collapsed }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo Header */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0 1rem' : '0 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        overflow: 'hidden'
      }}>
        {/* Logo image — always shown */}
        <motion.div
          whileHover={collapsed ? { rotate: 15, scale: 1.1 } : { scale: 1.05 }}
          transition={{ duration: 0.3 }}
          style={{ width: 36, height: 36, borderRadius: '0.75rem', overflow: 'hidden', border: '2px solid rgba(99,102,241,0.4)', boxShadow: '0 0 14px rgba(99,102,241,0.35)', flexShrink: 0, cursor: 'pointer', background: '#0d1117' }}
        >
          <img src="/logo.jpeg" alt="PerformPro Logo" style={{ width: '200%', height: '100%', objectFit: 'cover', objectPosition: 'left center', display: 'block' }} />
        </motion.div>
        {/* Brand name — only in expanded state */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ marginLeft: '0.75rem', overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            <p style={{ margin: 0, fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem', lineHeight: 1, letterSpacing: '-0.01em' }}>PerformPro</p>
            <p style={{ margin: 0, fontSize: '0.62rem', color: '#64748b', marginTop: '0.2rem', letterSpacing: '0.03em' }}>Enterprise Platform</p>
          </motion.div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }} className="hide-scrollbar">
        {!collapsed && (
          <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', paddingLeft: '0.75rem', marginBottom: '0.5rem', marginTop: '0' }}>
            Navigation
          </p>
        )}
        {filteredNav.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link key={item.name} to={item.href}
              title={collapsed ? item.name : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: collapsed ? '0.75rem' : '0.65rem 0.875rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '0.875rem', textDecoration: 'none',
                position: 'relative',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                color: isActive ? '#a5b4fc' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#cbd5e1'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  style={{ position: 'absolute', left: 0, top: '20%', width: 3, height: '60%', borderRadius: 2, background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)' }}
                />
              )}
              <item.icon size={18} style={{ flexShrink: 0, color: isActive ? '#a5b4fc' : 'inherit' }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {collapsed ? (
          <div style={{
            width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, margin: '0 auto',
            background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}`,
            cursor: 'help'
          }} title={`Role: ${user?.role || 'Guest'}`}>
            {user?.role?.charAt(0) || 'G'}
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem',
            borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
              background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}`
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || user?.email || 'User'}
              </p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: roleStyle.text, fontWeight: 600 }}>{user?.role}</p>
            </div>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0.25rem', display: 'flex', borderRadius: '0.375rem', flexShrink: 0 }}
              title="Logout"
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#060918' }}>
      {/* === Animated constellation background === */}
      <AnimatedBackground opacity={0.45} />

      {/* === SIDEBAR (Desktop) === */}
      <motion.div
        animate={{ width: isSidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          flexShrink: 0, position: 'relative', zIndex: 20,
          background: 'linear-gradient(180deg, #0d111f 0%, #0a0e1a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
        className="hidden md:block"
      >
        <SidebarContent collapsed={isSidebarCollapsed} />

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(v => !v)}
          style={{
            position: 'absolute', right: -10, top: 78,
            width: 20, height: 20, borderRadius: '50%',
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', zIndex: 30, padding: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.div>

      {/* === MOBILE NAV DRAWER === */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,24,0.8)', backdropFilter: 'blur(4px)', zIndex: 40 }}
            />
            <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, zIndex: 50,
                background: '#0d111f', borderRight: '1px solid rgba(255,255,255,0.06)'
              }}
              className="md:hidden"
            >
              <SidebarContent collapsed={false} />
              <button onClick={() => setIsMobileNavOpen(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '0.5rem', padding: '0.375rem', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* === MAIN CONTENT === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        {/* === TOP BAR === */}
        <header style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', flexShrink: 0,
          background: 'rgba(13,17,31,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '1rem' }}>
            {/* Mobile menu toggle */}
            <button onClick={() => setIsMobileNavOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '0.25rem' }}
              className="md:hidden"
            >
              <Menu size={22} />
            </button>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 440, position: 'relative' }} ref={searchRef}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search employees, goals, appraisals..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }}
                  style={{
                    width: '100%', padding: '0.55rem 1rem 0.55rem 2.4rem', borderRadius: '0.875rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocusCapture={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                  onBlurCapture={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                />
              </div>
              {/* Search dropdown */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 60,
                      background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', maxHeight: 320, overflowY: 'auto'
                    }}
                    className="hide-scrollbar"
                  >
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '1.25rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
                        No results for "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((res, i) => (
                        <div key={i} onClick={() => handleSearchClick(res)}
                          style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{res.type}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{res.title}</p>
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#475569' }}>{res.subtitle}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: notifications + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button onClick={() => setIsNotifOpen(v => !v)}
                style={{
                  position: 'relative', width: 38, height: 38, borderRadius: '0.875rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}
              >
                <Bell size={17} />
                {notifications && notifications.length > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                    background: '#ef4444', borderRadius: '50%',
                    border: '2px solid #060918'
                  }} />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    style={{
                      position: 'absolute', right: 0, top: '110%', width: 320, zIndex: 60,
                      background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>Notifications</p>
                      {notifications?.length > 0 && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {notifications.length} New
                        </span>
                      )}
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }} className="hide-scrollbar">
                      {(!notifications || notifications.length === 0) ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
                          No new notifications ✓
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id}
                            style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', marginTop: '0.4rem', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: '#e2e8f0' }}>{notif.title}</p>
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.775rem', color: '#64748b' }}>{notif.message}</p>
                              <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#334155' }}>{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                            </div>
                            <button onClick={() => markAsRead(notif.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: '0.2rem', borderRadius: '0.375rem', flexShrink: 0, display: 'flex' }}
                              title="Dismiss"
                              onMouseEnter={e => e.currentTarget.style.color = '#34d399'}
                              onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', padding: '0.375rem 0.625rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: roleStyle.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: roleStyle.text,
                border: `1px solid ${roleStyle.border}`, flexShrink: 0
              }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', lineHeight: 1 }}>{user?.name || 'User'}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.65rem', color: roleStyle.text, lineHeight: 1 }}>{user?.role}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* === PAGE CONTENT === */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;