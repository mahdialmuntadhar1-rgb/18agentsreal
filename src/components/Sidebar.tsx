/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Activity,
  LayoutDashboard, 
  Database, 
  Wand2, 
  Layers, 
  SendHorizontal,
  Terminal
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'scraper', label: 'Operator Command', icon: Activity },
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'records', label: 'Collected Records', icon: Database },
  { id: 'cleaning', label: 'Cleaning Workspace', icon: Wand2 },
  { id: 'staging', label: 'Staging Queue', icon: Layers },
  { id: 'push', label: 'Push Control', icon: SendHorizontal },
  { id: 'logs', label: 'Logs & Events', icon: Terminal },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  return (
    <div className="w-72 bg-slate-950 text-slate-400 flex flex-col h-screen border-r border-slate-800/50 relative z-50">
      <div className="p-8 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter leading-none">IQ DATA OPS</h1>
            <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-[0.3em] font-bold">Control Center</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-blue-600/10 text-white shadow-sm' 
                  : 'hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 mr-4 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-8 border-t border-slate-800/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">System Live</p>
              <p className="text-[9px] text-slate-500 font-mono">v1.0.4-stable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
