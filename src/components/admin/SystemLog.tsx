import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, type AgentLogRow } from '../../lib/supabase';

function levelColor(level: AgentLogRow['level']): string {
  if (level === 'error') return '#FC5C65';
  if (level === 'warn') return '#F7B731';
  if (level === 'info') return '#45AAF2';
  return '#94a3b8';
}

export function SystemLog() {
  const [logs, setLogs] = useState<AgentLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('agent_logs')
        .select('id,agent_id,task_id,run_id,level,message,correlation_id,details,created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (loadError) {
        setError(loadError.message);
      } else {
        const rows = ((data ?? []) as AgentLogRow[]).reverse();
        rows.forEach((row) => seen.current.add(row.id));
        setLogs(rows);
      }
      setLoading(false);
    };

    void load();

    const channel = supabase
      .channel('system-log-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
        const row = payload.new as AgentLogRow;
        if (seen.current.has(row.id)) return;
        seen.current.add(row.id);
        setLogs((prev) => [...prev.slice(-99), row]);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const headerRight = useMemo(() => {
    if (loading) return 'LOADING';
    if (error) return 'ERROR';
    return `ROWS ${logs.length}`;
  }, [error, loading, logs.length]);

  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, marginTop: 24, fontFamily: "'Courier New', monospace", overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#45AAF2', letterSpacing: 2, fontWeight: 700 }}>[ SYSTEM_EVENT_LOG ]</span>
        <span style={{ fontSize: 9, color: '#64748b' }}>{headerRight}</span>
      </div>
      <div ref={scrollRef} style={{ height: 180, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
        {error && <div style={{ color: '#FC5C65' }}>Failed to load logs: {error}</div>}
        {!error && loading && <div style={{ color: '#94a3b8' }}>Loading logs…</div>}
        {!error && !loading && logs.length === 0 && <div style={{ color: '#94a3b8' }}>No runtime logs yet.</div>}

        {!error &&
          logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: 12, opacity: 0.9 }}>
              <span style={{ color: '#475569', minWidth: 90 }}>[{new Date(log.created_at).toLocaleTimeString()}]</span>
              <span style={{ color: levelColor(log.level), minWidth: 60, fontWeight: 700 }}>{log.level.toUpperCase()}</span>
              <span style={{ color: '#64748b', minWidth: 120 }}>AGENT::{log.agent_id.toUpperCase()}</span>
              <span style={{ color: '#e2e8f0' }}>{log.message}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
