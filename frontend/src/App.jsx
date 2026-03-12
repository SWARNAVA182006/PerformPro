import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts component to hold Sidebar/Topbar
import Layout from './components/Layout';

// Lazy load enterprise pages for performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile'));
const Appraisals = lazy(() => import('./pages/Appraisals'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Fallback skeleton loader while routes load
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Enterprise Routes (Require Authentication) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* All Roles View Dashboard (Layout adapts) */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<EmployeeProfile />} />

              {/* Appraisals (Employee self eval, Manager review) */}
              <Route path="/appraisals" element={<Appraisals />} />
            </Route>
          </Route>

          {/* Manager & Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route element={<Layout />}>
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeProfile />} />
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