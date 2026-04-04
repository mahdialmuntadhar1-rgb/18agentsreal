/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: {
    id: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  onFilterChange?: (id: string, value: string) => void;
  showConfidenceSlider?: boolean;
  onConfidenceChange?: (value: number) => void;
  confidenceValue?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  searchPlaceholder = "Search...", 
  onSearchChange,
  filters = [],
  onFilterChange,
  showConfidenceSlider = false,
  onConfidenceChange,
  confidenceValue = 0
}) => {
  return (
    <div className="bg-white p-4 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder={searchPlaceholder} 
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>
      
      {filters.map((filter) => (
        <select 
          key={filter.id}
          onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {showConfidenceSlider && (
        <div className="flex items-center space-x-2 border-l pl-4 border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase">Min Confidence:</span>
          <input 
            type="range" 
            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
            min="0" 
            max="100" 
            value={confidenceValue}
            onChange={(e) => onConfidenceChange?.(parseInt(e.target.value))}
          />
          <span className="text-xs font-mono font-bold text-blue-600 w-8">{confidenceValue}%</span>
        </div>
      )}

      <button className="p-2 border border-slate-200 rounded hover:bg-slate-50">
        <Filter className="w-4 h-4 text-slate-600" />
      </button>
    </div>
  );
};
