import { useState, useEffect, useRef } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
  agent?: string;
}

const AGENTS = [
  "Baghdad", "Basra", "Nineveh", "Erbil", "Sulaymaniyah", 
  "Kirkuk", "Duhok", "Anbar", "Babil", "Karbala", "QC_OVERSEER"
];

const MESSAGES = [
  "Payload received from Google Maps API",
  "Enriching record with social media handles",
  "Validation passed for business entity",
  "Connection timeout, retrying in 5s",
  "New category detected: 'Art Gallery'",
  "Database sync complete",
  "Rate limit reached for Yelp API",
  "Agent heartbeat detected",
  "Coordinates verified for location",
  "Duplicate record merged",
  "QC: Verifying source authenticity",
  "QC: Flagging potential mock data in Basra",
  "QC: Cross-referencing Yelp vs Google data",
  "QC: Agent performance audit initiated",
  "QC: Source verification successful for Baghdad"
];

export function SystemLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial logs
    const initialLogs: LogEntry[] = Array.from({ length: 10 }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(Date.now() - (10 - i) * 5000).toLocaleTimeString(),
      level: i % 5 === 0 ? "WARN" : i % 8 === 0 ? "ERROR" : "INFO",
      message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      agent: AGENTS[Math.floor(Math.random() * AGENTS.length)]
    }));
    setLogs(initialLogs);

    // Add new logs periodically
    const interval = setInterval(() => {
      const level = Math.random() > 0.8 ? (Math.random() > 0.5 ? "WARN" : "ERROR") : (Math.random() > 0.7 ? "SUCCESS" : "INFO");
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        agent: AGENTS[Math.floor(Math.random() * AGENTS.length)]
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{
      background: "rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 8,
      marginTop: 24,
      fontFamily: "'Courier New', monospace",
      overflow: "hidden"
    }}>
      <div style={{
        padding: "8px 16px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{ fontSize: 10, color: "#45AAF2", letterSpacing: 2, fontWeight: 700 }}>
          [ SYSTEM_EVENT_LOG ]
        </span>
        <span style={{ fontSize: 9, color: "#64748b" }}>
          STREAMING_LIVE_DATAFEED
        </span>
      </div>
      <div 
        ref={scrollRef}
        style={{
          height: 180,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontSize: 11,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent"
        }}
      >
        {logs.map(log => (
          <div key={log.id} style={{ display: "flex", gap: 12, opacity: 0.9 }}>
            <span style={{ color: "#475569", minWidth: 70 }}>[{log.timestamp}]</span>
            <span style={{ 
              color: log.level === "ERROR" ? "#FC5C65" : log.level === "WARN" ? "#F7B731" : log.level === "SUCCESS" ? "#26de81" : "#45AAF2",
              minWidth: 60,
              fontWeight: 700
            }}>
              {log.level}
            </span>
            <span style={{ color: "#64748b", minWidth: 100 }}>AGENT::{log.agent?.toUpperCase()}</span>
            <span style={{ color: "#e2e8f0" }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
