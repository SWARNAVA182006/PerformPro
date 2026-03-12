import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { employeeApi, appraisalApi } from "../services/api";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function Appraisal() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        review_period: "Annual 2024",
        manager_remarks: ""
    });

    useEffect(() => {
        loadEmployee();
    }, [id]);

    const loadEmployee = async () => {
        try {
            const response = await employeeApi.getById(id);
            setEmployee(response.data);
        } catch (error) {
            console.error("Error loading employee:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await appraisalApi.create({
                employee_id: parseInt(id),
                ...formData
            });
            setIsSuccess(true);
            setTimeout(() => navigate(`/employees/${id}`), 2000);
        } catch (error) {
            console.error("Appraisal submission failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <button
                onClick={() => navigate(`/employees/${id}`)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft size={20} />
                <span>Back to Profile</span>
            </button>

            {isSuccess ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-12 text-center space-y-4"
                >
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-bold">Appraisal Submitted!</h2>
                    <p className="text-slate-400">The performance appraisal has been successfully saved and the KPI score has been updated.</p>
                    <p className="text-xs text-slate-500 mt-8">Redirecting back to profile...</p>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    <header>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Star className="text-yellow-400 fill-yellow-400" size={32} />
                            Performance Appraisal
                        </h2>
                        <p className="text-slate-400 mt-2">Complete the review process for <span className="text-white font-semibold">{employee?.name}</span>.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Review Period</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                value={formData.review_period}
                                onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                            >
                                <option value="Annual 2024" className="bg-slate-800">Annual 2024</option>
                                <option value="Mid-Year 2024" className="bg-slate-800">Mid-Year 2024</option>
                                <option value="Probation Review" className="bg-slate-800">Probation Review</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Manager Remarks & Observations</label>
                            <textarea
                                required
                                rows={8}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                placeholder="Provide detailed feedback on performance, behavior, and areas of growth..."
                                value={formData.manager_remarks}
                                onChange={(e) => setFormData({ ...formData, manager_remarks: e.target.value })}
                            />
                        </div>

                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl">
                            <h4 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                <Loader2 size={16} className="animate-pulse" />
                                AI-Driven Calculation
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                By submitting this form, the system will automatically calculate the final KPI score based on listed skills, historical feedback sentiment, and manager observations.
                            </p>
                        </div>

                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    <Send size={20} />
                                    Submit Performance Report
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
