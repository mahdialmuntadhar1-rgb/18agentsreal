import React, { useEffect, useState } from 'react';
import { FinalReport } from '../../components/reports/FinalReport';
import { dashboardService, type FinalReport as FinalReportType } from '../../services/dashboardService';

export const FinalReportPage: React.FC = () => {
  const [report, setReport] = useState<FinalReportType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardService.getFinalReport().then((data) => {
      if (mounted) {
        setReport(data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="text-slate-500">Building report...</div>;
  if (!report) return <div className="text-rose-600">Unable to build report.</div>;

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-slate-900">Final Report</h2>
      <p className="text-slate-500 text-sm">Canonical pipeline: normalize → validate → match → merge/review → aggregate.</p>
      <FinalReport report={report} />
    </div>
  );
};
