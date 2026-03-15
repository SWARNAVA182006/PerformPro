import React, { useState, useEffect } from 'react';
import { reportApi, analyticsApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  BarChart3, FileSpreadsheet, Download, Brain, TrendingUp, TrendingDown,
  Users, Shield, Zap, AlertTriangle, CheckCircle, Activity, Star,
  Trophy, Target, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const StatPill = ({ label, value, color = "indigo" }) => {
  const colorMap = {
    indigo: "from-indigo-600/20 to-purple-600/20 border-indigo-500/30 text-indigo-400",
    emerald: "from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-400",
    rose: "from-rose-600/20 to-pink-600/20 border-rose-500/30 text-rose-400",
    yellow: "from-yellow-600/20 to-amber-600/20 border-yellow-500/30 text-yellow-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 flex flex-col gap-1`}>
      <span className="text-3xl font-black text-gray-900">{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
};

const Reports = () => {
  const { user } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appraisalData, setAppraisalData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [orgInsights, setOrgInsights] = useState(null);
  const [myPrediction, setMyPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      analyticsApi.getPerformance(),
      analyticsApi.getDepartments(),
      analyticsApi.getAppraisals(),
      analyticsApi.getTopPerformers(),
      analyticsApi.getOrgInsights(),
    ]);

    if (results[0].status === 'fulfilled') setTrends(results[0].value?.data || []);
    if (results[1].status === 'fulfilled') setDepartments(results[1].value?.data || []);
    if (results[2].status === 'fulfilled') setAppraisalData(results[2].value?.data || []);
    if (results[3].status === 'fulfilled') setTopPerformers(results[3].value?.data || []);
    if (results[4].status === 'fulfilled') setOrgInsights(results[4].value?.data || null);
    setLoading(false);
  };

  const fetchMyPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const res = await analyticsApi.getMyPrediction();
      setMyPrediction(res?.data || null);
    } catch {
      toast.error("Could not generate prediction. Ensure you have appraisal history.");
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleExport = async (type = 'enterprise') => {
    setExporting(true);
    const toastId = toast.loading(`Generating ${type} report...`);
    try {
      const response = await (type === 'enterprise' ? reportApi.exportReport() : reportApi.downloadEmployeeCSV(''));
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performpro_${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded!", { id: toastId });
    } catch {
      toast.error("Failed to generate report", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: 'exports', label: 'Export', icon: Download },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered performance intelligence for your organization.</p>
        </div>
        <button
          onClick={fetchAllData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white border border-gray-200 transition text-sm"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white border border-gray-200 rounded-2xl border border-gray-200 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-gray-900 shadow-lg shadow-indigo-500/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Org Stats */}
            {orgInsights && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatPill label="Total Employees" value={orgInsights.total_employees || 0} color="indigo" />
                <StatPill label="High Performers" value={orgInsights.high_performers_count || 0} color="emerald" />
                <StatPill label="At Risk" value={orgInsights.at_risk_count || 0} color="rose" />
                <StatPill label="Org Health" value={`${orgInsights.org_health_score || 0}%`} color="yellow" />
              </div>
            )}

            {/* Top Performers */}
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-400" /> Top Performers
              </h3>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-white border border-gray-200 rounded-xl animate-pulse" />)}</div>
              ) : topPerformers.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No performance data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((emp, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl border border-gray-200 hover:border-indigo-500/20 transition-all"
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                        idx === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                        idx === 1 ? 'bg-slate-300/20 text-gray-700' :
                        idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-white border border-gray-200 text-gray-600'
                      }`}>#{idx + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-600">{emp.role || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${Math.min(100, emp.score || 0)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-indigo-400 w-12 text-right">{(emp.score || 0).toFixed(1)}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Performance */}
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Target size={20} className="text-emerald-400" /> Department Performance
              </h3>
              {loading ? (
                <div className="h-64 bg-white border border-gray-200 rounded-xl animate-pulse" />
              ) : departments.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No department data yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departments} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} width={120} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="score" name="Avg Score" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TRENDS TAB */}
        {activeTab === 'trends' && (
          <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Performance Trend */}
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-400" /> Performance Trend (Monthly)
              </h3>
              {loading ? (
                <div className="h-72 bg-white border border-gray-200 rounded-xl animate-pulse" />
              ) : trends.length === 0 ? (
                <p className="text-gray-600 text-center py-16">No appraisal data yet to trend.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Appraisal Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-400" /> Appraisal Volume
                </h3>
                {loading ? (
                  <div className="h-56 bg-white border border-gray-200 rounded-xl animate-pulse" />
                ) : appraisalData.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No appraisal data.</p>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appraisalData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                        <Bar dataKey="count" name="Appraisals" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Pie: Department Distribution */}
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Users size={20} className="text-teal-400" /> Dept Distribution
                </h3>
                {loading ? (
                  <div className="h-56 bg-white border border-gray-200 rounded-xl animate-pulse" />
                ) : departments.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No department data.</p>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departments}
                          dataKey="score"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={4}
                        >
                          {departments.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                        <Legend formatter={(val) => <span style={{ color: '#94a3b8' }}>{val}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI INSIGHTS TAB */}
        {activeTab === 'ai' && (
          <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Org AI Summary */}
            {orgInsights && (
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Brain size={22} className="text-indigo-400" /> Organization AI Intelligence
                  </h3>
                  <span className="text-xs bg-indigo-500/15 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                    PerformPro AI v2
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Avg Performance</p>
                    <p className="text-3xl font-black text-gray-900">{orgInsights.avg_performance}%</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Predicted Q+1</p>
                    <p className="text-3xl font-black text-indigo-400">{orgInsights.predicted_next_quarter}%</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Engagement Index</p>
                    <p className="text-3xl font-black text-emerald-400">{orgInsights.engagement_index}x</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-emerald-400" />
                      <span className="font-bold text-emerald-400">High Performers</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{orgInsights.high_performers_count}</p>
                    <p className="text-gray-600 text-sm mt-1">employees scoring 75%+</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-rose-400" />
                      <span className="font-bold text-rose-400">At Risk</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{orgInsights.at_risk_count}</p>
                    <p className="text-gray-600 text-sm mt-1">employees scoring below 40%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Prediction */}
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 border border-purple-500/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap size={22} className="text-yellow-400" /> My Performance Prediction
                </h3>
                <button
                  onClick={fetchMyPrediction}
                  disabled={loadingPrediction}
                  className="flex items-center gap-2 px-5 py-2 btn-primary text-sm"
                >
                  <Brain size={15} />
                  {loadingPrediction ? 'Analyzing...' : myPrediction ? 'Refresh' : 'Run AI Analysis'}
                </button>
              </div>

              {!myPrediction && !loadingPrediction && (
                <div className="text-center py-12">
                  <Brain size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-gray-600">Click "Run AI Analysis" to get your personalized performance prediction based on your appraisal history and feedback.</p>
                </div>
              )}

              {loadingPrediction && (
                <div className="flex items-center justify-center gap-3 py-12 text-indigo-400">
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>AI is analyzing your performance data...</span>
                </div>
              )}

              {myPrediction && !loadingPrediction && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 border border-gray-200 text-center">
                      <p className="text-gray-600 text-xs mb-1">Current</p>
                      <p className="text-3xl font-black text-gray-900">{myPrediction.current_score}%</p>
                    </div>
                    <div className="bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/20 text-center">
                      <p className="text-gray-600 text-xs mb-1">Predicted</p>
                      <p className="text-3xl font-black text-indigo-400">{myPrediction.predicted_score}%</p>
                    </div>
                    <div className={`rounded-2xl p-5 border text-center ${
                      myPrediction.risk_level === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      myPrediction.risk_level === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                      'bg-rose-500/10 border-rose-500/20'
                    }`}>
                      <p className="text-gray-600 text-xs mb-1">Risk Level</p>
                      <p className={`text-xl font-black ${
                        myPrediction.risk_level === 'Low' ? 'text-emerald-400' :
                        myPrediction.risk_level === 'Medium' ? 'text-yellow-400' : 'text-rose-400'
                      }`}>{myPrediction.risk_level}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 border border-gray-200 text-center">
                      <p className="text-gray-600 text-xs mb-1">Confidence</p>
                      <p className="text-3xl font-black text-purple-400">{myPrediction.confidence}%</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={16} className="text-yellow-400" />
                      <span className="font-bold text-gray-900">AI Recommendations for You</span>
                    </div>
                    <ul className="space-y-3">
                      {myPrediction.recommendations.map((rec, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 text-sm text-gray-700"
                        >
                          <CheckCircle size={15} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-gray-600 text-xs">Appraisals</p>
                      <p className="text-xl font-bold text-gray-900">{myPrediction.appraisal_count}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-gray-600 text-xs">Skills</p>
                      <p className="text-xl font-bold text-gray-900">{myPrediction.skill_count}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <p className="text-gray-600 text-xs">Positive Feedback</p>
                      <p className="text-xl font-bold text-gray-900">{Math.round(myPrediction.feedback_sentiment_ratio * 100)}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 text-center">{myPrediction.model}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'exports' && (
          <motion.div key="exports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 hover:border-indigo-500/30 transition-all border border-gray-200">
                <BarChart3 className="h-10 w-10 text-indigo-400 mb-5" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Report</h3>
                <p className="text-gray-600 text-sm mb-6">Full export of appraisal ratings, goals, and performance scores for all employees.</p>
                <button
                  onClick={() => handleExport('enterprise')}
                  disabled={exporting}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download CSV
                </button>
              </div>

              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 hover:border-emerald-500/30 transition-all border border-gray-200">
                <FileSpreadsheet className="h-10 w-10 text-emerald-400 mb-5" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Employee Directory</h3>
                <p className="text-gray-600 text-sm mb-6">List of all staff with status, department, and performance summaries.</p>
                <button
                  onClick={() => handleExport('employee')}
                  disabled={exporting}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-900 hover:bg-white border border-gray-200 transition flex items-center justify-center gap-2 font-semibold"
                >
                  <Download size={16} /> Download CSV
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reports;
