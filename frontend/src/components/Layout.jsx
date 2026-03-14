import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LayoutDashboard, Users, FileText, Bell, LogOut, Settings, Check, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { notificationApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      if (user) {
        const res = await notificationApi.getAll(true);
        if (res.success) setNotifications(res.data);
      }
    } catch (err) { }
  };

  const markAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { }
  };
    
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Enterprise Sidebar */}
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex md:flex-shrink-0 relative z-20"
      >
        <div className="flex w-full flex-col bg-slate-900 border-r border-gray-800 h-full">
          <div className="flex h-16 items-center px-6 justify-between border-b border-slate-800/50">
            {!isSidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-white tracking-wider truncate">
                PerformPro<span className="text-blue-500">.</span>
              </motion.span>
            )}
            {isSidebarCollapsed && (
              <span className="text-xl font-bold text-blue-500 mx-auto">P</span>
            )}
          </div>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-20 bg-slate-800 border-2 border-slate-900 rounded-full p-1 text-gray-400 hover:text-white hover:bg-slate-700 transition"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4 hide-scrollbar">
            <nav className="mt-2 flex-1 space-y-2 px-3">
              {filteredNav.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                      } group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative`}
                  >
                    <item.icon
                      className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        } ${isSidebarCollapsed ? 'mr-0 mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-colors`}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-14 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Role Badge inside Sidebar */}
          <div className="flex p-4 border-t border-slate-800 flex-col items-center">
            {isSidebarCollapsed ? (
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 text-xs font-bold border border-slate-700 hover:bg-blue-500/20 cursor-help" title={`Role: ${user?.role || 'Guest'}`}>
                    {user?.role?.charAt(0) || 'G'}
                </div>
            ) : (
                <span className="inline-flex items-center rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 ring-1 ring-inset ring-blue-500/20 w-full justify-center">
                    Role: {user?.role || 'Guest'}
                </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col w-0 overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md px-6 shadow-sm">
          <div className="flex flex-1 items-center">
            <button className="md:hidden text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-md">
                <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="ml-4 flex items-center md:ml-6 space-x-4">
            <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="rounded-full bg-white p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors relative"
                >
                {(notifications && notifications.length > 0) && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
                <Bell className="h-5 w-5" />
                </button>
                
                {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-left">
                        <div className="bg-slate-50 border-b border-gray-100 px-4 py-3 font-semibold text-gray-700 flex justify-between items-center">
                            Notifications
                            <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{notifications?.length || 0} Unread</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {(!notifications || notifications.length === 0) ? (
                                <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className="p-4 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div className="pr-4">
                                                <h4 className="text-sm font-semibold text-gray-800">{notif.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                                {/* <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p> */}
                                            </div>
                                            <button 
                                                onClick={() => markAsRead(notif.id)}
                                                className="text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

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