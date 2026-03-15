import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { appraisalApi } from '../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DataTable from '../components/DataTable';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { toast } from 'react-hot-toast';

const Appraisals = () => {
    const { id } = useParams();
    const { user, hasRole } = useAuthStore();
    const [appraisals, setAppraisals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Form state
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    
    const isReviewingOther = useMemo(() => id && id !== String(user?.employee_id), [id, user]);

    const fetchAppraisals = async () => {
        setLoading(true);
        try {
            const res = hasRole(['Manager', 'Admin']) 
                ? await appraisalApi.getAll() 
                : await appraisalApi.getMy();
            if (res?.success) {
                setAppraisals(res.data || []);
            }
        } catch (error) {
            console.error("Appraisal fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppraisals();
    }, []);

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ text: '', type: '' });
        try {
            const targetEmployeeId = isReviewingOther ? parseInt(id) : (user?.employee_id || user?.id);
            
            const payload = isReviewingOther ? {
                employee_id: targetEmployeeId,
                manager_remarks: comments,
                review_period: 'Q1-2026' // Default period or make dynamic
            } : {
                employee_id: targetEmployeeId,
                self_rating: Number(rating),
                self_comments: comments
            };

            const res = await appraisalApi.submit(payload);
            if (res?.success) {
                toast.success(isReviewingOther ? 'Review submitted!' : 'Self-appraisal submitted!');
                setComments('');
                setRating(5);
                fetchAppraisals();
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || error.message || 'Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    const handleManagerAction = async (appraisalId, approved) => {
        try {
            const payload = {
                manager_rating: 8.0, 
                manager_comments: 'Reviewed and approved'
            };
            const res = approved 
                ? await appraisalApi.approve(appraisalId, payload)
                : await appraisalApi.reject(appraisalId, payload);
                
            if (res?.success) {
                const action = user.role === 'Manager' ? 'reviewed' : 'approved';
                toast.success(`Appraisal ${approved ? action : 'rejected'} successfully`);
                fetchAppraisals();
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to process review');
        }
    };

    const filteredAppraisals = useMemo(() => {
        if (!searchQuery.trim()) return appraisals;
        const q = searchQuery.toLowerCase();
        return appraisals.filter(app => {
            const commentsMatch = app.comments?.toLowerCase().includes(q);
            const statusMatch = app.status?.toLowerCase().includes(q);
            const idMatch = String(app.employee_id).includes(q);
            return commentsMatch || statusMatch || idMatch;
        });
    }, [appraisals, searchQuery]);

    const columns = [
        { header: "Date", accessor: "date", render: (row) => new Date(row.date).toLocaleDateString() },
        { header: "Employee ID", accessor: "employee_id", render: (row) => <span className="text-gray-500">#{row.employee_id}</span> },
        { header: "Rating", accessor: "rating", render: (row) => <span className="font-bold text-gray-700">{row.rating ? `${row.rating}/10` : 'N/A'}</span> },
        { header: "Status", accessor: "status", render: (row) => (
            <span className={`px-2 py-1 rounded text-xs font-medium ${row.status === 'Approved' ? 'bg-green-100 text-green-800' : row.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {row.status || 'Pending'}
            </span>
        )},
        { header: "Details", accessor: "comments", render: (row) => <div className="max-w-xs truncate text-xs text-gray-500" title={row.comments}>{row.comments}</div> }
    ];

    if (hasRole(['Manager', 'Admin'])) {
        columns.push({
            header: "Actions",
            accessor: "actions",
            render: (row) => {
                const canManagerApprove = user.role === 'Manager' && row.status === 'Pending Manager';
                const canAdminApprove = user.role === 'Admin' && row.status === 'Pending Admin';
                const isOwn = row.employee_id === user?.employee_id;

                if ((canManagerApprove || canAdminApprove) && !isOwn) {
                    return (
                        <div className="flex space-x-2">
                            <button onClick={() => handleManagerAction(row.id, true)} className="text-xs bg-green-500 hover:bg-green-600 text-gray-900 px-3 py-1.5 rounded shadow-sm transition">
                                {user.role === 'Manager' ? 'Review' : 'Finalize'}
                            </button>
                            <button onClick={() => handleManagerAction(row.id, false)} className="text-xs bg-red-500 hover:bg-red-600 text-gray-900 px-3 py-1.5 rounded shadow-sm transition">Reject</button>
                        </div>
                    );
                }
                return <span className="text-xs text-gray-400">Locked</span>;
            }
        });
    }

    if (loading) return <SkeletonDashboard />;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-8"
        >
            <div className="border-b border-gray-100 pb-5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Performance Appraisals</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your self-evaluations and team reviews here.</p>
            </div>

            {msg?.text && (
                <div className={`p-4 rounded-md flex items-center shadow-sm ${msg?.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg?.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <AlertCircle className="w-5 h-5 mr-3 text-red-500" />}
                    {msg?.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden sticky top-8">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-medium text-gray-900">
                                {isReviewingOther ? `Reviewing Employee #${id}` : 'Self Evaluation Form'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {isReviewingOther 
                                    ? "Provide professional feedback and remarks for this employee." 
                                    : "Submit your self-assessment for the current cycle."}
                            </p>
                        </div>
                        <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
                            {!isReviewingOther && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating (1-10)</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            value={rating}
                                            onChange={(e) => setRating(e.target.value)}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <span className="inline-block w-12 text-center py-1 px-2 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-100">
                                            {rating}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {isReviewingOther ? 'Manager Remarks' : 'Key Achievements & Details'}
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
                                    placeholder={isReviewingOther ? "Enter manager review remarks..." : "Detail your accomplishments..."}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-900 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 w-full"
                                >
                                    {submitting ? 'Submitting...' : (isReviewingOther ? 'Submit Manager Review' : 'Submit Evaluation')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Data Table Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Appraisals Timeline</h3>
                                <p className="mt-1 text-sm text-gray-500">{hasRole(['Manager', 'Admin']) ? "Overview of team performance reviews and approvals." : "Your history of submitted performance evaluations."}</p>
                            </div>
                            <div className="w-1/3">
                                <input
                                    type="text"
                                    placeholder="Search by ID, Status, Comments..."
                                    className="w-full text-sm border-gray-300 rounded-md p-2 border shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-0">
                            <DataTable 
                                columns={columns} 
                                data={filteredAppraisals || []} 
                                loading={false} 
                                emptyMessage="No appraisals found in the system yet."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Appraisals;
