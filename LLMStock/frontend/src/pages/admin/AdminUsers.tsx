import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  Users, 
  Search, 
  Lock,
  Calendar,
  Mail,
  Smartphone,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm],
    queryFn: async () => {
      const response = await api.get(`/admin-dashboard/users/?search=${searchTerm}`);
      return response.data;
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: any) => {
      const response = await api.patch(`/admin-dashboard/users/${id}/reset-password/`, { password });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Failed to reset password');
    }
  });

  const handleResetPassword = (id: number, username: string) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (newPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ id, password: newPassword });
    } else if (newPassword) {
      toast.error('Password must be at least 6 characters');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="mr-3 text-primary-500" />
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor system users and manage access</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or email..." 
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-80 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
                <th className="p-6 font-medium">User Details</th>
                <th className="p-6 font-medium">Contact</th>
                <th className="p-6 font-medium text-center">Role</th>
                <th className="p-6 font-medium">Joined Date</th>
                <th className="p-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold uppercase">
                        {user.username[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{user.username}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: #{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <Mail size={14} className="mr-2 opacity-50" />
                        {user.email}
                      </div>
                      {user.telegram_id && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Smartphone size={14} className="mr-2 opacity-50" />
                          {user.telegram_id}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center">
                      {user.is_staff ? (
                        <span className="flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800">
                          <ShieldCheck size={12} className="mr-1.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                          User
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Calendar size={14} className="mr-2 opacity-50" />
                      {format(new Date(user.date_joined), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleResetPassword(user.id, user.username)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                      title="Reset Password"
                    >
                      <Lock size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
