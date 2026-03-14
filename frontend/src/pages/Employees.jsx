import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeApi, reportApi } from '../services/api';
import DataTable from '../components/DataTable';
import { UserPlus, Download } from 'lucide-react';

const Employees = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ skip: 0, limit: 10, total: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEmployees = useCallback(async (skip = 0, search = '') => {
        setLoading(true);
        try {
            const res = await employeeApi.getAll({ skip, limit: pagination.limit, search });
            if (res.success) {
                setEmployees(res.data);
                setPagination(res.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchEmployees(0, searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, fetchEmployees]);

    const handlePageChange = (newSkip) => {
        fetchEmployees(newSkip, searchQuery);
    };

    const handleDownloadCSV = async () => {
        try {
            const response = await reportApi.downloadEmployeeCSV('');
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'employee_report.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
        }
    };

    const columns = [
        {
            header: "Employee",
            accessor: "name",
            render: (row) => (
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex justify-center items-center text-blue-700 font-bold text-xs uppercase">
                        {row?.name?.charAt(0) || ''}{row?.name?.split(' ')?.[1] ? row.name.split(' ')[1].charAt(0) : ''}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row?.name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs">{row?.email || ''}</div>
                    </div>
                </div>
            )
        },
        { header: "Designation", accessor: "role", render: (row) => <span className="text-gray-600">{row.role}</span> },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {row.status}
                </span>
            )
        },
        {
            header: "Performance",
            accessor: "performance_score",
            render: (row) => (
                <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[4rem]">
                        <div className={`h-2 rounded-full ${row.performance_score > 80 ? 'bg-green-500' : row.performance_score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, row.performance_score)}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">{row.performance_score}%</span>
                </div>
            )
        },
        {
            header: "",
            accessor: "actions",
            render: (row) => (
                <button
                    onClick={() => navigate(`/employees/${row.id}`)}
                    className="text-blue-600 hover:text-blue-900 font-medium text-sm transition-colors"
                >
                    View Profile
                </button>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enterprise Directory</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your workforce, view profiles, and monitor company-wide statuses.</p>
                </div>
                <div className="mt-4 flex sm:mt-0 sm:ml-4 space-x-3">
                    <button onClick={handleDownloadCSV} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                        <Download className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
                        Export CSV
                    </button>
                    <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                        <UserPlus className="-ml-1 mr-2 h-4 w-4" />
                        Add Employee
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={employees}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onSearch={setSearchQuery}
                searchPlaceholder="Search employees by name or email..."
            />
        </div>
    );
};

export default Employees;
