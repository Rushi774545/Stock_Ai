import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Plus, 
  Trash2, 
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  X,
  FileText,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';

const Portfolio = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/portfolio/export-pdf/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url);
    } catch (error) {
      toast.error('Failed to generate portfolio report');
    }
  };

  const { data: groups } = useQuery({
    queryKey: ['portfolio-groups'],
    queryFn: async () => {
      const response = await api.get('/portfolio/groups/');
      return response.data;
    }
  });

  const { data: holdings, isLoading } = useQuery({
    queryKey: ['portfolio', selectedGroupId],
    queryFn: async () => {
      const url = selectedGroupId ? `/portfolio/?group_id=${selectedGroupId}` : '/portfolio/';
      const response = await api.get(url);
      return response.data;
    }
  });

  const { data: stocks } = useQuery({
    queryKey: ['stocks-all'],
    queryFn: async () => {
      const response = await api.get('/stocks/?page_size=100');
      return response.data.results;
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/portfolio/groups/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
      toast.success('Portfolio created!');
      setIsGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
    }
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/portfolio/add/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
      toast.success('Stock added to portfolio!');
      setIsAddModalOpen(false);
      resetForm();
    }
  });

  const removeMutation = useMutation({
    mutationFn: async ({ symbol, group_id }: { symbol: string, group_id?: number | null }) => {
      await api.delete('/portfolio/remove/', { data: { symbol, group_id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
      toast.success('Stock removed from portfolio');
    }
  });

  const resetForm = () => {
    setSelectedStock('');
    setQuantity('');
    setPurchasePrice('');
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      stock_symbol: selectedStock,
      quantity: parseInt(quantity),
      purchase_price: parseFloat(purchasePrice),
      group_id: selectedGroupId
    });
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDesc
    });
  };

  const currentGroup = groups?.find((g: any) => g.id === selectedGroupId);

  return (
    <div className="space-y-8">
      {/* Portfolio Selector */}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={() => setSelectedGroupId(null)}
          className={cn(
            "px-6 py-3 rounded-2xl text-sm font-bold transition-all",
            selectedGroupId === null 
              ? "bg-primary-600 text-white shadow-lg" 
              : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700"
          )}
        >
          All Holdings
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
        <div className="flex flex-wrap gap-3">
          {groups?.map((group: any) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all border",
                selectedGroupId === group.id 
                  ? "bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
              )}
            >
              {group.name}
              {group.total_value > 0 && (
                <span className="ml-2 text-[10px] opacity-60">
                  ${parseFloat(group.total_value).toFixed(0)}
                </span>
              )}
            </button>
          ))}
          <button 
            onClick={() => setIsGroupModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-primary-500 hover:border-primary-500 flex items-center"
          >
            <PlusCircle size={14} className="mr-2" />
            Custom Portfolio
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentGroup ? currentGroup.name : 'My Portfolio'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {currentGroup?.description || 'Manage your holdings and track performance across sectors'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl transition-all font-bold"
          >
            <FileText size={20} />
            <span>Report</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary-500/20 font-bold"
          >
            <Plus size={20} />
            <span>Add to {currentGroup ? 'Portfolio' : 'Holdings'}</span>
          </button>
        </div>
      </div>

      {currentGroup && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard 
            label="Total Value" 
            value={`$${parseFloat(currentGroup.total_value).toLocaleString()}`} 
            icon={<Briefcase size={24} className="text-primary-500" />}
          />
          <SummaryCard 
            label="Profit/Loss" 
            value={`$${parseFloat(currentGroup.total_profit_loss).toLocaleString()}`}
            trend={parseFloat(currentGroup.total_profit_loss) >= 0}
            icon={<ExternalLink size={24} className={parseFloat(currentGroup.total_profit_loss) >= 0 ? 'text-emerald-500' : 'text-rose-500'} />}
          />
          <SummaryCard 
            label="Assets" 
            value={holdings?.length || 0}
            icon={<ShieldCheck size={24} className="text-accent-500" />}
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="p-8">Asset</th>
                <th className="p-8 text-center">Quantity</th>
                <th className="p-8">Avg Price</th>
                <th className="p-8">Current</th>
                <th className="p-8">Value</th>
                <th className="p-8">P/L</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {holdings?.map((item: any) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                        {item.stock.symbol[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">{item.stock.symbol}</span>
                        <span className="text-xs font-medium text-slate-400 truncate max-w-[150px]">{item.stock.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-center text-slate-700 dark:text-slate-300 font-black">{item.quantity}</td>
                  <td className="p-8 text-slate-500 dark:text-slate-400 font-bold">${parseFloat(item.purchase_price).toFixed(2)}</td>
                  <td className="p-8 text-slate-500 dark:text-slate-400 font-bold">${parseFloat(item.stock.current_price).toFixed(2)}</td>
                  <td className="p-8 font-black text-slate-900 dark:text-white">${parseFloat(item.current_value).toFixed(2)}</td>
                  <td className="p-8">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-black",
                      parseFloat(item.profit_loss) >= 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                    )}>
                      {parseFloat(item.profit_loss) >= 0 ? '+' : ''}${parseFloat(item.profit_loss).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => removeMutation.mutate({ symbol: item.stock.symbol, group_id: item.group_id })}
                      className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {holdings?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <PlusCircle size={48} className="mx-auto text-slate-200 mb-6" />
                      <h3 className="text-xl font-bold text-slate-400 mb-2">No assets yet</h3>
                      <p className="text-sm text-slate-500 mb-8">Start building your {currentGroup ? `${currentGroup.name} portfolio` : 'holdings'} today.</p>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-primary-500 font-black hover:underline"
                      >
                        Add your first asset
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGroupModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-10 border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8">Create Portfolio</h3>
              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Portfolio Name</label>
                  <input 
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    placeholder="e.g., Long Term Growth"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none dark:text-white font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Description</label>
                  <textarea 
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="What's the goal of this portfolio?"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none dark:text-white font-bold transition-all h-32 resize-none"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                  <PlusCircle className="mr-2 text-primary-500" />
                  Add to {currentGroup ? currentGroup.name : 'Portfolio'}
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStock} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Stock</label>
                  <select 
                    value={selectedStock}
                    onChange={(e) => setSelectedStock(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                  >
                    <option value="">Choose a symbol...</option>
                    {stocks?.map((s: any) => (
                      <option key={s.id} value={s.symbol}>{s.symbol} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Purchase Price ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50 mt-4"
                >
                  {addMutation.isPending ? 'Processing...' : 'Confirm Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCard = ({ label, value, trend, icon }: { label: string, value: string | number, trend?: boolean, icon: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-500/10 transition-all duration-500"></div>
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      {trend !== undefined && (
        <span className={cn(
          "text-xs font-black px-3 py-1 rounded-full",
          trend ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
        )}>
          {trend ? 'Profit' : 'Loss'}
        </span>
      )}
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
  </div>
);

export default Portfolio;
