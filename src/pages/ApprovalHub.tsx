import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2, CheckSquare } from "lucide-react";
import { usePipeline } from "../lib/usePipeline";

interface ReviewBusiness {
  id: string | number;
  name_ar: string;
  original_name_ar?: string;
  name_ku?: string;
  original_name_ku?: string;
  name_en?: string;
  category?: string;
  city?: string;
  phone?: string;
  confidence?: number;
  needs_verification?: boolean;
  data_quality_score?: number;
}

export default function ApprovalHub() {
  const { approve, reject } = usePipeline();
  const [records, setRecords]   = useState<ReviewBusiness[]>([]);
  const [loading, setLoading]   = useState(false);
  const [actionId, setActionId] = useState<string | number | null>(null);

  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/businesses/review");
    const json = await res.json();
    setRecords(json.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string | number) => {
    setActionId(id);
    await approve(id);
    setRecords(r => r.filter(x => String(x.id) !== String(id)));
    setActionId(null);
  };

  const handleReject = async (id: string | number) => {
    setActionId(id);
    await reject(id);
    setRecords(r => r.filter(x => String(x.id) !== String(id)));
    setActionId(null);
  };

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
            <CheckSquare size={20} className="text-amber-500" /> Approval Hub
          </h1>
          <p className="text-gray-500 text-sm mt-1">{records.length} records need human review</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 text-sm shadow-sm transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
          <div className="text-gray-600 font-medium">All records reviewed</div>
          <div className="text-gray-400 text-sm mt-1">Run the pipeline to generate items for review</div>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                      <AlertTriangle size={11} /> Confidence: {r.confidence ?? "—"}%
                    </span>
                    {r.needs_verification && (
                      <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full font-semibold">Missing Phone</span>
                    )}
                    {r.data_quality_score !== undefined && (
                      <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                        r.data_quality_score >= 80 ? "text-green-700 bg-green-50 border-green-200" :
                        r.data_quality_score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200" :
                        "text-red-700 bg-red-50 border-red-200"
                      }`}>Quality: {r.data_quality_score}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-semibold">Original</div>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-1 border border-gray-100">
                        <div className="font-bold text-gray-900" dir="rtl">{r.original_name_ar || r.name_ar}</div>
                        {r.original_name_ku && <div className="text-gray-500 text-sm" dir="rtl">{r.original_name_ku}</div>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-600 uppercase tracking-wider mb-2 font-semibold">AI Suggestion</div>
                      <div className="bg-amber-50 rounded-xl p-4 space-y-1 border border-amber-100">
                        <div className="font-bold text-gray-900" dir="rtl">{r.name_ar}</div>
                        {r.name_ku && <div className="text-gray-500 text-sm" dir="rtl">{r.name_ku}</div>}
                        {r.name_en && <div className="text-gray-400 text-sm">{r.name_en}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                    {r.category && <span>Category: <span className="text-gray-600 font-medium">{r.category}</span></span>}
                    {r.city     && <span>City: <span className="text-gray-600 font-medium">{r.city}</span></span>}
                    {r.phone    && <span>Phone: <span className="text-gray-600 font-medium">{r.phone}</span></span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={actionId === r.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {actionId === r.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={actionId === r.id}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
