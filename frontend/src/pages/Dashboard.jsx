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

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden"
  >
    <div className="flex items-center justify-between z-10 relative">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <div className="flex items-baseline mb-1">
          <p className="text-3xl font-bold border-b-2 border-blue-500/20 text-gray-900 pb-1">{value || 0}</p>
        </div>
        {trend && (
          <span className={`text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-500'} font-medium`}>
            {trend} vs last month
          </span>
        )}
      </div>
      <div className="p-4 bg-blue-50 rounded-lg text-blue-600 relative z-10 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    {/* Subtle decorative background */}
    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl z-0"></div>
  </motion.div>
);

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
    switch (user?.role) {
      case 'Admin':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">Admin Tools</h3>
            <p className="text-indigo-700">Access System Analytics and full User Management capabilities over the entire organization.</p>
          </motion.div>
        );
      case 'Manager':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Manager Actions</h3>
            <p className="text-blue-700">Review your Team's Performance, approve pending Appraisals, and manage goal setups.</p>
          </motion.div>
        );
      case 'Employee':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-green-900 mb-2">My Performance Focus</h3>
            <p className="text-green-700">Submit Self-Appraisals, provide 360-degree feedback, and monitor your personal growth KPIs.</p>
          </motion.div>
        );
      case 'Client':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Client View</h3>
            <p className="text-gray-600">Limited Read-Only Access to selected operational metrics provided by the organization.</p>
          </motion.div>
        );
      default:
        return null;
    }
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
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enterprise Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.email}. Here's what's happening today.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={async () => {
              const toastId = toast.loading("Generating report...");
              try {
                const response = await reportApi.exportReport();
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = "performpro_appraisals_export.csv";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Report exported!", { id: toastId });
              } catch (e) {
                toast.error("Failed to export report", { id: toastId });
              }
            }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            Export Report
          </button>
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-gray-900 hover:bg-blue-700 transition shadow-sm"
          >
            New Goal
          </button>
        </div>
      </div>

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Create New Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleGoalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} placeholder="e.g. Q3 Sales Quota" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target / Metric</label>
                <input required type="text" className="w-full border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} placeholder="e.g. $150,000 Revenue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input required type="date" className="w-full border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submittingGoal} className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-gray-900 hover:bg-blue-700 disabled:opacity-50">
                  {submittingGoal ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Premium Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Workforce"
          value={analytics?.total_workforce || 0}
          icon={Users}
          trend="+12%"
        />
        <StatCard
          title="Active Goals"
          value={analytics?.active_goals || 0}
          icon={Target}
          trend="Current Cycle"
        />
        <StatCard
          title="Active Appraisals"
          value={analytics?.active_appraisals || 0}
          icon={Activity}
        />
        <StatCard
          title="Avg Performance KPI"
          value={`${analytics?.avg_kpi || 0}%`}
          icon={TrendingUp}
          trend="+5.4%"
        />
        <StatCard
          title="Top Performer"
          value={analytics?.top_performer || "N/A"}
          icon={Award}
          trend="Highest Score"
        />
        <StatCard
          title="Dept Engagement"
          value={analytics?.department_engagement || "0%"}
          icon={Activity}
          trend="Overall"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-500" />
            Company Performance Trends
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Bar Chart (Department breakdown) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Department Engagement</h3>
          <div className="h-80 w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData || []} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="engagement" fill="#E5E7EB" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Role-Based Panel & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            {renderRoleSpecificContent()}
        </div>
        
        {/* Global Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden h-96 flex flex-col mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            Global Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {(!activities || activities?.length === 0) ? (
                <p className="text-gray-500 text-sm text-center mt-4">No recent activity.</p>
            ) : (
                activities?.map((activity, idx) => (
                    <div key={idx} className="flex border-b border-gray-50 pb-3 last:border-0">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mr-3"></div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{activity?.action}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {activity?.entity} #{activity?.entity_id} • {activity?.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Recently'}
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
