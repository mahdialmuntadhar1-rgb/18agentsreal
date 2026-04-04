import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { DiscoveryRun } from '../types';
import { useDiscoveryRuns } from '../hooks/useSupabase';

export const DiscoveryRuns: React.FC = () => {
  const { runs, loading } = useDiscoveryRuns();

  const columns: Column<DiscoveryRun>[] = [
    { header: 'Job ID', accessor: 'id', className: 'font-mono text-xs' },
    { header: 'Governorate', accessor: 'governorate' },
    { header: 'Category', accessor: 'category' },
    { header: 'Status', accessor: (run) => <StatusBadge status={run.status as any} /> },
    { header: 'Records', accessor: (run) => run.recordsFound },
    { header: 'Started', accessor: 'startedAt' },
    { header: 'Completed', accessor: (run) => run.completedAt ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Discovery Runs</h2>
        <p className="text-slate-500">Derived directly from jobs + job_results tables.</p>
      </header>

      <FilterBar onSearchChange={() => {}} onFilterChange={() => {}} filters={[]} />

      {loading ? (
        <div className="text-slate-500 text-sm">Loading runs...</div>
      ) : (
        <DataTable columns={columns} data={runs} keyExtractor={(run) => run.id} />
      )}
    </div>
  );
};
