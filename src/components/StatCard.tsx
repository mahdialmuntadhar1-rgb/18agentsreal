/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color = 'text-blue-600' }) => {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          
          {trend && (
            <div className={`flex items-center space-x-1 text-[10px] font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span className="flex items-center">
                {trend.isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {trend.value}
              </span>
              <span className="text-slate-400 font-medium">vs last sync</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform duration-300 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
