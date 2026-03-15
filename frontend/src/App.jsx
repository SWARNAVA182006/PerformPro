import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Layouts component to hold Sidebar/Topbar
import Layout from './components/Layout';

// Lazy load enterprise pages for performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const Appraisals = lazy(() => import('./pages/Appraisals'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Signup = lazy(() => import('./pages/Signup'));
const Goals = lazy(() => import('./pages/Goals'));
const Reports = lazy(() => import('./pages/Reports'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));

// Fallback custom branded skeleton loader while routes load
const PageLoader = () => (
  <div className="flex flex-col h-screen w-full items-center justify-center bg-gray-50 space-y-4">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
      className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/30"
    >
      <span className="text-3xl font-bold text-white">P</span>
    </motion.div>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: 120 }}
      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
      className="h-1 bg-blue-600 rounded-full"
    />
    <p className="text-gray-500 font-medium tracking-wide animate-pulse">Loading PerformPro...</p>
  </div>
);

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Enterprise Routes (Require Authentication) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* All Roles */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<EmployeeProfile />} />
              <Route path="/appraisals" element={<Appraisals />} />
              <Route path="/appraisals/:id" element={<Appraisals />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          {/* Manager & Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route element={<Layout />}>
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeProfile />} />
              <Route path="/logs" element={<SystemLogs />} />
            </Route>
          </Route>

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;