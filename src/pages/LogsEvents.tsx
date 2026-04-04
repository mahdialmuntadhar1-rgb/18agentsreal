import React from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { LogEvent } from '../types';
import { Terminal, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { useLogs } from '../hooks/useSupabase';

export const LogsEvents: React.FC = () => {
  const { logs, loading } = useLogs();

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO': return <Info className="w-3 h-3 text-blue-500" />;
      case 'WARN': return <AlertCircle className="w-3 h-3 text-amber-500" />;
      case 'ERROR': return <AlertCircle className="w-3 h-3 text-rose-500" />;
      case 'CRITICAL': return <ShieldAlert className="w-3 h-3 text-rose-700" />;
      default: return null;
    }
  };

  const columns: Column<LogEvent>[] = [
    { header: 'Timestamp', accessor: 'timestamp', className: 'font-mono text-[10px] text-slate-500' },
    {
      header: 'Level',
      accessor: (log) => (
        <div className="flex items-center space-x-2">
          {getLevelIcon(log.level)}
          <span className="text-[10px] font-bold uppercase tracking-wider">{log.level}</span>
        </div>
      )
    },
    { header: 'Agent', accessor: 'source', className: 'font-mono text-xs font-bold' },
    { header: 'Message', accessor: 'message', className: 'text-sm text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Logs & Events</h2>
          <p className="text-slate-500">Streaming from job_events table.</p>
        </div>
        <button className="bg-slate-900 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center" disabled>
          <Terminal className="w-3 h-3 mr-2" />
          Live Stream
        </button>
      </header>

      <FilterBar onSearchChange={() => {}} onFilterChange={() => {}} filters={[]} />

      {loading ? <div className="text-slate-500 text-sm">Loading events...</div> : (
        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-xl">
          <DataTable
            columns={columns}
            data={logs}
            keyExtractor={(log) => log.id}
            className="bg-slate-900 text-slate-300"
            headerClassName="bg-slate-800 text-slate-400 border-slate-700"
            rowClassName="border-slate-800 hover:bg-slate-800/50"
          />
        </div>
      )}
    </div>
  );
};
