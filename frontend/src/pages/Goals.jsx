import React, { useState, useEffect } from 'react';
import { goalApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Target, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { SkeletonBox } from '../components/SkeletonLoader';

const Goals = () => {
    const { user, hasRole } = useAuthStore();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchGoals = async () => {
        try {
            const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'Admin';
            const res = isManagerOrAdmin 
                ? await goalApi.getAll() 
                : await goalApi.getMy();
            if (res?.success) setGoals(res.data || []);
        } catch (error) {
            console.error(error);
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [user?.role]);

    const updateProgress = async (id, newProgress) => {
        try {
            await goalApi.update(id, { progress: newProgress });
            toast.success("Progress updated!");
            fetchGoals();
        } catch (error) {
            toast.error("Failed to update progress");
        }
    };

    const handleApprove = async (id) => {
        try {
            await goalApi.approve(id);
            toast.success("Goal approved!");
            fetchGoals();
        } catch (error) {
            toast.error("Failed to approve goal");
        }
    };

    const handleComplete = async (id) => {
        try {
            await goalApi.complete(id);
            toast.success("Goal completed!");
            fetchGoals();
        } catch (error) {
            toast.error("Failed to complete goal");
        }
    };

    if (loading) return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="space-y-2">
                <SkeletonBox className="h-8 w-48" />
                <SkeletonBox className="h-4 w-64" />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <SkeletonBox key={i} className="h-64 w-full rounded-2xl" />
                ))}
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto space-y-8"
        >
            <header>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Goals & Targets</h1>
                <p className="text-sm text-gray-900 font-medium mt-1">Track your professional growth and key objectives.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals?.length === 0 ? (
                    <div className="col-span-full p-12 bg-gray-50 border-2 border-dashed border-gray-400 rounded-2xl text-center">
                        <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No active goals found</h3>
                        <p className="text-gray-900 font-medium mt-2">You haven't set any personal or professional goals yet.</p>
                    </div>
                ) : (
                    goals?.map((goal) => (
                        <motion.div 
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <Target size={20} />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    goal?.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {goal?.status}
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{goal?.title}</h3>
                            <p className="text-sm text-gray-900 font-medium mb-4">{goal?.target}</p>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-gray-900">Progress</span>
                                    <span className="text-blue-700 font-bold">{goal?.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${goal?.progress}%` }}
                                        className="bg-blue-600 h-full rounded-full"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                <div className="flex items-center text-xs text-black font-semibold">
                                    <Clock size={14} className="mr-1.5" />
                                    Due: {goal?.deadline ? format(new Date(goal.deadline), 'MMM dd, yyyy') : 'N/A'}
                                </div>
                                <div className="flex gap-2">
                                    {goal?.status === 'Pending' && hasRole(['Manager', 'Admin']) && (
                                        <button 
                                            onClick={() => handleApprove(goal.id)}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1 bg-emerald-50 rounded-lg transition-colors"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {goal?.status === 'Approved' && (
                                        <>
                                            <button 
                                                onClick={() => updateProgress(goal.id, Math.min(100, (goal?.progress || 0) + 10))}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-50 rounded-lg transition-colors"
                                            >
                                                +10%
                                            </button>
                                            <button 
                                                onClick={() => handleComplete(goal.id)}
                                                className="text-xs font-bold text-gray-600 hover:text-gray-700 px-3 py-1 bg-gray-50 rounded-lg transition-colors"
                                            >
                                                Finish
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default Goals;
