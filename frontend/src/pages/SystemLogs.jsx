import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../services/api';
import { format } from 'date-fns';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await dashboardApi.getActivity();
                if (res?.success) {
                    const mappedLogs = res.data.map((item, idx) => ({
                        id: idx,
                        type: 'ACTIVITY',
                        message: item.action,
                        time: format(new Date(item.timestamp), 'HH:mm:ss'),
                        status: 'INFO'
                    }));
                    setLogs(mappedLogs);
                }
            } catch (err) {
                console.error("Failed to fetch logs");
            }
        };
        fetchLogs();
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <header className="flex items-center gap-4">
                <div className="bg-slate-900 p-2 rounded-lg text-gray-900"><Terminal size={20} /></div>
                <h1 className="text-xl font-bold">System Event Logs</h1>
            </header>
            <div className="bg-slate-950 rounded-xl p-6 font-mono text-xs text-gray-700 space-y-2 border border-slate-800">
                {logs?.map(log => (
                    <div key={log.id} className="flex gap-4">
                        <span className="text-slate-600">[{log.time}]</span>
                        <span className={log.status === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}>{log.status}</span>
                        <span>{log.message}</span>
                    </div>
                ))}
                <div className="text-slate-600 mt-4">_ Monitoring active...</div>
            </div>
        </motion.div>
    );
};

export default SystemLogs;
