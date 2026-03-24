import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  TrendingUp, 
  Search, 
  Edit3, 
  Trash2, 
  Plus,
  Save,
  X,
  RefreshCcw,
  BarChart2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminStocks = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditEditForm] = useState<any>({});

  const { data: stocks, isLoading } = useQuery({
    queryKey: ['admin-stocks', searchTerm],
    queryFn: async () => {
      const response = await api.get(`/admin-dashboard/stocks/?search=${searchTerm}`);
      return response.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await api.patch(`/admin-dashboard/stocks/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stocks'] });
      toast.success('Stock updated successfully');
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin-dashboard/stocks/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stocks'] });
      toast.success('Stock deleted');
    }
  });

  const handleEdit = (stock: any) => {
    setEditingId(stock.id);
    setEditEditForm(stock);
  };

  const handleSave = () => {
    updateMutation.mutate({ id: editingId, data: editForm });
  };

  const handleDelete = (id: number, symbol: string) => {
    if (confirm(`Are you sure you want to delete ${symbol}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <TrendingUp className="mr-3 text-primary-500" />
            Stock Inventory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage global stock list and financial data</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbol, name..." 
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => toast.error("Please use 'fetch_live_stocks' command for bulk additions")}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 font-bold text-sm"
          >
            <Plus size={18} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
                <th className="p-6 font-medium">Asset</th>
                <th className="p-6 font-medium">Sector</th>
                <th className="p-6 font-medium">Price</th>
                <th className="p-6 font-medium">PE Ratio</th>
                <th className="p-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stocks?.map((stock: any) => (
                <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-6">
                    {editingId === stock.id ? (
                      <div className="flex flex-col space-y-2">
                        <input 
                          value={editForm.symbol} 
                          onChange={e => setEditEditForm({...editForm, symbol: e.target.value})}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-bold"
                        />
                        <input 
                          value={editForm.name} 
                          onChange={e => setEditEditForm({...editForm, name: e.target.value})}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                          {stock.symbol[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{stock.symbol}</div>
                          <div className="text-xs text-slate-500">{stock.name}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === stock.id ? (
                      <input 
                        value={editForm.sector} 
                        onChange={e => setEditEditForm({...editForm, sector: e.target.value})}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm"
                      />
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {stock.sector}
                      </span>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === stock.id ? (
                      <input 
                        type="number"
                        value={editForm.current_price} 
                        onChange={e => setEditEditForm({...editForm, current_price: e.target.value})}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm font-bold w-24"
                      />
                    ) : (
                      <div className="font-bold text-slate-900 dark:text-white">${parseFloat(stock.current_price).toFixed(2)}</div>
                    )}
                  </td>
                  <td className="p-6">
                    {editingId === stock.id ? (
                      <input 
                        type="number"
                        value={editForm.pe_ratio} 
                        onChange={e => setEditEditForm({...editForm, pe_ratio: e.target.value})}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm w-20"
                      />
                    ) : (
                      <div className="text-slate-600 dark:text-slate-400">{stock.pe_ratio || '-'}</div>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {editingId === stock.id ? (
                        <>
                          <button onClick={handleSave} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition-all">
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition-all">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(stock)} className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleDelete(stock.id, stock.symbol)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStocks;
