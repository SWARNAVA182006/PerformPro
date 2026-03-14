import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Target, Activity, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

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
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, trendsRes, deptRes, activityRes] = await Promise.all([
          dashboardApi.getAnalytics(),
          dashboardApi.getPerformanceTrends(),
          dashboardApi.getDepartmentEngagement(),
          dashboardApi.getActivityFeed()
        ]);
        
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        if (trendsRes.success) setTrends(trendsRes.data);
        if (deptRes.success) setDepartmentData(deptRes.data);
        if (activityRes.success) setActivities(activityRes.data);
        
      } catch (error) {
        console.error("Dashboard fetch error:", error);
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enterprise Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.email}. Here's what's happening today.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm">
            New Goal
          </button>
        </div>
      </div>

      {/* Premium Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workforce"
          value={analytics?.workforce_total || 0}
          icon={Users}
          trend="+12%"
        />
        <StatCard
          title="Avg Performance KPI"
          value={`${analytics?.avg_kpi || 0}%`}
          icon={Target}
          trend="+5.4%"
        />
        <StatCard
          title="Active Appraisals"
          value={analytics?.active_appraisals || 0}
          icon={Activity}
        />
        <StatCard
          title="Top Performer (Score)"
          value={analytics?.top_performers?.[0]?.score ? `${analytics.top_performers[0].score}%` : "N/A"}
          icon={Award}
          trend={analytics?.top_performers?.[0]?.name}
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
                <Area type="monotone" dataKey="performance" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" />
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
              <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="performance" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
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
            {activities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-4">No recent activity.</p>
            ) : (
                activities.map((activity, idx) => (
                    <div key={idx} className="flex border-b border-gray-50 pb-3 last:border-0">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mr-3"></div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {activity.entity} #{activity.entity_id} • {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Recently'}
                            </p>
                        </div>
                    </div>
                ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
