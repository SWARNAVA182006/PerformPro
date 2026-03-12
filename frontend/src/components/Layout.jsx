import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Settings } from 'lucide-react';

const Layout = () => {
  const { user, logout, hasRole } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Performance Appraisals', href: '/appraisals', icon: FileText, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Directory (HR)', href: '/employees', icon: Users, roles: ['Admin', 'Manager'] },
    { name: 'System Logs', href: '/logs', icon: Settings, roles: ['Admin'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Enterprise Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex w-64 flex-col bg-slate-900 border-r border-gray-800">
          <div className="flex h-16 items-center px-6">
            <span className="text-xl font-bold text-white tracking-wider">PerformPro<span className="text-blue-500">.</span></span>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-5 flex-1 space-y-1 px-4">
              {filteredNav.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                      } group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors`}
                  >
                    <item.icon
                      className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        } mr-3 h-5 w-5 flex-shrink-0 transition-colors`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Role Badge inside Sidebar */}
          <div className="flex p-4 border-t border-slate-800">
            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 w-full justify-center">
              Role: {user?.role || 'Guest'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <div className="flex-1"></div>
          <div className="ml-4 flex items-center md:ml-6 space-x-4">
            <button className="rounded-full bg-white p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors relative">
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              <Bell className="h-5 w-5" />
            </button>

            <div className="relative flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-gray-700">{user?.email || 'User'}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 cursor-pointer">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button onClick={logout} className="ml-2 text-gray-500 hover:text-red-600 transition p-1">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {/* Page content injected here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;