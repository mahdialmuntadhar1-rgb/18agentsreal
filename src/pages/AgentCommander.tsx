import React, { useRef, useState } from "react";
import { usePipeline } from "../lib/usePipeline";
import { Upload, Play, Square, RefreshCw, CheckCircle2, AlertCircle, Clock, Loader2, Database, Terminal } from "lucide-react";

const STAGE_INFO = [
  { key: "stage1", num: 1, label: "Ingest",      desc: "Pull 74k records from Supabase + optional JSON merge", color: "blue"   },
  { key: "stage2", num: 2, label: "Text Repair",  desc: "Gemini AI cleans corrupted Arabic/Kurdish text",       color: "purple" },
  { key: "stage3", num: 3, label: "Enrichment",   desc: "Fill missing categories, cities, phones",              color: "amber"  },
  { key: "stage4", num: 4, label: "Postcards",    desc: "Generate visual HTML business postcards",              color: "green"  },
] as const;

const COLORS = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-600",   bar: "bg-blue-500",   btn: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"   },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", bar: "bg-purple-500", btn: "bg-purple-500 hover:bg-purple-600 text-white border-purple-500" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-600",  bar: "bg-amber-500",  btn: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"  },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-600",  bar: "bg-green-500",  btn: "bg-green-500 hover:bg-green-600 text-white border-green-500"  },
};

function StatusIcon({ status }: { status: string }) {
  if (status === "done")    return <CheckCircle2 size={15} className="text-green-500" />;
  if (status === "running") return <Loader2 size={15} className="text-amber-500 animate-spin" />;
  if (status === "error")   return <AlertCircle size={15} className="text-red-500" />;
  return <Clock size={15} className="text-gray-400" />;
}

export default function AgentCommander() {
  const { state, startStage1, startStage2, stopStage2, startStage3, stopStage3, startStage4, stopStage4, reset } = usePipeline();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [jsonInfo, setJsonInfo] = useState<{ name: string; count: number; data: any[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(raw) ? raw : [raw];
        setJsonInfo({ name: file.name, count: arr.length, data: arr });
      } catch { alert("Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const act = async (fn: () => Promise<any>, key: string) => {
    setLoading(key);
    await fn();
    setLoading(null);
  };

  if (!state) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  const s1 = state.stage1, s2 = state.stage2, s3 = state.stage3;

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
            <Terminal size={20} className="text-amber-500" /> Agent Commander
          </h1>
          <p className="text-gray-500 text-sm mt-1">Control and monitor all AI pipeline stages</p>
        </div>
        <button
          onClick={() => act(reset, "reset")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300 text-sm transition-all shadow-sm"
        >
          <RefreshCw size={13} className={loading === "reset" ? "animate-spin" : ""} /> Reset All
        </button>
      </div>

      <div className="space-y-3">
        {STAGE_INFO.map(({ key, num, label, desc, color }) => {
          const stage = state[key as keyof typeof state] as any;
          const c = COLORS[color];
          const pct = stage.total > 0 ? Math.round((stage.processed / stage.total) * 100) : 0;
          const isRunning = stage.status === "running";
          const isDone    = stage.status === "done";

          return (
            <div key={key} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${isDone ? c.border : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-lg font-black ${c.text}`}>{num}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <StatusIcon status={stage.status} />
                      <span className="font-bold text-gray-900 text-sm">{label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                        isDone    ? "bg-green-50 text-green-700 border border-green-200" :
                        isRunning ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                    "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}>{stage.status}</span>
                    </div>
                    <div className="text-xs text-gray-400">{stage.message || desc}</div>

                    {stage.total > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{stage.processed.toLocaleString()} / {stage.total.toLocaleString()}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${c.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                  {key === "stage1" && (
                    <>
                      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
                      <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800 text-xs transition-all">
                        <Upload size={11} />
                        {jsonInfo ? `+ ${jsonInfo.count.toLocaleString()} from JSON` : "Add JSON (optional)"}
                      </button>
                      <button
                        onClick={() => act(() => startStage1(jsonInfo?.data), "stage1")}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"
                      >
                        {loading === "stage1" || isRunning
                          ? <><Loader2 size={12} className="animate-spin" /> Loading...</>
                          : <><Database size={12} /> Load from Supabase</>}
                      </button>
                    </>
                  )}
                  {key === "stage2" && (
                    isRunning
                      ? <button onClick={() => act(stopStage2, "s2-stop")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all shadow-sm"><Square size={12} /> Stop</button>
                      : <button onClick={() => act(startStage2, "stage2")} disabled={s1.status !== "done"} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"><Play size={12} /> Run Repair</button>
                  )}
                  {key === "stage3" && (
                    isRunning
                      ? <button onClick={() => act(stopStage3, "s3-stop")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all shadow-sm"><Square size={12} /> Stop</button>
                      : <button onClick={() => act(startStage3, "stage3")} disabled={s2.status !== "done"} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"><Play size={12} /> Run Enrichment</button>
                  )}
                  {key === "stage4" && (
                    isRunning
                      ? <button onClick={() => act(stopStage4, "s4-stop")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all shadow-sm"><Square size={12} /> Stop</button>
                      : <button onClick={() => act(() => startStage4(), "stage4")} disabled={s3.status !== "done"} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"><Play size={12} /> Generate</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
