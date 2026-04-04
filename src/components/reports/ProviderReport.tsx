import React from 'react';
import type { ProviderReport as ProviderReportType } from '../../services/dashboardService';

interface Props {
  providers: ProviderReportType[];
}

export const ProviderReport: React.FC<Props> = ({ providers }) => {
  if (providers.length === 0) {
    return <div className="text-sm text-slate-500">No provider records available.</div>;
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Provider</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3 text-right">New</th>
            <th className="px-4 py-3 text-right">Update</th>
            <th className="px-4 py-3 text-right">Duplicate</th>
            <th className="px-4 py-3 text-right">Review</th>
            <th className="px-4 py-3 text-right">Quality</th>
            <th className="px-4 py-3 text-right">Gov Coverage</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider.provider} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">{provider.provider}</td>
              <td className="px-4 py-3 text-right">{provider.total}</td>
              <td className="px-4 py-3 text-right">{provider.newCount}</td>
              <td className="px-4 py-3 text-right">{provider.updateCount}</td>
              <td className="px-4 py-3 text-right">{provider.duplicateCount}</td>
              <td className="px-4 py-3 text-right">{provider.reviewCount}</td>
              <td className="px-4 py-3 text-right">{provider.avgCompleteness}%</td>
              <td className="px-4 py-3 text-right">{provider.governorateCoverage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
