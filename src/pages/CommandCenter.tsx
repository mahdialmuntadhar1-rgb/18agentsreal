import { useEffect, useState } from 'react';
import { Play, Square, Terminal, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type LogEntry = { id: string; message: string; type: string; created_at: string };

export default function CommandCenter() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [instruction, setInstruction] = useState('Run social enrichment for Baghdad');
  const [runningCount, setRunningCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    const { data } = await supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs((data as LogEntry[]) ?? []);
  };

  const fetchRunningCount = async () => {
    const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'running');
    setRunningCount(count ?? 0);
  };

  useEffect(() => {
    fetchLogs();
    fetchRunningCount();
  }, []);

  const start = async () => {
    setLoading(true);
    await supabase.from('agent_tasks').insert({
      type: 'manual_command',
      instruction,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    await fetch('/api/orchestrator/start', { method: 'POST' });
    await Promise.all([fetchLogs(), fetchRunningCount()]);
    setLoading(false);
  };

  const stop = async () => {
    setLoading(true);
    await fetch('/api/orchestrator/stop', { method: 'POST' });
    await Promise.all([fetchLogs(), fetchRunningCount()]);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Command Center</h1>
      <div className="flex gap-3">
        <input value={instruction} onChange={(e) => setInstruction(e.target.value)} className="border rounded px-3 py-2 flex-1" />
        <button disabled={loading} onClick={start} className="px-4 py-2 bg-emerald-600 rounded text-white flex items-center gap-2"><Play size={16} /> Start</button>
        <button disabled={loading} onClick={stop} className="px-4 py-2 border rounded flex items-center gap-2"><Square size={16} /> Stop</button>
      </div>
      <div>Status: {runningCount > 0 ? `running (${runningCount} agents)` : 'idle'}</div>
      <div className="border rounded p-4">
        <div className="font-semibold mb-2 flex items-center gap-2"><Terminal size={16} /> Recent Logs</div>
        <ul className="space-y-2 text-sm">
          {logs.map((log) => <li key={log.id}>[{log.type}] {log.message}</li>)}
        </ul>
      </div>
      <button className="px-3 py-2 border rounded text-xs flex items-center gap-2" onClick={() => Promise.all([fetchLogs(), fetchRunningCount()])}>
        <RefreshCw size={14} /> Refresh Runtime State
      </button>
    </div>
  );
}
