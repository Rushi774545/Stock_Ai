import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  ChevronRight,
  Filter,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../utils/utils';

const Stocks = () => {
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'NIFTY' | 'USA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stocksData, isLoading } = useQuery({
    queryKey: ['stocks', marketFilter, searchQuery],
    queryFn: async () => {
      let url = '/stocks/?page_size=100';
      if (marketFilter !== 'ALL') url += `&market=${marketFilter}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      const response = await api.get(url);
      return response.data.results;
    }
  });

  const niftyStocks = stocksData?.filter((s: any) => s.market === 'NIFTY') || [];
  const usaStocks = stocksData?.filter((s: any) => s.market === 'USA') || [];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-12 rounded-[40px] text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Market Explorer</h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Track real-time performance across Nifty 50 and Top US markets. 
            Analyze technical indicators and AI-driven forecasts.
          </p>
        </div>
        
        {/* Controls */}
        <div className="mt-12 flex flex-col md:flex-row gap-6">
          <div className="relative flex-grow">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={22} />
            <input 
              type="text"
              placeholder="Search by symbol or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-lg focus:ring-4 focus:ring-primary-500/30 focus:bg-white/10 outline-none transition-all backdrop-blur-md"
            />
          </div>
          <div className="flex p-2 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
            {(['ALL', 'NIFTY', 'USA'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                className={cn(
                  "px-8 py-3 rounded-2xl text-sm font-bold transition-all",
                  marketFilter === m 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                {m === 'ALL' ? 'Global' : m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-800/50 rounded-[40px] animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          {/* Nifty Section */}
          {(marketFilter === 'ALL' || marketFilter === 'NIFTY') && niftyStocks.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                    <Globe size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Nifty 50</h2>
                </div>
                <div className="h-px flex-grow mx-8 bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{niftyStocks.length} Assets</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {niftyStocks.map((stock: any) => (
                  <StockCard key={stock.id} stock={stock} currency="₹" />
                ))}
              </div>
            </section>
          )}

          {/* USA Section */}
          {(marketFilter === 'ALL' || marketFilter === 'USA') && usaStocks.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <Globe size={24} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">US Stocks</h2>
                </div>
                <div className="h-px flex-grow mx-8 bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{usaStocks.length} Assets</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {usaStocks.map((stock: any) => (
                  <StockCard key={stock.id} stock={stock} currency="$" />
                ))}
              </div>
            </section>
          )}

          {stocksData?.length === 0 && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Search size={64} className="mx-auto text-slate-300 mb-6" />
              <h3 className="text-2xl font-bold text-slate-400">No stocks match your search</h3>
              <button 
                onClick={() => {setSearchQuery(''); setMarketFilter('ALL')}}
                className="mt-6 text-primary-500 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StockCard = ({ stock, currency }: { stock: any, currency: string }) => (
  <Link to={`/stocks/${stock.id}`}>
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 relative overflow-hidden"
    >
      {/* AI Recommendation Badge */}
      {stock.news_gold?.recommendation && (
        <div className={cn(
          "absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg",
          stock.news_gold.recommendation === 'BUY' ? "bg-emerald-500 shadow-emerald-500/20" : 
          stock.news_gold.recommendation === 'SELL' ? "bg-rose-500 shadow-rose-500/20" : 
          "bg-amber-500 shadow-amber-500/20"
        )}>
          {stock.news_gold.recommendation}
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-400 dark:text-slate-500 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-500">
          {stock.symbol[0]}
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {currency}{parseFloat(stock.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className={cn(
            "text-sm font-black flex items-center",
            (stock.change_pct || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            {(stock.change_pct || 0) >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
            {Math.abs(stock.change_pct || 0).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-primary-500 transition-colors">
          {stock.symbol}
        </div>
        <div className="text-sm font-medium text-slate-500 truncate mb-4">{stock.name}</div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volatility</div>
            <div className="text-sm font-black text-slate-700 dark:text-slate-300">{(stock.volatility || 0).toFixed(2)}%</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume</div>
            <div className="text-sm font-black text-slate-700 dark:text-slate-300">
              {(stock.volume / 1e6).toFixed(1)}M
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Open</div>
            <div className="text-xs font-black text-slate-700 dark:text-slate-300">{currency}{parseFloat(stock.open_price || 0).toFixed(1)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">High</div>
            <div className="text-xs font-black text-emerald-500">{currency}{parseFloat(stock.high_price || 0).toFixed(1)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Low</div>
            <div className="text-xs font-black text-rose-500">{currency}{parseFloat(stock.low_price || 0).toFixed(1)}</div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Cap</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {currency}{(stock.market_cap / 1e9).toFixed(1)}B
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white group-hover:translate-x-1 transition-all">
          <ArrowRight size={18} />
        </div>
      </div>
    </motion.div>
  </Link>
);

export default Stocks;