/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { RefreshCw } from 'lucide-react';
import { AgentJob } from '../types';
import { useActiveJobs } from '../hooks/useSupabase';

export const ActiveJobs: React.FC = () => {
  const { jobs, loading } = useActiveJobs();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'recordsFound', direction: 'desc' });

  const displayJobs = jobs.map((job: any) => ({
    ...job,
    agentName: job.assigned_agent_id || 'unassigned',
    status: String(job.status || 'queued').toUpperCase(),
    progress: job.status === 'completed' ? 100 : job.status === 'running' ? 50 : 0,
    recordsFound: job.records_found ?? 0,
    lastUpdated: job.last_heartbeat_at ?? job.started_at ?? '-',
    errorCount: job.failure_reason ? 1 : 0,
  }));

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredData = displayJobs
    .filter(job => {
      const matchesSearch = 
        job.agentName.toLowerCase().includes(search.toLowerCase()) ||
        job.city.toLowerCase().includes(search.toLowerCase()) ||
        job.governorate.toLowerCase().includes(search.toLowerCase());
      
      const matchesGov = !filters.gov || job.governorate.toLowerCase() === filters.gov;
      const matchesStatus = !filters.status || job.status.toLowerCase() === filters.status;

      return matchesSearch && matchesGov && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const valA = a[key as keyof AgentJob] ?? '';
      const valB = b[key as keyof AgentJob] ?? '';
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const columns: Column<AgentJob>[] = [
    {
      header: 'Agent ID',
      sortKey: 'agentName',
      accessor: (job: AgentJob) => (
        <span className="font-mono text-xs font-bold text-slate-900">{job.agentName}</span>
      )
    },
    {
      header: 'Location / Category',
      sortKey: 'governorate',
      accessor: (job: AgentJob) => (
        <div>
          <div className="text-sm font-bold text-slate-900">{job.governorate}, {job.city}</div>
          <div className="text-xs text-slate-500">{job.category}</div>
        </div>
      )
    },
    {
      header: 'Status',
      sortKey: 'status',
      headerClassName: 'text-center',
      accessor: (job: AgentJob) => (
        <div className="text-center">
          <StatusBadge status={job.status} />
        </div>
      )
    },
    {
      header: 'Progress',
      sortKey: 'progress',
      accessor: (job: AgentJob) => (
        <div className="w-32">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                job.status === 'FAILED' ? 'bg-red-500' : 
                job.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} 
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">{job.progress}%</div>
        </div>
      )
    },
    {
      header: 'Records',
      sortKey: 'recordsFound',
      accessor: (job: AgentJob) => (
        <span className="text-sm font-mono text-slate-600">{job.recordsFound.toLocaleString()}</span>
      )
    },
    {
      header: 'Errors',
      sortKey: 'errorCount',
      accessor: (job: AgentJob) => (
        <span className={`text-sm font-mono ${job.errorCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
          {job.errorCount}
        </span>
      )
    },
    { header: 'Last Updated', accessor: 'lastUpdated' as const, className: 'text-xs text-slate-500' },
    {
      header: 'Actions',
      accessor: () => (
        <button className="text-blue-600 text-xs font-bold hover:underline">Details</button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Jobs</h2>
          <p className="text-slate-500">Monitor and manage agent data collection runs.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </button>
      </header>

      <FilterBar 
        searchPlaceholder="Search by agent, city..."
        onSearchChange={setSearch}
        filters={[
          { id: 'gov', label: 'All Governorates', options: [
            { value: 'baghdad', label: 'Baghdad' }, 
            { value: 'basra', label: 'Basra' },
            { value: 'erbil', label: 'Erbil' },
            { value: 'nineveh', label: 'Nineveh' }
          ] },
          { id: 'status', label: 'All Statuses', options: [
            { value: 'running', label: 'Running' }, 
            { value: 'failed', label: 'Failed' },
            { value: 'completed', label: 'Completed' },
            { value: 'waiting', label: 'Waiting' }
          ] }
        ]}
        onFilterChange={(id, val) => setFilters(prev => ({ ...prev, [id]: val }))}
      />

      <DataTable 
        columns={columns} 
        data={filteredData} 
        keyExtractor={(j) => j.id}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  );
};
