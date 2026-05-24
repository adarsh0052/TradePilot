import { useState, useEffect } from 'react';
import { supabase, TradingRule } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

type RuleEditorProps = {
  rule: TradingRule | null;
  onClose: () => void;
};

export default function RuleEditor({ rule, onClose }: RuleEditorProps) {
  const { user } = useAuth();
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [symbol, setSymbol] = useState(rule?.symbol || 'NIFTY');
  const [timeframe, setTimeframe] = useState(rule?.timeframe || '5m');
  const [indicators, setIndicators] = useState(rule?.indicators ? JSON.stringify(rule.indicators, null, 2) : '[]');
  const [entryConditions, setEntryConditions] = useState(
    rule?.entry_conditions ? JSON.stringify(rule.entry_conditions, null, 2) : '{}'
  );
  const [exitConditions, setExitConditions] = useState(
    rule?.exit_conditions ? JSON.stringify(rule.exit_conditions, null, 2) : '{}'
  );
  const [riskSettings, setRiskSettings] = useState(
    rule?.risk_settings ? JSON.stringify(rule.risk_settings, null, 2) : '{"stopLoss": 1, "takeProfit": 2, "positionSize": 1}'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const parsedIndicators = JSON.parse(indicators);
      const parsedEntry = JSON.parse(entryConditions);
      const parsedExit = JSON.parse(exitConditions);
      const parsedRisk = JSON.parse(riskSettings);

      const ruleData = {
        user_id: user.id,
        name,
        description,
        symbol,
        timeframe,
        indicators: parsedIndicators,
        entry_conditions: parsedEntry,
        exit_conditions: parsedExit,
        risk_settings: parsedRisk,
      };

      if (rule) {
        const { error } = await supabase
          .from('trading_rules')
          .update(ruleData)
          .eq('id', rule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trading_rules')
          .insert([ruleData]);

        if (error) throw error;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {rule ? 'Edit Rule' : 'Create New Rule'}
          </h1>
          <p className="text-slate-600 mt-1">Define your trading strategy</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., RSI Oversold Strategy"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Symbol
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="NIFTY">NIFTY</option>
                <option value="BANKNIFTY">BANKNIFTY</option>
                <option value="FINNIFTY">FINNIFTY</option>
                <option value="SENSEX">SENSEX</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={2}
              placeholder="Brief description of your strategy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Indicators (JSON Array)
            </label>
            <textarea
              value={indicators}
              onChange={(e) => setIndicators(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder='[{"name": "RSI", "period": 14}, {"name": "EMA", "period": 20}]'
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Entry Conditions (JSON)
              </label>
              <textarea
                value={entryConditions}
                onChange={(e) => setEntryConditions(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                rows={6}
                placeholder='{"RSI": {"operator": "<", "value": 30}}'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Exit Conditions (JSON)
              </label>
              <textarea
                value={exitConditions}
                onChange={(e) => setExitConditions(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                rows={6}
                placeholder='{"RSI": {"operator": ">", "value": 70}}'
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Risk Settings (JSON)
            </label>
            <textarea
              value={riskSettings}
              onChange={(e) => setRiskSettings(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder='{"stopLoss": 1, "takeProfit": 2, "positionSize": 1}'
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !name}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Rule'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
