import React from 'react';
import type { FinalReport as FinalReportType } from '../../services/dashboardService';
import { ProviderReport } from './ProviderReport';

interface Props {
  report: FinalReportType;
}

export const FinalReport: React.FC<Props> = ({ report }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Total" value={report.totalRecords} />
        <Metric label="Unique" value={report.uniqueRecords} />
        <Metric label="Completeness" value={`${report.avgCompleteness}%`} />
        <Metric label="Gov Coverage" value={`${report.governorateCoverage.covered}/19`} />
      </div>

      <div className="bg-white border border-slate-200 p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="New" value={report.counts.NEW} />
        <Metric label="Update" value={report.counts.UPDATE} />
        <Metric label="Duplicate" value={report.counts.DUPLICATE} />
        <Metric label="Review" value={report.counts.REVIEW} />
      </div>

      <div className="bg-white border border-slate-200 p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Data Quality</h3>
        <p className="text-sm text-slate-600">
          Valid: {report.quality.valid} • Invalid: {report.quality.invalid} • High/Medium/Low: {report.quality.completenessBuckets.high}/
          {report.quality.completenessBuckets.medium}/{report.quality.completenessBuckets.low}
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Provider Report</h3>
        <ProviderReport providers={report.providerReports} />
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-white border border-slate-200 p-4 shadow-sm">
    <div className="text-xs text-slate-500 uppercase">{label}</div>
    <div className="text-2xl font-semibold text-slate-900">{value}</div>
  </div>
);
