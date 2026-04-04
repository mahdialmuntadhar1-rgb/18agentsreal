import React from 'react';
export const ProviderReport = ({ stats }: { stats: any[] }) => (
  <div className="p-4 bg-white shadow rounded-lg border border-gray-200">
    <h2 className="text-xl font-bold mb-4 text-blue-900">18 Provinces: Provider Status</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((s) => (
        <div key={s.name} className="p-2 border rounded bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase">{s.name}</p>
          <p className="text-lg font-bold">{s.count}</p>
        </div>
      ))}
    </div>
  </div>
);
