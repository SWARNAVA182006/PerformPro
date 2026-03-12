import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { employeeApi, skillApi, feedbackApi, appraisalApi } from "../services/api";
import { motion } from "framer-motion";
import { Award, MessageSquare, ChevronLeft, Plus, Star, Target, TrendingUp } from "lucide-react";
import Modal from "../components/Modal";

export default function EmployeeProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [skills, setSkills] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [skillFormData, setSkillFormData] = useState({ skill_name: "", proficiency_level: "Intermediate" });
    const [feedbackFormData, setFeedbackFormData] = useState({ feedback_text: "", given_by: "Manager" });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [empRes, skillRes, feedRes, reportRes] = await Promise.all([
                employeeApi.getById(id),
                skillApi.getByEmployeeId(id),
                feedbackApi.getByEmployeeId(id),
                appraisalApi.getReport(id).catch(() => ({ data: null }))
            ]);
            setEmployee(empRes.data);
            setSkills(skillRes.data);
            setFeedbacks(feedRes.data);
            setReport(reportRes.data);
        } catch (error) {
            console.error("Failed to load employee data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            await skillApi.add({ ...skillFormData, employee_id: parseInt(id) });
            setIsSkillModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error adding skill:", error);
        }
    };

    const handleAddFeedback = async (e) => {
        e.preventDefault();
        try {
            await feedbackApi.create({ ...feedbackFormData, employee_id: parseInt(id) });
            setIsFeedbackModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error adding feedback:", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Loader2 className="text-indigo-500" size={40} />
            </motion.div>
        </div>
    );

    if (!employee) return <div>Employee not found.</div>;

    return (
        <div className="space-y-8">
            <button
                onClick={() => navigate("/employees")}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft size={20} />
                <span>Back to Employees</span>
            </button>

            <header className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-indigo-500/20">
                    {employee.name.charAt(0)}
                </div>
                <div className="flex-1">
                    <h2 className="text-4xl font-bold text-white mb-2">{employee.name}</h2>
                    <div className="flex flex-wrap gap-4 text-slate-400">
                        <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full text-sm">
                            <Target size={14} className="text-indigo-400" /> {employee.role}
                        </span>
                        <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full text-sm">
                            <TrendingUp size={14} className="text-emerald-400" /> {employee.department}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsFeedbackModalOpen(true)}
                        className="px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm font-semibold"
                    >
                        Add Feedback
                    </button>
                    <button
                        onClick={() => setIsSkillModalOpen(true)}
                        className="btn-primary flex items-center gap-2 text-sm px-6"
                    >
                        <Plus size={18} />
                        Add Skill
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Skills Section */}
                    <section className="glass-card p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Award className="text-indigo-400" size={24} />
                                Technical Skills
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skills.map((skill) => (
                                <div key={skill.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{skill.skill_name}</span>
                                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded">
                                            {skill.proficiency_level}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width:
                                                    skill.proficiency_level.toLowerCase() === 'beginner' ? '25%' :
                                                        skill.proficiency_level.toLowerCase() === 'intermediate' ? '50%' :
                                                            skill.proficiency_level.toLowerCase() === 'advanced' ? '75%' : '100%'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Feedback Section */}
                    <section className="glass-card p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <MessageSquare className="text-purple-400" size={24} />
                            Recent Feedbacks
                        </h3>
                        <div className="space-y-4">
                            {feedbacks.map((f) => (
                                <div key={f.id} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-slate-300">from {f.given_by}</span>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${f.sentiment === 'Positive' ? 'text-emerald-400 bg-emerald-400/10' :
                                                f.sentiment === 'Negative' ? 'text-rose-400 bg-rose-400/10' : 'text-slate-400 bg-slate-400/10'
                                            }`}>
                                            {f.sentiment}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 italic">"{f.feedback_text}"</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    {/* Performance Overview */}
                    <section className="glass-card p-8">
                        <h3 className="text-xl font-bold mb-6">Performance Details</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 text-sm">Appraisal Status</span>
                                <span className="text-indigo-400 font-bold">Pending</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">KPI Score</span>
                                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    {report?.kpi?.final_kpi_score || "N/A"}
                                </span>
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <button
                                    onClick={() => navigate(`/appraisals/${id}`)}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    <Star size={18} />
                                    Start Appraisal
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Skills Modal */}
            <Modal isOpen={isSkillModalOpen} onClose={() => setIsSkillModalOpen(false)} title="Add technical Skill">
                <form onSubmit={handleAddSkill} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Skill Name</label>
                        <input
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                            placeholder="e.g. React, Python, AWS"
                            value={skillFormData.skill_name}
                            onChange={(e) => setSkillFormData({ ...skillFormData, skill_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Proficiency</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
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
                        <label className="block text-sm font-medium text-slate-400 mb-1">Feedback Text</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                            placeholder="Describe employee performance..."
                            value={feedbackFormData.feedback_text}
                            onChange={(e) => setFeedbackFormData({ ...feedbackFormData, feedback_text: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-500 mt-2 italic">Resulting sentiment will be analyzed by AI.</p>
                    </div>
                    <button type="submit" className="w-full btn-primary py-3">Submit Feedback</button>
                </form>
            </Modal>
        </div>
    );
}

const Loader2 = ({ className, size }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
