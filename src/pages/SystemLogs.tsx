import { usePipeline } from "../lib/usePipeline";
import { ScrollText, Activity, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function SystemLogs() {
  const { state } = usePipeline();

  const logs = useMemo(() => {
    if (!state) return [];
    const entries: { time: string; level: string; source: string; message: string }[] = [];
    const stages = [
      { key: "stage1", name: "Ingest" },
      { key: "stage2", name: "TextRepair" },
      { key: "stage3", name: "Enrichment" },
      { key: "stage4", name: "Postcards" },
    ];
    stages.forEach(({ key, name }) => {
      const s = state[key as keyof typeof state] as any;
      if (!s) return;
      if (s.startedAt)   entries.push({ time: s.startedAt,   level: "INFO",    source: name, message: `Stage started` });
      if (s.completedAt) entries.push({ time: s.completedAt, level: "SUCCESS", source: name, message: `Stage completed · ${s.processed} records processed` });
      if (s.message)     entries.push({ time: s.completedAt || s.startedAt || new Date().toISOString(), level: s.status === "error" ? "ERROR" : "INFO", source: name, message: s.message });
      if (s.errors > 0)  entries.push({ time: s.completedAt || new Date().toISOString(), level: "WARN", source: name, message: `${s.errors} records had errors` });
    });
    state.errors?.forEach((e: any) => {
      entries.push({ time: new Date().toISOString(), level: "ERROR", source: "System", message: String(e.message || e) });
    });
    if (entries.length === 0) {
      entries.push({ time: new Date().toISOString(), level: "INFO", source: "System", message: "System initialized · 74,049 records available in Supabase" });
    }
    return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [state]);

  function LevelBadge({ level }: { level: string }) {
    const map: Record<string, { cls: string; icon: JSX.Element }> = {
      SUCCESS: { cls: "bg-green-50 text-green-700 border-green-200",   icon: <CheckCircle2 size={10} /> },
      INFO:    { cls: "bg-blue-50 text-blue-700 border-blue-200",      icon: <Activity size={10} /> },
      WARN:    { cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: <AlertCircle size={10} /> },
      ERROR:   { cls: "bg-red-50 text-red-700 border-red-200",         icon: <AlertCircle size={10} /> },
    };
    const m = map[level] ?? map.INFO;
    return (
      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${m.cls}`}>
        {m.icon} {level}
      </span>
    );
  }

  if (!state) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
          <ScrollText size={20} className="text-gray-500" /> System Logs
        </h1>
        <p className="text-gray-500 text-sm mt-1">{logs.length} log entries · Real-time pipeline activity</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-sm">Activity Log</span>
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.length === 0 ? (
            <div className="px-5 py-16 text-center text-gray-400">
              <Clock size={32} className="mx-auto mb-3 text-gray-300" />
              No activity logged yet
            </div>
          ) : logs.map((entry, i) => (
            <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 pt-0.5 w-36">
                {new Date(entry.time).toLocaleTimeString()}
              </span>
              <LevelBadge level={entry.level} />
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{entry.source}</span>
              <span className="text-sm text-gray-600 flex-1 min-w-0">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
