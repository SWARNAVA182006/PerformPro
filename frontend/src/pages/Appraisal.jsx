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
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
                <ChevronLeft size={20} />
                <span>Back to Profile</span>
            </button>

            {isSuccess ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white shadow-sm border border-gray-100 rounded-2xl p-12 text-center space-y-4"
                >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Appraisal Submitted!</h2>
                    <p className="text-gray-600">The performance appraisal has been successfully saved and the KPI score has been updated.</p>
                    <p className="text-xs text-gray-500 mt-8">Redirecting back to profile...</p>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    <header>
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Star className="text-yellow-400 fill-yellow-400" size={32} />
                            Performance Appraisal
                        </h2>
                        <p className="text-gray-500 mt-2">Complete the review process for <span className="text-gray-900 font-bold">{employee?.name}</span>.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Review Period</label>
                            <select
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-500"
                                value={formData.review_period}
                                onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                            >
                                <option value="Annual 2024">Annual 2024</option>
                                <option value="Mid-Year 2024">Mid-Year 2024</option>
                                <option value="Probation Review">Probation Review</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Manager Remarks & Observations</label>
                            <textarea
                                required
                                rows={8}
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 placeholder-gray-400"
                                placeholder="Provide detailed feedback on performance, behavior, and areas of growth..."
                                value={formData.manager_remarks}
                                onChange={(e) => setFormData({ ...formData, manager_remarks: e.target.value })}
                            />
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                            <h4 className="text-indigo-700 font-bold mb-2 flex items-center gap-2">
                                <Loader2 size={16} className="animate-pulse" />
                                AI-Driven Calculation
                            </h4>
                            <p className="text-xs text-indigo-900/70 leading-relaxed font-medium">
                                By submitting this form, the system will automatically calculate the final KPI score based on listed skills, historical feedback sentiment, and manager observations.
                            </p>
                        </div>

                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-gray-900 font-bold rounded-xl py-4 text-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
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
