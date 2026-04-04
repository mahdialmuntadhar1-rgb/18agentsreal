/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

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

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color = 'text-blue-500' }) => {
  return (
    <div className="bg-white p-6 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value} <span className="text-slate-400 font-normal ml-1">vs last period</span>
            </p>
          )}
        </div>
        <div className={`p-2 bg-slate-50 rounded ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
