/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { DataTable } from '../components/DataTable';
import { SidePanel } from '../components/SidePanel';
import { Download, Phone, MessageSquare, MapPin, Tag, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BusinessRecord } from '../types';
import { Column } from '../components/DataTable';
import { useRecords } from '../hooks/useSupabase';

const MOCK_RECORDS: BusinessRecord[] = [
  { id: 'REC-001', nameAr: 'مطعم الزيتون', nameEn: 'Al Zaitoon Restaurant', category: 'Restaurants', governorate: 'Baghdad', city: 'Mansour', phone: '07701234567', whatsapp: '07701234567', completenessScore: 95, status: 'STAGED', lastUpdated: '2026-04-01' },
  { id: 'REC-002', nameAr: 'فندق بابل', nameEn: 'Babylon Hotel', category: 'Hotels', governorate: 'Baghdad', city: 'Jadriya', phone: '07809876543', whatsapp: '', completenessScore: 75, status: 'NEEDS_CLEANING', lastUpdated: '2026-04-02', issues: ['Missing WhatsApp'] },
  { id: 'REC-003', nameAr: 'صيدلية النور', nameEn: 'Al Noor Pharmacy', category: 'Pharmacies', governorate: 'Basra', city: 'Ashar', phone: '07501112223', whatsapp: '07501112223', completenessScore: 100, status: 'APPROVED', lastUpdated: '2026-03-30' },
  { id: 'REC-004', nameAr: 'سوبر ماركت الرافدين', nameEn: 'Al Rafidain Supermarket', category: 'Retail', governorate: 'Erbil', city: 'Ainkawa', phone: '07712223334', whatsapp: '07712223334', completenessScore: 85, status: 'RAW', lastUpdated: '2026-04-03' },
  { id: 'REC-005', nameAr: 'شركة النقل السريع', nameEn: 'Fast Transport Co', category: 'Logistics', governorate: 'Nineveh', city: 'Mosul', phone: '07814445556', whatsapp: '', completenessScore: 60, status: 'DUPLICATE_SUSPECT', lastUpdated: '2026-04-02', issues: ['Possible duplicate of REC-089'] },
  { id: 'REC-006', nameAr: 'مقهى الشابندر', nameEn: 'Shabandar Cafe', category: 'Cafes', governorate: 'Baghdad', city: 'Mutanabbi', phone: '07705556667', whatsapp: '07705556667', completenessScore: 92, status: 'APPROVED', lastUpdated: '2026-04-01' },
];

export const CollectedRecords: React.FC = () => {
  const { records, loading } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState<BusinessRecord | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'lastUpdated', direction: 'desc' });

  const displayRecords = records.length > 0 ? records : MOCK_RECORDS;

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredData = displayRecords
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

  const columns: Column<BusinessRecord>[] = [
    {
      header: 'Business Name',
      sortKey: 'nameEn',
      accessor: (record: BusinessRecord) => (
        <div>
          <div className="text-sm font-bold text-slate-900">{record.nameEn}</div>
          <div className="text-xs text-slate-500 font-medium">{record.nameAr}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">{record.id}</div>
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
      header: 'Contact',
      accessor: (record: BusinessRecord) => (
        <div>
          <div className="flex items-center text-xs text-slate-600 mb-1">
            <Phone className="w-3 h-3 mr-1 text-slate-400" /> {record.phone || 'N/A'}
          </div>
          {record.whatsapp && (
            <div className="flex items-center text-xs text-emerald-600">
              <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Score',
      sortKey: 'completenessScore',
      headerClassName: 'text-center',
      accessor: (record: BusinessRecord) => (
        <div className="text-center">
          <span className={`text-xs font-bold font-mono ${
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
    { header: 'Last Updated', accessor: 'lastUpdated' as const, sortKey: 'lastUpdated', className: 'text-xs text-slate-500 font-mono' }
  ];

  return (
    <div className="relative h-full">
      <div className="space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Collected Records</h2>
            <p className="text-slate-500">Browse and inspect all business data collected by agents.</p>
          </div>
          <button className="flex items-center px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-bold rounded hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </header>

        <FilterBar 
          searchPlaceholder="Search by name, phone, ID..."
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
          onFilterChange={(id, val) => setFilters(prev => ({ ...prev, [id]: val }))}
          showConfidenceSlider
          confidenceValue={confidence}
          onConfidenceChange={setConfidence}
        />

        <DataTable 
          columns={columns} 
          data={filteredData} 
          onRowClick={setSelectedRecord}
          keyExtractor={(r) => r.id}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      </div>

      <SidePanel 
        isOpen={!!selectedRecord} 
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.nameEn || ''}
        subtitle={selectedRecord?.id}
        footer={
          <div className="grid grid-cols-2 gap-4">
            <button className="px-4 py-3 border border-slate-200 text-slate-700 text-sm font-bold rounded hover:bg-white transition-colors">
              Reject Record
            </button>
            <button className="px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
            </button>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Status</p>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completeness</p>
                <p className="text-xl font-bold text-blue-600 font-mono">{selectedRecord.completenessScore}%</p>
              </div>
            </div>

            {selectedRecord.issues && selectedRecord.issues.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded space-y-2">
                <div className="flex items-center text-rose-700 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Attention Required
                </div>
                <ul className="list-disc list-inside text-sm text-rose-600 space-y-1">
                  {selectedRecord.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Tag className="w-3 h-3 mr-1" /> Category
                </label>
                <p className="text-sm font-medium text-slate-900">{selectedRecord.category}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Calendar className="w-3 h-3 mr-1" /> Last Updated
                </label>
                <p className="text-sm font-medium text-slate-900">{selectedRecord.lastUpdated}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> Governorate
                </label>
                <p className="text-sm font-medium text-slate-900">{selectedRecord.governorate}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> City
                </label>
                <p className="text-sm font-medium text-slate-900">{selectedRecord.city}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Phone className="w-3 h-3 mr-1" /> Phone
                </label>
                <p className="text-sm font-medium text-slate-900 font-mono">{selectedRecord.phone || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                </label>
                <p className="text-sm font-medium text-slate-900 font-mono">{selectedRecord.whatsapp || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Arabic Name</label>
              <p className="text-lg font-bold text-slate-900 text-right" dir="rtl">{selectedRecord.nameAr}</p>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
};
