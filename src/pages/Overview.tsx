import React from 'react';
import { LayoutDashboard, TrendingUp, Users, Map } from 'lucide-react';

export default function Overview() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gold uppercase tracking-widest">System Overview</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Nationwide Directory Status</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Records', value: '74,049', icon: <Database className="text-blue-400" /> },
          { label: 'Verified', value: '52,120', icon: <CheckCircle className="text-green-400" /> },
          { label: 'Pending QC', value: '12,430', icon: <AlertTriangle className="text-orange-400" /> },
          { label: 'Active Agents', value: '6', icon: <Bot className="text-purple-400" /> }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-gold/10 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              {stat.icon}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-gold/10 rounded-xl p-6 h-[400px] flex items-center justify-center text-slate-600 italic">
          [Governorate Distribution Map Placeholder]
        </div>
        <div className="bg-white/5 border border-gold/10 rounded-xl p-6 h-[400px] flex items-center justify-center text-slate-600 italic">
          [Growth Trends Chart Placeholder]
        </div>
      </div>
    </div>
  );
}

import { Database, CheckCircle, AlertTriangle, Bot } from 'lucide-react';
