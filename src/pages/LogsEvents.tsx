import React, { useState } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { LogEvent } from '../types';
import { Terminal, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { useLogs } from '../hooks/useSupabase';

export const LogsEvents: React.FC = () => {
  const { logs, loading } = useLogs();
  const displayLogs = logs.map((log: any) => ({
    ...log,
    timestamp: log.created_at,
    level: (log.level || log.event_type || 'INFO').toUpperCase(),
    source: log.agent_id || log.source || 'runtime',
    message: log.message || log.event_type || '',
  }));

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
    { header: 'Timestamp', accessor: 'timestamp' as const, className: 'font-mono text-[10px] text-slate-500' },
    { 
      header: 'Level', 
      accessor: (log: LogEvent) => (
        <div className="flex items-center space-x-2">
          {getLevelIcon(log.level)}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            log.level === 'INFO' ? 'text-blue-600' :
            log.level === 'WARN' ? 'text-amber-600' :
            log.level === 'ERROR' ? 'text-rose-600' :
            'text-rose-800'
          }`}>
            {log.level}
          </span>
        </div>
      )
    },
    { header: 'Source', accessor: 'source' as const, className: 'font-mono text-xs font-bold' },
    { header: 'Message', accessor: 'message' as const, className: 'text-sm text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Logs & Events</h2>
          <p className="text-slate-500">Real-time audit trail of all automated and manual operations.</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded font-bold text-xs hover:bg-slate-200 transition-colors">
            Export Logs
          </button>
          <button className="bg-slate-900 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center hover:bg-slate-800 transition-colors">
            <Terminal className="w-3 h-3 mr-2" />
            Live Stream
          </button>
        </div>
      </header>

      <FilterBar 
        onSearch={() => {}} 
        onFilterChange={() => {}} 
        filters={[
          { id: 'level', label: 'Level', options: ['INFO', 'WARN', 'ERROR', 'CRITICAL'] },
          { id: 'source', label: 'Source', options: ['Agent-Alpha', 'Data-Cleaner', 'Supabase-Sync', 'System-Monitor'] }
        ]}
      />

      <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-xl">
        <DataTable 
          columns={columns} 
          data={displayLogs} 
          keyExtractor={(log) => log.id}
          onRowClick={(log) => console.log('Log clicked:', log)}
          className="bg-slate-900 text-slate-300"
          headerClassName="bg-slate-800 text-slate-400 border-slate-700"
          rowClassName="border-slate-800 hover:bg-slate-800/50"
        />
      </div>
    </div>
  );
};
