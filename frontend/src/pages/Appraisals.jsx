import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { appraisalApi } from '../services/api';
import { CheckCircle2, AlertCircle, Clock, Star, FileText, ChevronRight, ClipboardList, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  'Pending Manager': { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Pending Manager Review' },
  'Pending Admin':   { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)',  label: 'Pending Admin Approval' },
  'Approved':        { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Approved' },
  'Rejected':        { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.22)',  label: 'Rejected' },
};

/* ── Appraisal Row (list view) ───────────────────────────────────────────── */
const AppraisalRow = ({ appraisal, canAction, onApprove, onReject, onOpenReview, userRole }) => {
  const cfg = STATUS_CONFIG[appraisal.status] || STATUS_CONFIG['Pending Manager'];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        padding: '1rem 1.25rem', borderRadius: '1rem',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      <div style={{ width: 36, height: 36, borderRadius: '0.75rem', background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FileText size={16} style={{ color: cfg.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
            {appraisal.employee_name || `Employee #${appraisal.employee_id}`}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>·</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{appraisal.review_period || appraisal.cycle}</span>
          {appraisal.employee_email && (
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{appraisal.employee_email}</span>
          )}
        </div>
        {appraisal.comments && (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.775rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
            {appraisal.comments}
          </p>
        )}
      </div>
      {appraisal.rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', flexShrink: 0 }}>
          <Star size={13} fill="#fbbf24" />
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fbbf24' }}>{appraisal.rating}/10</span>
        </div>
      )}
      <span style={{
        padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
        letterSpacing: '0.05em', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        {cfg.label}
      </span>
      {appraisal.created_at && (
        <span style={{ fontSize: '0.7rem', color: '#64748b', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={11} />{format(new Date(appraisal.created_at), 'MMM dd')}
        </span>
      )}
      {canAction && (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {/* Manager gets "Review" button that opens inline form */}
          {userRole === 'Manager' && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => onOpenReview(appraisal)}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
                background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              <MessageSquare size={12} /> Review
            </motion.button>
          )}
          {/* Admin gets direct approve/reject */}
          {userRole === 'Admin' && (
            <>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => onApprove(appraisal.id, {})}
                style={{
                  padding: '0.35rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                }}
              >
                <CheckCircle2 size={12} /> Approve
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => onReject(appraisal.id)}
                style={{
                  padding: '0.35rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)',
                  cursor: 'pointer',
                }}
              >
                Reject
              </motion.button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ── Manager Inline Review Modal ─────────────────────────────────────────── */
const ManagerReviewModal = ({ appraisal, onClose, onSubmit }) => {
  const [rating, setRating]     = useState(7);
  const [remarks, setRemarks]   = useState('');
  const [submitting, setSub]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) { toast.error('Please provide manager remarks'); return; }
    setSub(true);
    try {
      await onSubmit(appraisal.id, { manager_rating: Number(rating), manager_comments: remarks });
    } finally { setSub(false); }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(3,5,15,0.88)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, borderRadius: '1.5rem',
          background: 'linear-gradient(145deg,rgba(13,18,32,0.98),rgba(6,9,24,0.98))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(99,102,241,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-display)' }}>
              Manager Evaluation
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              {appraisal.employee_name || `Employee #${appraisal.employee_id}`}
              {appraisal.employee_email && ` · ${appraisal.employee_email}`}
              {' · '}{appraisal.review_period || appraisal.cycle}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.35rem 0.6rem', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem' }}>✕</button>
        </div>

        {/* Employee self-eval summary */}
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>Employee Self-Assessment</p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {appraisal.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Star size={14} fill="#fbbf24" style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fbbf24' }}>Self-Rating: {appraisal.rating}/10</span>
              </div>
            )}
            {appraisal.employee_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc' }}>👤 {appraisal.employee_name}</span>
              </div>
            )}
          </div>
          {appraisal.comments && appraisal.comments.trim() ? (
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.6, padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              "{appraisal.comments}"
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>No self-assessment comments provided.</p>
          )}
        </div>

        {/* Manager review form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Manager rating */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Manager Rating: <span style={{ color: '#a5b4fc', fontWeight: 800 }}>{rating}/10</span>
            </label>
            <input
              type="range" min="1" max="10" step="0.5"
              value={rating} onChange={e => setRating(e.target.value)}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
              {[1, 3, 5, 7, 10].map(v => (
                <span key={v} style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{v}</span>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Manager Remarks <span style={{ color: '#f87171' }}>*</span>
            </label>
            <textarea
              required rows={4}
              placeholder="Provide detailed professional feedback on this employee's performance..."
              value={remarks} onChange={e => setRemarks(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.875rem', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none',
                resize: 'vertical', lineHeight: 1.6, transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <motion.button type="submit" disabled={submitting}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '0.8rem', borderRadius: '0.875rem', border: 'none',
                background: submitting ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: submitting ? 'wait' : 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {submitting ? 'Forwarding...' : <><ChevronRight size={15} /> Forward to Admin</>}
            </motion.button>
            <button type="button" onClick={onClose}
              style={{
                padding: '0.8rem 1.25rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

/* ── Main Appraisals Page ────────────────────────────────────────────────── */
const Appraisals = () => {
  const { id }                = useParams();
  const { user, hasRole }     = useAuthStore();
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rating, setRating]         = useState(5);
  const [comments, setComments]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null); // appraisal obj for manager modal

  const isManagerOrAdmin = hasRole(['Manager', 'Admin']);
  const isReviewingOther = useMemo(() => id && id !== String(user?.employee_id), [id, user]);

  const fetchAppraisals = async () => {
    setLoading(true);
    try {
      const res = isManagerOrAdmin ? await appraisalApi.getAll() : await appraisalApi.getMy();
      if (res?.success) setAppraisals(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppraisals(); }, []);

  /* Self-evaluation / reviewing-other submit */
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const targetId = isReviewingOther ? parseInt(id) : (user?.employee_id || user?.id);
      const payload  = isReviewingOther
        ? { employee_id: targetId, manager_remarks: comments, review_period: 'Q2-2026' }
        : { employee_id: targetId, self_rating: Number(rating), self_comments: comments };

      const res = await appraisalApi.submit(payload);
      if (res?.success) {
        toast.success(isReviewingOther ? 'Review submitted!' : 'Self-appraisal submitted! Awaiting manager review.');
        setComments('');
        setRating(5);
        fetchAppraisals();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  /* Manager review modal submit */
  const handleManagerReviewSubmit = async (appraisalId, reviewData) => {
    try {
      const res = await appraisalApi.approve(appraisalId, reviewData);
      if (res?.success) {
        toast.success('Appraisal forwarded to Admin for final approval');
        setReviewTarget(null);
        fetchAppraisals();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to forward appraisal');
    }
  };

  /* Admin approve */
  const handleApprove = async (appraisalId, reviewData = {}) => {
    try {
      const payload = { manager_rating: reviewData.manager_rating || 8.0, manager_comments: reviewData.manager_comments || 'Reviewed and approved by admin' };
      const res = await appraisalApi.approve(appraisalId, payload);
      if (res?.success) {
        toast.success('Appraisal fully approved!');
        fetchAppraisals();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve');
    }
  };

  /* Reject */
  const handleReject = async (appraisalId) => {
    try {
      const res = await appraisalApi.reject(appraisalId, { manager_rating: 3.0, manager_comments: 'Requires revision' });
      if (res?.success) {
        toast.success('Appraisal rejected');
        fetchAppraisals();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject');
    }
  };

  const filteredAppraisals = useMemo(() => {
    if (!searchQuery.trim()) return appraisals;
    const q = searchQuery.toLowerCase();
    return appraisals.filter(a =>
      a.comments?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q) ||
      String(a.employee_id).includes(q) ||
      (a.review_period || a.cycle)?.toLowerCase().includes(q)
    );
  }, [appraisals, searchQuery]);

  const pendingManagerAppraisals = filteredAppraisals.filter(a => a.status === 'Pending Manager');
  const pendingAdminAppraisals   = filteredAppraisals.filter(a => a.status === 'Pending Admin');
  const processedAppraisals      = filteredAppraisals.filter(a => ['Approved', 'Rejected'].includes(a.status));

  // Manager can action on 'Pending Manager' appraisals that aren't their own
  const canManagerAction = (a) => user?.role === 'Manager' && a.status === 'Pending Manager' && a.employee_id !== user?.employee_id;
  const canAdminAction   = (a) => user?.role === 'Admin' && a.status === 'Pending Admin';

  if (loading) return <SkeletonDashboard />;

  return (
    <>
      {/* Manager Review Modal */}
      <AnimatePresence>
        {reviewTarget && (
          <ManagerReviewModal
            appraisal={reviewTarget}
            onClose={() => setReviewTarget(null)}
            onSubmit={handleManagerReviewSubmit}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 800, color: '#f0f4ff' }}>
            Performance Appraisals
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
            {isManagerOrAdmin
              ? 'Review employee self-evaluations and manage the approval workflow.'
              : 'Submit your self-evaluation and track your review status.'}
          </p>
        </div>

        {/* Manager pending banner */}
        {user?.role === 'Manager' && pendingManagerAppraisals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '1rem 1.25rem', borderRadius: '1rem',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', gap: '0.875rem',
            }}
          >
            <AlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#fbbf24', fontSize: '0.875rem' }}>
                {pendingManagerAppraisals.length} appraisal{pendingManagerAppraisals.length > 1 ? 's' : ''} awaiting your review
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#92400e' }}>
                Click "Review" on each entry below to provide your evaluation and forward to Admin.
              </p>
            </div>
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* ── LEFT: Submission Form ───────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', overflow: 'hidden',
            alignSelf: 'start', position: 'sticky', top: '1.5rem',
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(99,102,241,0.06)' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'var(--font-display)' }}>
                {isReviewingOther ? `Manager Review: Employee #${id}` : 'Self Evaluation'}
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                {isReviewingOther
                  ? 'Provide professional feedback for this employee.'
                  : 'Submit your self-assessment for the current review cycle.'}
              </p>
            </div>

            <form onSubmit={handleSubmitForm} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Rating (only for self-evaluation) */}
              {!isReviewingOther && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Self Rating: <span style={{ color: '#a5b4fc', fontWeight: 800 }}>{rating}/10</span>
                  </label>
                  <input
                    type="range" min="1" max="10" step="0.5"
                    value={rating} onChange={e => setRating(e.target.value)}
                    style={{ width: '100%', accentColor: '#6366f1' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                    {[1, 3, 5, 7, 10].map(v => <span key={v} style={{ fontSize: '0.65rem', color: '#475569' }}>{v}</span>)}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {isReviewingOther ? 'Manager Remarks' : 'Key Achievements'}
                </label>
                <textarea
                  required rows={5}
                  placeholder={isReviewingOther ? 'Enter professional feedback...' : 'Describe your achievements this period...'}
                  value={comments} onChange={e => setComments(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.75rem', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                    color: '#e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
                    resize: 'vertical', lineHeight: 1.6, transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={submitting}
                style={{
                  width: '100%', padding: '0.8rem', borderRadius: '0.875rem', border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: submitting ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'inherit',
                  boxShadow: submitting ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {submitting ? 'Submitting...' : (isReviewingOther ? 'Submit Manager Review' : 'Submit Evaluation')}
              </motion.button>
            </form>
          </div>

          {/* ── RIGHT: Appraisals list ──────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search by employee ID, status, period..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.7rem 1rem', borderRadius: '0.875rem', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />

            {/* Pending Manager Review */}
            {pendingManagerAppraisals.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <AlertCircle size={15} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24' }}>
                    Awaiting Manager Review ({pendingManagerAppraisals.length})
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.15)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingManagerAppraisals.map(a => (
                    <AppraisalRow key={a.id} appraisal={a}
                      canAction={canManagerAction(a)} userRole={user?.role}
                      onApprove={handleApprove} onReject={handleReject}
                      onOpenReview={setReviewTarget}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Admin */}
            {pendingAdminAppraisals.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <ChevronRight size={15} style={{ color: '#67e8f9' }} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#67e8f9' }}>
                    Awaiting Admin Approval ({pendingAdminAppraisals.length})
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(6,182,212,0.12)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingAdminAppraisals.map(a => (
                    <AppraisalRow key={a.id} appraisal={a}
                      canAction={canAdminAction(a)} userRole={user?.role}
                      onApprove={handleApprove} onReject={handleReject}
                      onOpenReview={setReviewTarget}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Processed */}
            {processedAppraisals.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={15} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
                    Processed ({processedAppraisals.length})
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {processedAppraisals.map(a => (
                    <AppraisalRow key={a.id} appraisal={a}
                      canAction={false} userRole={user?.role}
                      onApprove={handleApprove} onReject={handleReject}
                      onOpenReview={setReviewTarget}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredAppraisals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '1.25rem' }}>
                <FileText style={{ color: '#94a3b8', margin: '0 auto 1rem' }} size={40} />
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  {searchQuery ? `No appraisals matching "${searchQuery}"` : 'No appraisals found yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Appraisals;
