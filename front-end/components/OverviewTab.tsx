import { useState, useEffect } from 'react';
import { supabase, Trade, PerformanceMetrics } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Play, Pause } from 'lucide-react';
import PriceChart from './PriceChart';

export default function OverviewTab() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradingMode, setTradingMode] = useState<'simulated' | 'real'>('simulated');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const { data: tradesData } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_time', { ascending: false })
      .limit(10);

    const today = new Date().toISOString().split('T')[0];
    const { data: metricsData } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    setTrades(tradesData || []);
    setMetrics(metricsData);
    setLoading(false);
  };

  const totalPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
  const openTrades = trades.filter(t => t.status === 'open').length;
  const closedTrades = trades.filter(t => t.status === 'closed').length;
  const winRate = metrics?.win_rate || 0;

  const statCards = [
    {
      title: 'Total P&L',
      value: `₹${totalPnl.toFixed(2)}`,
      change: totalPnl >= 0 ? '+' : '',
      icon: DollarSign,
      color: totalPnl >= 0 ? 'emerald' : 'red',
    },
    {
      title: 'Open Trades',
      value: openTrades.toString(),
      icon: Activity,
      color: 'blue',
    },
    {
      title: 'Closed Trades',
      value: closedTrades.toString(),
      icon: BarChart3,
      color: 'slate',
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'emerald',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor your trading performance</p>
        </div>

        <div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setTradingMode('simulated')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              tradingMode === 'simulated'
                ? 'bg-blue-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pause className="w-4 h-4" />
            <span className="font-medium">Simulated</span>
          </button>
          <button
            onClick={() => setTradingMode('real')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              tradingMode === 'real'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Play className="w-4 h-4" />
            <span className="font-medium">Real</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${card.color}-50`}>
                  <Icon className={`w-6 h-6 text-${card.color}-500`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">{card.title}</h3>
              <p className={`text-2xl font-bold text-${card.color}-600`}>
                {card.change}{card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Market Overview</h2>
          <span className="text-sm text-slate-500">NIFTY 50 - 1D</span>
        </div>
        <PriceChart />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Recent Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No trades yet. Create a trading rule to get started!
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{trade.symbol}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.trade_type === 'buy' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.trade_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">₹{Number(trade.entry_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {trade.exit_price ? `₹${Number(trade.exit_price).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`flex items-center ${Number(trade.pnl) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Number(trade.pnl) >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        ₹{Math.abs(Number(trade.pnl)).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.status === 'open'
                          ? 'bg-blue-100 text-blue-800'
                          : trade.status === 'closed'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
