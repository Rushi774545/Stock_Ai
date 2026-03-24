import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { data: portfolioAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['portfolio-analysis'],
    queryFn: async () => {
      const response = await api.get('/portfolio/analysis/');
      return response.data;
    }
  });

  const { data: stocks, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const response = await api.get('/stocks/');
      return response.data.results;
    }
  });

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b'];

  const sectorData = portfolioAnalysis?.sector_distribution 
    ? Object.entries(portfolioAnalysis.sector_distribution).map(([name, value]: [string, any]) => ({
        name,
        value: value * 100
      }))
    : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Investment" 
          value={`$${portfolioAnalysis?.summary?.total_investment?.toFixed(2) || '0.00'}`}
          icon={<DollarSign className="text-primary-500" />}
        />
        <StatCard 
          title="Current Value" 
          value={`$${portfolioAnalysis?.summary?.total_current_value?.toFixed(2) || '0.00'}`}
          icon={<BarChart3 className="text-accent-500" />}
          trend={portfolioAnalysis?.summary?.total_return_pct}
        />
        <StatCard 
          title="Total Profit/Loss" 
          value={`$${portfolioAnalysis?.summary?.total_profit_loss?.toFixed(2) || '0.00'}`}
          icon={<TrendingUp className="text-emerald-500" />}
          isProfit={portfolioAnalysis?.summary?.total_profit_loss >= 0}
        />
        <StatCard 
          title="Return Rate" 
          value={`${portfolioAnalysis?.summary?.total_return_pct?.toFixed(2) || '0'}%`}
          icon={<TrendingUp className="text-blue-500" />}
          trend={portfolioAnalysis?.summary?.total_return_pct}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 dark:text-white">Sector Allocation</h3>
          <div className="h-[300px]">
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No portfolio data yet</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Top Stocks</h3>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  placeholder="Search stocks..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 font-medium">Symbol</th>
                  <th className="pb-4 font-medium">Name</th>
                  <th className="pb-4 font-medium">Price</th>
                  <th className="pb-4 font-medium">Sector</th>
                  <th className="pb-4 font-medium text-right">PE Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stocks?.slice(0, 6).map((stock: any) => (
                  <tr key={stock.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <td className="py-4 font-bold text-primary-600 dark:text-primary-400">{stock.symbol}</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">{stock.name}</td>
                    <td className="py-4 font-semibold text-slate-900 dark:text-white">${stock.current_price || 'N/A'}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400">
                        {stock.sector}
                      </span>
                    </td>
                    <td className="py-4 text-right text-slate-600 dark:text-slate-400">{stock.pe_ratio || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, isProfit }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
          {Math.abs(trend).toFixed(2)}%
        </div>
      )}
    </div>
    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
  </motion.div>
);

export default Dashboard;
