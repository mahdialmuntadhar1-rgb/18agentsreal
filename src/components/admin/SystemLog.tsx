import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

type DbLog = {
  id: string;
  timestamp?: string;
  created_at?: string;
  type?: string;
  message?: string;
  agent_id?: string;
};

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
  agent?: string;
}

function levelFromType(type?: string): LogEntry["level"] {
  const normalized = (type || "info").toLowerCase();
  if (normalized === "error") return "ERROR";
  if (normalized === "warn" || normalized === "warning") return "WARN";
  if (normalized === "success" || normalized === "ok") return "SUCCESS";
  return "INFO";
}

export function SystemLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("agent_logs")
        .select("id,timestamp,created_at,type,message,agent_id")
        .order("created_at", { ascending: false })
        .limit(50);

      const mapped = (data || []).reverse().map((log: DbLog) => ({
        id: String(log.id),
        timestamp: new Date(log.timestamp || log.created_at || new Date().toISOString()).toLocaleTimeString(),
        level: levelFromType(log.type),
        message: log.message || "No message",
        agent: log.agent_id || "unknown",
      }));

      setLogs(mapped);
    };

    fetchLogs();

    const channel = supabase
      .channel("system_log_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_logs" }, (payload) => {
        const log = payload.new as DbLog;
        setLogs((prev) => [
          ...prev.slice(-49),
          {
            id: String(log.id),
            timestamp: new Date(log.timestamp || log.created_at || new Date().toISOString()).toLocaleTimeString(),
            level: levelFromType(log.type),
            message: log.message || "No message",
            agent: log.agent_id || "unknown",
          },
        ]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginTop: 24, fontFamily: "'Courier New', monospace", overflow: "hidden" }}>
      <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#45AAF2", letterSpacing: 2, fontWeight: 700 }}>[ SYSTEM_EVENT_LOG ]</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>LIVE_FROM_SUPABASE</span>
      </div>
      <div ref={scrollRef} style={{ height: 180, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
        {logs.map((log) => (
          <div key={log.id} style={{ display: "flex", gap: 12, opacity: 0.9 }}>
            <span style={{ color: "#475569", minWidth: 70 }}>[{log.timestamp}]</span>
            <span style={{ color: log.level === "ERROR" ? "#FC5C65" : log.level === "WARN" ? "#F7B731" : log.level === "SUCCESS" ? "#26de81" : "#45AAF2", minWidth: 60, fontWeight: 700 }}>{log.level}</span>
            <span style={{ color: "#64748b", minWidth: 100 }}>AGENT::{log.agent?.toUpperCase()}</span>
            <span style={{ color: "#e2e8f0" }}>{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && <span style={{ color: "#64748b" }}>No runtime logs yet. Trigger a discovery run.</span>}
      </div>
    </div>
  );
}
