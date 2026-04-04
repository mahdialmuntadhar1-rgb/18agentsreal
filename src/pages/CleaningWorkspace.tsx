/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronRight, 
  Save,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import { BusinessRecord } from '../types';
import { useRecords } from '../hooks/useSupabase';

const MOCK_ISSUES = [
  { id: 'REC-002', name: 'Babylon Hotel', issue: 'Missing WhatsApp', type: 'MISSING_DATA' },
  { id: 'REC-005', name: 'Fast Transport Co', issue: 'Possible duplicate of REC-089', type: 'DUPLICATE' },
  { id: 'REC-012', name: 'Al-Mansour Clinic', issue: 'Malformed Arabic Name', type: 'DATA_QUALITY' },
  { id: 'REC-015', name: 'Unknown Business', issue: 'Missing Category', type: 'MISSING_DATA' },
];

export const CleaningWorkspace: React.FC = () => {
  const { records, loading } = useRecords('NEEDS_CLEANING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'duplicates' | 'missing'>('all');

  const displayRecords = records.length > 0 ? records : [];
  const currentId = selectedId || (displayRecords.length > 0 ? displayRecords[0].id : (MOCK_ISSUES.length > 0 ? MOCK_ISSUES[0].id : null));
  const selectedRecord = displayRecords.find(r => r.id === currentId) || null;

  const issueList = displayRecords.length > 0 
    ? displayRecords.map(r => ({ id: r.id, name: r.nameEn, issue: r.issues?.[0] || 'Unknown Issue', type: 'DATA_QUALITY' }))
    : MOCK_ISSUES;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cleaning Workspace</h2>
          <p className="text-slate-500">Resolve data quality issues and validate records for staging.</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded hover:bg-slate-800 transition-colors flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Bulk Approve
          </button>
        </div>
      </header>

      {/* Issue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-orange-50 rounded-full mr-4 text-orange-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Missing Data</p>
            <p className="text-xl font-bold text-slate-900">142 <span className="text-xs font-normal text-slate-400">records</span></p>
          </div>
        </div>
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-purple-50 rounded-full mr-4 text-purple-600">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duplicates</p>
            <p className="text-xl font-bold text-slate-900">28 <span className="text-xs font-normal text-slate-400">suspects</span></p>
          </div>
        </div>
        <div className="bg-white p-4 border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-rose-50 rounded-full mr-4 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Malformed Data</p>
            <p className="text-xl font-bold text-slate-900">56 <span className="text-xs font-normal text-slate-400">errors</span></p>
          </div>
        </div>
      </div>

      {/* Split View Workspace */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Issue List */}
        <div className="w-1/3 bg-white border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-200 space-y-4">
            <div className="flex space-x-1 bg-slate-100 p-1 rounded">
              {['all', 'duplicates', 'missing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filter issues..." 
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {issueList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start justify-between ${
                  currentId === item.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-rose-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {item.issue}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.id}</p>
                </div>
                <ChevronRight className={`w-4 h-4 mt-1 ${currentId === item.id ? 'text-blue-500' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Record Editor */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-slate-900">Record Detail</h3>
              <StatusBadge status="NEEDS_CLEANING" />
            </div>
            <div className="flex space-x-2">
              <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {selectedRecord ? (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Name (EN)</label>
                  <input 
                    type="text" 
                    defaultValue={selectedRecord.nameEn}
                    className="w-full px-4 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Name (AR)</label>
                  <input 
                    type="text" 
                    defaultValue={selectedRecord.nameAr}
                    dir="rtl"
                    className="w-full px-4 py-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-right font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded text-sm outline-none" defaultValue={selectedRecord.category}>
                    <option>Hotels</option>
                    <option>Restaurants</option>
                    <option>Pharmacies</option>
                    <option>Retail</option>
                    <option>Medical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="text" 
                    defaultValue={selectedRecord.phone || ''}
                    className="w-full px-4 py-2 border border-slate-200 rounded text-sm font-mono outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      defaultValue={selectedRecord.whatsapp || ''}
                      placeholder="Missing..."
                      className={`w-full px-4 py-2 border rounded text-sm font-mono outline-none focus:border-blue-500 ${
                        !selectedRecord.whatsapp ? 'border-rose-200 bg-rose-50' : 'border-slate-200'
                      }`}
                    />
                    {!selectedRecord.whatsapp && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Governorate</label>
                  <input 
                    type="text" 
                    defaultValue={selectedRecord.governorate}
                    disabled
                    className="w-full px-4 py-2 border border-slate-100 bg-slate-50 rounded text-sm text-slate-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Select a record to begin cleaning
              </div>
            )}

            <div className="p-6 bg-slate-900 rounded-lg text-white space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Operational Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-4 py-3 bg-slate-800 border border-slate-700 rounded text-sm font-bold hover:bg-slate-700 transition-colors">
                  Mark as Duplicate
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 transition-colors">
                  Send to Staging
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
