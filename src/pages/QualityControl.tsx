import { usePipeline } from "../lib/usePipeline";
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function QualityControl() {
  const { state } = usePipeline();

  const records = state?.records ?? [];
  const total   = records.length;
  const q80     = records.filter((r: any) => (r.data_quality_score ?? 0) >= 80).length;
  const q50     = records.filter((r: any) => (r.data_quality_score ?? 0) >= 50).length;
  const qLow    = total - q50;
  const withPhone    = records.filter((r: any) => r.phone).length;
  const withCategory = records.filter((r: any) => r.category).length;
  const withCity     = records.filter((r: any) => r.city || r.governorate).length;
  const flagged      = records.filter((r: any) => (r.confidence ?? 100) < 70 || r.needs_verification).length;
  const verified     = records.filter((r: any) => r.verified).length;
  const avgScore     = total > 0 ? Math.round(records.reduce((a: number, r: any) => a + (r.data_quality_score ?? 0), 0) / total) : 0;

  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;

  const METRICS = [
    { label: "Avg Quality Score", value: `${avgScore}`,        icon: TrendingUp,   color: "text-blue-600",  bg: "bg-blue-50"   },
    { label: "High Quality ≥80",  value: q80.toLocaleString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50"  },
    { label: "QC Flags",          value: flagged.toLocaleString(), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Verified",          value: verified.toLocaleString(), icon: ShieldCheck,  color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const BARS = [
    { label: "High Quality (≥ 80)", value: q80,                color: "bg-green-500"  },
    { label: "Acceptable (50–79)",  value: q50 - q80,          color: "bg-amber-500"  },
    { label: "Needs Work (< 50)",   value: qLow,               color: "bg-red-500"    },
    { label: "Has Phone Number",    value: withPhone,           color: "bg-blue-500"   },
    { label: "Has Category",        value: withCategory,        color: "bg-purple-500" },
    { label: "Has City/Governorate",value: withCity,            color: "bg-teal-500"   },
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-gray-900 uppercase flex items-center gap-2">
          <ShieldCheck size={20} className="text-green-500" /> Quality Control
        </h1>
        <p className="text-gray-500 text-sm mt-1">Real-time data quality metrics and analysis</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {METRICS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1 font-semibold">{label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <ShieldCheck size={48} className="mx-auto mb-4 text-gray-300" />
          <div className="text-gray-400 font-medium">No records to analyze yet</div>
          <div className="text-gray-300 text-sm mt-1">Run the pipeline to load and process records</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="font-bold text-gray-900 mb-5">Quality Breakdown</div>
          <div className="space-y-4">
            {BARS.map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600 font-medium">{label}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {value.toLocaleString()} <span className="text-gray-400 font-normal">({pct(value)}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct(value)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
