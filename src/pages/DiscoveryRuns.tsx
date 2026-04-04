import React, { useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { DiscoveryRun } from '../types';
import { Play, Search, MapPin, Tag } from 'lucide-react';
import { useDiscoveryRuns } from '../hooks/useSupabase';

export const DiscoveryRuns: React.FC = () => {
  const { runs, loading } = useDiscoveryRuns();
  const displayRuns = runs;
  const coveredGovernorates = new Set(runs.map((r: any) => r.governorate)).size;
  const activeCategories = new Set(runs.map((r: any) => r.category)).size;

  const columns: Column<DiscoveryRun>[] = [
    { header: 'ID', accessor: 'id' as const, className: 'font-mono text-xs' },
    { header: 'Governorate', accessor: 'governorate' as const },
    { header: 'Category', accessor: 'category' as const },
    { 
      header: 'Status', 
      accessor: (run: DiscoveryRun) => <StatusBadge status={run.status as any} />
    },
    { header: 'Sources', accessor: (run: DiscoveryRun) => run.sourceCount },
    { header: 'Records', accessor: (run: DiscoveryRun) => run.recordsFound },
    { header: 'Started', accessor: 'startedAt' as const },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Discovery Runs</h2>
          <p className="text-slate-500">Launch and monitor automated data discovery pipelines.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center hover:bg-blue-700 transition-colors">
          <Play className="w-4 h-4 mr-2 fill-current" />
          New Discovery Run
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <Search className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Runs</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{runs.length}</div>
        </div>
        <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Governorates Covered</span>
          {coveredGovernorates}/18
          </div>
          <div className="text-2xl font-bold text-slate-900">{Math.round((coveredGovernorates / 18) * 100) || 0}%</div>
        </div>
        <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <Tag className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Active Categories</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeCategories}</div>
        </div>
      </div>

      <FilterBar 
        onSearch={() => {}} 
        onFilterChange={() => {}} 
        filters={[
          { id: 'gov', label: 'Governorate', options: ['Baghdad', 'Basra', 'Erbil'] },
          { id: 'cat', label: 'Category', options: ['Restaurants', 'Hotels', 'Industrial'] }
        ]}
      />

      <DataTable 
        columns={columns} 
        data={displayRuns} 
        keyExtractor={(run) => run.id}
        onRowClick={(run) => console.log('Run clicked:', run)}
      />
    </div>
  );
};
