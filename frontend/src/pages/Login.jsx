import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Zap, Shield, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const FEATURES = [
  { icon: TrendingUp, label: 'Real-Time KPIs',        desc: 'Live performance metrics & dashboards',   color: '#6366f1', glow: 'rgba(99,102,241,0.35)'  },
  { icon: Shield,     label: 'Role-Based Access',      desc: 'Enterprise-grade security & permissions', color: '#06b6d4', glow: 'rgba(6,182,212,0.35)'   },
  { icon: Users,      label: '360° Appraisals',        desc: 'Peer reviews & manager evaluations',      color: '#10b981', glow: 'rgba(16,185,129,0.35)'  },
  { icon: Zap,        label: 'AI Workforce Insights',  desc: 'Predictive analytics & recommendations',  color: '#f59e0b', glow: 'rgba(245,158,11,0.35)'  },
];

const STATS = [
  { value: '10k+', label: 'Employees Tracked' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '4.9★', label: 'User Rating' },
];

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [activeF, setActiveF]   = useState(0);
  const [focusField, setFocus]  = useState(null);

  const loginAction       = useAuthStore(s => s.login);
  const googleLoginAction = useAuthStore(s => s.googleLogin);
  const navigate          = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setActiveF(i => (i+1) % FEATURES.length), 2800);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await loginAction(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (cred) => {
    setLoading(true); setError(null);
    try {
      await googleLoginAction(cred.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Google Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', position:'relative', overflow:'hidden' }}>
      <AnimatedBackground opacity={0.6} />

      {/* Ambient light blobs */}
      <div style={{ position:'fixed', top:'-20%', left:'30%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents:'none', zIndex:0, animation:'orbDrift 18s ease-in-out infinite alternate' }}/>
      <div style={{ position:'fixed', bottom:'-15%', right:'10%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0, animation:'orbDrift 24s ease-in-out infinite alternate-reverse' }}/>

      <div style={{ display:'flex', width:'100%', zIndex:1, position:'relative' }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, x:-50 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.9, ease:[0.4,0,0.2,1] }}
          className="hidden lg:flex"
          style={{ flex:1.1, flexDirection:'column', justifyContent:'center', padding:'4rem 3.5rem', position:'relative', overflow:'hidden' }}
        >
          {/* Subtle grid pattern */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none', opacity:0.5 }}/>

          {/* Brand */}
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2, duration:0.7}}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'3.5rem' }}>
              <motion.div
                animate={{ rotate:[0,4,-4,0], boxShadow:['0 0 20px rgba(99,102,241,0.4)','0 0 40px rgba(99,102,241,0.7)','0 0 20px rgba(99,102,241,0.4)'] }}
                transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:52, height:52, borderRadius:'1rem', overflow:'hidden', border:'2px solid rgba(99,102,241,0.4)', background:'#0d1220', flexShrink:0 }}
              >
                <img src="/logo.jpeg" alt="PerformPro" style={{ width:'200%', height:'100%', objectFit:'cover', objectPosition:'left center', display:'block' }}/>
              </motion.div>
              <div>
                <h1 style={{ margin:0, fontFamily:'var(--font-display)', fontSize:'1.75rem', fontWeight:800, color:'#f0f4ff', letterSpacing:'-0.03em', lineHeight:1 }}>
                  Perform<span style={{ background:'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Pro</span>
                </h1>
                <p style={{ margin:'0.2rem 0 0', fontSize:'0.72rem', color:'#94a3b8', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase' }}>Enterprise Platform</p>
              </div>
            </div>

            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:800, color:'#f0f4ff', letterSpacing:'-0.03em', lineHeight:1.15, margin:'0 0 1rem' }}>
              Elevate Your<br/>
              <span style={{ background:'linear-gradient(135deg,#6366f1 0%,#06b6d4 50%,#8b5cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundSize:'200% 200%', animation:'auroraShift 4s linear infinite' }}>
                Workforce
              </span><br/>
              Performance
            </h2>
            <p style={{ margin:'0 0 3rem', color:'#475569', fontSize:'1.05rem', lineHeight:1.7, maxWidth:460 }}>
              AI-powered appraisals, real-time KPIs, and 360° feedback — all in one enterprise platform.
            </p>
          </motion.div>

          {/* Feature Carousel */}
          <motion.div initial={{opacity:0, y:24}} animate={{opacity:1, y:0}} transition={{delay:0.4, duration:0.7}} style={{ marginBottom:'3rem' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {FEATURES.map((f, i) => (
                <motion.div key={i}
                  animate={{ x: activeF === i ? 6 : 0 }}
                  transition={{ duration:0.35, ease:[0.34,1.56,0.64,1] }}
                  style={{
                    display:'flex', alignItems:'center', gap:'1rem',
                    padding:'0.875rem 1rem', borderRadius:'1rem',
                    border:`1px solid ${activeF===i ? f.color+'40' : 'rgba(255,255,255,0.05)'}`,
                    background: activeF===i ? `${f.color}12` : 'rgba(255,255,255,0.02)',
                    cursor:'pointer', transition:'all 0.3s ease',
                    boxShadow: activeF===i ? `0 4px 20px ${f.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                  }}
                  onClick={() => setActiveF(i)}
                >
                  <div style={{ width:38, height:38, borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', background: activeF===i ? `${f.color}22` : 'rgba(255,255,255,0.04)', border:`1px solid ${activeF===i ? f.color+'35' : 'transparent'}`, flexShrink:0, transition:'all 0.3s' }}>
                    <f.icon size={17} style={{ color: activeF===i ? f.color : '#94a3b8', filter: activeF===i ? `drop-shadow(0 0 6px ${f.color})` : 'none', transition:'all 0.3s' }}/>
                  </div>
                  <div>
                    <p style={{ margin:0, fontSize:'0.875rem', fontWeight:700, color: activeF===i ? '#e2e8f0' : '#475569', transition:'color 0.3s', fontFamily:'var(--font-body)' }}>{f.label}</p>
                    <p style={{ margin:0, fontSize:'0.775rem', color: activeF===i ? '#64748b' : '#2d3748', transition:'color 0.3s' }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6, duration:0.7}} style={{ display:'flex', gap:'2rem' }}>
            {STATS.map((s, i) => (
              <div key={i}>
                <p style={{ margin:0, fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800, background:'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.value}</p>
                <p style={{ margin:'0.15rem 0 0', fontSize:'0.72rem', color:'#94a3b8', fontWeight:600, letterSpacing:'0.04em' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL — Login Form ─────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1.5rem', width:'100%', flex:1, maxWidth:'560px', marginLeft:'auto' }}>
          <motion.div
            initial={{ opacity:0, y:30, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1 }}
            transition={{ duration:0.7, ease:[0.34,1.56,0.64,1], delay:0.1 }}
            style={{ width:'100%', maxWidth:420 }}
          >
            <div style={{
              background:'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter:'blur(24px) saturate(200%)',
              WebkitBackdropFilter:'blur(24px) saturate(200%)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'1.5rem',
              padding:'2.5rem',
              boxShadow:'0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
              position:'relative', overflow:'hidden',
            }}>
              {/* Top shine */}
              <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:'1px', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', pointerEvents:'none' }}/>

              <div style={{ marginBottom:'2rem' }}>
                <motion.div
                  initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}}
                  transition={{delay:0.25, type:'spring', stiffness:400, damping:25}}
                  style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'999px', padding:'0.3rem 0.875rem', marginBottom:'1.25rem' }}
                >
                  <Sparkles size={12} style={{ color:'#6366f1' }}/>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#a5b4fc', letterSpacing:'0.06em', textTransform:'uppercase' }}>Secure Login</span>
                </motion.div>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.65rem', fontWeight:800, color:'#f0f4ff', margin:'0 0 0.4rem', letterSpacing:'-0.02em' }}>Welcome back</h2>
                <p style={{ margin:0, color:'#475569', fontSize:'0.9rem' }}>Sign in to your enterprise account</p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{opacity:0, y:-8, scale:0.97}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:-8}}
                    style={{ marginBottom:'1.25rem', padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', fontSize:'0.85rem', display:'flex', alignItems:'flex-start', gap:'0.5rem' }}
                  >
                    <span style={{ marginTop:'0.1rem', flexShrink:0 }}>⚠</span>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label style={{ display:'block', marginBottom:'0.5rem', fontSize:'0.78rem', fontWeight:600, color:'#64748b', letterSpacing:'0.04em' }}>EMAIL ADDRESS</label>
                  <input
                    id="login-email"
                    type="email" value={email} required autoComplete="email"
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocus('email')} onBlur={() => setFocus(null)}
                    placeholder="you@company.com"
                    style={{
                      width:'100%', padding:'0.8rem 1rem', borderRadius:'0.875rem',
                      background: focusField==='email' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                      border: focusField==='email' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color:'#f0f4ff', fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none',
                      boxShadow: focusField==='email' ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                      transition:'all 0.2s ease',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display:'block', marginBottom:'0.5rem', fontSize:'0.78rem', fontWeight:600, color:'#64748b', letterSpacing:'0.04em' }}>PASSWORD</label>
                  <div style={{ position:'relative' }}>
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'} value={password} required autoComplete="current-password"
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocus('pass')} onBlur={() => setFocus(null)}
                      placeholder="••••••••"
                      style={{
                        width:'100%', padding:'0.8rem 2.8rem 0.8rem 1rem', borderRadius:'0.875rem',
                        background: focusField==='pass' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                        border: focusField==='pass' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        color:'#f0f4ff', fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none',
                        boxShadow: focusField==='pass' ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                        transition:'all 0.2s ease',
                      }}
                    />
                    <button type="button" onClick={() => setShowPass(v=>!v)}
                      style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:'0.2rem', transition:'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color='#94a3b8'}
                      onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
                    >
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <motion.button
                  id="login-submit"
                  type="submit" disabled={loading}
                  whileHover={!loading ? { scale:1.02, y:-2 } : {}}
                  whileTap={!loading ? { scale:0.97 } : {}}
                  style={{
                    width:'100%', padding:'0.9rem', marginTop:'0.25rem',
                    borderRadius:'0.875rem', border:'none', cursor: loading ? 'wait' : 'pointer',
                    background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color:'#fff', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'0.9rem',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transition:'all 0.25s ease', position:'relative', overflow:'hidden',
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration:0.9, repeat:Infinity, ease:'linear' }}
                        style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%' }}
                      />
                      Signing in...
                    </>
                  ) : (
                    <>Sign in to Dashboard<ArrowRight size={16}/></>
                  )}
                </motion.button>
              </form>

              <div style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'1.5rem 0' }}>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }}/>
                <span style={{ fontSize:'0.72rem', color:'#2d3748', fontWeight:600, letterSpacing:'0.06em' }}>OR CONTINUE WITH</span>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }}/>
              </div>

              <div style={{ display:'flex', justifyContent:'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogle}
                  onError={() => setError('Google Login failed.')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signin_with"
                />
              </div>

              <p style={{ textAlign:'center', marginTop:'1.75rem', margin:'1.75rem 0 0', fontSize:'0.825rem', color:'#94a3b8' }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color:'#a5b4fc', fontWeight:700, textDecoration:'none', transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color='#818cf8'}
                  onMouseLeave={e => e.target.style.color='#a5b4fc'}
                >
                  Request access →
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;