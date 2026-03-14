import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { appraisalApi } from '../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import DataTable from '../components/DataTable';
import { SkeletonDashboard } from '../components/SkeletonLoader';

const Appraisals = () => {
    const { user, hasRole } = useAuthStore();
    const [appraisals, setAppraisals] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    const fetchAppraisals = async () => {
        setLoading(true);
        try {
            const res = await appraisalApi.getAll();
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

    const handleSubmitSelf = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMsg({ text: '', type: '' });
        try {
            const employeeId = user?.employee_id || user?.id; 
            const res = await appraisalApi.submitSelf({
                employee_id: employeeId,
                self_rating: Number(rating),
                self_comments: comments
            });
            if (res?.success) {
                setMsg({ text: 'Self-appraisal submitted successfully! Pending manager review.', type: 'success' });
                setComments('');
                setRating(5);
                fetchAppraisals();
            }
        } catch (error) {
            setMsg({ 
                text: error.response?.data?.detail || error.message || 'Failed to submit appraisal', 
                type: 'error' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleManagerAction = async (appraisalId, approved) => {
        try {
            // Simplified UI approach for demo: one-click approve/reject
            // In a deeper enterprise system this would open a modal to write manager_comments
            const res = await appraisalApi.submitManagerReview({
                appraisal_id: appraisalId,
                manager_rating: approved ? 8.0 : 4.0, 
                manager_comments: approved ? 'Performance meets expectations' : 'Needs performance improvement plan',
                approved: approved
            });
            if (res?.success) {
                fetchAppraisals();
            }
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to process review');
        }
    };

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
            render: (row) => (row.status === 'Pending Manager' && row.employee_id !== user?.employee_id) ? (
                <div className="flex space-x-2">
                    <button onClick={() => handleManagerAction(row.id, true)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded shadow-sm transition">Approve</button>
                    <button onClick={() => handleManagerAction(row.id, false)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded shadow-sm transition">Reject</button>
                </div>
            ) : <span className="text-xs text-gray-400">Locked</span>
        });
    }

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="border-b border-gray-100 pb-5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Performance Appraisals</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your self-evaluations and team reviews here.</p>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-md flex items-center shadow-sm ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <AlertCircle className="w-5 h-5 mr-3 text-red-500" />}
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden sticky top-8">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-medium text-gray-900">Self Evaluation Form</h3>
                            <p className="mt-1 text-sm text-gray-500">Submit your self-assessment for the current cycle.</p>
                        </div>
                        <form onSubmit={handleSubmitSelf} className="p-6 space-y-6">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Key Achievements & Details</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
                                    placeholder="Detail your accomplishments, roadblocks, and goals..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 w-full"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Evaluation'}
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
                        </div>
                        <div className="p-0">
                            <DataTable 
                                columns={columns} 
                                data={appraisals} 
                                loading={false} 
                                emptyMessage="No appraisals found in the system yet."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Appraisals;
