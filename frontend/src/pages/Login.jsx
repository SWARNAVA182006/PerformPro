import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { authApi } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, TrendingUp, Users, Eye, EyeOff } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const FEATURES = [
    { icon: TrendingUp, text: "Real-Time Performance KPIs", color: "#6366f1" },
    { icon: Shield, text: "Secure Role-Based Access", color: "#06b6d4" },
    { icon: Users, text: "360° Team Appraisals", color: "#10b981" },
    { icon: Zap, text: "AI-Powered Workforce Insights", color: "#f59e0b" },
];

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    const loginAction = useAuthStore(state => state.login);
    const googleLoginAction = useAuthStore(state => state.googleLogin);
    const navigate = useNavigate();

    // Cycle through features animation
    useEffect(() => {
        const t = setInterval(() => setActiveFeature(i => (i + 1) % FEATURES.length), 2500);
        return () => clearInterval(t);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await loginAction(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError(null);
        try {
            await googleLoginAction(credentialResponse.credential);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Google Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#060918', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            {/* Animated constellation background */}
            <AnimatedBackground opacity={0.65} />

            <div style={{ display: 'flex', width: '100%', zIndex: 1, position: 'relative' }}>
                {/* ===== LEFT HERO PANEL ===== */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                        flex: 1, display: 'none', padding: '3rem', flexDirection: 'column', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(6,182,212,0.04) 100%)',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                    }}
                    className="md:flex"
                >
                    {/* Brand */}
                    <div style={{ marginBottom: '3rem' }}>
                        <motion.div
                            animate={{ rotate: [0, 3, -3, 0] }}
                            transition={{ duration: 5, repeat: Infinity }}
                            style={{
                                width: 64, height: 64, borderRadius: '1.25rem', overflow: 'hidden',
                                boxShadow: '0 0 30px rgba(99,102,241,0.4)', marginBottom: '1.5rem',
                                border: '2px solid rgba(99,102,241,0.3)', background: '#fff'
                            }}
                        >
                            <img src="/logo.jpeg" alt="PerformPro" style={{ width: '200%', height: '100%', objectFit: 'cover', objectPosition: 'left center', display: 'block' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                            Perform<span style={{ 
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>Pro</span>
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 500 }}>
                            Enterprise Performance Management
                        </p>
                    </div>

                    {/* Cycling feature showcase */}
                    <div style={{ marginBottom: '3rem' }}>
                        <p style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                            Platform Capabilities
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {FEATURES.map((feat, i) => (
                                <motion.div key={i}
                                    animate={{
                                        background: i === activeFeature ? `rgba(${feat.color === '#6366f1' ? '99,102,241' : feat.color === '#06b6d4' ? '6,182,212' : feat.color === '#10b981' ? '16,185,129' : '245,158,11'},0.12)` : 'rgba(255,255,255,0.02)',
                                        borderColor: i === activeFeature ? `${feat.color}44` : 'rgba(255,255,255,0.06)',
                                        scale: i === activeFeature ? 1.02 : 1,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                                        padding: '0.875rem 1.125rem', borderRadius: '0.875rem',
                                        border: '1px solid', cursor: 'default'
                                    }}
                                >
                                    <feat.icon size={18} style={{ color: feat.color, flexShrink: 0 }} />
                                    <span style={{ color: i === activeFeature ? '#e2e8f0' : '#64748b', fontWeight: i === activeFeature ? 600 : 400, fontSize: '0.875rem', transition: 'color 0.3s' }}>
                                        {feat.text}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        {[
                            { value: '99.9%', label: 'Uptime' },
                            { value: '4 Roles', label: 'Access Tiers' },
                            { value: 'AI-Ready', label: 'Intelligence' },
                        ].map((s, i) => (
                            <div key={i}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc', margin: 0 }}>{s.value}</p>
                                <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, marginTop: '0.2rem' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ===== RIGHT LOGIN PANEL ===== */}
                <div style={{ 
                    width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', margin: '0 auto'
                }} className="md:w-auto md:min-w-[480px]">
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1.75rem',
                            padding: '2.5rem',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.08)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <motion.div
                                initial={{ scale: 0.5, rotate: -15 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                                style={{
                                    width: 56, height: 56, borderRadius: '1rem', overflow: 'hidden',
                                    margin: '0 auto 1.25rem',
                                    boxShadow: '0 0 24px rgba(99,102,241,0.5)',
                                    border: '2px solid rgba(99,102,241,0.4)',
                                    background: '#fff'
                                }}
                            >
                                <img src="/logo.jpeg" alt="Logo" style={{ width: '200%', height: '100%', objectFit: 'cover', objectPosition: 'left center', display: 'block' }} />
                            </motion.div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                                Welcome back
                            </h2>
                            <p style={{ color: '#94a3b8', marginTop: '0.35rem', fontSize: '0.875rem' }}>
                                Sign in to your enterprise dashboard
                            </p>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    style={{
                                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                                        borderRadius: '0.875rem', padding: '0.875rem 1rem', 
                                        color: '#f87171', fontSize: '0.875rem', marginBottom: '1.5rem',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ fontSize: '1rem' }}>⚠</span> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
                                    EMAIL ADDRESS
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    style={{
                                        width: '100%', padding: '0.8rem 1rem', borderRadius: '0.875rem',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
                                    PASSWORD
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="login-password"
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        style={{
                                            width: '100%', padding: '0.8rem 3rem 0.8rem 1rem', borderRadius: '0.875rem',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#e2e8f0', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        style={{
                                            position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#475569',
                                            padding: '0.25rem', display: 'flex', alignItems: 'center'
                                        }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <motion.button
                                id="login-submit"
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: '100%', padding: '0.875rem',
                                    background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white', fontWeight: 700, fontSize: '0.95rem',
                                    borderRadius: '0.875rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
                                    fontFamily: 'inherit', letterSpacing: '0.02em',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    marginTop: '0.5rem'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                                        />
                                        Authenticating...
                                    </>
                                ) : (
                                    <><Zap size={16} /> Access Dashboard</>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>OR</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                        </div>

                        {/* Google Login */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Google Login Failed")}
                                useOneTap
                                theme="filled_black"
                                shape="pill"
                                width="100%"
                            />
                        </div>

                        {/* Footer link */}
                        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: '#475569' }}>
                            Don't have an account?{" "}
                            <Link to="/signup" style={{ color: '#a5b4fc', fontWeight: 700, textDecoration: 'none' }}>
                                Request Access →
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Login;