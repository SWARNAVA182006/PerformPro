import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed }) {
  const items = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Employees", icon: Users },
    { name: "Analytics", icon: BarChart3 },
    { name: "Reports", icon: FileText },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 90 : 260 }}
      transition={{ duration: 0.3 }}
      className="fixed h-screen bg-[#0b1220] border-r border-gray-800 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between px-6 py-6">
          {!collapsed && (
            <h1 className="text-xl font-semibold text-white">
              PerformPro
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-white"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        <nav className="mt-6 space-y-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition rounded-lg cursor-pointer"
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </div>
          ))}
        </nav>
      </div>

      <div className="px-6 py-4 text-xs text-gray-600">
        {!collapsed && "© 2026 PerformPro"}
      </div>
    </motion.aside>
  );
}