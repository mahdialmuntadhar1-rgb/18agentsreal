/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { CheckSquare, Square, ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react';
import { BusinessRecord } from '../types';
import { useRecords } from '../hooks/useSupabase';

export const StagingQueue: React.FC = () => {
  const { records, loading, error } = useRecords('STAGED');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'lastUpdated', direction: 'desc' });

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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(r => r.id)));
    }
  };

  const filteredData = useMemo(() => {
    return records
      .filter(record => {
        const matchesSearch = 
          record.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          record.nameAr.toLowerCase().includes(search.toLowerCase()) ||
          record.id.toLowerCase().includes(search.toLowerCase());
        
        const matchesCat = !filters.cat || record.category.toLowerCase() === filters.cat;
        const matchesGov = !filters.gov || record.governorate.toLowerCase() === filters.gov;

        return matchesSearch && matchesCat && matchesGov;
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
  }, [records, search, filters, sortConfig]);

  const columns: Column<BusinessRecord>[] = [
    {
      header: (
        <div className="flex justify-center" onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}>
          {selectedIds.size > 0 && selectedIds.size === filteredData.length ? (
            <CheckSquare className="w-5 h-5 text-blue-600 cursor-pointer" />
          ) : (
            <Square className="w-5 h-5 text-slate-300 cursor-pointer" />
          )}
        </div>
      ),
      headerClassName: 'w-16',
      accessor: (record: BusinessRecord) => (
        <div className="flex justify-center" onClick={(e) => { e.stopPropagation(); toggleSelect(record.id); }}>
          {selectedIds.has(record.id) ? (
            <CheckSquare className="w-5 h-5 text-blue-600 cursor-pointer" />
          ) : (
            <Square className="w-5 h-5 text-slate-300 cursor-pointer" />
          )}
        </div>
      )
    },
    {
      header: 'Business Name',
      sortKey: 'nameEn',
      accessor: (record: BusinessRecord) => (
        <div className="py-1">
          <div className="text-sm font-bold text-slate-900 leading-tight">{record.nameEn}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">{record.id}</div>
        </div>
      )
    },
    { 
      header: 'Category', 
      accessor: (record: BusinessRecord) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
          {record.category}
        </span>
      ),
      sortKey: 'category' 
    },
    {
      header: 'Location',
      sortKey: 'governorate',
      accessor: (record: BusinessRecord) => (
        <div>
          <div className="text-sm font-medium text-slate-900">{record.governorate}</div>
          <div className="text-xs text-slate-500">{record.city}</div>
        </div>
      )
    },
    {
      header: 'Completeness',
      sortKey: 'completenessScore',
      headerClassName: 'text-center',
      accessor: (record: BusinessRecord) => (
        <div className="flex flex-col items-center space-y-1.5">
          <span className={`text-xs font-bold font-mono ${record.completenessScore > 90 ? 'text-emerald-600' : 'text-orange-600'}`}>
            {record.completenessScore}%
          </span>
          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${record.completenessScore > 90 ? 'bg-emerald-500' : 'bg-orange-500'}`} 
              style={{ width: `${record.completenessScore}%` }} 
            />
          </div>
        </div>
      )
    },
    { 
      header: 'Staged Date', 
      accessor: (record: BusinessRecord) => (
        <div className="text-xs text-slate-500 font-mono font-medium">
          {record.lastUpdated ? new Date(record.lastUpdated).toLocaleDateString() : 'N/A'}
        </div>
      ),
      sortKey: 'lastUpdated' 
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      accessor: () => (
        <div className="flex justify-end space-x-2">
          <button className="px-3 py-1.5 text-rose-600 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-all active:scale-95">
            Reject
          </button>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 rounded-lg transition-all active:scale-95 flex items-center">
            Review <ArrowUpRight className="w-3 h-3 ml-1.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading && records.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading staging queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Staging Queue</h2>
          <p className="text-slate-500 text-lg">Cleaned records awaiting final approval before production push.</p>
        </div>
        <button 
          disabled={selectedIds.size === 0}
          className="flex items-center px-8 py-4 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-5 h-5 mr-3" /> Batch Approve Selected
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <FilterBar 
            searchPlaceholder="Search staging queue..."
            onSearchChange={setSearch}
            filters={[
              { id: 'gov', label: 'All Governorates', options: [
                { value: 'baghdad', label: 'Baghdad' },
                { value: 'basra', label: 'Basra' },
                { value: 'najaf', label: 'Najaf' },
                { value: 'erbil', label: 'Erbil' }
              ] },
              { id: 'cat', label: 'All Categories', options: [
                { value: 'restaurants', label: 'Restaurants' }, 
                { value: 'hotels', label: 'Hotels' },
                { value: 'pharmacies', label: 'Pharmacies' },
                { value: 'retail', label: 'Retail' }
              ] }
            ]}
            onFilterChange={(id, val) => setFilters(prev => ({ ...prev, [id]: val }))}
          />
        </div>

        <DataTable 
          columns={columns} 
          data={filteredData} 
          keyExtractor={(r) => r.id}
          dense
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-8 duration-300">
          <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Batch Approval Ready</p>
                <p className="text-xs text-slate-400">You have <strong>{selectedIds.size}</strong> records selected for production push.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-5 py-2.5 text-slate-400 text-xs font-bold hover:text-white transition-colors"
              >
                Clear Selection
              </button>
              <button className="px-6 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95">
                Approve Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
