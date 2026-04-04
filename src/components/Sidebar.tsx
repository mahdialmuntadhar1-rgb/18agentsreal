/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Database, 
  Wand2, 
  Layers, 
  SendHorizontal 
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'jobs', label: 'Active Jobs', icon: PlayCircle },
  { id: 'records', label: 'Collected Records', icon: Database },
  { id: 'cleaning', label: 'Cleaning Workspace', icon: Wand2 },
  { id: 'staging', label: 'Staging Queue', icon: Layers },
  { id: 'push', label: 'Push Control', icon: SendHorizontal },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  return (
    <div className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">IQ DATA OPS</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono">Command Center</p>
      </div>
      
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-slate-900 text-white border-r-2 border-blue-500' 
                  : 'hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-800 text-xs text-slate-600 font-mono">
        v1.0.4-stable
      </div>
    </div>
  );
};
