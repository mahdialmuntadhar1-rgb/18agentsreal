import { usePipeline } from "../lib/usePipeline";
import { Sparkles, Play, Square, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

export default function DataCleaner() {
  const { state, startStage2, stopStage2, startStage3, stopStage3 } = usePipeline();
  const [loading, setLoading] = useState<string | null>(null);

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

  const repairs = [
    { key: "text-repair",   label: "Text Repair",   desc: "Gemini AI cleans corrupted Arabic & Kurdish text, normalizes encoding errors and OCR artifacts.", stage: s2, startFn: startStage2, stopFn: stopStage2, startKey: "stage2", stopKey: "s2-stop", enabled: s1.status === "done", color: "purple" },
    { key: "enrichment",    label: "Data Enrichment", desc: "AI fills missing categories, cities, and phone numbers from surrounding context.", stage: s3, startFn: startStage3, stopFn: stopStage3, startKey: "stage3", stopKey: "s3-stop", enabled: s2.status === "done", color: "amber"  },
  ];

  const COLOR: Record<string, { bg: string; text: string; btn: string; bar: string; border: string }> = {
    purple: { bg: "bg-purple-50", text: "text-purple-600", btn: "bg-purple-500 hover:bg-purple-600", bar: "bg-purple-500", border: "border-purple-200" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  btn: "bg-amber-500 hover:bg-amber-600",   bar: "bg-amber-500",  border: "border-amber-200"  },
  };

  const totalProcessed = (s2.processed ?? 0) + (s3.processed ?? 0);
  const totalRecords   = state.records.length;

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" /> Data Cleaner
        </h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered text repair and data enrichment tools</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Records Processed", value: totalProcessed.toLocaleString(), color: "text-purple-600" },
          { label: "Text Repaired",     value: s2.processed.toLocaleString(),   color: "text-amber-600"  },
          { label: "Fields Enriched",   value: s3.processed.toLocaleString(),   color: "text-green-600"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {repairs.map(({ key, label, desc, stage, startFn, stopFn, startKey, stopKey, enabled, color }) => {
          const c = COLOR[color];
          const isRunning = stage.status === "running";
          const isDone    = stage.status === "done";
          const pct = stage.total > 0 ? Math.round((stage.processed / stage.total) * 100) : 0;

          return (
            <div key={key} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${isDone ? c.border : "border-gray-100"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <Sparkles size={20} className={c.text} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-gray-900">{label}</span>
                    {isDone    && <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold"><CheckCircle2 size={10} /> Done</span>}
                    {isRunning && <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold"><Loader2 size={10} className="animate-spin" /> Running</span>}
                    {!isDone && !isRunning && <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full font-semibold"><Clock size={10} /> Idle</span>}
                  </div>
                  <div className="text-sm text-gray-400 mb-3">{desc}</div>
                  {stage.message && <div className="text-xs text-gray-500 mb-2 italic">{stage.message}</div>}

                  {stage.total > 0 && (
                    <div className="space-y-1 mb-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{stage.processed.toLocaleString()} / {stage.total.toLocaleString()} records</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  )}

                  {!enabled && !isDone && (
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <AlertCircle size={11} className="text-amber-400" />
                      Complete the previous stage first
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {isRunning ? (
                    <button onClick={() => act(stopFn, stopKey)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-sm transition-all">
                      <Square size={12} /> Stop
                    </button>
                  ) : (
                    <button onClick={() => act(startFn, startKey)} disabled={!enabled} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 ${c.btn}`}>
                      <Play size={12} /> Run
                    </button>
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
