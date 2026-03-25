import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  LineChart as LineChartIcon,
  Activity,
  Brain,
  Download,
  FileText,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  Plus,
  Briefcase,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  Bar, 
  ComposedChart, 
  ReferenceLine, 
  Legend, 
  Brush
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';

const StockDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Fundamentals');
  const [timeframe, setTimeframe] = useState('1Y');
  const [overlays, setOverlays] = useState({ ma20: true, ma50: true, ma200: false });
  
  // Portfolio selection state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');

  // Forecast specific state
  const [forecastModel, setForecastModel] = useState('arima');
  const [forecastTimeframe, setForecastTimeframe] = useState('daily');
  const [forecastHorizon, setForecastHorizon] = useState(30);

  const { data: stock, isLoading } = useQuery({
    queryKey: ['stock-detail', id],
    queryFn: async () => {
      const response = await api.get(`/stocks/${id}/`);
      return response.data;
    }
  });

  const { data: groups } = useQuery({
    queryKey: ['portfolio-groups'],
    queryFn: async () => {
      const response = await api.get('/portfolio/groups/');
      return response.data;
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
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add stock');
    }
  });

  const handleAddToPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error('Please select a portfolio');
      return;
    }
    addMutation.mutate({
      stock_symbol: stock.symbol,
      quantity: parseInt(quantity),
      purchase_price: parseFloat(stock.current_price),
      group_id: selectedGroupId
    });
  };

  const { data: forecastData, isLoading: isForecastLoading, refetch: refetchForecast } = useQuery({
    queryKey: ['stock-forecast', id, forecastModel, forecastTimeframe, forecastHorizon],
    queryFn: async () => {
      const response = await api.get(`/stocks/${id}/forecast/`, {
        params: {
          model: forecastModel,
          timeframe: forecastTimeframe,
          horizon: forecastHorizon
        }
      });
      return response.data;
    },
    enabled: activeTab === 'Forecast'
  });

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">Loading stock data...</div>;

  const chartData = stock?.historical_data || [];
  
  // Prepare combined forecast chart data
  const combinedForecastData = [
    ...(forecastData?.historical?.map((h: any) => ({ 
      date: h.date, 
      historicalPrice: h.price,
      forecastPrice: null 
    })) || []),
    // Add the last historical point to the forecast data to bridge the gap
    ...(forecastData?.historical?.length > 0 && forecastData?.forecast?.length > 0 ? [{
      date: forecastData.historical[forecastData.historical.length - 1].date,
      historicalPrice: null,
      forecastPrice: forecastData.historical[forecastData.historical.length - 1].price
    }] : []),
    ...(forecastData?.forecast?.map((f: any) => ({ 
      date: f.date, 
      historicalPrice: null, 
      forecastPrice: f.price 
    })) || [])
  ];

  const getFilteredData = () => {
    if (timeframe === '1M') return chartData.slice(-22);
    if (timeframe === '3M') return chartData.slice(-66);
    if (timeframe === '1Y') return chartData.slice(-252);
    return chartData;
  };

  const filteredData = getFilteredData();

  const trendData = stock?.performance_trend?.prices?.map((price: number, index: number) => ({
    date: `Day ${index + 1}`,
    price
  })) || [];

  const tabs = ['Fundamentals', 'Technical Charts', 'Forecast', 'AI Recommendation', 'Market News'];

  const handleDownloadCSV = async () => {
    try {
      const response = await api.get(`/stocks/${id}/export-csv/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${stock.symbol}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download CSV');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/stocks/${id}/export-pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url);
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const currency = stock?.market === 'NIFTY' ? '₹' : '$';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-2xl shadow-inner">
            {stock?.symbol[0]}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stock?.symbol}</h1>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider">{stock?.market} • {stock?.sector}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{stock?.name}</p>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-3">
          <div className="flex flex-col items-end">
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{currency}{parseFloat(stock?.current_price).toFixed(2)}</div>
            <div className={cn(
              "flex items-center px-4 py-1.5 rounded-full text-sm font-bold shadow-sm",
              stock?.performance_trend?.trend_30d_pct >= 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
            )}>
              {stock?.performance_trend?.trend_30d_pct >= 0 ? <TrendingUp size={16} className="mr-1.5" /> : <TrendingDown size={16} className="mr-1.5" />}
              {Math.abs(stock?.performance_trend?.trend_30d_pct).toFixed(2)}% (30d)
            </div>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-primary-500/20 font-bold w-full md:w-auto justify-center"
          >
            <Plus size={20} />
            <span>Add to Portfolio</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                <BarChart2 className="mr-3 text-primary-500" />
                Advanced Price Analysis
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                {['1M', '3M', '1Y', 'ALL'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setTimeframe(p)}
                    className={cn("px-4 py-1.5 rounded-xl text-xs font-bold transition-all", timeframe === p ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm" : "text-slate-500")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <OverlayToggle label="MA 20" active={overlays.ma20} onClick={() => setOverlays(o => ({...o, ma20: !o.ma20}))} color="#10b981" />
              <OverlayToggle label="MA 50" active={overlays.ma50} onClick={() => setOverlays(o => ({...o, ma50: !o.ma50}))} color="#3b82f6" />
              <OverlayToggle label="MA 200" active={overlays.ma200} onClick={() => setOverlays(o => ({...o, ma200: !o.ma200}))} color="#8b5cf6" />
            </div>

            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" hide />
                  <YAxis yAxisId="price" domain={['auto', 'auto']} hide />
                  <YAxis yAxisId="volume" orientation="right" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar yAxisId="volume" dataKey="volume" fill="#cbd5e1" opacity={0.2} name="Volume" />
                  <Line yAxisId="price" type="monotone" dataKey="close" stroke="#0ea5e9" strokeWidth={4} dot={false} name="Price" />
                  {overlays.ma20 && <Line yAxisId="price" type="monotone" dataKey="ma_20" stroke="#10b981" strokeWidth={2} dot={false} name="MA 20" />}
                  {overlays.ma50 && <Line yAxisId="price" type="monotone" dataKey="ma_50" stroke="#3b82f6" strokeWidth={2} dot={false} name="MA 50" />}
                  {overlays.ma200 && <Line yAxisId="price" type="monotone" dataKey="ma_200" stroke="#8b5cf6" strokeWidth={2} dot={false} name="MA 200" />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Tabs */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl min-h-[500px]">
            <div className="flex flex-wrap gap-2 mb-10 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center space-x-2",
                    activeTab === tab 
                      ? "bg-white dark:bg-slate-700 text-primary-600 shadow-lg shadow-slate-200/50 dark:shadow-none scale-105" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {tab === 'Fundamentals' && <FileText size={18} />}
                  {tab === 'Technical Charts' && <Activity size={18} />}
                  {tab === 'Forecast' && <LineChartIcon size={18} />}
                  {tab === 'AI Recommendation' && <Brain size={18} />}
                  {tab === 'Market News' && <TableIcon size={18} />}
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'Fundamentals' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <MetricCard label="Open" value={`${currency}${parseFloat(stock?.open_price || 0).toFixed(2)}`} />
                    <MetricCard label="Prev Close" value={`${currency}${parseFloat(stock?.prev_close || 0).toFixed(2)}`} />
                    <MetricCard label="Day High" value={`${currency}${parseFloat(stock?.high_price || 0).toFixed(2)}`} />
                    <MetricCard label="Day Low" value={`${currency}${parseFloat(stock?.low_price || 0).toFixed(2)}`} />
                    <MetricCard label="52W High" value={`${currency}${parseFloat(stock?.fifty_two_week_high || 0).toFixed(2)}`} />
                    <MetricCard label="52W Low" value={`${currency}${parseFloat(stock?.fifty_two_week_low || 0).toFixed(2)}`} />
                    <MetricCard label="Market Cap" value={`${currency}${(stock?.market_cap / 1e9).toFixed(2)}B`} />
                    <MetricCard label="PE Ratio" value={stock?.pe_ratio?.toFixed(2) || 'N/A'} />
                    <MetricCard label="Dividend Yield" value={`${(stock?.dividend_yield * 100).toFixed(2)}%` || '0.00%'} />
                    <MetricCard label="Volume" value={stock?.volume?.toLocaleString()} />
                  </div>
                )}
                {activeTab === 'Technical Charts' && (
                  <div className="space-y-12">
                    {/* RSI Chart */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Relative Strength Index (RSI 14)</h4>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          stock?.indicators?.rsi > 70 ? "bg-rose-100 text-rose-600" : stock?.indicators?.rsi < 30 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {stock?.indicators?.rsi?.toFixed(2)} - {stock?.indicators?.rsi > 70 ? 'Overbought' : stock?.indicators?.rsi < 30 ? 'Oversold' : 'Neutral'}
                        </span>
                      </div>
                      <div className="h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                        <div className="p-4 h-full w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={filteredData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                              <XAxis dataKey="date" hide />
                              <YAxis domain={[0, 100]} ticks={[30, 70]} hide />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                              />
                              <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" />
                              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                              <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* MACD Chart */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">MACD (12, 26, 9)</h4>
                        <span className="text-xs font-bold text-slate-500">Trend Momentum</span>
                      </div>
                      <div className="h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl">
                        <div className="p-4 h-full w-full">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <ComposedChart data={filteredData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                              <XAxis dataKey="date" hide />
                              <YAxis hide />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }} />
                              <Bar dataKey="macd_hist" fill="#94a3b8" opacity="0.5" />
                              <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="macd_signal" stroke="#f43f5e" strokeWidth={2} dot={false} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'Forecast' && (
                  <div className="space-y-8">
                    {/* Forecast Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Model</label>
                        <select 
                          value={forecastModel}
                          onChange={(e) => setForecastModel(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          <option value="arima">ARIMA (Time Series)</option>
                          <option value="linear">Linear Regression</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Timeframe</label>
                        <select 
                          value={forecastTimeframe}
                          onChange={(e) => setForecastTimeframe(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horizon</label>
                        <input 
                          type="number"
                          value={forecastHorizon}
                          onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button 
                          onClick={() => refetchForecast()}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center transition-all shadow-lg shadow-primary-500/20"
                        >
                          <RefreshCw size={16} className={cn("mr-2", isForecastLoading && "animate-spin")} />
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div className="h-[400px] relative">
                      {isForecastLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                          <RefreshCw size={48} className="text-primary-500 animate-spin" />
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <ComposedChart data={combinedForecastData}>
                          <defs>
                            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity="0.3"/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity="0.3"/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            tickFormatter={(str) => str.split(' ')[0]}
                            minTickGap={30}
                          />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            formatter={(value: any, name: any) => [`${currency}${parseFloat(value).toFixed(2)}`, name]}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Area 
                            type="monotone" 
                            dataKey="historicalPrice" 
                            stroke="#f59e0b" 
                            strokeWidth={3} 
                            fill="url(#colorHistorical)" 
                            name="Historical"
                            isAnimationActive={false}
                            connectNulls
                          />
                          <Area 
                            type="monotone" 
                            dataKey="forecastPrice" 
                            stroke="#0ea5e9" 
                            strokeWidth={3} 
                            strokeDasharray="5 5"
                            fill="url(#colorForecast)" 
                            name="Forecast"
                            connectNulls
                          />
                          <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="transparent" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center space-y-2">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white">{stock?.symbol} Projection</h4>
                      <p className="text-sm text-slate-500 italic">Historical trend with projected {forecastTimeframe} horizon using {forecastModel === 'arima' ? 'ARIMA (Time Series)' : 'Linear Regression'}.</p>
                    </div>
                  </div>
                )}
                {activeTab === 'AI Recommendation' && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center justify-center space-y-6 py-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative w-64 h-32 bg-slate-100 dark:bg-slate-800 rounded-t-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <motion.div 
                        initial={{ rotate: -90 }}
                        animate={{ rotate: ((stock?.news_gold?.overall_sentiment || 0.5) * 180) - 90 }}
                        transition={{ duration: 1.5, type: 'spring' }}
                        className="absolute bottom-0 left-1/2 -ml-1 w-2 h-24 bg-primary-600 origin-bottom rounded-full z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 opacity-20"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-slate-900 dark:text-white mb-1">{((stock?.news_gold?.overall_sentiment || 0.5) * 100).toFixed(0)}%</div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Market Sentiment Score (Gold Layer)</div>
                    </div>
                    
                    <div className={cn(
                      "px-8 py-4 rounded-3xl text-2xl font-black shadow-lg",
                      stock?.news_gold?.recommendation === 'BUY' ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                      stock?.news_gold?.recommendation === 'SELL' ? "bg-rose-500 text-white shadow-rose-500/20" : 
                      "bg-amber-500 text-white shadow-amber-500/20"
                    )}>
                      GOLD SIGNAL: {stock?.news_gold?.recommendation || 'NEUTRAL'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Sparkles size={16} className="mr-2 text-amber-500" />
                        Gold Insight Summary
                      </h4>
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 leading-relaxed text-slate-700 dark:text-slate-300">
                        {stock?.news_gold?.summary || "No gold analysis available yet. Run the fetcher to process news through the medallion pipeline."}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <FileText size={16} className="mr-2 text-primary-500" />
                        Detailed Gold Reasoning
                      </h4>
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {stock?.news_gold?.reasoning || "Pending analysis..."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
                {activeTab === 'Market News' && (
                  <div className="space-y-6">
                    {stock?.news?.map((item: any, idx: number) => (
                      <a 
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-6 p-6 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-primary-500 transition-all group"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 text-xs font-black text-primary-500 uppercase tracking-wider">
                            {item.publisher}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-slate-400">{new Date(item.providerPublishTime * 1000).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{item.title}</h4>
                          <div className="flex items-center text-xs font-bold text-slate-400">
                            Read more <ChevronRight size={14} className="ml-1" />
                          </div>
                        </div>
                        {item.thumbnail?.resolutions?.[0]?.url && (
                          <img 
                            src={item.thumbnail.resolutions[0].url} 
                            alt="" 
                            className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                          />
                        )}
                      </a>
                    ))}
                    {!stock?.news?.length && (
                      <div className="text-center py-20 text-slate-400 font-bold italic">
                        No recent news found for this stock.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Right Sidebar - Quick Insights */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
              <Sparkles className="mr-3 text-amber-500" />
              AI Insight
            </h3>
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{stock?.symbol} is currently showing {stock?.indicators?.rsi > 60 ? 'strong bullish momentum' : stock?.indicators?.rsi < 40 ? 'potential oversold conditions' : 'a stable consolidation phase'}. 
                  The 3-month forecast suggests a potential {stock?.forecasts['90_days'] > stock?.current_price ? 'upside' : 'correction'} of {Math.abs(((stock?.forecasts['90_days'] - stock?.current_price) / stock?.current_price) * 100).toFixed(1)}%."
                </p>
              </div>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold flex items-center justify-center hover:opacity-90 transition-all"
                >
                  <Download size={18} className="mr-2" />
                  Download Full Report
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-200 transition-all"
                >
                  <TableIcon size={18} className="mr-2" />
                  Export Raw Data (CSV)
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-700"></div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Activity className="mr-3" />
              Decision Signal
            </h3>
            <div className="text-4xl font-black mb-4">
              {stock?.ai_analysis?.recommendation || 'HOLD'}
            </div>
            <p className="text-primary-100 text-sm leading-relaxed mb-6">
              Based on AI news analysis and technical momentum.
            </p>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stock?.sentiment_score * 100}%` }}
                className="h-full bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add to Portfolio Modal */}
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
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-10 border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center">
                <Briefcase className="mr-3 text-primary-500" />
                Add to Portfolio
              </h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Add {stock?.symbol} to one of your existing portfolios.</p>
              
              <form onSubmit={handleAddToPortfolio} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Portfolio</label>
                  <select 
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none dark:text-white font-bold transition-all"
                  >
                    <option value="">Choose a portfolio...</option>
                    {groups?.map((group: any) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quantity</label>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      min="1"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none dark:text-white font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Price</label>
                    <div className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800/50 border border-transparent rounded-2xl text-slate-500 font-bold">
                      {currency}{parseFloat(stock?.current_price).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={addMutation.isPending}
                    className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all disabled:opacity-50"
                  >
                    {addMutation.isPending ? 'Adding...' : 'Add Stock'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OverlayToggle = ({ label, active, onClick, color }: { label: string, active: boolean, onClick: () => void, color: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-xl text-xs font-black flex items-center border transition-all",
      active 
        ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm" 
        : "bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-400"
    )}
  >
    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: active ? color : '#cbd5e1' }}></div>
    {label}
  </button>
);

const MetricCard = ({ label, value }: { label: string, value: string | number }) => (
  <div className="space-y-1">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</div>
  </div>
);

const IndicatorCard = ({ label, value, type }: { label: string, value: string | number, type: string }) => (
  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">{value}</div>
    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={cn(
        "h-full rounded-full",
        type === 'RSI' ? (parseFloat(value as string) > 70 ? 'bg-rose-500' : parseFloat(value as string) < 30 ? 'bg-emerald-500' : 'bg-primary-500') : 'bg-primary-500'
      )} style={{ width: type === 'RSI' ? `${value}%` : '100%' }}></div>
    </div>
  </div>
);

export default StockDetail;
