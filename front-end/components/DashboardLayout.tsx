import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, LogOut, LayoutDashboard, FileText, Settings, Link } from 'lucide-react';

type DashboardLayoutProps = {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rules', label: 'Trading Rules', icon: FileText },
    { id: 'brokers', label: 'Brokers', icon: Link },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TradingBot</span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 hidden sm:inline">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
