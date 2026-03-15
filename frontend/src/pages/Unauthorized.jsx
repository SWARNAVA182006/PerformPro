import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Unauthorized = () => {
    const { logout } = useAuthStore();

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 flex-col">
            <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Access Denied</h1>
            <p className="text-gray-600 mb-8 max-w-md text-center">
                You do not have the necessary enterprise permissions to access this page. Please contact your system administrator.
            </p>
            <div className="flex space-x-4">
                <Link to="/dashboard" className="px-6 py-2 bg-blue-600 text-gray-900 rounded-md hover:bg-blue-700 transition">
                    Return to Dashboard
                </Link>
                <button onClick={logout} className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition text-gray-700">
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
