import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { Database, Layers, AlertCircle, GitMerge, ClipboardCheck } from 'lucide-react';
import { dashboardService, type FinalReport } from '../services/dashboardService';

export const Dashboard: React.FC = () => {
  const [report, setReport] = useState<FinalReport | null>(null);

  useEffect(() => {
    dashboardService.getFinalReport().then(setReport);
  }, []);

  if (!report) {
    return <div className="text-slate-500">Loading dashboard report...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Command Center</h2>
        <p className="text-slate-500">Single-source operational stats from the canonical report service.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Records" value={report.totalRecords.toLocaleString()} icon={Database} />
        <StatCard label="Unique" value={report.uniqueRecords.toLocaleString()} icon={Layers} />
        <StatCard label="Needs Review" value={report.counts.REVIEW} icon={AlertCircle} color="text-amber-500" />
        <StatCard label="Merged Updates" value={report.counts.UPDATE} icon={GitMerge} color="text-blue-500" />
        <StatCard label="Valid Records" value={report.quality.valid} icon={ClipboardCheck} color="text-emerald-500" />
      </div>

      <div className="bg-white border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Classification Summary</h3>
        <p className="text-sm text-slate-600 mt-2">
          NEW: {report.counts.NEW} • UPDATE: {report.counts.UPDATE} • DUPLICATE: {report.counts.DUPLICATE} • REVIEW: {report.counts.REVIEW}
        </p>
      </div>
    </div>
  );
};
