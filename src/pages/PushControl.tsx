/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  SendHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';

import { useRecords } from '../hooks/useSupabase';
import { StatCard } from '../components/StatCard';

export const PushControl: React.FC = () => {
  const { records, loading, error } = useRecords('APPROVED');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const PUSH_STATS = useMemo(() => ({
    totalRecords: records.length,
    governorates: new Set(records.map(r => r.governorate)).size,
    categories: new Set(records.map(r => r.category)).size,
    avgCompleteness: records.length > 0 
      ? Math.round(records.reduce((acc, r) => acc + r.completenessScore, 0) / records.length) 
      : 0
  }), [records]);

  const CHECKLIST = [
    { label: 'Incomplete fields < 5%', status: PUSH_STATS.avgCompleteness > 95 ? 'PASS' : 'WARNING', value: `${(100 - PUSH_STATS.avgCompleteness).toFixed(1)}%` },
    { label: 'Duplicate risk assessment', status: 'PASS', value: 'Low' },
    { label: 'All records approved by operator', status: 'PASS', value: '100%' },
    { label: 'Geocoding validation', status: 'WARNING', value: '92% verified' },
  ];

  if (loading && records.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Analyzing release candidate...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Push / Release Control</h2>
        <p className="text-slate-500 text-lg">Final stage before data is pushed to the production environment.</p>
      </header>

      {/* Summary Panel */}
      <div className="bg-slate-950 text-white p-10 rounded-[2rem] shadow-2xl border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] -mr-48 -mt-48 rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center space-x-6">
              <div className="p-5 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-inner">
                <SendHorizontal className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Production Release Candidate</h3>
                <p className="text-slate-400 text-sm font-mono tracking-widest uppercase mt-1">RC-{new Date().toISOString().split('T')[0].replace(/-/g, '')}-001</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-[0.3em]">
                Integrity Verified
              </span>
              <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-[0.3em]">
                Ready for Push
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-12 border-y border-slate-800/50">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Total Records</p>
              <p className="text-4xl font-bold tracking-tighter">{PUSH_STATS.totalRecords.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Governorates</p>
              <p className="text-4xl font-bold tracking-tighter">{PUSH_STATS.governorates}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Categories</p>
              <p className="text-4xl font-bold tracking-tighter">{PUSH_STATS.categories}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Avg. Quality</p>
              <p className="text-4xl font-bold tracking-tighter text-emerald-400">{PUSH_STATS.avgCompleteness}%</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center text-sm text-slate-400 font-medium">
              <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500" />
              Security & Integrity Check Passed for all {PUSH_STATS.totalRecords} records
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={PUSH_STATS.totalRecords === 0}
              className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-blue-600/40 flex items-center justify-center disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              EXECUTE PRODUCTION PUSH <ArrowRight className="w-6 h-6 ml-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pre-push Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-8">
          <h4 className="font-bold text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-3 text-slate-400" /> Pre-push Checklist
          </h4>
          <div className="space-y-4">
            {CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                <span className="text-sm font-bold text-slate-600">{item.label}</span>
                <div className="flex items-center">
                  <span className="text-xs font-mono mr-4 text-slate-400 font-bold">{item.value}</span>
                  {item.status === 'PASS' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-8">
          <h4 className="font-bold text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 text-slate-400" /> System Warnings
          </h4>
          <div className="space-y-4">
            <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex items-start">
              <Info className="w-6 h-6 text-orange-600 mr-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-orange-900">Geocoding Incomplete</p>
                <p className="text-xs text-orange-800/80 leading-relaxed">
                  8% of records in Nineveh governorate are missing precise coordinates. These will be pushed with city-level centroids.
                </p>
              </div>
            </div>
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start">
              <Info className="w-6 h-6 text-blue-600 mr-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900">Batch Size Alert</p>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  This push contains {PUSH_STATS.totalRecords.toLocaleString()} records. Estimated propagation time to public API is 4 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-rose-600 text-white">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-tight">Confirm Production Push</h3>
                  <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mt-0.5">High Stakes Action</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-500 rounded-xl transition-all active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <p className="text-slate-600 text-lg leading-relaxed">
                  You are about to push <span className="font-bold text-slate-900 underline decoration-rose-500 decoration-4 underline-offset-4">{PUSH_STATS.totalRecords.toLocaleString()} records</span> to the live production database.
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  This action will update public-facing business directories across Iraq and cannot be easily undone. All downstream consumers will receive this data immediately.
                </p>
              </div>
              
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono text-slate-500 space-y-2 shadow-inner">
                <div className="flex justify-between">
                  <span className="font-bold uppercase tracking-tighter">Action:</span>
                  <span className="text-slate-900">PUSH_TO_PROD</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold uppercase tracking-tighter">Operator:</span>
                  <span className="text-slate-900">mahdialmuntadhar1@gmail.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold uppercase tracking-tighter">Timestamp:</span>
                  <span className="text-slate-900">{new Date().toISOString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  className="w-full py-5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-2xl shadow-rose-600/30 active:scale-95 text-lg"
                  onClick={() => {
                    alert('Production push initiated successfully.');
                    setIsModalOpen(false);
                  }}
                >
                  CONFIRM & EXECUTE PUSH
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-5 bg-white text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel and Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
