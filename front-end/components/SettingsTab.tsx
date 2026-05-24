import { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, User } from 'lucide-react';

export default function SettingsTab() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      setMessage('Failed to update profile');
    } else {
      setMessage('Profile updated successfully');
      loadProfile();
    }

    setSaving(false);
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-emerald-100 p-3 rounded-full">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            message.includes('success')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
              disabled
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Account Created:</span>
            <span className="text-slate-900 font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-600">User ID:</span>
            <span className="text-slate-900 font-mono text-xs">
              {user?.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
