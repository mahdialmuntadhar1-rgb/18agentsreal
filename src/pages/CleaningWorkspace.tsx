/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronRight, 
  Save,
  Trash2,
  ArrowRightLeft,
  Loader2,
  Database
} from 'lucide-react';
import { BusinessRecord } from '../types';
import { useRecords } from '../hooks/useSupabase';
import { StatCard } from '../components/StatCard';

export const CleaningWorkspace: React.FC = () => {
  const { records, loading, error } = useRecords('NEEDS_CLEANING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'duplicates' | 'missing'>('all');
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        r.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        r.nameAr.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase());
      
      if (activeTab === 'duplicates') return matchesSearch && r.status === 'DUPLICATE_SUSPECT';
      if (activeTab === 'missing') return matchesSearch && (r.issues?.length || 0) > 0;
      return matchesSearch;
    });
  }, [records, search, activeTab]);

  const selectedRecord = useMemo(() => 
    records.find(r => r.id === selectedId) || (filteredRecords.length > 0 ? filteredRecords[0] : null)
  , [records, selectedId, filteredRecords]);

  if (loading && records.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Preparing cleaning workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col max-w-7xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cleaning Workspace</h2>
          <p className="text-slate-500 text-lg">Resolve data quality issues and validate records for staging.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
            Bulk Approve
          </button>
        </div>
      </header>

      {/* Issue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Missing Data" 
          value={records.filter(r => r.issues?.some(i => i.toLowerCase().includes('missing'))).length.toString()} 
          icon={AlertCircle} 
          subValue="Requires manual entry"
        />
        <StatCard 
          label="Duplicates" 
          value={records.filter(r => r.status === 'DUPLICATE_SUSPECT').length.toString()} 
          icon={ArrowRightLeft} 
          subValue="Suspect matches"
        />
        <StatCard 
          label="Malformed Data" 
          value={records.filter(r => r.status === 'NEEDS_CLEANING').length.toString()} 
          icon={XCircle} 
          subValue="Format errors"
        />
      </div>

      {/* Split View Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Left: Issue List */}
        <div className="w-full lg:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 space-y-4 bg-slate-50/50">
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl">
              {['all', 'duplicates', 'missing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                    activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filter issues..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-5 hover:bg-slate-50 transition-all flex items-start justify-between group ${
                    selectedRecord?.id === item.id ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="space-y-1.5 pr-4">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{item.nameEn}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.issues?.map((issue, i) => (
                        <span key={i} className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          <AlertCircle className="w-2.5 h-2.5 mr-1" /> {issue}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{item.id}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 mt-1 transition-transform group-hover:translate-x-1 ${selectedRecord?.id === item.id ? 'text-blue-500' : 'text-slate-300'}`} />
                </button>
              ))
            ) : (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">All Clear</p>
                <p className="text-xs text-slate-500">No records matching these filters need cleaning.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Record Editor */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden">
          {selectedRecord ? (
            <>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{selectedRecord.nameEn}</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{selectedRecord.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className="flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EditorField label="Business Name (EN)" defaultValue={selectedRecord.nameEn} />
                  <EditorField label="Business Name (AR)" defaultValue={selectedRecord.nameAr} isArabic />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Category</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none" defaultValue={selectedRecord.category}>
                      <option>Hotels</option>
                      <option>Restaurants</option>
                      <option>Pharmacies</option>
                      <option>Retail</option>
                      <option>Medical</option>
                    </select>
                  </div>
                  <EditorField label="Phone Number" defaultValue={selectedRecord.phone || ''} isMono />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">WhatsApp</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        defaultValue={selectedRecord.whatsapp || ''}
                        placeholder="Missing contact..."
                        className={`w-full px-4 py-3 border rounded-xl text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${
                          !selectedRecord.whatsapp ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-slate-200 bg-slate-50 text-slate-900'
                        }`}
                      />
                      {!selectedRecord.whatsapp && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />}
                    </div>
                  </div>
                  <EditorField label="Governorate" defaultValue={selectedRecord.governorate} disabled />
                </div>

                <div className="p-8 bg-slate-900 rounded-3xl text-white space-y-6 shadow-2xl shadow-slate-200">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Operational Actions</h4>
                    <p className="text-slate-400 text-xs">Finalize record processing and move to the next stage.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all active:scale-95">
                      Mark as Duplicate
                    </button>
                    <button className="flex items-center justify-center px-6 py-4 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                      Send to Staging
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/30">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
                <ArrowRightLeft className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-medium italic">Select a record from the sidebar to begin cleaning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditorField = ({ label, defaultValue, isArabic = false, isMono = false, disabled = false }: { label: string, defaultValue: string, isArabic?: boolean, isMono?: boolean, disabled?: boolean }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</label>
    <input 
      type="text" 
      defaultValue={defaultValue}
      disabled={disabled}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`w-full px-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all ${
        disabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 
        'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
      } ${isArabic ? 'text-right font-arabic text-lg' : ''} ${isMono ? 'font-mono' : ''}`}
    />
  </div>
);
