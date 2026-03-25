import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  Briefcase, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../utils/utils';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/app' },
    { name: 'Stocks', icon: TrendingUp, path: '/app/stocks' },
    { name: 'Portfolio', icon: Briefcase, path: '/app/portfolio' },
    { name: 'AI Chatbot', icon: MessageSquare, path: '/app/chat' },
  ];

  return (
    <aside className={cn(
      "h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col border-r border-slate-800",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <Link to="/" className="text-xl font-black tracking-[0.12em] uppercase bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent hover:opacity-90">
            MORPHEUS
          </Link>
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
            end={item.path === '/app'}
            className={({ isActive }) => cn(
              "flex items-center p-3 rounded-xl transition-all duration-200 group",
              isActive ? "bg-primary-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={24} className={cn("min-w-[24px]", !isCollapsed && "mr-4")} />
            {!isCollapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
