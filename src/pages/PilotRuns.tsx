import { useEffect, useRef, useState } from "react";
import { Play, Square, RefreshCw, CheckCircle2, AlertCircle, Clock, Loader2, Download, ShieldCheck, FileText, Rocket, Activity } from "lucide-react";

type StageStatus = "idle" | "running" | "done" | "error";

interface AgentLog { ts: string; agent: string; level: "info" | "success" | "warn" | "error"; msg: string; }
interface GovStage { status: StageStatus; processed: number; total: number; errors: number; message?: string; startedAt?: string; completedAt?: string; }
interface QCReview { approved: number; flagged: number; total: number; status: "pending" | "running" | "done"; issues: string[]; }
interface PilotData {
  governorate: string; displayName: string;
  cleaning: GovStage; enrichment: GovStage; postcards: GovStage; qc: QCReview;
  logs: AgentLog[];
  report: { totalBusinesses: number; totalApproved: number; totalFlagged: number; postcardsReady: number; generatedAt: string } | null;
}
interface PilotState { sulaymaniyah: PilotData; karbala: PilotData; }

const GOVS: Array<{ key: "sulaymaniyah" | "karbala"; label: string; labelAr: string; color: string; bg: string; border: string; bar: string }> = [
  { key: "sulaymaniyah", label: "Sulaymaniyah",  labelAr: "سليمانية",  color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", bar: "bg-purple-500" },
  { key: "karbala",      label: "Karbala",        labelAr: "كربلاء",    color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  bar: "bg-amber-500"  },
];

const STAGES = [
  { key: "cleaning",   label: "1. Data Cleaning",   desc: "Normalize text, remove duplicates",     icon: "🧹" },
  { key: "enrichment", label: "2. Data Enrichment",  desc: "Fill phones, addresses, coordinates",  icon: "🔍" },
  { key: "postcards",  label: "3. Postcard Generation", desc: "Generate profiles & shareable cards", icon: "📮" },
  { key: "qc",         label: "4. Quality Control",  desc: "QC Agent reviews all outputs",         icon: "✅" },
];

function StatusPill({ status }: { status: StageStatus | "pending" }) {
  const map: Record<string, { cls: string; icon: JSX.Element }> = {
    done:    { cls: "bg-green-50 text-green-700 border-green-200",   icon: <CheckCircle2 size={10} /> },
    running: { cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: <Loader2 size={10} className="animate-spin" /> },
    error:   { cls: "bg-red-50   text-red-700   border-red-200",     icon: <AlertCircle size={10} /> },
    idle:    { cls: "bg-gray-100 text-gray-400   border-gray-200",   icon: <Clock size={10} /> },
    pending: { cls: "bg-gray-100 text-gray-400   border-gray-200",   icon: <Clock size={10} /> },
  };
  const m = map[status] ?? map.idle;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${m.cls}`}>
      {m.icon} {status}
    </span>
  );
}

function ProgressBar({ stage, bar }: { stage: GovStage; bar: string }) {
  const pct = stage.total > 0 ? Math.round((stage.processed / stage.total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{stage.processed.toLocaleString()} / {stage.total.toLocaleString()}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}

function LiveLog({ logs, govKey }: { logs: AgentLog[]; govKey: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const levelStyle: Record<string, string> = {
    info:    "text-blue-600",
    success: "text-green-600",
    warn:    "text-amber-600",
    error:   "text-red-600",
  };
  const levelDot: Record<string, string> = {
    info:    "bg-blue-400",
    success: "bg-green-500",
    warn:    "bg-amber-400",
    error:   "bg-red-500",
  };

  const isLive = logs.some(l => {
    const d = new Date(l.ts);
    return Date.now() - d.getTime() < 8000;
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">Agent Activity Log</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-semibold">LIVE</span>
          </div>
        )}
        {!isLive && logs.length === 0 && (
          <span className="text-[10px] text-gray-600">No activity yet</span>
        )}
      </div>

      <div className="h-36 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center pt-8">Run a stage to see agent activity here</div>
        ) : (
          [...logs].reverse().map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${levelDot[log.level] ?? "bg-gray-500"}`} />
              <span className="text-gray-600 flex-shrink-0">{new Date(log.ts).toLocaleTimeString()}</span>
              <span className="text-gray-500 flex-shrink-0">[{log.agent}]</span>
              <span className={levelStyle[log.level] ?? "text-gray-400"}>{log.msg}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

async function api(url: string, method = "POST") {
  const r = await fetch(url, { method });
  return r.json();
}

export default function PilotRuns() {
  const [state, setState] = useState<PilotState | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const load = async () => {
    const data = await fetch("/api/pilot/status").then(r => r.json());
    setState(data);
  };

  useEffect(() => {
    load();
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "pilot") setState(msg.payload);
    };
    const interval = setInterval(load, 3000);
    return () => { es.close(); clearInterval(interval); };
  }, []);

  const act = async (key: string, fn: () => Promise<any>) => {
    setLoading(l => ({ ...l, [key]: true }));
    await fn();
    setLoading(l => ({ ...l, [key]: false }));
    await load();
  };

  if (!state) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  const isAnyRunning = (key: "sulaymaniyah" | "karbala") => {
    const p = state![key];
    return [p.cleaning.status, p.enrichment.status, p.postcards.status, p.qc.status].includes("running");
  };
  const isAllDone = (key: "sulaymaniyah" | "karbala") => {
    const p = state![key];
    return p.cleaning.status === "done" && p.enrichment.status === "done" && p.postcards.status === "done" && p.qc.status === "done";
  };
  const bothRunning = isAnyRunning("sulaymaniyah") || isAnyRunning("karbala");
  const bothDone    = isAllDone("sulaymaniyah") && isAllDone("karbala");

  const runBoth = () => {
    api("/api/pilot/sulaymaniyah/autorun");
    api("/api/pilot/karbala/autorun");
  };

  const stopBoth = () => {
    api("/api/pilot/sulaymaniyah/abort");
    api("/api/pilot/karbala/abort");
  };

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Rocket size={22} className="text-amber-500" />
            <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase">Governorate Pilot Runs</h1>
          </div>
          <p className="text-gray-500 text-sm ml-9">Full AI pipeline pilot for Sulaymaniyah and Karbala · running in parallel</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {bothDone ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold">
              <CheckCircle2 size={16} /> Both Pilots Complete
            </div>
          ) : bothRunning ? (
            <button
              onClick={stopBoth}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow transition-all"
            >
              <Square size={15} /> Stop Both Pilots
            </button>
          ) : (
            <button
              onClick={runBoth}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black shadow-lg transition-all"
            >
              <Rocket size={16} /> Run Both Pilots Automatically
            </button>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-sm text-amber-800 flex items-start gap-3">
        <div className="text-lg mt-0.5">🚀</div>
        <div>
          <span className="font-bold">Auto-run mode:</span> Click "Run Both Pilots Automatically" above to start all 4 stages sequentially for both governorates simultaneously — no manual clicking needed. Each stage unlocks and runs automatically after the previous one completes.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {GOVS.map(({ key, label, labelAr, color, bg, border, bar }) => {
          const pilot = state[key];
          const govStages = STAGES.map(s => ({ ...s, stageData: (pilot as any)[s.key] as GovStage | QCReview }));
          const allDone = pilot.cleaning.status === "done" && pilot.enrichment.status === "done" && pilot.postcards.status === "done" && pilot.qc.status === "done";

          return (
            <div key={key} className={`bg-white rounded-2xl shadow-sm border ${allDone ? border : "border-gray-100"} overflow-hidden`}>
              <div className={`px-5 py-4 ${bg} border-b ${allDone ? border : "border-gray-100"} flex items-center justify-between gap-3`}>
                <div>
                  <div className={`font-black text-lg ${color}`}>{label}</div>
                  <div className="text-xs text-gray-400" dir="rtl">{labelAr}</div>
                </div>
                <div className="flex items-center gap-2">
                  {allDone ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-bold">
                      <CheckCircle2 size={12} /> Complete
                    </span>
                  ) : isAnyRunning(key) ? (
                    <button
                      onClick={() => act(`abort-${key}`, () => api(`/api/pilot/${key}/abort`))}
                      className="flex items-center gap-1.5 text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg font-bold transition-all"
                    >
                      <Square size={11} /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => act(`auto-${key}`, () => api(`/api/pilot/${key}/autorun`))}
                      className={`flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
                        key === "sulaymaniyah" ? "bg-purple-500 hover:bg-purple-600" : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      <Rocket size={11} /> Auto-Run All
                    </button>
                  )}
                  <button
                    onClick={() => act(`reset-${key}`, () => api(`/api/pilot/${key}/reset`))}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white transition-all"
                  >
                    <RefreshCw size={11} className={loading[`reset-${key}`] ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Stage 1: Cleaning */}
                <div className={`rounded-xl p-4 border ${pilot.cleaning.status === "done" ? "border-green-200 bg-green-50/30" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🧹</span>
                      <span className="font-semibold text-gray-900 text-sm">1. Data Cleaning</span>
                      <StatusPill status={pilot.cleaning.status} />
                    </div>
                    {pilot.cleaning.status !== "done" && (
                      <button
                        disabled={pilot.cleaning.status === "running"}
                        onClick={() => act(`clean-${key}`, () => api(`/api/pilot/${key}/cleaning/start`))}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                          pilot.cleaning.status === "running" ? "bg-red-500 text-white hover:bg-red-600" : `${bg.replace("50", "500")} text-white`
                        } disabled:opacity-50`}
                      >
                        {pilot.cleaning.status === "running" ? <><Square size={10} /> Stop</> : <><Play size={10} /> Run</>}
                      </button>
                    )}
                  </div>
                  {pilot.cleaning.message && <div className="text-xs text-gray-500 mb-2">{pilot.cleaning.message}</div>}
                  {pilot.cleaning.total > 0 && <ProgressBar stage={pilot.cleaning} bar={bar} />}
                  {pilot.cleaning.status === "idle" && <div className="text-xs text-gray-400">Normalize Arabic/Kurdish text, remove duplicates, fix encoding errors</div>}
                </div>

                {/* Stage 2: Enrichment */}
                <div className={`rounded-xl p-4 border ${pilot.enrichment.status === "done" ? "border-green-200 bg-green-50/30" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔍</span>
                      <span className="font-semibold text-gray-900 text-sm">2. Data Enrichment</span>
                      <StatusPill status={pilot.enrichment.status} />
                    </div>
                    {pilot.enrichment.status !== "done" && (
                      <button
                        disabled={pilot.cleaning.status !== "done" || pilot.enrichment.status === "running"}
                        onClick={() => act(`enrich-${key}`, () => api(`/api/pilot/${key}/enrichment/start`))}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40`}
                      >
                        <Play size={10} /> Run
                      </button>
                    )}
                  </div>
                  {pilot.enrichment.message && <div className="text-xs text-gray-500 mb-2">{pilot.enrichment.message}</div>}
                  {pilot.enrichment.total > 0 && <ProgressBar stage={pilot.enrichment} bar="bg-blue-500" />}
                  {pilot.enrichment.errors > 0 && <div className="text-xs text-amber-600 mt-1">⚠ {pilot.enrichment.errors} records with missing data</div>}
                  {pilot.enrichment.status === "idle" && <div className="text-xs text-gray-400">Fill phones, addresses, coordinates · requires Cleaning to complete first</div>}
                </div>

                {/* Stage 3: Postcards */}
                <div className={`rounded-xl p-4 border ${pilot.postcards.status === "done" ? "border-green-200 bg-green-50/30" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📮</span>
                      <span className="font-semibold text-gray-900 text-sm">3. Postcard Generation</span>
                      <StatusPill status={pilot.postcards.status} />
                    </div>
                    {pilot.postcards.status !== "done" && (
                      <button
                        disabled={pilot.enrichment.status !== "done" || pilot.postcards.status === "running"}
                        onClick={() => act(`postcards-${key}`, () => api(`/api/pilot/${key}/postcards/start`))}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm bg-green-500 hover:bg-green-600 text-white disabled:opacity-40"
                      >
                        <Play size={10} /> Generate
                      </button>
                    )}
                  </div>
                  {pilot.postcards.message && <div className="text-xs text-gray-500 mb-2">{pilot.postcards.message}</div>}
                  {pilot.postcards.total > 0 && <ProgressBar stage={pilot.postcards} bar="bg-green-500" />}
                  {pilot.postcards.status === "idle" && <div className="text-xs text-gray-400">Generate PDF/PNG postcards with QR codes · saved to output/{key}_postcards.zip</div>}
                </div>

                {/* Stage 4: QC */}
                <div className={`rounded-xl p-4 border ${pilot.qc.status === "done" ? "border-purple-200 bg-purple-50/30" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">✅</span>
                      <span className="font-semibold text-gray-900 text-sm">4. QC Review</span>
                      <StatusPill status={pilot.qc.status === "pending" ? "idle" : pilot.qc.status} />
                    </div>
                    {pilot.qc.status !== "done" && (
                      <button
                        disabled={pilot.postcards.status !== "done" || pilot.qc.status === "running"}
                        onClick={() => act(`qc-${key}`, () => api(`/api/pilot/${key}/qc/start`))}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-40"
                      >
                        <ShieldCheck size={10} /> Run QC
                      </button>
                    )}
                  </div>
                  {pilot.qc.status === "done" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center py-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="text-lg font-black text-green-700">{pilot.qc.approved}</div>
                          <div className="text-[10px] text-green-600 font-semibold">Approved</div>
                        </div>
                        <div className="text-center py-2 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="text-lg font-black text-amber-700">{pilot.qc.flagged}</div>
                          <div className="text-[10px] text-amber-600 font-semibold">Flagged</div>
                        </div>
                      </div>
                      {pilot.qc.issues.length > 0 && (
                        <div className="text-[10px] text-gray-500 space-y-0.5 max-h-20 overflow-y-auto">
                          {pilot.qc.issues.slice(0, 5).map((iss, i) => <div key={i}>⚠ {iss}</div>)}
                          {pilot.qc.issues.length > 5 && <div className="text-gray-400">+{pilot.qc.issues.length - 5} more issues</div>}
                        </div>
                      )}
                    </div>
                  )}
                  {pilot.qc.status !== "done" && <div className="text-xs text-gray-400">QC Agent verifies text, checks for duplicates & mandatory fields · runs after Postcard Generation</div>}
                </div>

                {/* Live Agent Activity Log */}
                <LiveLog logs={pilot.logs} govKey={key} />

                {/* Final Report */}
                {pilot.report && (
                  <div className={`rounded-xl p-4 border ${border} ${bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={14} className={color} />
                      <span className="font-bold text-gray-900 text-sm">Final Report</span>
                      <span className="text-[10px] text-gray-400">{new Date(pilot.report.generatedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: "Total Businesses",     value: pilot.report.totalBusinesses },
                        { label: "Approved by QC",       value: pilot.report.totalApproved   },
                        { label: "Flagged for Re-processing", value: pilot.report.totalFlagged },
                        { label: "Postcards Ready",      value: pilot.report.postcardsReady  },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-lg px-3 py-2 border border-white/60 shadow-sm">
                          <div className="font-black text-gray-900">{value.toLocaleString()}</div>
                          <div className="text-gray-400 text-[10px]">{label}</div>
                        </div>
                      ))}
                    </div>
                    <a
                      href={`/api/pilot/${key}/progress`}
                      download={`${key}_pilot_report.json`}
                      className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold shadow-sm transition-all"
                    >
                      <Download size={12} /> Download Progress File
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
