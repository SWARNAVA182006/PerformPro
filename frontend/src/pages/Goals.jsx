import React, { useState, useEffect } from 'react';
import { goalApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Target, Clock, CheckCircle2, AlertCircle, X, Plus, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import { SkeletonBox } from '../components/SkeletonLoader';

const STATUS_STYLE = {
    'Pending':   { label: 'Awaiting Approval', bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    'Approved':  { label: 'Active',             bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    'Completed': { label: 'Completed',           bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
    'Rejected':  { label: 'Rejected',            bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

const GoalCard = ({ goal, isManagerOrAdmin, onApprove, onDeny, onUpdateProgress, onComplete, onDelete }) => {
    const deadline = goal?.deadline ? new Date(goal.deadline) : null;
    const overdue = deadline && isPast(deadline) && goal?.status !== 'Completed';
    const statusStyle = STATUS_STYLE[goal?.status] || STATUS_STYLE['Pending'];
    const progressPercent = goal?.progress || 0;
    const [editProgress, setEditProgress] = React.useState(false);
    const [newProgress, setNewProgress] = React.useState(progressPercent);

    React.useEffect(() => {
        setNewProgress(progressPercent);
    }, [progressPercent]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: `1px solid ${goal?.status === 'Pending' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '1.25rem',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: goal?.status === 'Pending' ? '0 0 20px rgba(245,158,11,0.05)' : '0 4px 16px rgba(0,0,0,0.2)',
            }}
        >
            {/* Decorative glow */}
            <div style={{
                position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
                background: goal?.status === 'Pending' ? 'rgba(245,158,11,0.06)' : goal?.status === 'Approved' ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)',
                pointerEvents: 'none'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{
                    padding: '0.6rem', borderRadius: '0.75rem',
                    background: goal?.status === 'Approved' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                    border: `1px solid ${goal?.status === 'Approved' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`,
                }}>
                    <Target size={18} style={{ color: goal?.status === 'Approved' ? '#34d399' : '#a5b4fc' }} />
                </div>
                <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`
                }}>
                    {statusStyle.label}
                </span>
            </div>

            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{goal?.title}</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{goal?.target}</p>

            {/* Progress */}
            {goal?.status !== 'Pending' && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Progress</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: progressPercent >= 100 ? '#34d399' : '#a5b4fc' }}>{progressPercent}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                                height: '100%', borderRadius: 999,
                                background: progressPercent >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                boxShadow: `0 0 8px ${progressPercent >= 100 ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.4)'}`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: overdue ? '#f87171' : '#cbd5e1', fontWeight: 500 }}>
                    <Clock size={13} style={{ color: overdue ? '#f87171' : '#94a3b8' }} />
                    {deadline ? format(deadline, 'MMM dd, yyyy') : 'No deadline'}
                    {overdue && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: '999px', border: '1px solid rgba(239,68,68,0.2)' }}>OVERDUE</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                    {/* Manager/Admin: Approve/Deny Pending goals */}
                    {goal?.status === 'Pending' && isManagerOrAdmin && (
                        <>
                            <motion.button whileTap={{ scale: 0.95 }}
                                onClick={() => onApprove(goal.id)}
                                style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                                <CheckCircle2 size={12} /> Approve
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }}
                                onClick={() => onDeny(goal.id)}
                                style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                                <X size={12} /> Deny
                            </motion.button>
                        </>
                    )}

                    {/* Employee: Update progress on approved goals */}
                    {goal?.status === 'Approved' && (
                        <>
                            {editProgress ? (
                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="number" min="0" max="100"
                                        value={newProgress}
                                        onChange={e => {
                                            const v = Math.min(100, Math.max(0, Number(e.target.value)));
                                            setNewProgress(v);
                                        }}
                                        style={{ width: 52, padding: '0.25rem 0.4rem', borderRadius: '0.4rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(99,102,241,0.4)', color: '#fff', fontSize: '0.8rem', textAlign: 'center', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>%</span>
                                    <motion.button whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            const clamped = Math.min(100, Math.max(0, newProgress));
                                            onUpdateProgress(goal.id, clamped);
                                            setEditProgress(false);
                                        }}
                                        style={{ padding: '0.25rem 0.55rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)' }}
                                    >Save</motion.button>
                                    <motion.button whileTap={{ scale: 0.95 }}
                                        onClick={() => { setEditProgress(false); setNewProgress(progressPercent); }}
                                        style={{ padding: '0.25rem 0.45rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}
                                    >✕</motion.button>
                                </div>
                            ) : (
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditProgress(true)}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    <TrendingUp size={12} /> Update
                                </motion.button>
                            )}

                            {progressPercent >= 80 && (
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => onComplete(goal.id)}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    <CheckCircle2 size={12} /> Finish
                                </motion.button>
                            )}
                        </>
                    )}

                    {/* Withdraw / Delete logic */}
                    { ((goal?.status === 'Pending' && !isManagerOrAdmin) || isManagerOrAdmin) && (
                        <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => onDelete(goal.id)}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                            <AlertCircle size={12} /> {isManagerOrAdmin ? 'Delete' : 'Withdraw'}
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const Goals = () => {
    const { user, hasRole } = useAuthStore();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'Admin';

    const fetchGoals = async () => {
        try {
            const res = isManagerOrAdmin ? await goalApi.getAll() : await goalApi.getMy();
            if (res?.success) setGoals(res.data || []);
        } catch (error) {
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, [user?.role]);

    const handleApprove = async (id) => {
        const prev = goals;
        setGoals(gs => gs.map(g => g.id === id ? { ...g, status: 'Approved' } : g));
        try {
            await goalApi.approve(id);
            toast.success('Goal approved!');
            fetchGoals();
        } catch (err) {
            setGoals(prev);
            toast.error(err?.detail || 'Failed to approve');
        }
    };

    const handleDeny = async (id) => {
        const prev = goals;
        setGoals(gs => gs.map(g => g.id === id ? { ...g, status: 'Rejected' } : g));
        try {
            await goalApi.deny(id);
            toast.success('Goal denied');
            fetchGoals();
        } catch (err) {
            setGoals(prev);
            toast.error(err?.detail || 'Failed to deny goal');
        }
    };

    const handleUpdateProgress = async (id, progress) => {
        // Optimistic update — reflect the change immediately in local state
        const prev = goals;
        setGoals(gs => gs.map(g => g.id === id ? { ...g, progress } : g));
        try {
            await goalApi.update(id, { progress });
            toast.success('Progress updated!');
            // Refresh in background to sync any server-side changes
            fetchGoals();
        } catch (err) {
            // Revert on failure
            setGoals(prev);
            const detail = err?.detail || err?.message || 'Failed to update progress';
            toast.error(detail);
        }
    };

    const handleComplete = async (id) => {
        const prev = goals;
        setGoals(gs => gs.map(g => g.id === id ? { ...g, status: 'Completed', progress: 100 } : g));
        try {
            await goalApi.complete(id);
            toast.success('Goal completed! 🎉');
            fetchGoals();
        } catch (err) {
            setGoals(prev);
            toast.error(err?.detail || 'Failed to complete goal');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to withdraw/delete this goal?')) return;
        const prev = goals;
        setGoals(gs => gs.filter(g => g.id !== id));
        try {
            await goalApi.delete(id);
            toast.success('Goal deleted/withdrawn successfully');
        } catch (err) {
            setGoals(prev);
            toast.error(err?.detail || err?.detail || 'Failed to delete goal');
        }
    };

    if (loading) return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SkeletonBox className="h-8 w-48" />
                <SkeletonBox className="h-4 w-64" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {[1,2,3,4].map(i => <SkeletonBox key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
        </div>
    );

    const pendingGoals   = goals.filter(g => g.status === 'Pending');
    const approvedGoals  = goals.filter(g => g.status === 'Approved');
    const completedGoals = goals.filter(g => g.status === 'Completed');
    const rejectedGoals  = goals.filter(g => g.status === 'Rejected');

    const cardProps = { isManagerOrAdmin, onApprove: handleApprove, onDeny: handleDeny, onUpdateProgress: handleUpdateProgress, onComplete: handleComplete, onDelete: handleDelete };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: '#e2e8f0' }}>Goals & Targets</h1>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
                        Track professional objectives across your team.
                        <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(99,102,241,0.2)' }}>
                            {goals.length} Total
                        </span>
                    </p>
                </div>
            </div>

            {goals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '1.5rem' }}>
                    <Target style={{ color: '#94a3b8', margin: '0 auto 1rem' }} size={48} />
                    <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 0.5rem' }}>No goals found</h3>
                    <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0 }}>No goals have been set yet. Create one from the Dashboard.</p>
                </div>
            )}

            {/* Pending Approval Section */}
            {pendingGoals.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <AlertCircle size={16} style={{ color: '#fbbf24' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24' }}>
                            Awaiting Approval ({pendingGoals.length})
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.15)' }} />
                        {isManagerOrAdmin && (
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Review and approve or deny each goal</span>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {pendingGoals.map(goal => <GoalCard key={goal.id} goal={goal} {...cardProps} />)}
                    </div>
                </div>
            )}

            {/* Active / Approved Goals */}
            {approvedGoals.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <TrendingUp size={16} style={{ color: '#34d399' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34d399' }}>
                            Active Goals ({approvedGoals.length})
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(16,185,129,0.12)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {approvedGoals.map(goal => <GoalCard key={goal.id} goal={goal} {...cardProps} />)}
                    </div>
                </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <CheckCircle2 size={16} style={{ color: '#a5b4fc' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a5b4fc' }}>
                            Completed ({completedGoals.length})
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(99,102,241,0.12)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} {...cardProps} />)}
                    </div>
                </div>
            )}

            {/* Rejected Goals */}
            {rejectedGoals.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <X size={16} style={{ color: '#f87171' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f87171' }}>
                            Denied ({rejectedGoals.length})
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.08)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {rejectedGoals.map(goal => <GoalCard key={goal.id} goal={goal} {...cardProps} />)}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Goals;
