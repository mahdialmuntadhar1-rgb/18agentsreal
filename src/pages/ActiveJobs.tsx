/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { RefreshCw, Loader2 } from 'lucide-react';
import { AgentJob } from '../types';
import { useActiveJobs } from '../hooks/useSupabase';

const MOCK_JOBS: AgentJob[] = [
  { id: '1', agentName: 'Agent-Alpha', governorate: 'Baghdad', city: 'Karkh', category: 'Restaurants', status: 'RUNNING', progress: 65, recordsFound: 420, lastUpdated: '2 mins ago', errorCount: 0 },
  { id: '2', agentName: 'Agent-Beta', governorate: 'Erbil', city: 'Ankawa', category: 'Hotels', status: 'RUNNING', progress: 88, recordsFound: 156, lastUpdated: 'Just now', errorCount: 1 },
  { id: '3', agentName: 'Agent-Gamma', governorate: 'Basra', city: 'Zubair', category: 'Pharmacies', status: 'WAITING', progress: 0, recordsFound: 0, lastUpdated: '15 mins ago', errorCount: 0 },
  { id: '4', agentName: 'Agent-Delta', governorate: 'Nineveh', city: 'Mosul', category: 'Retail', status: 'COMPLETED', progress: 100, recordsFound: 1240, lastUpdated: '1h ago', errorCount: 4 },
  { id: '5', agentName: 'Agent-Epsilon', governorate: 'Dohuk', city: 'Zakho', category: 'Tourism', status: 'FAILED', progress: 42, recordsFound: 120, lastUpdated: '3h ago', errorCount: 12 },
  { id: '6', agentName: 'Agent-Zeta', governorate: 'Najaf', city: 'Kufa', category: 'Medical', status: 'COMPLETED', progress: 100, recordsFound: 890, lastUpdated: '8h ago', errorCount: 0 },
];

export const ActiveJobs: React.FC = () => {
  const { jobs, loading } = useActiveJobs();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'recordsFound', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredData = useMemo(() => {
    return jobs
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
  }, [jobs, search, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const columns: Column<AgentJob>[] = [
    {
      header: 'Agent Identity',
      sortKey: 'agentName',
      accessor: (job: AgentJob) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs">
            {job.agentName.charAt(0)}
          </div>
          <span className="font-mono text-xs font-bold text-slate-900">{job.agentName}</span>
        </div>
      )
    },
    {
      header: 'Operational Zone',
      sortKey: 'governorate',
      accessor: (job: AgentJob) => (
        <div>
          <div className="text-sm font-bold text-slate-900">{job.governorate}</div>
          <div className="text-xs text-slate-500">{job.city} • {job.category}</div>
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
        <div className="w-40">
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                job.status === 'FAILED' ? 'bg-rose-500' : 
                job.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600'
              }`} 
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[10px] text-slate-400 font-mono font-bold">{job.progress}%</span>
            <span className="text-[10px] text-slate-400 font-medium italic">
              {job.status === 'RUNNING' ? 'Syncing...' : 'Idle'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Yield',
      sortKey: 'recordsFound',
      accessor: (job: AgentJob) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 font-mono">{job.recordsFound.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Records</span>
        </div>
      )
    },
    {
      header: 'Health',
      sortKey: 'errorCount',
      accessor: (job: AgentJob) => (
        <div className="flex items-center space-x-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${job.errorCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className={`text-xs font-mono font-bold ${job.errorCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {job.errorCount} errors
          </span>
        </div>
      )
    },
    { 
      header: 'Last Sync', 
      accessor: (job: AgentJob) => (
        <span className="text-[10px] font-mono text-slate-500 uppercase">{job.lastUpdated}</span>
      )
    },
    {
      header: 'Control',
      accessor: () => (
        <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
          MANAGE
        </button>
      )
    }
  ];

  if (loading && jobs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Retrieving active pipeline status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Active Jobs</h2>
          <p className="text-slate-500 text-lg">Monitor and manage real-time agent data collection runs.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Active</span>
              <span className="text-lg font-bold text-slate-900 leading-none">{jobs.filter(j => j.status === 'RUNNING').length}</span>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Failed</span>
              <span className="text-lg font-bold text-rose-600 leading-none">{jobs.filter(j => j.status === 'FAILED').length}</span>
            </div>
          </div>
          <button className="flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95">
            <RefreshCw className="w-4 h-4 mr-2" />
            Force Sync
          </button>
        </div>
      </header>

      <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
        <FilterBar 
          searchPlaceholder="Search by agent identity, city, or governorate..."
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
          onFilterChange={(id, val) => {
            setFilters(prev => ({ ...prev, [id]: val }));
            setCurrentPage(1);
          }}
        />
      </div>

      <DataTable 
        columns={columns} 
        data={paginatedData} 
        keyExtractor={(j) => j.id}
        sortConfig={sortConfig}
        onSort={handleSort}
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredData.length / pageSize),
          onPageChange: setCurrentPage,
          pageSize,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          totalCount: filteredData.length
        }}
      />
    </div>
  );
};
