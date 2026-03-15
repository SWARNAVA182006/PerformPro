import { motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon, trend, trendValue }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 flex items-start justify-between"
    >
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
        {trend && (
          <div className={`mt-2 text-xs font-semibold ${trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
            {trend === "up" ? "↑" : "↓"} {trendValue} <span className="text-gray-500 font-normal ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-indigo-400">
        <Icon size={24} />
      </div>
    </motion.div>
  );
}