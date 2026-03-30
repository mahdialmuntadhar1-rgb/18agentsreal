import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Terminal, 
  Clock,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';

interface AgentLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'ok' | 'warn' | 'agent' | 'error' | 'success' | 'warning';
  taskId?: string;
  agent_id?: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500); 

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      await handleSupabaseError(err, OperationType.GET, 'agent_logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
        setLogs(prev => [payload.new as AgentLog, ...prev].slice(0, 500));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.agent_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.taskId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">SYSTEM LOGS</h2>
          <p className="text-gray-500 font-medium">Comprehensive audit trail of all agent operations</p>
        </div>
        <button disabled title="Log export is not implemented yet" className="bg-[#1B2B5E] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg opacity-60 cursor-not-allowed">
          <Download size={18} />
          Export Logs
        </button>
      </header>

      {/* Log Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search logs by agent, action, or details..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
      </div>

      {/* Terminal-style Log View */}
      <div className="bg-[#151619] rounded-[32px] shadow-2xl overflow-hidden border border-white/5">
        <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
            </div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 flex items-center gap-2">
              <Terminal size={12} />
              Live System Output
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        <div className="p-6 font-mono text-xs space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-white/20 text-center py-10">Initializing log stream...</div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-white/20 text-center py-10">No logs found matching criteria</div>
          ) : (
            paginatedLogs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4 group"
              >
                <span className="text-white/20 whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`font-bold whitespace-nowrap min-w-[120px] ${
                  log.agent_id === 'System' ? 'text-purple-400' : 'text-[#C9A84C]'
                }`}>
                  {log.agent_id || 'System'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                  log.type === 'success' || log.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400' :
                  log.type === 'warning' || log.type === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                  log.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {log.type}
                </span>
                <span className="text-white/60 group-hover:text-white transition-colors">
                  {log.message}
                </span>
              </motion.div>
            ))
          )}
          <div className="flex items-center gap-2 text-white/20 pt-4">
            <Clock size={12} />
            <span>Waiting for new events...</span>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
