import React, { useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { DiscoveryRun } from '../types';
import { Play, Search, MapPin, Tag } from 'lucide-react';
import { useDiscoveryRuns } from '../hooks/useSupabase';

const MOCK_DISCOVERY_RUNS: DiscoveryRun[] = [
  {
    id: 'DR-001',
    governorate: 'Baghdad',
    category: 'Restaurants',
    status: 'COMPLETED',
    sourceCount: 45,
    recordsFound: 1240,
    startedAt: '2024-03-20 10:00',
    completedAt: '2024-03-20 11:30'
  },
  {
    id: 'DR-002',
    governorate: 'Basra',
    category: 'Industrial',
    status: 'FAILED',
    sourceCount: 12,
    recordsFound: 0,
    startedAt: '2024-03-20 14:00',
    completedAt: '2024-03-20 14:15'
  },
  {
    id: 'DR-003',
    governorate: 'Erbil',
    category: 'Hotels',
    status: 'RUNNING',
    sourceCount: 30,
    recordsFound: 156,
    startedAt: '2024-03-21 09:00'
  }
];

export const DiscoveryRuns: React.FC = () => {
  const { runs, loading } = useDiscoveryRuns();
  const displayRuns = runs.length > 0 ? runs : MOCK_DISCOVERY_RUNS;

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
          <div className="text-2xl font-bold text-slate-900">128</div>
        </div>
        <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Governorates Covered</span>
          18/18
          </div>
          <div className="text-2xl font-bold text-slate-900">100%</div>
        </div>
        <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
          <div className="flex items-center text-slate-500 mb-2">
            <Tag className="w-4 h-4 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">Active Categories</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">24</div>
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
