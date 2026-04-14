import { useState, useEffect } from 'react';
import { dashboardApi, analyticsApi, goalApi, reportApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Target, Activity, Award, Clock, TrendingUp, Brain, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CARD_GRADIENTS = [
  { from: '#6366f1', to: '#8b5cf6' },
  { from: '#06b6d4', to: '#6366f1' },
  { from: '#10b981', to: '#06b6d4' },
  { from: '#f59e0b', to: '#ef4444' },
  { from: '#ec4899', to: '#8b5cf6' },
  { from: '#f59e0b', to: '#10b981' },
  { from: '#ef4444', to: '#f9a515ff' },
];

const StatCard = ({ title, value, icon: Icon, trend, colorIdx = 0, pending }) => {
  const grad = CARD_GRADIENTS[colorIdx % CARD_GRADIENTS.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${pending ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '1.25rem', padding: '1.5rem', position: 'relative',
        overflow: 'hidden', cursor: 'default',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
      }}
    >
      {/* Glow orb */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${grad.from}22, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 1, position: 'relative' }}>
        <div>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{title}</p>
          <p style={{ margin: '0 0 0.4rem', fontSize: '2rem', fontWeight: 900, color: '#e2e8f0', lineHeight: 1 }}>{value ?? 0}</p>
          {trend && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600,
              color: trend.startsWith('+') ? '#34d399' : '#94a3b8'
            }}>
              {trend}
            </span>
          )}
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '0.875rem', background: `linear-gradient(135deg, ${grad.from}25, ${grad.to}15)`, border: `1px solid ${grad.from}35`, flexShrink: 0 }}>
          <Icon size={22} style={{ color: grad.from }} />
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [orgInsights, setOrgInsights] = useState(null);
  const [myPrediction, setMyPrediction] = useState(null);

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', target: '', deadline: '' });
  const [submittingGoal, setSubmittingGoal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch metrics
        try {
          const res = await dashboardApi.getMetrics();
          if (res?.success) setAnalytics(res.data);
        } catch (e) { console.warn("Metrics fetch failed:", e); }

        // Fetch performance trends
        try {
          const res = await analyticsApi.getPerformance();
          if (res?.success) setTrends(res.data || []);
        } catch (e) { console.warn("Trends fetch failed:", e); }

        // Fetch department data
        try {
          const res = await analyticsApi.getDepartments();
          if (res?.success) setDepartmentData(res.data || []);
        } catch (e) { console.warn("Department data fetch failed:", e); }

        // Fetch activity feed
        try {
          const res = await dashboardApi.getActivity();
          if (res?.success) setActivities(res.data || []);
        } catch (e) {
          setActivities([{ action: "Welcome to PerformPro", entity: "System", timestamp: new Date() }]);
        }

        // Fetch AI org insights (non-blocking)
        try {
          const res = await analyticsApi.getOrgInsights();
          if (res?.success) setOrgInsights(res.data);
        } catch (e) { /* silent fail */ }

        // Fetch personal AI prediction (non-blocking)
        try {
          const res = await analyticsApi.getMyPrediction();
          if (res?.success) setMyPrediction(res.data);
        } catch (e) { /* no prediction data yet, that's fine */ }
        
      } catch (error) {
        console.error("Global dashboard fetch error:", error);
        toast.error("Some dashboard data could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);


  if (loading) return <SkeletonDashboard />;

  const renderRoleSpecificContent = () => {
    const configs = {
      Admin: { from: '#6366f1', to: '#8b5cf6', title: '⚡ Admin Control Center', text: 'Full system access: manage users, approve appraisals, view org-wide analytics and audit logs.' },
      Manager: { from: '#06b6d4', to: '#6366f1', title: '🎯 Manager Actions', text: "Review your team's pending goals and appraisals. Approve, reject, and track performance in real time." },
      Employee: { from: '#10b981', to: '#06b6d4', title: '📈 My Performance Hub', text: 'Submit self-appraisals, update goal progress, and monitor your personal KPI growth trajectory.' },
      Client: { from: '#f59e0b', to: '#ef4444', title: '👁 Client Dashboard', text: 'Read-only access to selected approved metrics shared by the organization.' },
    };
    const cfg = configs[user?.role];
    if (!cfg) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ borderRadius: '1.25rem', padding: '1.5rem', border: `1px solid ${cfg.from}25`, background: `linear-gradient(135deg, ${cfg.from}12, ${cfg.to}08)`, transition: 'all 0.3s' }}
      >
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>{cfg.title}</h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>{cfg.text}</p>
      </motion.div>
    );
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      const response = await goalApi.create({
        employee_id: user?.employee_id || user?.id,
        title: goalForm.title,
        target: goalForm.target,
        deadline: goalForm.deadline
      });
      if (!response.success) throw new Error("Failed to create goal");
      setIsGoalModalOpen(false);
      setGoalForm({ title: '', target: '', deadline: '' });
      toast.success("Goal created successfully! A notification has been sent.");
    } catch (e) {
      toast.error(e.message || "Failed to create goal");
    } finally {
      setSubmittingGoal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: '#e2e8f0' }}>Enterprise Overview</h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#475569' }}>Welcome back, <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{user?.name || user?.email}</span>. Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={async () => {
              const toastId = toast.loading("Generating report...");
              try {
                const response = await reportApi.exportReport();
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = "performpro_appraisals_export.csv";
                document.body.appendChild(a); a.click();
                window.URL.revokeObjectURL(url); document.body.removeChild(a);
                toast.success("Report exported!", { id: toastId });
              } catch (e) { toast.error("Failed to export report", { id: toastId }); }
            }}
            style={{ padding: '0.6rem 1.1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
          >Export Report</button>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            style={{ padding: '0.6rem 1.1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >+ New Goal</button>
        </div>
      </div>

      {/* Goal Modal - dark glass */}
      {isGoalModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(6,9,24,0.8)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 440, background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99,102,241,0.05)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Create New Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem', padding: '0.25rem', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleGoalSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['title', 'target'].map(field => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'capitalize', letterSpacing: '0.05em' }}>{field === 'title' ? 'GOAL TITLE' : 'TARGET / METRIC'}</label>
                  <input required type="text"
                    placeholder={field === 'title' ? 'e.g. Q3 Sales Quota' : 'e.g. $150,000 Revenue'}
                    value={goalForm[field]} onChange={e => setGoalForm({...goalForm, [field]: e.target.value})}
                    style={{ width: '100%', padding: '0.7rem 0.875rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>DEADLINE</label>
                <input required type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})}
                  style={{ width: '100%', padding: '0.7rem 0.875rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsGoalModalOpen(false)}
                  style={{ padding: '0.65rem 1.125rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontFamily: 'inherit' }}
                >Cancel</button>
                <button type="submit" disabled={submittingGoal}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: submittingGoal ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: 'white', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', opacity: submittingGoal ? 0.6 : 1 }}
                >{submittingGoal ? 'Saving...' : 'Save Goal'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Premium Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard title="Total Workforce" value={analytics?.total_workforce || 0} icon={Users} trend="+12% this quarter" colorIdx={0} />
        <StatCard title="Approved Goals" value={analytics?.active_goals || 0} icon={Target} trend="Current Cycle" colorIdx={1} />
        {analytics?.pending_goals > 0 && (
          <StatCard title="Pending Approval" value={analytics?.pending_goals || 0} icon={AlertTriangle} trend="Awaiting review" colorIdx={3} pending />
        )}
        <StatCard title="Active Appraisals" value={analytics?.active_appraisals || 0} icon={Activity} colorIdx={2} />
        <StatCard title="Avg KPI Score" value={`${analytics?.avg_kpi || 0}%`} icon={TrendingUp} trend="+5.4% vs last month" colorIdx={4} />
        <StatCard title="Top Performer" value={analytics?.top_performer || 'N/A'} icon={Award} trend="Highest KPI" colorIdx={5} />
        <StatCard title="Dept Engagement" value={analytics?.department_engagement || '0%'} icon={Zap} trend="Approved Appraisals" colorIdx={6} />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }} className="grid-cols-1 lg:grid-cols-3">
        {/* Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Activity size={18} style={{ color: '#6366f1' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>Company Performance Trends</h3>
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} dx={-5} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPerf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '1.5rem' }}
        >
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }}>Dept Engagement</h3>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData || []} layout="vertical" margin={{ top: 0, right: 8, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#e2e8f0' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="engagement" fill="rgba(99,102,241,0.2)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Role-Based Panel + Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }} className="grid-cols-1 lg:grid-cols-3">
        <div>{renderRoleSpecificContent()}</div>

        {/* Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '1.5rem', height: 380, display: 'flex', flexDirection: 'column', marginTop: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Clock size={16} style={{ color: '#64748b' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>Activity Feed</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="hide-scrollbar">
            {(!activities || activities.length === 0) ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>No recent activity.</p>
            ) : (
              activities.map((activity, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', marginTop: '0.4rem', flexShrink: 0, boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>{activity?.action}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#475569' }}>
                      {activity?.entity} #{activity?.entity_id} · {activity?.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Recently'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* AI Intelligence Section */}
      {(orgInsights || myPrediction) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Org AI Insights */}
          {orgInsights && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-indigo-900">AI Organization Intel</h3>
                <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-emerald-600">{orgInsights.high_performers_count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">High Performers</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-rose-500">{orgInsights.at_risk_count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">At Risk</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-indigo-600">{orgInsights.predicted_next_quarter}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Predicted Q+1</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-purple-600">{orgInsights.org_health_score}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Org Health</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="w-full py-2 rounded-lg bg-indigo-600 text-gray-900 text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> View Full AI Report
              </button>
            </div>
          )}

          {/* Personal AI Prediction */}
          {myPrediction && (
            <div className={`rounded-xl p-6 border ${
              myPrediction.risk_level === 'Low' ? 'bg-emerald-50 border-emerald-100' :
              myPrediction.risk_level === 'Medium' ? 'bg-yellow-50 border-yellow-100' :
              'bg-rose-50 border-rose-100'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className={`w-5 h-5 ${myPrediction.risk_level === 'Low' ? 'text-emerald-600' : myPrediction.risk_level === 'Medium' ? 'text-yellow-600' : 'text-rose-600'}`} />
                <h3 className="text-lg font-bold text-gray-900">My AI Prediction</h3>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                  myPrediction.risk_level === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                  myPrediction.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'
                }`}>{myPrediction.risk_level} Risk</span>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-3xl font-black text-gray-900">{myPrediction.current_score}%</p>
                </div>
                <div className="text-gray-400 mb-2 text-xl">→</div>
                <div>
                  <p className="text-xs text-gray-500">Predicted</p>
                  <p className={`text-3xl font-black ${myPrediction.risk_level === 'Low' ? 'text-emerald-600' : myPrediction.risk_level === 'Medium' ? 'text-yellow-600' : 'text-rose-600'}`}>
                    {myPrediction.predicted_score}%
                  </p>
                </div>
                <div className="ml-auto text-right mb-1">
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="font-bold text-gray-700">{myPrediction.confidence}%</p>
                </div>
              </div>
              {myPrediction.recommendations?.[0] && (
                <div className="bg-white/80 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{myPrediction.recommendations[0]}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
};

export default Dashboard;
