import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  Terminal,
  Menu,
  X
} from 'lucide-react';
import Overview from './pages/Overview';
import DiscoveryFeed from './pages/DiscoveryFeed';
import CommandCenter from './pages/CommandCenter';
import ApprovalHub from './pages/ApprovalHub';
import QC from './pages/QC';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'discovery', label: 'Discovery', icon: Search },
    { id: 'command', label: 'Command', icon: Terminal },
    { id: 'approval', label: 'Approval', icon: CheckSquare },
    { id: 'qc', label: 'QC', icon: AlertTriangle },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'discovery':
        return <DiscoveryFeed />;
      case 'command':
        return <CommandCenter />;
      case 'approval':
        return <ApprovalHub />;
      case 'qc':
        return <QC />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1B2B5E] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center">
                <Users size={20} className="text-[#1B2B5E]" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">SKYHIGH</h1>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">18-AGENTS</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-[#C9A84C] text-[#1B2B5E]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="text-[10px] text-white/40 font-medium">
              v1.0.0 • {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1B2B5E] rounded-lg flex items-center justify-center">
              <Users size={16} className="text-[#C9A84C]" />
            </div>
            <h1 className="font-black text-[#1B2B5E]">SKYHIGH</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
