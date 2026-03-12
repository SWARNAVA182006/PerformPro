import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { appraisalApi } from '../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const Appraisals = () => {
    const { user, hasRole } = useAuthStore();
    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    // In a real enterprise app, we'd fetch pending appraisals here

    const handleSubmitSelf = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await appraisalApi.submitSelf({
                employee_id: user.id, // Assuming user.id aligns with employee.id for this demo, usually it's mapped via user.employee_profile.id
                self_rating: Number(rating),
                self_comments: comments
            });
            if (res.success) {
                setMsg({ text: 'Self-appraisal submitted successfully! Pending manager review.', type: 'success' });
                setComments('');
                setRating(5);
            }
        } catch (error) {
            setMsg({ text: error.detail || 'Failed to submit appraisal', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-gray-100 pb-5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Performance Appraisals</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your self-evaluations and team reviews.</p>
            </div>

            {msg.text && (
                <div className={`p-4 rounded-md flex items-center ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <AlertCircle className="w-5 h-5 mr-3 text-red-500" />}
                    {msg.text}
                </div>
            )}

            <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
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
                            disabled={loading}
                            className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Self-Evaluation'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Manager View Only */}
            {hasRole(['Manager', 'Admin']) && (
                <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mt-8 opacity-75">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Manager Approvals (Pending)</h3>
                            <p className="mt-1 text-sm text-gray-500">Reviews awaiting your feedback.</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            2 Pending
                        </span>
                    </div>
                    <div className="p-6 text-center text-gray-500">
                        Pending Appraisals list would render here via DataTable.
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appraisals;
