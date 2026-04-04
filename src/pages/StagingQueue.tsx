/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { CheckSquare, Square, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { BusinessRecord } from '../types';
import { useRecords } from '../hooks/useSupabase';

export const StagingQueue: React.FC = () => {
  const { records, loading } = useRecords('STAGED');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'lastUpdated', direction: 'desc' });

  const displayRecords = records;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredData = displayRecords
    .filter(record => {
      const matchesSearch = 
        record.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        record.id.toLowerCase().includes(search.toLowerCase());
      
      const matchesCat = !filters.cat || record.category.toLowerCase() === filters.cat;

      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const valA = a[key as keyof BusinessRecord] ?? '';
      const valB = b[key as keyof BusinessRecord] ?? '';
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const columns: Column<BusinessRecord>[] = [
    {
      header: '',
      headerClassName: 'w-12',
      accessor: (record: BusinessRecord) => (
        <div className="flex justify-center" onClick={(e) => { e.stopPropagation(); toggleSelect(record.id); }}>
          {selectedIds.has(record.id) ? (
            <CheckSquare className="w-4 h-4 text-blue-600 cursor-pointer" />
          ) : (
            <Square className="w-4 h-4 text-slate-300 cursor-pointer" />
          )}
        </div>
      )
    },
    {
      header: 'Business Name',
      sortKey: 'nameEn',
      accessor: (record: BusinessRecord) => (
        <div>
          <div className="text-sm font-bold text-slate-900">{record.nameEn}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{record.id}</div>
        </div>
      )
    },
    { header: 'Category', accessor: 'category' as const, sortKey: 'category', className: 'text-sm text-slate-600' },
    {
      header: 'Location',
      sortKey: 'governorate',
      accessor: (record: BusinessRecord) => (
        <div>
          <div className="text-sm text-slate-900">{record.governorate}</div>
          <div className="text-xs text-slate-500">{record.city}</div>
        </div>
      )
    },
    {
      header: 'Completeness',
      sortKey: 'completenessScore',
      headerClassName: 'text-center',
      accessor: (record: BusinessRecord) => (
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-emerald-600 font-mono">{record.completenessScore}%</span>
          <div className="w-16 bg-slate-100 h-1 rounded-full mt-1">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${record.completenessScore}%` }} />
          </div>
        </div>
      )
    },
    { header: 'Staged Date', accessor: 'lastUpdated' as const, sortKey: 'lastUpdated', className: 'text-xs text-slate-500 font-mono' },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      accessor: () => (
        <div className="flex justify-end space-x-3">
          <button className="text-rose-600 text-xs font-bold hover:underline">Reject</button>
          <button className="text-blue-600 text-xs font-bold hover:underline flex items-center">
            Review <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staging Queue</h2>
          <p className="text-slate-500">Cleaned records awaiting final approval before production push.</p>
        </div>
        <button className="flex items-center px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
          <CheckCircle2 className="w-4 h-4 mr-2" /> Batch Approve Selected
        </button>
      </header>

      <FilterBar 
        searchPlaceholder="Search staging queue..."
        onSearchChange={setSearch}
        filters={[
          { id: 'cat', label: 'All Categories', options: [
            { value: 'restaurants', label: 'Restaurants' }, 
            { value: 'hotels', label: 'Hotels' },
            { value: 'pharmacies', label: 'Pharmacies' },
            { value: 'retail', label: 'Retail' }
          ] }
        ]}
        onFilterChange={(id, val) => setFilters(prev => ({ ...prev, [id]: val }))}
      />

      <DataTable 
        columns={columns} 
        data={filteredData} 
        keyExtractor={(r) => r.id}
        dense
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
        <div className="flex items-center text-blue-800 text-sm">
          <CheckCircle2 className="w-5 h-5 mr-3 text-blue-600" />
          <span>You have <strong>{selectedIds.size}</strong> records selected for approval. These will move to the Push Control queue.</span>
        </div>
      </div>
    </div>
  );
};
