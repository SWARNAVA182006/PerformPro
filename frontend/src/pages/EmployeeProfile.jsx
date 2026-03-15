import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { employeeApi, skillApi, feedbackApi, uploadApi, analyticsApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, MessageSquare, ChevronLeft, Plus, Star, Target, TrendingUp,
  Edit2, Brain, AlertTriangle, CheckCircle, TrendingDown, Minus,
  Upload, Mail, Phone, Calendar, Building2, User, Zap, BarChart3,
  Activity, Shield
} from "lucide-react";
import Modal from "../components/Modal";
import { SkeletonBox } from "../components/SkeletonLoader";
import useAuthStore from "../store/useAuthStore";
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TrendIcon = ({ trend }) => {
  if (trend === "upward") return <TrendingUp size={16} className="text-emerald-400" />;
  if (trend === "downward") return <TrendingDown size={16} className="text-rose-400" />;
  return <Minus size={16} className="text-yellow-400" />;
};

const RiskBadge = ({ level }) => {
  const colors = {
    Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    High: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colors[level] || colors.Medium}`}>
      {level} Risk
    </span>
  );
};

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [employee, setEmployee] = useState(null);
  const [skills, setSkills] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [skillFormData, setSkillFormData] = useState({ skill_name: "", proficiency_level: "Intermediate" });
  const [feedbackFormData, setFeedbackFormData] = useState({ feedback_text: "", given_by: "Manager" });
  const [editFormData, setEditFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (employee) {
      setEditFormData({
        name: employee.name || "",
        role: employee.role || "",
        phone: employee.phone || "",
        bio: employee.bio || "",
        profile_image_url: employee.profile_image_url || "",
        status: employee.status || "Active"
      });
    }
  }, [employee]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch core employee data
      const empRes = id ? employeeApi.getById(id) : employeeApi.getMe();
      const empData = await empRes;
      const emp = empData.data;
      setEmployee(emp);

      const targetId = emp?.id || id;
      if (!targetId) {
        setLoading(false);
        return;
      }

      // Parallel: skills, feedbacks, AI prediction
      const [skillRes, feedRes, predRes] = await Promise.allSettled([
        skillApi.getByEmployeeId(targetId),
        feedbackApi.getByEmployeeId(targetId),
        analyticsApi.getPrediction(targetId),
      ]);

      if (skillRes.status === 'fulfilled') setSkills(skillRes.value?.data || []);
      if (feedRes.status === 'fulfilled') setFeedbacks(feedRes.value?.data || []);
      if (predRes.status === 'fulfilled') setPrediction(predRes.value?.data || null);
    } catch (error) {
      console.error("Failed to load employee data:", error);
      toast.error("Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file (JPG, PNG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      const imageUrl = `${API_BASE_URL}${res.data.url}`;
      setEditFormData(prev => ({ ...prev, profile_image_url: imageUrl }));
      toast.success("Image uploaded! Save changes to apply.");
    } catch (err) {
      toast.error("Image upload failed");
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const targetId = id || employee?.id;
      await skillApi.add({ ...skillFormData, employee_id: parseInt(targetId) });
      setIsSkillModalOpen(false);
      toast.success("Skill added!");
      loadData();
    } catch {
      toast.error("Error adding skill");
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    try {
      const targetId = id || employee?.id;
      await feedbackApi.create({ ...feedbackFormData, employee_id: parseInt(targetId) });
      setIsFeedbackModalOpen(false);
      toast.success("Feedback submitted!");
      loadData();
    } catch {
      toast.error("Error submitting feedback");
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await employeeApi.update(id, editFormData);
      } else {
        await employeeApi.updateMe(editFormData);
      }
      setIsEditModalOpen(false);
      setImagePreview(null);
      toast.success("Profile updated successfully!");
      loadData();
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex gap-8 items-center">
          <SkeletonBox className="w-28 h-28 rounded-3xl" />
          <div className="flex-1 space-y-4">
            <SkeletonBox className="h-8 w-1/3" />
            <div className="flex gap-4">
              <SkeletonBox className="h-6 w-24 rounded-full" />
              <SkeletonBox className="h-6 w-32 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <SkeletonBox className="h-64 w-full rounded-2xl" />
            <SkeletonBox className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <SkeletonBox className="h-48 w-full rounded-2xl" />
            <SkeletonBox className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle size={48} className="text-yellow-400" />
        <p className="text-gray-600 text-lg">Employee profile not found.</p>
        <button onClick={() => navigate(-1)} className="btn-primary px-6">Go Back</button>
      </div>
    );
  }

  const proficiencyWidth = (level) => {
    const map = { beginner: '25%', intermediate: '55%', advanced: '80%', excellent: '100%' };
    return map[(level || '').toLowerCase()] || '50%';
  };

  const profileImageSrc = imagePreview || employee?.profile_image_url;

  return (
    <div className="space-y-8">
      {id && (
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to Employees</span>
        </button>
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start md:items-center"
      >
        <div className="relative group">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-gray-900 overflow-hidden shadow-2xl shadow-indigo-500/30 border-2 border-gray-200">
            {profileImageSrc ? (
              <img src={profileImageSrc} alt={employee.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-bold">
                {employee?.name ? employee.name.charAt(0).toUpperCase() : 'E'}
              </span>
            )}
          </div>
          {/* Status dot */}
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${employee?.status === 'Active' ? 'bg-emerald-400' : employee?.status === 'On Leave' ? 'bg-yellow-400' : 'bg-slate-400'}`} />
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">{employee?.name || 'Unknown Employee'}</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <span className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
              <Target size={13} className="text-indigo-400" /> {employee?.role || 'No Designation'}
            </span>
            <span className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
              <Building2 size={13} className="text-emerald-400" /> {employee?.department?.name || 'No Department'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${employee?.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-gray-600'}`}>
              {employee?.status || 'Active'}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><Mail size={13} className="text-indigo-400" />{employee?.email}</span>
            {employee?.phone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-emerald-400" />{employee.phone}</span>}
            {employee?.date_joined && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-purple-400" />
                Joined {new Date(employee.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
          {employee?.bio && <p className="mt-3 text-gray-600 text-sm italic">"{employee.bio}"</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          {(user?.role === 'Admin' || user?.role === 'Manager' || !id) && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-900 hover:bg-gray-100 transition-all text-sm font-semibold flex items-center gap-2"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-900 hover:bg-white border border-gray-200 transition-all text-sm font-semibold flex items-center gap-2"
          >
            <MessageSquare size={16} /> Feedback
          </button>
          <button
            onClick={() => setIsSkillModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm px-5"
          >
            <Plus size={16} /> Add Skill
          </button>
        </div>
      </motion.header>

      {/* Performance Score Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-400" /> Overall Performance Score
          </span>
          <span className="text-2xl font-bold text-gray-900">{(employee?.performance_score || 0).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, employee?.performance_score || 0)}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`h-full rounded-full ${
              employee?.performance_score >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
              employee?.performance_score >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
              'bg-gradient-to-r from-rose-500 to-pink-400'
            }`}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Skills Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="text-indigo-400" size={22} /> Technical Skills
              </h3>
              <span className="text-xs text-gray-500">{skills.length} skills</span>
            </div>
            {skills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award size={32} className="mx-auto mb-2 opacity-30" />
                <p>No skills added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-gray-200 p-4 rounded-xl border border-gray-200 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-900">{skill.skill_name}</span>
                      <span className="text-xs bg-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        {skill.proficiency_level}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: proficiencyWidth(skill.proficiency_level) }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Feedback Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="text-purple-400" size={22} /> Recent Feedback
            </h3>
            {feedbacks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p>No feedback received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((f) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border border-gray-200 p-5 rounded-2xl border border-gray-200 hover:border-purple-500/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <User size={13} className="text-purple-400" /> {f.given_by}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                        f.sentiment === 'Positive' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' :
                        f.sentiment === 'Negative' ? 'text-rose-400 bg-rose-400/10 border-rose-500/20' :
                        'text-gray-600 bg-slate-400/10 border-slate-500/20'
                      }`}>
                        {f.sentiment || 'Neutral'}
                      </span>
                    </div>
                    <p className="text-gray-600 italic text-sm">"{f.feedback_text}"</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Quick Info Card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <Shield size={18} className="text-indigo-400" /> Profile Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                <span className="text-gray-600">Employee ID</span>
                <span className="text-gray-900 font-medium">#{employee?.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${employee?.status === 'Active' ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {employee?.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                <span className="text-gray-600">Department</span>
                <span className="text-gray-900 font-medium">{employee?.department?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                <span className="text-gray-600">Skills</span>
                <span className="text-indigo-400 font-bold">{skills.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Feedbacks</span>
                <span className="text-purple-400 font-bold">{feedbacks.length}</span>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-gray-200">
              <button
                onClick={() => navigate(`/appraisals`)}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                <Star size={16} /> View Appraisals
              </button>
            </div>
          </motion.section>

          {/* AI Prediction Card */}
          <AnimatePresence>
            {prediction && (
              <motion.section
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 border border-indigo-500/20"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Brain size={18} className="text-indigo-400" /> AI Prediction
                  </h3>
                  <span className="text-xs text-gray-500">{prediction.confidence}% confidence</span>
                </div>

                {/* Predicted Score */}
                <div className="text-center mb-5">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.91" fill="none"
                        stroke={prediction.risk_level === 'Low' ? '#10b981' : prediction.risk_level === 'Medium' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${prediction.predicted_score} ${100 - prediction.predicted_score}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-gray-900">{prediction.predicted_score}%</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">Predicted Next Quarter</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Trend</span>
                    <span className="flex items-center gap-1.5">
                      <TrendIcon trend={prediction.trend} />
                      <span className={`font-semibold capitalize ${
                        prediction.trend === 'upward' ? 'text-emerald-400' :
                        prediction.trend === 'downward' ? 'text-rose-400' : 'text-yellow-400'
                      }`}>{prediction.trend}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Risk Level</span>
                    <RiskBadge level={prediction.risk_level} />
                  </div>
                  {prediction.kpi_score !== null && prediction.kpi_score !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Avg KPI</span>
                      <span className="text-gray-900 font-bold">{prediction.kpi_score}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Sentiment</span>
                    <span className="text-gray-900 font-medium">{Math.round(prediction.feedback_sentiment_ratio * 100)}% positive</span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold mb-3 flex items-center gap-1.5">
                    <Zap size={12} className="text-yellow-400" /> AI Recommendations
                  </p>
                  <ul className="space-y-2">
                    {prediction.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckCircle size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[10px] text-slate-600 mt-4 text-center">{prediction.model}</p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Skill Modal */}
      <Modal isOpen={isSkillModalOpen} onClose={() => setIsSkillModalOpen(false)} title="Add Technical Skill">
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Skill Name</label>
            <input
              required
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              placeholder="e.g. React, Python, AWS"
              value={skillFormData.skill_name}
              onChange={(e) => setSkillFormData({ ...skillFormData, skill_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Proficiency</label>
            <select
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              value={skillFormData.proficiency_level}
              onChange={(e) => setSkillFormData({ ...skillFormData, proficiency_level: e.target.value })}
            >
              <option value="Beginner" className="bg-slate-800">Beginner</option>
              <option value="Intermediate" className="bg-slate-800">Intermediate</option>
              <option value="Advanced" className="bg-slate-800">Advanced</option>
              <option value="Excellent" className="bg-slate-800">Excellent</option>
            </select>
          </div>
          <button type="submit" className="w-full btn-primary py-3">Add Skill</button>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} title="Provide Feedback">
        <form onSubmit={handleAddFeedback} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Your Name / Role</label>
            <input
              required
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              placeholder="e.g. John Smith (Manager)"
              value={feedbackFormData.given_by}
              onChange={(e) => setFeedbackFormData({ ...feedbackFormData, given_by: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Feedback</label>
            <textarea
              required
              rows={4}
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              placeholder="Describe employee performance..."
              value={feedbackFormData.feedback_text}
              onChange={(e) => setFeedbackFormData({ ...feedbackFormData, feedback_text: e.target.value })}
            />
            <p className="text-[10px] text-gray-500 mt-1 italic">Sentiment will be analyzed by AI.</p>
          </div>
          <button type="submit" className="w-full btn-primary py-3">Submit Feedback</button>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setImagePreview(null); }} title="Edit Employee Profile">
        <form onSubmit={handleEditEmployee} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Profile Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-800 overflow-hidden flex items-center justify-center border border-gray-200">
                {imagePreview || editFormData.profile_image_url ? (
                  <img src={imagePreview || editFormData.profile_image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 rounded-xl border border-white/15 text-gray-700 hover:bg-white border border-gray-200 transition text-sm flex items-center gap-2 justify-center"
                >
                  <Upload size={14} /> {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                </button>
                <p className="text-[10px] text-gray-500 mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input
              required
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              value={editFormData.name || ""}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Designation</label>
              <input
                className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
                value={editFormData.role || ""}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select
                className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
                value={editFormData.status || "Active"}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="Active" className="bg-slate-800">Active</option>
                <option value="Inactive" className="bg-slate-800">Inactive</option>
                <option value="On Leave" className="bg-slate-800">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              placeholder="+1 (555) 000-0000"
              value={editFormData.phone || ""}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
            <textarea
              rows={3}
              className="w-full bg-white border border-gray-200 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 outline-none focus:border-indigo-500"
              placeholder="Short biography or professional summary..."
              value={editFormData.bio || ""}
              onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
            />
          </div>

          <button type="submit" className="w-full btn-primary py-3 mt-2">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
}
