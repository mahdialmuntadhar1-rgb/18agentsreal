import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Square, Terminal, RefreshCw, Bot, AlertTriangle, ListTodo, ActivitySquare, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type LogEntry = { id: string; message: string; type: string; created_at: string };
type TaskEntry = { id: string; type: string; instruction: string; status: string; created_at: string };

export default function CommandCenter() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [instruction, setInstruction] = useState('');
  const [runningCount, setRunningCount] = useState<number | null>(null);
  const [totalAgentsCount, setTotalAgentsCount] = useState<number | null>(null);
  const [pendingTasksCount, setPendingTasksCount] = useState<number | null>(null);
  const [recentErrorsCount, setRecentErrorsCount] = useState<number | null>(null);
  const [runtimeHealth, setRuntimeHealth] = useState<string>('unknown');
  const [runtimeDetail, setRuntimeDetail] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<TaskEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    const { data } = await supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs((data as LogEntry[]) ?? []);
  };

  const fetchRuntimeSummary = async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [runningRes, totalRes, pendingRes, errorsRes, latestRunRes] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'running'),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('agent_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('agent_logs').select('*', { count: 'exact', head: true }).eq('type', 'error').gte('created_at', twentyFourHoursAgo),
      supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    setRunningCount(runningRes.error ? null : (runningRes.count ?? 0));
    setTotalAgentsCount(totalRes.error ? null : (totalRes.count ?? 0));
    setPendingTasksCount(pendingRes.error ? null : (pendingRes.count ?? 0));
    setRecentErrorsCount(errorsRes.error ? null : (errorsRes.count ?? 0));
    setLatestRun(latestRunRes.error ? null : ((latestRunRes.data as TaskEntry | null) ?? null));
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        setRuntimeHealth('unreachable');
        setRuntimeDetail('Health endpoint unavailable');
        return;
      }
      const data = await response.json();
      setRuntimeHealth(data.status ?? 'unknown');
      setRuntimeDetail(data.detail ?? null);
    } catch {
      setRuntimeHealth('unreachable');
      setRuntimeDetail('Unable to reach runtime API');
    }
  };

  const refreshRuntimeState = async () => {
    setMessage(null);
    await Promise.all([fetchLogs(), fetchRuntimeSummary(), fetchHealth()]);
  };

  useEffect(() => {
    refreshRuntimeState();
  }, []);

  const queueInstruction = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.from('agent_tasks').insert({
      type: 'manual_command',
      instruction: instruction.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    await refreshRuntimeState();
    if (error) {
      setMessage(`Queue failed: ${error.message}`);
    } else {
      setInstruction('');
      setMessage('Instruction queued.');
    }
    setLoading(false);
  };

  const startOrchestrator = async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch('/api/orchestrator/start', { method: 'POST' });
    await refreshRuntimeState();
    setMessage(response.ok ? 'Orchestrator start requested.' : 'Failed to start orchestrator.');
    setLoading(false);
  };

  const stopOrchestrator = async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch('/api/orchestrator/stop', { method: 'POST' });
    await refreshRuntimeState();
    setMessage(response.ok ? 'Orchestrator stop requested.' : 'Failed to stop orchestrator.');
    setLoading(false);
  };

  const runtimeStatusLabel = () => {
    if (runtimeHealth === 'ok' && runningCount !== null) {
      return runningCount > 0 ? `Running (${runningCount} active agents)` : 'Idle';
    }
    if (runtimeHealth === 'degraded') return 'Degraded';
    if (runtimeHealth === 'unreachable') return 'Unreachable';
    return 'Unknown';
  };

  const summaryCards = [
    { title: 'Total Agents', value: totalAgentsCount, icon: <Bot size={16} /> },
    { title: 'Running Agents', value: runningCount, icon: <ActivitySquare size={16} /> },
    { title: 'Pending Tasks', value: pendingTasksCount, icon: <ListTodo size={16} /> },
    { title: 'Recent Errors (24h)', value: recentErrorsCount, icon: <AlertTriangle size={16} /> },
  ];

  const shortcuts = [
    { title: 'Agents', to: '/agents', subtitle: 'Inspect agent registry' },
    { title: 'Logs', to: '/logs', subtitle: 'Review runtime events' },
    { title: 'Pilot Runs', to: '/pilot', subtitle: 'Inspect task history' },
    { title: 'Commander', to: '/commander', subtitle: 'Send direct commands' },
  ];

  const formatTimestamp = (value?: string) => {
    if (!value) return 'No activity yet';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Unknown timestamp' : parsed.toLocaleString();
  };

  const actionButton = 'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2';

  return (
    <div className="p-6 md:p-8 space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A84C]">18 AGENTS</p>
        <h1 className="text-3xl font-black text-[#1B2B5E] tracking-tight">Agent Operations Console</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Control, monitor, and orchestrate AI agents across Iraqi governorates.
          This console is dedicated to runtime operations and is separate from the customer-facing directory product.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <article key={card.title} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500">{card.title}</span>
              <span className="text-[#1B2B5E]">{card.icon}</span>
            </div>
            <div className="text-2xl font-black text-[#1B2B5E]">
              {card.value === null ? <span className="text-sm text-gray-400">Unavailable</span> : card.value}
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-black text-[#1B2B5E] uppercase tracking-wider">Quick Actions</h2>
            <button className={`${actionButton} border border-gray-300 text-gray-700`} onClick={refreshRuntimeState} disabled={loading}>
              <RefreshCw size={14} /> Refresh Runtime State
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button disabled={loading} onClick={startOrchestrator} className={`${actionButton} bg-emerald-600 text-white`}>
              <Play size={14} /> Start Orchestrator
            </button>
            <button disabled={loading} onClick={stopOrchestrator} className={`${actionButton} border border-rose-300 text-rose-700 bg-rose-50`}>
              <Square size={14} /> Stop Orchestrator
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Queue Command / Instruction</label>
            <div className="flex gap-3 flex-col md:flex-row">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Enter an orchestration instruction..."
                className="border border-gray-300 rounded-xl px-3 py-2 flex-1 text-sm"
              />
              <button
                disabled={loading || !instruction.trim()}
                onClick={queueInstruction}
                className={`${actionButton} bg-[#1B2B5E] text-white justify-center`}
              >
                <Terminal size={14} /> Queue Command
              </button>
            </div>
          </div>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>

        <aside className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-black text-[#1B2B5E] uppercase tracking-wider">System Health</h2>
          <p className="text-sm text-gray-600">Current Runtime Status</p>
          <div className="text-xl font-black text-[#1B2B5E]">{runtimeStatusLabel()}</div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Health: {runtimeHealth}</p>
          {runtimeDetail && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">{runtimeDetail}</p>}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Latest Run Activity</p>
            {latestRun ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">{latestRun.type}</p>
                <p className="text-gray-600">{latestRun.instruction}</p>
                <p className="text-xs text-gray-500">Status: {latestRun.status}</p>
                <p className="text-xs text-gray-500">{formatTimestamp(latestRun.created_at)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No runtime activity available yet.</p>
            )}
          </div>
        </aside>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#1B2B5E] uppercase tracking-wider flex items-center gap-2">
            <Terminal size={16} /> Recent Logs
          </h2>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">No persisted runtime logs available.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {logs.slice(0, 8).map((log) => (
              <li key={log.id} className="border border-gray-100 rounded-lg px-3 py-2 text-gray-700">
                <span className="font-bold uppercase text-xs text-gray-500 mr-2">[{log.type}]</span>
                {log.message}
                <span className="block text-xs text-gray-400 mt-1">{formatTimestamp(log.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-black text-[#1B2B5E] uppercase tracking-wider mb-4">Navigation Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {shortcuts.map((item) => (
            <Link key={item.to} to={item.to} className="border border-gray-200 rounded-xl p-4 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors">
              <p className="font-black text-[#1B2B5E]">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
              <span className="text-xs text-[#1B2B5E] font-semibold inline-flex items-center gap-1 mt-3">
                Open <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
