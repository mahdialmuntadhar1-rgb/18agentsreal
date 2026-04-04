import React, { useState, useMemo } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { LogEvent } from '../types';
import { Terminal, AlertCircle, Info, ShieldAlert, Loader2, Download } from 'lucide-react';
import { useLogs } from '../hooks/useSupabase';

export const LogsEvents: React.FC = () => {
  const { logs, loading, error } = useLogs();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO': return <Info className="w-4 h-4 text-blue-400" />;
      case 'WARN': return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default: return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.source.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase());
      
      const matchesLevel = !filters.level || log.level === filters.level;
      const matchesSource = !filters.source || log.source === filters.source;

      return matchesSearch && matchesLevel && matchesSource;
    });
  }, [logs, search, filters]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const columns: Column<LogEvent>[] = [
    { 
      header: 'Timestamp', 
      accessor: (log: LogEvent) => (
        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-tighter">
          {log.timestamp}
        </span>
      ),
      className: 'w-48'
    },
    { 
      header: 'Level', 
      accessor: (log: LogEvent) => (
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-lg ${
            log.level === 'INFO' ? 'bg-blue-500/10' :
            log.level === 'WARN' ? 'bg-amber-500/10' :
            log.level === 'ERROR' ? 'bg-rose-500/10' :
            'bg-rose-900/20'
          }`}>
            {getLevelIcon(log.level)}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
            log.level === 'INFO' ? 'text-blue-400' :
            log.level === 'WARN' ? 'text-amber-400' :
            log.level === 'ERROR' ? 'text-rose-400' :
            'text-rose-500'
          }`}>
            {log.level}
          </span>
        </div>
      ),
      className: 'w-32'
    },
    { 
      header: 'Source', 
      accessor: (log: LogEvent) => (
        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md font-mono text-[10px] font-bold border border-slate-700 uppercase tracking-wider">
          {log.source}
        </span>
      ),
      className: 'w-40'
    },
    { 
      header: 'Event Message', 
      accessor: (log: LogEvent) => (
        <div className="flex flex-col space-y-0.5">
          <span className="text-sm text-slate-200 font-medium leading-relaxed">{log.message}</span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter opacity-50">{log.id}</span>
        </div>
      )
    },
  ];

  if (loading && logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Connecting to system audit stream...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Logs & Events</h2>
          <p className="text-slate-500 text-lg">Real-time audit trail of all automated and manual operations.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Download className="w-4 h-4 mr-2 text-slate-400" />
            Export Audit Trail
          </button>
          <button className="flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 group">
            <Terminal className="w-4 h-4 mr-2 text-blue-400 group-hover:animate-pulse" />
            Live Stream
          </button>
        </div>
      </header>

      <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
        <FilterBar 
          searchPlaceholder="Search logs by message, source, or ID..."
          onSearchChange={setSearch}
          filters={[
            { id: 'level', label: 'All Levels', options: [
              { value: 'INFO', label: 'Info' },
              { value: 'WARN', label: 'Warning' },
              { value: 'ERROR', label: 'Error' },
              { value: 'CRITICAL', label: 'Critical' }
            ] },
            { id: 'source', label: 'All Sources', options: [
              { value: 'Agent-Alpha', label: 'Agent Alpha' },
              { value: 'Data-Cleaner', label: 'Data Cleaner' },
              { value: 'Supabase-Sync', label: 'Supabase Sync' },
              { value: 'System-Monitor', label: 'System Monitor' }
            ] }
          ]}
          onFilterChange={(id, val) => {
            setFilters(prev => ({ ...prev, [id]: val }));
            setCurrentPage(1);
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-3 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Stream connection error: {error}</p>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <DataTable 
          columns={columns} 
          data={paginatedLogs} 
          keyExtractor={(log) => log.id}
          onRowClick={(log) => console.log('Log clicked:', log)}
          className="bg-slate-900 text-slate-300"
          headerClassName="bg-slate-800/50 text-slate-400 border-slate-800 font-bold uppercase tracking-[0.2em] text-[10px]"
          rowClassName="border-slate-800/50 hover:bg-slate-800/30 transition-colors"
          pagination={{
            currentPage,
            totalPages: Math.ceil(filteredLogs.length / pageSize),
            onPageChange: setCurrentPage,
            pageSize,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setCurrentPage(1);
            },
            totalCount: filteredLogs.length
          }}
        />
      </div>
    </div>
  );
};
