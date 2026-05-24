import { useState, useEffect } from 'react';
import { supabase, TradingRule } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Play, Pause, AlertCircle } from 'lucide-react';
import RuleEditor from './RuleEditor';

export default function RulesTab() {
  const { user } = useAuth();
  const [rules, setRules] = useState<TradingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<TradingRule | null>(null);

  useEffect(() => {
    loadRules();
  }, [user]);

  const loadRules = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('trading_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setRules(data || []);
    setLoading(false);
  };

  const toggleRuleStatus = async (rule: TradingRule) => {
    const { error } = await supabase
      .from('trading_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);

    if (!error) {
      loadRules();
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    const { error } = await supabase
      .from('trading_rules')
      .delete()
      .eq('id', ruleId);

    if (!error) {
      loadRules();
    }
  };

  const handleEdit = (rule: TradingRule) => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleCreateNew = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingRule(null);
    loadRules();
  };

  if (showEditor) {
    return <RuleEditor rule={editingRule} onClose={handleCloseEditor} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trading Rules</h1>
          <p className="text-slate-600 mt-1">Create and manage your trading strategies</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Rule</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No trading rules yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first trading rule to start automated trading
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Rule</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{rule.name}</h3>
                  {rule.description && (
                    <p className="text-sm text-slate-600">{rule.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleRuleStatus(rule)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.is_active
                        ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={rule.is_active ? 'Pause' : 'Activate'}
                  >
                    {rule.is_active ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Symbol:</span>
                  <span className="font-medium text-slate-900">{rule.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Timeframe:</span>
                  <span className="font-medium text-slate-900">{rule.timeframe}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Status:</span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleEdit(rule)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
