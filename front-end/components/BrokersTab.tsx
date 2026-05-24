import { useState, useEffect } from 'react';
import { supabase, BrokerConnection } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

const BROKERS = [
  { id: 'dhan', name: 'Dhan', color: 'blue' },
  { id: 'zerodha', name: 'Zerodha', color: 'emerald' },
  { id: 'upstox', name: 'Upstox', color: 'violet' },
  { id: 'angel_one', name: 'Angel One', color: 'red' },
];

export default function BrokersTab() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('user_id', user.id);

    setConnections(data || []);
    setLoading(false);
  };

  const handleAddConnection = async () => {
    if (!user) return;

    setError('');
    setSaving(true);

    try {
      const { error } = await supabase.from('broker_connections').insert([
        {
          user_id: user.id,
          broker_name: selectedBroker as 'dhan' | 'zerodha' | 'upstox' | 'angel_one',
          api_key: apiKey,
          api_secret: apiSecret,
          is_active: false,
        },
      ]);

      if (error) throw error;

      setShowForm(false);
      setSelectedBroker('');
      setApiKey('');
      setApiSecret('');
      loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add connection');
    } finally {
      setSaving(false);
    }
  };

  const toggleConnection = async (connection: BrokerConnection) => {
    const { error } = await supabase
      .from('broker_connections')
      .update({ is_active: !connection.is_active })
      .eq('id', connection.id);

    if (!error) {
      loadConnections();
    }
  };

  const deleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this broker connection?')) return;

    const { error } = await supabase
      .from('broker_connections')
      .delete()
      .eq('id', connectionId);

    if (!error) {
      loadConnections();
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Broker Integrations</h1>
          <p className="text-slate-600 mt-1">Connect your trading accounts</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Broker</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Add Broker Connection</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Broker
              </label>
              <select
                value={selectedBroker}
                onChange={(e) => setSelectedBroker(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Choose a broker...</option>
                {BROKERS.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your API key"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your API secret"
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setSelectedBroker('');
                  setApiKey('');
                  setApiSecret('');
                }}
                className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddConnection}
                disabled={saving || !selectedBroker || !apiKey || !apiSecret}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Connection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {connections.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Link className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No broker connections</h3>
          <p className="text-slate-600 mb-6">
            Connect a broker to enable real trading
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Broker</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connections.map((connection) => {
            const broker = BROKERS.find((b) => b.id === connection.broker_name);
            return (
              <div
                key={connection.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{broker?.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      API Key: {connection.api_key.substring(0, 8)}...
                    </p>
                  </div>
                  {connection.is_active ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Status:</span>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        connection.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {connection.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Added:</span>
                    <span className="text-slate-900">
                      {new Date(connection.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => toggleConnection(connection)}
                    className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {connection.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteConnection(connection.id)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
