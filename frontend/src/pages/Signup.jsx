import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Sparkles, ArrowRight, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const ROLE_INFO = {
  Admin:    { color: '#ef4444', desc: 'Full system access & oversight' },
  Manager:  { color: '#6366f1', desc: 'Team management & appraisals' },
  Employee: { color: '#10b981', desc: 'Self-evaluations & goals' },
  Client:   { color: '#f59e0b', desc: 'View-only access to reports' },
};

const Signup = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('Employee');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [focusField, setFocus]  = useState(null);

  const navigate     = useNavigate();
  const loginAction  = useAuthStore(state => state.login);
  const roleColors   = ROLE_INFO[role];

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.signup({ email, password, role });
      if (res) navigate('/login');
    } catch (err) {
      setError(err.detail || err?.response?.data?.detail || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.detail || err.message || 'Google Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '2rem 1rem' }}>
      <AnimatedBackground opacity={0.55} />

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-10%', right: '20%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
      >
        {/* Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top shine */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', pointerEvents: 'none' }} />

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '999px', padding: '0.3rem 0.875rem', marginBottom: '1.25rem' }}
            >
              <Sparkles size={12} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Create Account</span>
            </motion.div>

            <motion.div
              animate={{ rotate: [0, 4, -4, 0], boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 40px rgba(99,102,241,0.7)', '0 0 20px rgba(99,102,241,0.4)'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 52, height: 52, borderRadius: '1rem', overflow: 'hidden', border: '2px solid rgba(99,102,241,0.4)', background: '#0d1220', margin: '0 auto 1rem' }}
            >
              <img src="/logo.jpeg" alt="PerformPro" style={{ width: '200%', height: '100%', objectFit: 'cover', objectPosition: 'left center', display: 'block' }} />
            </motion.div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#f0f4ff', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
              Join <span style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PerformPro</span>
            </h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem' }}>Create your enterprise account</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}
              >
                <span>⚠</span><span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email Address</label>
              <input
                id="signup-email"
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocus('email')} onBlur={() => setFocus(null)}
                placeholder="you@company.com"
                style={{
                  width: '100%', padding: '0.8rem 1rem', borderRadius: '0.875rem', boxSizing: 'border-box',
                  background: focusField === 'email' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: focusField === 'email' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: '#f0f4ff', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
                  boxShadow: focusField === 'email' ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocus('pass')} onBlur={() => setFocus(null)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '0.8rem 2.8rem 0.8rem 1rem', borderRadius: '0.875rem', boxSizing: 'border-box',
                    background: focusField === 'pass' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                    border: focusField === 'pass' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: '#f0f4ff', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
                    boxShadow: focusField === 'pass' ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: '0.2rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {Object.entries(ROLE_INFO).map(([r, info]) => (
                  <motion.button key={r} type="button" whileTap={{ scale: 0.97 }}
                    onClick={() => setRole(r)}
                    style={{
                      padding: '0.65rem 0.75rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
                      background: role === r ? `${info.color}18` : 'rgba(255,255,255,0.03)',
                      border: role === r ? `1px solid ${info.color}40` : '1px solid rgba(255,255,255,0.07)',
                      textAlign: 'left', transition: 'all 0.2s',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: role === r ? info.color : '#64748b' }}>{r}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.65rem', color: role === r ? '#94a3b8' : '#334155' }}>{info.desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <motion.button
              id="signup-submit"
              type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              style={{
                width: '100%', padding: '0.9rem', marginTop: '0.25rem',
                borderRadius: '0.875rem', border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.25s ease',
              }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                  />
                  Creating Account...
                </>
              ) : (
                <><UserPlus size={15} /> Create Account</>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '0.72rem', color: '#2d3748', fontWeight: 600, letterSpacing: '0.06em' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="filled_black" shape="pill" size="large" text="signup_with"
            />
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.825rem', color: '#334155' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 700, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#818cf8'}
              onMouseLeave={e => e.target.style.color = '#a5b4fc'}
            >
              Sign in →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;