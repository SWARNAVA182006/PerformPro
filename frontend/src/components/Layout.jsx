import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Check, ChevronLeft, ChevronRight, Menu, Search, Activity, Target, X, Settings, Sparkles } from 'lucide-react';
import { notificationApi, searchApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';
import SahayakWidget from './SahayakWidget';

const ROLE_COLORS = {
  Admin:    { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.25)',  grad: 'linear-gradient(135deg,#ef4444,#f43f5e)' },
  Manager:  { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.25)', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  Employee: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)', grad: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  Client:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
};

const NAV_ITEMS = [
  { name: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard, roles: ['Admin','Manager','Employee'], color: '#6366f1' },
  { name: 'Goals',       href: '/goals',       icon: Target,          roles: ['Admin','Manager','Employee'], color: '#10b981' },
  { name: 'Appraisals',  href: '/appraisals',  icon: FileText,        roles: ['Admin','Manager','Employee'], color: '#06b6d4' },
  { name: 'Directory',   href: '/employees',   icon: Users,           roles: ['Admin','Manager'],            color: '#8b5cf6' },
  { name: 'Analytics',   href: '/reports',     icon: Activity,        roles: ['Admin','Manager','Employee'], color: '#f59e0b' },
  { name: 'System Logs', href: '/logs',        icon: Settings,        roles: ['Admin'],                      color: '#ec4899' },
];

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location  = useLocation();
  const navigate  = useNavigate();
  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.Employee;

  const filteredNav = NAV_ITEMS.filter(i => i.roles.includes(user?.role));

  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [notifications, setNotifs]      = useState([]);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [searchResults, setSearchRes]   = useState([]);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [pageTitle, setPageTitle]       = useState('');
  const notifRef  = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const found = NAV_ITEMS.find(i => location.pathname.startsWith(i.href));
    setPageTitle(found?.name || 'PerformPro');
  }, [location.pathname]);

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  const fetchNotifs = async () => {
    try {
      if (user) {
        const res = await notificationApi.getAll(true);
        if (res.success) setNotifs(res.data);
      }
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifs(p => p.filter(n => n.id !== id));
    } catch {}
  };

  useEffect(() => {
    const fn = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); setSearchOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(searchQ);
        if (res?.success) { setSearchRes(res.data||[]); setSearchOpen(true); }
      } catch {}
    }, 380);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleSearch = (r) => {
    setSearchOpen(false); setSearchQ('');
    if (r.type === 'Employee') navigate(`/employees/${r.id}`);
    else if (r.type === 'Goal') navigate('/goals');
    else if (r.type === 'Appraisal') navigate('/appraisals');
  };

  // ── Sidebar Content ──────────────────────────────────────────────────────
  const SidebarContent = ({ col }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{
        height: 64, display:'flex', alignItems:'center',
        justifyContent: col ? 'center' : 'flex-start',
        padding: col ? '0 1rem' : '0 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.055)', flexShrink: 0
      }}>
        <motion.div
          whileHover={{ rotate: col ? 15 : 3, scale: 1.08 }}
          transition={{ duration: 0.35, type: 'spring' }}
          style={{
            width: 36, height: 36, borderRadius: '0.875rem', overflow: 'hidden', flexShrink: 0,
            border: '1.5px solid rgba(99,102,241,0.4)',
            boxShadow: '0 0 18px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            cursor: 'pointer', background: '#0d1220', position: 'relative',
          }}
        >
          <img src="/logo.jpeg" alt="PerformPro" style={{ width:'200%', height:'100%', objectFit:'cover', objectPosition:'left center', display:'block' }} />
        </motion.div>
        {!col && (
          <motion.div
            initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-8 }} transition={{ duration:0.2 }}
            style={{ marginLeft:'0.75rem', overflow:'hidden', whiteSpace:'nowrap' }}
          >
            <p style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:800, color:'#f0f4ff', fontSize:'1rem', letterSpacing:'-0.02em' }}>
              Perform<span style={{ background:'var(--grad-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Pro</span>
            </p>
            <p style={{ margin:0, fontSize:'0.6rem', color:'#475569', marginTop:'0.15rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Enterprise</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'1rem 0.625rem', display:'flex', flexDirection:'column', gap:'0.2rem' }} className="hide-scrollbar">
        {!col && (
          <p style={{ fontFamily:'var(--font-display)', fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.14em', color:'#94a3b8', textTransform:'uppercase', paddingLeft:'0.75rem', marginBottom:'0.625rem', marginTop:0 }}>
            Navigation
          </p>
        )}
        {filteredNav.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name} to={item.href}
              title={col ? item.name : undefined}
              style={{
                display:'flex', alignItems:'center', gap:'0.75rem',
                padding: col ? '0.75rem' : '0.65rem 0.875rem',
                justifyContent: col ? 'center' : 'flex-start',
                borderRadius:'0.875rem', textDecoration:'none',
                position:'relative', overflow:'hidden',
                background: isActive ? `${item.color}18` : 'transparent',
                border: isActive ? `1px solid ${item.color}30` : '1px solid transparent',
                color: isActive ? item.color : '#4a5568',
                fontFamily: 'var(--font-body)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#4a5568'; e.currentTarget.style.borderColor='transparent'; }}}
            >
              {isActive && (
                <motion.div layoutId="navGlow"
                  style={{ position:'absolute', left:0, top:'15%', height:'70%', width:3, borderRadius:'0 2px 2px 0', background:`linear-gradient(to bottom, ${item.color}, ${item.color}88)` }}
                />
              )}
              <item.icon size={17} style={{
                flexShrink:0, color: isActive ? item.color : 'inherit',
                filter: isActive ? `drop-shadow(0 0 6px ${item.color}88)` : 'none',
                transition: 'filter 0.3s',
              }} />
              {!col && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding:'0.875rem 0.75rem', borderTop:'1px solid rgba(255,255,255,0.055)', flexShrink:0 }}>
        {col ? (
          <div title={user?.role}
            style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, margin:'0 auto', background: roleStyle.grad, color:'#fff', cursor:'help', boxShadow:`0 0 14px ${roleStyle.border}` }}
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:'0.875rem', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.055)', transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
          >
            <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, flexShrink:0, background: roleStyle.grad, color:'#fff', boxShadow:`0 2px 10px ${roleStyle.border}` }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:'0.8rem', fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:'var(--font-body)' }}>
                {user?.name || user?.email || 'User'}
              </p>
              <p style={{ margin:'0.1rem 0 0', fontSize:'0.65rem', color: roleStyle.text, fontWeight:700, letterSpacing:'0.04em' }}>{user?.role}</p>
            </div>
            <button onClick={logout} title="Logout"
              style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'0.3rem', display:'flex', borderRadius:'0.5rem', flexShrink:0, transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background='none'; }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-void)' }}>
      <AnimatedBackground opacity={0.5} />

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <motion.div
        animate={{ width: collapsed ? 70 : 242 }}
        transition={{ duration: 0.28, ease: [0.4,0,0.2,1] }}
        style={{
          flexShrink:0, position:'relative', zIndex:20, overflow:'hidden',
          background:'linear-gradient(180deg, rgba(8,12,26,0.98) 0%, rgba(6,9,24,0.98) 100%)',
          borderRight:'1px solid rgba(255,255,255,0.055)',
        }}
        className="hidden md:block"
      >
        <SidebarContent col={collapsed} />
        <button onClick={() => setCollapsed(v=>!v)}
          style={{
            position:'absolute', right:-11, top:76,
            width:22, height:22, borderRadius:'50%',
            background:'#161f31', border:'1px solid rgba(255,255,255,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'#475569', zIndex:30, padding:0,
            boxShadow:'0 2px 10px rgba(0,0,0,0.5)',
            transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='#1e293b'; e.currentTarget.style.color='#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#161f31'; e.currentTarget.style.color='#475569'; }}
        >
          {collapsed ? <ChevronRight size={12}/> : <ChevronLeft size={12}/>}
        </button>
      </motion.div>

      {/* ── Mobile Drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setMobileOpen(false)}
              style={{ position:'fixed', inset:0, background:'rgba(3,5,15,0.85)', backdropFilter:'blur(6px)', zIndex:40 }}
            />
            <motion.div initial={{x:-242}} animate={{x:0}} exit={{x:-242}} transition={{duration:0.25, ease:'easeOut'}}
              style={{ position:'fixed', left:0, top:0, bottom:0, width:242, zIndex:50, background:'rgba(8,12,26,0.98)', borderRight:'1px solid rgba(255,255,255,0.06)' }}
              className="md:hidden"
            >
              <SidebarContent col={false} />
              <button onClick={() => setMobileOpen(false)}
                style={{ position:'absolute', top:'1rem', right:'1rem', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'0.5rem', padding:'0.375rem', cursor:'pointer', color:'#64748b' }}
              ><X size={16}/></button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', zIndex:10 }}>

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header style={{
          height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 1.5rem', flexShrink:0,
          background:'rgba(6,9,24,0.82)',
          backdropFilter:'blur(20px) saturate(180%)',
          WebkitBackdropFilter:'blur(20px) saturate(180%)',
          borderBottom:'1px solid rgba(255,255,255,0.055)',
          boxShadow:'0 4px 30px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display:'flex', alignItems:'center', flex:1, gap:'1rem' }}>
            <button onClick={() => setMobileOpen(true)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', display:'flex', padding:'0.25rem', transition:'color 0.2s' }}
              className="md:hidden"
              onMouseEnter={e => e.currentTarget.style.color='#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color='#475569'}
            >
              <Menu size={22}/>
            </button>

            <div className="hidden md:flex" style={{ alignItems:'center', gap:'0.5rem' }}>
              <Sparkles size={14} style={{ color:'#94a3b8' }}/>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'0.78rem', color:'#e2e8f0', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {pageTitle}
              </span>
            </div>

            <div style={{ flex:1, maxWidth:420, position:'relative' }} ref={searchRef}>
              <div style={{ position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                <input
                  type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  onFocus={() => { if (searchResults.length) setSearchOpen(true); }}
                  placeholder="Search employees, goals, appraisals..."
                  style={{
                    width:'100%', padding:'0.55rem 1rem 0.55rem 2.4rem',
                    borderRadius:'0.875rem',
                    background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.07)',
                    color:'#e2e8f0', fontSize:'0.835rem',
                    fontFamily:'var(--font-body)', outline:'none',
                    transition:'all 0.25s',
                  }}
                  onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.45)'; e.target.style.background='rgba(255,255,255,0.07)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.background='rgba(255,255,255,0.04)'; e.target.style.boxShadow='none'; }}
                />
              </div>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div initial={{opacity:0, y:-8, scale:0.97}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:-8, scale:0.97}} transition={{duration:0.15}}
                    style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:60, background:'#0d1220', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'1rem', boxShadow:'0 20px 60px rgba(0,0,0,0.6)', overflow:'hidden', maxHeight:300, overflowY:'auto' }}
                    className="hide-scrollbar"
                  >
                    {!searchResults.length ? (
                      <div style={{ padding:'1.25rem', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem' }}>No results for "{searchQ}"</div>
                    ) : searchResults.map((r,i) => (
                      <div key={i} onClick={() => handleSearch(r)}
                        style={{ padding:'0.75rem 1rem', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <span style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#6366f1', background:'rgba(99,102,241,0.1)', padding:'0.15rem 0.5rem', borderRadius:'999px' }}>{r.type}</span>
                        <p style={{ margin:'0.3rem 0 0', fontSize:'0.85rem', fontWeight:600, color:'#e2e8f0' }}>{r.title}</p>
                        <p style={{ margin:'0.1rem 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>{r.subtitle}</p>
                        {r.detail && <p style={{ margin:'0.2rem 0 0', fontSize:'0.7rem', color:'#64748b' }}>{r.detail}</p>}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginLeft:'1rem' }}>
            <div style={{ position:'relative' }} ref={notifRef}>
              <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                onClick={() => setNotifOpen(v=>!v)}
                style={{
                  position:'relative', width:38, height:38, borderRadius:'0.875rem',
                  background: notifOpen ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: notifOpen ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', color: notifOpen ? '#a5b4fc' : '#475569',
                  transition:'all 0.2s',
                }}
              >
                <Bell size={16}/>
                {notifications?.length > 0 && (
                  <motion.span initial={{scale:0}} animate={{scale:1}}
                    style={{ position:'absolute', top:7, right:7, width:8, height:8, background:'#ef4444', borderRadius:'50%', border:'2px solid #060918' }}
                  />
                )}
              </motion.button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{opacity:0, y:-10, scale:0.94}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:-10, scale:0.94}} transition={{duration:0.18, type:'spring', stiffness:400, damping:30}}
                    style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:320, zIndex:60, background:'#0d1220', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'1rem', boxShadow:'0 20px 60px rgba(0,0,0,0.6)', overflow:'hidden' }}
                  >
                    <div style={{ padding:'0.875rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <p style={{ margin:0, fontFamily:'var(--font-display)', fontWeight:700, color:'#e2e8f0', fontSize:'0.875rem' }}>Notifications</p>
                      {notifications?.length > 0 && (
                        <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.12)', padding:'0.2rem 0.6rem', borderRadius:'999px', border:'1px solid rgba(99,102,241,0.2)' }}>
                          {notifications.length} New
                        </span>
                      )}
                    </div>
                    <div style={{ maxHeight:280, overflowY:'auto' }} className="hide-scrollbar">
                      {!notifications?.length ? (
                        <div style={{ padding:'2rem', textAlign:'center', color:'#94a3b8', fontSize:'0.85rem' }}>All caught up ✓</div>
                      ) : notifications.map(n => (
                        <div key={n.id}
                          style={{ padding:'0.875rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:'0.75rem', alignItems:'flex-start', transition:'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >
                          <div style={{ width:6, height:6, borderRadius:'50%', background:'#6366f1', marginTop:'0.45rem', flexShrink:0, boxShadow:'0 0 8px rgba(99,102,241,0.6)' }}/>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontSize:'0.825rem', fontWeight:600, color:'#e2e8f0' }}>{n.title}</p>
                            <p style={{ margin:'0.2rem 0 0', fontSize:'0.775rem', color:'#475569' }}>{n.message}</p>
                            <p style={{ margin:'0.3rem 0 0', fontSize:'0.7rem', color:'#2d3748' }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix:true })}</p>
                          </div>
                          <button onClick={() => markRead(n.id)} title="Dismiss"
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#2d3748', padding:'0.2rem', borderRadius:'0.375rem', flexShrink:0, display:'flex', transition:'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color='#34d399'; e.currentTarget.style.background='rgba(16,185,129,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color='#2d3748'; e.currentTarget.style.background='none'; }}
                          ><Check size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/profile"
              style={{ display:'flex', alignItems:'center', gap:'0.625rem', textDecoration:'none', padding:'0.35rem 0.75rem 0.35rem 0.4rem', borderRadius:'999px', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.13)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
            >
              <div style={{ width:28, height:28, borderRadius:'50%', background: roleStyle.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#fff', flexShrink:0, boxShadow:`0 2px 10px ${roleStyle.border}` }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p style={{ margin:0, fontSize:'0.78rem', fontWeight:600, color:'#cbd5e1', lineHeight:1, fontFamily:'var(--font-body)' }}>{user?.name || 'User'}</p>
                <p style={{ margin:'0.18rem 0 0', fontSize:'0.62rem', color: roleStyle.text, lineHeight:1, fontWeight:700, letterSpacing:'0.04em' }}>{user?.role}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────────────────────── */}
        <main style={{ flex:1, overflowY:'auto', padding:'1.5rem' }} className="hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity:0, y:16, filter:'blur(4px)' }}
              animate={{ opacity:1, y:0, filter:'blur(0px)' }}
              exit={{ opacity:0, y:-10, filter:'blur(2px)' }}
              transition={{ duration:0.28, ease:[0.4,0,0.2,1] }}
            >
              <Outlet/>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Sahayak AI Chatbot ─────────────────────────────────────────── */}
      <SahayakWidget user={user} />
    </div>
  );
};

export default Layout;