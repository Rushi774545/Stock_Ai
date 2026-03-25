import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Briefcase,
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../utils/utils';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'User Control', icon: Users, path: '/admin/users' },
    { name: 'Stock Inventory', icon: TrendingUp, path: '/admin/stocks' },
    { name: 'All Portfolios', icon: Briefcase, path: '/admin/portfolios' },
    { name: 'System Logs', icon: MessageSquare, path: '/admin/logs' },
  ];

  return (
    <aside className={cn(
      "h-screen bg-slate-950 text-white transition-all duration-300 flex flex-col border-r border-slate-800",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <ShieldAlert className="text-amber-500" size={24} />
            <span className="text-xl font-black tracking-tighter uppercase">Admin Panel</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center p-3 rounded-xl transition-all duration-200 group",
              isActive ? "bg-amber-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={24} className={cn("min-w-[24px]", !isCollapsed && "mr-4")} />
            {!isCollapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <NavLink 
          to="/app"
          className="flex items-center p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <ArrowLeft size={20} className={cn(!isCollapsed && "mr-4")} />
          {!isCollapsed && <span className="text-sm font-bold">Back to App</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;
