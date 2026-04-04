/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { SidePanel } from '../components/SidePanel';
import { Download, Phone, MessageSquare, MapPin, Tag, Calendar, CheckCircle2, AlertTriangle, Database, Loader2, AlertCircle } from 'lucide-react';
import { BusinessRecord } from '../types';
import { useRecords } from '../hooks/useSupabase';

export const CollectedRecords: React.FC = () => {
  const { records, loading, error } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState<BusinessRecord | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'lastUpdated', direction: 'desc' });
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
    return records
      .filter(record => {
        const matchesSearch = 
          record.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          record.nameAr.toLowerCase().includes(search.toLowerCase()) ||
          record.id.toLowerCase().includes(search.toLowerCase()) ||
          (record.phone || '').includes(search);
        
        const matchesGov = !filters.gov || record.governorate.toLowerCase() === filters.gov;
        const matchesStatus = !filters.status || record.status.toLowerCase() === filters.status;
        const matchesConfidence = record.completenessScore >= confidence;

        return matchesSearch && matchesGov && matchesStatus && matchesConfidence;
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
  }, [records, search, filters, confidence, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const columns: Column<BusinessRecord>[] = [
    {
      header: 'Business Identity',
      sortKey: 'nameEn',
      accessor: (record: BusinessRecord) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">{record.nameEn}</div>
            <div className="text-xs text-slate-500 font-medium leading-tight">{record.nameAr}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">{record.id}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Category', 
      accessor: (record: BusinessRecord) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
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
          <div className="text-sm font-bold text-slate-900">{record.governorate}</div>
          <div className="text-xs text-slate-500">{record.city}</div>
        </div>
      )
    },
    {
      header: 'Contact Details',
      accessor: (record: BusinessRecord) => (
        <div className="space-y-1">
          <div className="flex items-center text-xs text-slate-600 font-mono">
            <Phone className="w-3 h-3 mr-1.5 text-slate-300" /> {record.phone || 'N/A'}
          </div>
          {record.whatsapp && (
            <div className="flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              <MessageSquare className="w-3 h-3 mr-1.5" /> WhatsApp Active
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Confidence',
      sortKey: 'completenessScore',
      headerClassName: 'text-center',
      accessor: (record: BusinessRecord) => (
        <div className="flex flex-col items-center space-y-1">
          <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                record.completenessScore >= 90 ? 'bg-emerald-500' :
                record.completenessScore >= 70 ? 'bg-blue-500' : 'bg-rose-500'
              }`}
              style={{ width: `${record.completenessScore}%` }}
            />
          </div>
          <span className={`text-[10px] font-bold font-mono ${
            record.completenessScore >= 90 ? 'text-emerald-600' :
            record.completenessScore >= 70 ? 'text-blue-600' : 'text-rose-600'
          }`}>
            {record.completenessScore}%
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      sortKey: 'status',
      headerClassName: 'text-center',
      accessor: (record: BusinessRecord) => (
        <div className="text-center">
          <StatusBadge status={record.status} />
        </div>
      )
    },
    { 
      header: 'Last Sync', 
      accessor: (record: BusinessRecord) => (
        <span className="text-[10px] text-slate-400 font-mono uppercase">{record.lastUpdated}</span>
      ), 
      sortKey: 'lastUpdated' 
    }
  ];

  if (loading && records.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading business directory...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full max-w-7xl mx-auto pb-12">
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Collected Records</h2>
            <p className="text-slate-500 text-lg">Browse and inspect all business data collected by agents.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-5 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <Download className="w-4 h-4 mr-2" />
              Export Directory
            </button>
          </div>
        </header>

        <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
          <FilterBar 
            searchPlaceholder="Search by name, phone, or record ID..."
            onSearchChange={setSearch}
            filters={[
              { id: 'gov', label: 'All Governorates', options: [
                { value: 'baghdad', label: 'Baghdad' }, 
                { value: 'basra', label: 'Basra' },
                { value: 'erbil', label: 'Erbil' },
                { value: 'nineveh', label: 'Nineveh' }
              ] },
              { id: 'status', label: 'All Statuses', options: [
                { value: 'raw', label: 'Raw' }, 
                { value: 'needs_cleaning', label: 'Needs Cleaning' },
                { value: 'staged', label: 'Staged' },
                { value: 'approved', label: 'Approved' }
              ] }
            ]}
            onFilterChange={(id, val) => {
              setFilters(prev => ({ ...prev, [id]: val }));
              setCurrentPage(1);
            }}
            showConfidenceSlider
            confidenceValue={confidence}
            onConfidenceChange={setConfidence}
          />
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-3 text-rose-700">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Failed to sync records: {error}</p>
          </div>
        )}

        <DataTable 
          columns={columns} 
          data={paginatedData} 
          onRowClick={setSelectedRecord}
          keyExtractor={(r) => r.id}
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

      <SidePanel 
        isOpen={!!selectedRecord} 
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.nameEn || ''}
        subtitle={selectedRecord?.id}
        footer={
          <div className="grid grid-cols-2 gap-4">
            <button className="px-4 py-3 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95">
              Reject Record
            </button>
            <button className="px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
            </button>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Confidence</p>
                <p className="text-2xl font-bold text-blue-600 font-mono leading-none">{selectedRecord.completenessScore}%</p>
              </div>
            </div>

            {selectedRecord.issues && selectedRecord.issues.length > 0 && (
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl space-y-3">
                <div className="flex items-center text-rose-700 text-[10px] font-bold uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Validation Warnings
                </div>
                <ul className="space-y-2">
                  {selectedRecord.issues.map((issue, i) => (
                    <li key={i} className="flex items-start text-sm text-rose-600">
                      <span className="mr-2 mt-1.5 w-1 h-1 bg-rose-400 rounded-full flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <section className="space-y-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Business Details</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <DetailItem icon={Tag} label="Category" value={selectedRecord.category} />
                <DetailItem icon={Calendar} label="Last Updated" value={selectedRecord.lastUpdated} />
                <DetailItem icon={MapPin} label="Governorate" value={selectedRecord.governorate} />
                <DetailItem icon={MapPin} label="City" value={selectedRecord.city} />
                <DetailItem icon={Phone} label="Phone" value={selectedRecord.phone || 'N/A'} isMono />
                <DetailItem icon={MessageSquare} label="WhatsApp" value={selectedRecord.whatsapp || 'N/A'} isMono />
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Arabic Identity</h4>
              <div className="p-6 bg-slate-50 rounded-2xl">
                <p className="text-2xl font-bold text-slate-900 text-right font-arabic" dir="rtl">{selectedRecord.nameAr}</p>
              </div>
            </section>
          </div>
        )}
      </SidePanel>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value, isMono = false }: { icon: any, label: string, value: string, isMono?: boolean }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
      <Icon className="w-3 h-3 mr-1.5 text-slate-300" /> {label}
    </label>
    <p className={`text-sm font-bold text-slate-900 ${isMono ? 'font-mono' : ''}`}>{value}</p>
  </div>
);
