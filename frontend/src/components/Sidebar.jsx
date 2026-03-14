import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useAuthStore from "../store/useAuthStore";

const SidebarItem = ({ icon: Icon, label, path, active }) => (
  <Link
    to={path}
    className={`nav-link ${active ? "active" : ""}`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Employees", path: "/employees" },
    { icon: Award, label: "Skills", path: "/skills" },
    { icon: Star, label: "Appraisals", path: "/appraisals" },
    { icon: Star, label: "Feedback", path: "/feedback" },
  ];

  return (
    <motion.aside 
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 border-r border-white/10 h-screen sticky top-0 bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Award className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          PerformPro
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            {...item}
            active={location.pathname === item.path}
          />
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
        <SidebarItem icon={Settings} label="Settings" path="/settings" />
        <button onClick={handleLogout} className="nav-link w-full text-left text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}