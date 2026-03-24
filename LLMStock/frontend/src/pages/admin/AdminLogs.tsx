import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  MessageSquare, 
  Search, 
  Clock,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const AdminLogs = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-logs', searchTerm],
    queryFn: async () => {
      const response = await api.get(`/admin-dashboard/chat-logs/?search=${searchTerm}`);
      return response.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <MessageSquare className="mr-3 text-primary-500" />
            System Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Review AI interactions and user sessions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user or intent..." 
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-80 shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {logs?.map((log: any) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <User size={14} />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{log.user_name || 'Anonymous'}</span>
                {log.intent && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    {log.intent}
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <Clock size={12} className="mr-1.5" />
                {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Message</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                  "{log.message}"
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest flex items-center">
                  <Sparkles size={10} className="mr-1" />
                  AI Response
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-primary-50/30 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-900/20">
                  {log.response}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {logs?.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            No system logs found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
