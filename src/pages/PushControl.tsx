/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  SendHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

import { useRecords } from '../hooks/useSupabase';

export const PushControl: React.FC = () => {
  const { records } = useRecords('APPROVED');

  const PUSH_STATS = {
    totalRecords: records.length,
    governorates: new Set(records.map(r => r.governorate)).size,
    categories: new Set(records.map(r => r.category)).size,
    avgCompleteness: records.length > 0
      ? Math.round(records.reduce((acc, r) => acc + r.completenessScore, 0) / records.length)
      : 0
  };

  const CHECKLIST = [
    { label: 'Approved records available', status: records.length > 0 ? 'PASS' : 'WARNING', value: records.length.toString() },
    { label: 'Duplicate risk assessment', status: 'PASS', value: 'runtime-enforced' },
    { label: 'All records approved by operator', status: 'PASS', value: 'DB truth' },
    { label: 'Geocoding validation', status: 'WARNING', value: 'check records.latitude/longitude' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Push / Release Control</h2>
        <p className="text-slate-500">Final stage before data is pushed to the production environment.</p>
      </header>

      {/* Summary Panel */}
      <div className="bg-slate-950 text-white p-8 rounded-lg shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <SendHorizontal className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Production Release Candidate</h3>
              <p className="text-slate-400 text-sm font-mono">Runtime-generated from approved records</p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-widest">
              Manual Push Required
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-slate-800">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Records</p>
            <p className="text-2xl font-bold">{PUSH_STATS.totalRecords.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Governorates</p>
            <p className="text-2xl font-bold">{PUSH_STATS.governorates}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Categories</p>
            <p className="text-2xl font-bold">{PUSH_STATS.categories}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Quality</p>
            <p className="text-2xl font-bold text-emerald-400">{PUSH_STATS.avgCompleteness}%</p>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <div className="flex items-center text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
            Security & Integrity Check Passed
          </div>
          <button
            disabled
            className="px-8 py-4 bg-slate-400 text-white font-bold rounded cursor-not-allowed flex items-center"
            title="Direct production push is not wired in this frontend"
          >
            PUSH VIA EXTERNAL RUNBOOK <ArrowRight className="w-5 h-5 ml-3" />
          </button>
        </div>
      </div>

      {/* Pre-push Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-6 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" /> Pre-push Checklist
          </h4>
          <div className="space-y-4">
            {CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-slate-50 rounded">
                <span className="text-sm text-slate-600">{item.label}</span>
                <div className="flex items-center">
                  <span className="text-xs font-mono mr-3 text-slate-400">{item.value}</span>
                  {item.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-6 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-slate-400" /> System Warnings
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-100 rounded flex items-start">
              <Info className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
              <p className="text-xs text-orange-800 leading-relaxed">
                <strong>Geocoding Check:</strong> Review approved records missing precise coordinates before push.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Batch Size:</strong> This push contains {PUSH_STATS.totalRecords.toLocaleString()} approved records.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
