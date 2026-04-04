import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { DiscoveryRun } from '../types';
import { useDiscoveryRuns } from '../hooks/useSupabase';

export const DiscoveryRuns: React.FC = () => {
  const { runs } = useDiscoveryRuns();

  const columns: Column<DiscoveryRun>[] = [
    { header: 'ID', accessor: 'id' as const, className: 'font-mono text-xs' },
    { header: 'Governorate', accessor: 'governorate' as const },
    { header: 'Category', accessor: 'category' as const },
    { header: 'Status', accessor: (run: DiscoveryRun) => <StatusBadge status={run.status as any} /> },
    { header: 'Sources', accessor: (run: DiscoveryRun) => run.sourceCount },
    { header: 'Records', accessor: (run: DiscoveryRun) => run.recordsFound },
    { header: 'Started', accessor: 'startedAt' as const },
    { header: 'Completed', accessor: (run: DiscoveryRun) => run.completedAt ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Discovery Runs</h2>
          <p className="text-slate-500">Runtime-backed discovery runs produced by the worker.</p>
        </div>
      </header>

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
        data={runs}
        keyExtractor={(run) => run.id}
      />
    </div>
  );
};
