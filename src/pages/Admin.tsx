import { Link } from "react-router-dom";
import { AgentControlPanel } from "../components/admin/AgentControlPanel";

export default function Admin() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agent Orchestrator</h1>
          <Link to="/" className="text-sm text-emerald-400 hover:text-emerald-300">
            Back to Directory
          </Link>
import { useEffect, useMemo, useState } from "react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { ALLOWED_CATEGORIES } from "../lib/categories";
import { AgentControlPanel } from "../components/admin/AgentControlPanel";

type BusinessRow = {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  government_rate: string | null;
  phone: string | null;
  website: string | null;
  verification_status: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

export default function Admin() {
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALLOWED_CATEGORIES[0]);
  const [selectedRate, setSelectedRate] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  async function fetchGrid() {
    setLoading(true);

    let query = supabase
      .from("businesses")
      .select("id,name,category,city,government_rate,phone,website,verification_status,created_at")
      .eq("category", selectedCategory)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (selectedRate !== "all") {
      query = query.eq("government_rate", selectedRate);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load grid", error);
      setRows([]);
    } else {
      setRows((data as BusinessRow[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchGrid();
  }, [selectedCategory, selectedRate, offset]);

  useEffect(() => {
    const channel = supabase
      .channel("business_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "businesses",
        },
        () => {
          fetchGrid();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, selectedRate, offset]);

  const rates = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (row.government_rate) {
        set.add(row.government_rate);
      }
    });
    return Array.from(set);
  }, [rows]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Business Dashboard</h1>
        <AgentControlPanel />

        <div className="flex gap-3 flex-wrap">
          <select
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setOffset(0);
import { SystemLog } from "../components/admin/SystemLog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const STATIC_GOVERNORS = [
  { id: 1, name: "Baghdad", category: "Restaurants", emoji: "🍽️", color: "#FF6B35", records: 3247, target: 4000, status: "active", lastRun: "2m ago", errors: 2, governmentRate: "Rate Level 1" },
  { id: 2, name: "Basra", category: "Cafes", emoji: "☕", color: "#F7B731", records: 1892, target: 2500, status: "active", lastRun: "5m ago", errors: 0, governmentRate: "Rate Level 1" },
  { id: 3, name: "Nineveh", category: "Bakeries", emoji: "🥐", color: "#FC5C65", records: 843, target: 1200, status: "idle", lastRun: "1h ago", errors: 1, governmentRate: "Rate Level 1" },
  { id: 4, name: "Erbil", category: "Hotels", emoji: "🏨", color: "#45AAF2", records: 612, target: 800, status: "active", lastRun: "8m ago", errors: 0, governmentRate: "Rate Level 1" },
  { id: 5, name: "Sulaymaniyah", category: "Gyms", emoji: "💪", color: "#26de81", records: 438, target: 600, status: "active", lastRun: "12m ago", errors: 3, governmentRate: "Rate Level 2" },
  { id: 6, name: "Kirkuk", category: "Beauty Salons", emoji: "💅", color: "#fd9644", records: 1124, target: 1500, status: "active", lastRun: "3m ago", errors: 0, governmentRate: "Rate Level 2" },
  { id: 7, name: "Duhok", category: "Barbershops", emoji: "✂️", color: "#a55eea", records: 967, target: 1200, status: "idle", lastRun: "45m ago", errors: 0, governmentRate: "Rate Level 2" },
  { id: 8, name: "Anbar", category: "Pharmacies", emoji: "💊", color: "#2bcbba", records: 756, target: 1000, status: "active", lastRun: "6m ago", errors: 1, governmentRate: "Rate Level 2" },
  { id: 9, name: "Babil", category: "Supermarkets", emoji: "🛒", color: "#4b7bec", records: 521, target: 700, status: "active", lastRun: "9m ago", errors: 0, governmentRate: "Rate Level 3" },
  { id: 10, name: "Karbala", category: "Electronics", emoji: "📱", color: "#0fb9b1", records: 389, target: 600, status: "error", lastRun: "2h ago", errors: 12, governmentRate: "Rate Level 3" },
  { id: 11, name: "Wasit", category: "Clothing Stores", emoji: "👗", color: "#e84393", records: 1043, target: 1400, status: "active", lastRun: "4m ago", errors: 0, governmentRate: "Rate Level 3" },
  { id: 12, name: "Dhi Qar", category: "Car Services", emoji: "🚗", color: "#778ca3", records: 334, target: 500, status: "idle", lastRun: "3h ago", errors: 0, governmentRate: "Rate Level 3" },
  { id: 13, name: "Maysan", category: "Dentists", emoji: "🦷", color: "#20bf6b", records: 287, target: 400, status: "active", lastRun: "15m ago", errors: 0, governmentRate: "Rate Level 4" },
  { id: 14, name: "Muthanna", category: "Clinics", emoji: "🏥", color: "#eb3b5a", records: 412, target: 600, status: "active", lastRun: "7m ago", errors: 2, governmentRate: "Rate Level 4" },
  { id: 15, name: "Najaf", category: "Schools", emoji: "🏫", color: "#f7b731", records: 891, target: 1100, status: "active", lastRun: "11m ago", errors: 0, governmentRate: "Rate Level 4" },
  { id: 16, name: "Qadisiyyah", category: "Co-working Spaces", emoji: "💼", color: "#45aaf2", records: 156, target: 300, status: "idle", lastRun: "6h ago", errors: 1, governmentRate: "Rate Level 5" },
  { id: 17, name: "Saladin", category: "Entertainment", emoji: "🎭", color: "#fa8231", records: 743, target: 1000, status: "active", lastRun: "18m ago", errors: 0, governmentRate: "Rate Level 5" },
  { id: 18, name: "Diyala", category: "Tourism", emoji: "🕌", color: "#2d98da", records: 512, target: 800, status: "active", lastRun: "22m ago", errors: 4, governmentRate: "Rate Level 5" },
  { id: 19, name: "QC Overseer", category: "Quality Control", emoji: "🛡️", color: "#f8fafc", records: 15420, target: 20000, status: "active", lastRun: "1m ago", errors: 0, governmentRate: "Supervisory" },
];

const statusConfig: Record<string, any> = {
  active: { label: "ACTIVE", bg: "rgba(38,222,129,0.15)", border: "#26de81", dot: "#26de81" },
  idle:   { label: "IDLE",   bg: "rgba(247,183,49,0.15)",  border: "#F7B731", dot: "#F7B731" },
  error:  { label: "ERROR",  bg: "rgba(252,92,101,0.15)",  border: "#FC5C65", dot: "#FC5C65" },
};

function pulse(color: string) {
  return {
    width: 8, height: 8, borderRadius: "50%", background: color,
    boxShadow: `0 0 0 0 ${color}`,
    animation: "pulse 1.8s infinite",
  };
}

export default function Admin() {
  const [time, setTime] = useState(new Date());
  const [animatedRecords, setAnimatedRecords] = useState<Record<string, number>>({});
  const [selectedGov, setSelectedGov] = useState<string | number | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [governors, setGovernors] = useState(STATIC_GOVERNORS);
  const [newToday, setNewToday] = useState(1247); // Mocked for visual

  // Pagination & Dropdown states
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedGovId, setExpandedGovId] = useState<string | number | null>(null);
  const [govRecords, setGovRecords] = useState<Record<string | number, any[]>>({});
  const [loadingRecords, setLoadingRecords] = useState<Record<string | number, boolean>>({});

  const itemsPerPage = 6;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for agents
    const channel = supabase
      .channel("public:agents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedGovId(null);
  }, [activeFilter]);

  async function fetchGovRecords(govId: string | number, govName: string) {
    if (govRecords[govId]) return;
    
    setLoadingRecords(prev => ({ ...prev, [govId]: true }));
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("name, category, status, created_at, source, verification_status")
        .eq("governorate", govName)
        .limit(10)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setGovRecords(prev => ({ ...prev, [govId]: data || [] }));
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoadingRecords(prev => ({ ...prev, [govId]: false }));
    }
  }

  async function fetchData() {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("id, agent_name, category, status, records_collected, target, errors, last_run")
        .order("agent_name");
        
      if (error) throw error;

      if (data && data.length > 0) {
        let merged = data.map((dbGov) => {
          // Extract governor index from name like "Agent-01"
          let govIndex = -1;
          const match = dbGov.agent_name.match(/Agent-(\d+)/i);
          if (match) {
            govIndex = parseInt(match[1], 10) - 1;
          }

          // Map to static governor data for visual properties (emoji, color, name)
          const staticGov = (govIndex >= 0 && govIndex < STATIC_GOVERNORS.length) 
            ? STATIC_GOVERNORS[govIndex] 
            : STATIC_GOVERNORS.find(g => g.name === dbGov.agent_name) || ({} as any);
          
          // Format last run time from Supabase timestamp
          let lastRunStr = "Never";
          if (dbGov.last_run) {
            const diffMins = Math.round((new Date().getTime() - new Date(dbGov.last_run).getTime()) / 60000);
            if (diffMins < 60) lastRunStr = `${diffMins}m ago`;
            else if (diffMins < 1440) lastRunStr = `${Math.floor(diffMins / 60)}h ago`;
            else lastRunStr = new Date(dbGov.last_run).toLocaleDateString();
          }

          // Prioritize Supabase data, fallback to static template
          return {
            id: dbGov.id,
            name: staticGov.name || dbGov.agent_name,
            category: dbGov.category || staticGov.category,
            emoji: staticGov.emoji || "🤖",
            color: staticGov.color || "#45AAF2",
            records: dbGov.records_collected || 0,
            target: dbGov.target || staticGov.target || 1000,
            status: dbGov.status || "idle",
            lastRun: lastRunStr,
            errors: dbGov.errors || 0,
            governmentRate: staticGov.governmentRate || "Rate Level 1"
          };
        });

        // Ensure QC Overseer is always present
        if (!merged.find(g => g.name === "QC Overseer" || g.name === "Agent-QC")) {
          merged.push(STATIC_GOVERNORS.find(g => g.name === "QC Overseer")!);
        }

        setGovernors(merged as any);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  }

  useEffect(() => {
    // Animate numbers counting up
    const initial: Record<string, number> = {};
    governors.forEach(g => { initial[g.id] = 0; });
    setAnimatedRecords(initial);
    
    const timers = governors.map((g, i) =>
      setTimeout(() => {
        let count = 0;
        const step = Math.ceil(g.records / 60) || 1;
        const iv = setInterval(() => {
          count = Math.min(count + step, g.records);
          setAnimatedRecords(prev => ({ ...prev, [g.id]: count }));
          if (count >= g.records) clearInterval(iv);
        }, 20);
      }, i * 80)
    );
    return () => timers.forEach(clearTimeout);
  }, [governors]);

  const totalRecords = governors.reduce((a, g) => a + g.records, 0);
  const activeCount = governors.filter(g => g.status === "active").length;
  const errorCount = governors.filter(g => g.status === "error").length;
  const totalTarget = governors.reduce((a, g) => a + g.target, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalRecords / totalTarget) * 100) : 0;

  const filtered = activeFilter === "all" ? governors : governors.filter(g => g.status === activeFilter);

  // Chart Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    governors.forEach(g => {
      counts[g.category] = (counts[g.category] || 0) + g.records;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [governors]);

  const statusData = useMemo(() => [
    { name: 'Active', value: activeCount, color: '#26de81' },
    { name: 'Idle', value: governors.length - activeCount - errorCount, color: '#F7B731' },
    { name: 'Error', value: errorCount, color: '#FC5C65' },
  ], [activeCount, errorCount, governors.length]);

  return (
    <div style={{
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      background: "#090d13",
      minHeight: "100vh",
      color: "#e2e8f0",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 currentColor; }
          70% { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gov-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.2) !important;
          cursor: pointer;
        }
        .gov-card { transition: all 0.2s ease; }
        .filter-btn:hover { opacity: 1 !important; }
      `}</style>

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Scan line effect */}
      <div style={{
        position: "fixed", left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(69,170,242,0.4), transparent)",
        zIndex: 1, animation: "scan 4s linear infinite", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "#45AAF2", letterSpacing: 6, fontWeight: 700 }}>
                IRAQ COMPASS // GOVERNOR CONTROL CENTER
              </div>
              <div style={{ fontSize: 9, color: "#26de81", animation: "blink 1.2s infinite", letterSpacing: 2 }}>
                ● LIVE
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, color: "#fff" }}>
              18 GOVERNORS DASHBOARD
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, letterSpacing: 2, display: "flex", gap: "16px" }}>
              <span>BUSINESS INTELLIGENCE COLLECTION NETWORK</span>
              <Link to="/" style={{ color: "#45AAF2", textDecoration: "none", borderBottom: "1px solid #45AAF2" }}>
                [ RETURN TO PUBLIC DIRECTORY ]
              </Link>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#45AAF2", letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2 }}>
              {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "TOTAL RECORDS", value: totalRecords.toLocaleString(), sub: `${overallProgress}% of target`, color: "#45AAF2", icon: "◈" },
            { label: "ACTIVE GOVERNORS", value: `${activeCount} / ${governors.length}`, sub: `${governors.length - activeCount - errorCount} idle`, color: "#26de81", icon: "▶" },
            { label: "NEW TODAY", value: `+${newToday.toLocaleString()}`, sub: "across all categories", color: "#f7b731", icon: "↑" },
            { label: "QC VERIFIED", value: "98.4%", sub: "Source authenticity score", color: "#f8fafc", icon: "🛡️" },
            { label: "ERRORS", value: errorCount, sub: `${governors.reduce((a,g)=>a+g.errors,0)} total issues`, color: "#FC5C65", icon: "⚠" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              borderTop: `2px solid ${stat.color}`,
              borderRight: `1px solid rgba(255,255,255,0.07)`,
              borderBottom: `1px solid rgba(255,255,255,0.07)`,
              borderLeft: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: 8, padding: "20px 20px",
              animation: `slideIn 0.4s ease ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 3, marginBottom: 8 }}>
                {stat.icon} {stat.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, fontVariantNumeric: "tabular-nums" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
          {/* Category Distribution Chart */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "20px",
            height: 300
          }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 3, marginBottom: 20 }}>
              ◈ CATEGORY DISTRIBUTION (BY RECORDS)
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ background: '#090d13', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }}
                  itemStyle={{ color: '#45AAF2' }}
                />
                <Bar dataKey="value" fill="#45AAF2" radius={[0, 4, 4, 0]} barSize={12}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Network Status Pie */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "20px",
            height: 300,
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 3, marginBottom: 20 }}>
              ◈ NETWORK STATUS
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#090d13', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: -20 }}>
              {statusData.map(s => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 9, color: "#64748b" }}>{s.name.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simplified Iraq Map (SVG) */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "20px",
            height: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 3, marginBottom: 20, width: "100%" }}>
              ◈ GEOGRAPHIC COVERAGE
            </div>
            <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", opacity: 0.6 }}>
              {/* Abstract Iraq Shape */}
              <path d="M100,20 L140,40 L160,80 L150,140 L100,180 L50,140 L40,80 L60,40 Z" fill="none" stroke="#45AAF2" strokeWidth="1" strokeDasharray="4 4" />
              {/* Governor Dots */}
              {governors.map((g, idx) => {
                const angle = (idx / governors.length) * Math.PI * 2;
                const r = 60 + Math.random() * 10;
                const x = 100 + Math.cos(angle) * r;
                const y = 100 + Math.sin(angle) * r;
                return (
                  <circle 
                    key={g.id} 
                    cx={x} cy={y} r={3} 
                    fill={statusConfig[g.status]?.dot || "#45AAF2"} 
                    style={{ animation: g.status === 'active' ? 'blink 1.5s infinite' : 'none' }}
                  />
                );
              })}
              <text x="100" y="105" textAnchor="middle" fill="#45AAF2" fontSize="10" fontWeight="bold" style={{ letterSpacing: 2 }}>IRAQ_NET</text>
            </svg>
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8, padding: "16px 20px", marginBottom: 28,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: 3, color: "#64748b" }}>◈ OVERALL NETWORK PROGRESS</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#45AAF2" }}>{overallProgress}% — {totalRecords.toLocaleString()} / {totalTarget.toLocaleString()} records</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4, width: `${overallProgress}%`,
              background: "linear-gradient(90deg, #45AAF2, #26de81)",
              transition: "width 1s ease",
              boxShadow: "0 0 10px rgba(69,170,242,0.5)",
            }} />
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["all", "active", "idle", "error"].map(f => (
            <button key={f} className="filter-btn" onClick={() => setActiveFilter(f)} style={{
              background: activeFilter === f ? "rgba(69,170,242,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeFilter === f ? "#45AAF2" : "rgba(255,255,255,0.07)"}`,
              color: activeFilter === f ? "#45AAF2" : "#64748b",
              borderRadius: 4, padding: "6px 16px",
              fontSize: 11, letterSpacing: 2, fontFamily: "inherit", cursor: "pointer",
              opacity: 0.9, transition: "all 0.15s",
            }}>
              {f.toUpperCase()}
              {f !== "all" && <span style={{ marginLeft: 8, opacity: 0.7 }}>
                ({governors.filter(g => g.status === f).length})
              </span>}
            </button>
          ))}
        </div>

        {/* Pagination Controls */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: currentPage === 1 ? "#334155" : "#45AAF2",
              padding: "8px 16px",
              borderRadius: 4,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: 11,
              letterSpacing: 1,
              transition: "all 0.2s"
            }}
          >
            {ALLOWED_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
            value={selectedRate}
            onChange={(e) => {
              setSelectedRate(e.target.value);
              setOffset(0);
            }}
          >
            <option value="all">all government rates</option>
            {rates.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </div>

        <div className="border border-neutral-800 rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left">
              <tr>
                <th className="px-3 py-2">Business Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Government Rate</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Website</th>
                <th className="px-3 py-2">Verification Status</th>
                <th className="px-3 py-2">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2">{row.city}</td>
                  <td className="px-3 py-2">{row.government_rate}</td>
                  <td className="px-3 py-2">{row.phone}</td>
                  <td className="px-3 py-2">{row.website}</td>
                  <td className="px-3 py-2">{row.verification_status}</td>
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-neutral-400">
                    No rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded bg-neutral-800 disabled:opacity-50"
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </button>
          <button
            className="px-3 py-2 rounded bg-neutral-800"
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </button>
          <span className="text-sm text-neutral-400">offset: {offset}</span>
        {/* Agent Monitoring Panel (Admin View) */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8, padding: "24px", marginBottom: 28,
        }}>
          <div style={{ fontSize: 11, color: "#45AAF2", letterSpacing: 3, marginBottom: 20, fontWeight: 700 }}>
            ◈ AGENT MONITORING PANEL
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "inherit" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>AGENT ID</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>GOVERNMENT RATE</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>BUSINESSES COLLECTED</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>LAST ACTIVITY</th>
                </tr>
              </thead>
              <tbody>
                {governors.map((gov) => (
                  <tr key={gov.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} className="hover:bg-white/5">
                    <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700 }}>
                      {gov.name.toUpperCase()} <span style={{ opacity: 0.4, fontSize: 10 }}>#{gov.id}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#45AAF2" }}>{gov.governmentRate}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusConfig[gov.status]?.dot || "#64748b" }} />
                        <span style={{ color: statusConfig[gov.status]?.dot || "#64748b", fontWeight: 700, fontSize: 10 }}>{gov.status.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>{gov.records.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{gov.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Governor Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((gov, i) => {
            const pct = gov.target > 0 ? Math.round((gov.records / gov.target) * 100) : 0;
            const sc = statusConfig[gov.status] || statusConfig.idle;
            const isSelected = selectedGov === gov.id;

            return (
              <div key={gov.id} className="gov-card"
                onClick={() => setSelectedGov(isSelected ? null : gov.id)}
                style={{
                  background: isSelected ? "rgba(69,170,242,0.06)" : "rgba(255,255,255,0.025)",
                  borderTop: `1px solid ${isSelected ? "#45AAF2" : "rgba(255,255,255,0.07)"}`,
                  borderRight: `1px solid ${isSelected ? "#45AAF2" : "rgba(255,255,255,0.07)"}`,
                  borderBottom: `1px solid ${isSelected ? "#45AAF2" : "rgba(255,255,255,0.07)"}`,
                  borderLeft: `3px solid ${gov.color}`,
                  borderRadius: 8, padding: "16px 18px",
                  animation: `slideIn 0.4s ease ${i * 0.04}s both`,
                }}>

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{gov.emoji}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", letterSpacing: 1 }}>
                        {gov.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{gov.category}</div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: sc.bg, border: `1px solid ${sc.border}`,
                    borderRadius: 4, padding: "3px 8px",
                  }}>
                    <div style={{ ...pulse(sc.dot), color: sc.dot }} />
                    <span style={{ fontSize: 9, letterSpacing: 2, color: sc.dot, fontWeight: 700 }}>{sc.label}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>PROGRESS</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: gov.color }}>{pct}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3, width: `${pct}%`,
                      background: `linear-gradient(90deg, ${gov.color}88, ${gov.color})`,
                      boxShadow: `0 0 8px ${gov.color}66`,
                      transition: "width 1.2s ease",
                    }} />
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: "7px 8px" }}>
                    <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 2 }}>RECORDS</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>
                      {(animatedRecords[gov.id] || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: "7px 8px" }}>
                    <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 2 }}>TARGET</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                      {gov.target.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: gov.errors > 0 ? "rgba(252,92,101,0.08)" : "rgba(255,255,255,0.04)", borderRadius: 4, padding: "7px 8px" }}>
                    <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 2 }}>ERRORS</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: gov.errors > 0 ? "#FC5C65" : "#26de81" }}>
                      {gov.errors}
                    </div>
                  </div>
                </div>

                {/* Last run */}
                <div style={{ marginTop: 10, fontSize: 10, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                  <span>◷ LAST RUN: {gov.lastRun}</span>
                  <span style={{ color: "#334155" }}>→ NEXT: 6h</span>
                </div>

                {/* View Records Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const isExpanded = expandedGovId === gov.id;
                    setExpandedGovId(isExpanded ? null : gov.id);
                    if (!isExpanded) fetchGovRecords(gov.id, gov.name);
                  }}
                  style={{
                    width: "100%", marginTop: 12, padding: "8px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 4, color: "#45AAF2", fontSize: 10,
                    fontWeight: 700, letterSpacing: 1, cursor: "pointer",
                    transition: "all 0.2s", fontFamily: "inherit"
                  }}
                >
                  {expandedGovId === gov.id ? "▲ HIDE RECORDS" : "▼ VIEW RECORDS"}
                </button>

                {/* Expanded Records */}
                {expandedGovId === gov.id && (
                  <div style={{ 
                    marginTop: 12, padding: "12px", 
                    background: "rgba(0,0,0,0.2)", 
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 4, animation: "slideIn 0.3s ease"
                  }}>
                    {loadingRecords[gov.id] ? (
                      <div style={{ fontSize: 9, color: "#64748b", textAlign: "center", padding: "10px", letterSpacing: 1 }}>
                        FETCHING DATA...
                      </div>
                    ) : govRecords[gov.id]?.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ 
                          display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.6fr 1fr 0.8fr", 
                          gap: 8, fontSize: 7, color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.05)",
                          paddingBottom: 4, fontWeight: 700, letterSpacing: 1
                        }}>
                          <span>NAME</span>
                          <span>CATEGORY</span>
                          <span>STATUS</span>
                          <span>SOURCE</span>
                          <span>VERIFIED</span>
                        </div>
                        {govRecords[gov.id].map((rec, idx) => (
                          <div key={idx} style={{ 
                            display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.6fr 1fr 0.8fr", 
                            gap: 8, fontSize: 8, borderBottom: "1px solid rgba(255,255,255,0.03)",
                            paddingBottom: 4
                          }}>
                            <span style={{ color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.name}</span>
                            <span style={{ color: "#64748b" }}>{rec.category}</span>
                            <span style={{ color: rec.status === "active" ? "#26de81" : "#f7b731" }}>{rec.status?.toUpperCase()}</span>
                            <span style={{ color: "#45AAF2", fontSize: 7 }}>{rec.source || "GOOGLE_MAPS"}</span>
                            <span style={{ color: rec.verification_status === "verified" ? "#26de81" : "#64748b" }}>
                              {rec.verification_status === "verified" ? "✓ YES" : "PENDING"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 9, color: "#64748b", textAlign: "center", padding: "10px", letterSpacing: 1 }}>
                        NO RECORDS FOUND
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mb-6 text-sm text-neutral-300">
          Start the manager and workers to process Supabase queue tasks and insert verified businesses into the
          frontend directory table.
        </p>
        <AgentControlPanel />

        {/* System Event Log */}
        <SystemLog />

        {/* Footer */}
        <div style={{
          marginTop: 28, padding: "14px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: "#334155", letterSpacing: 2,
        }}>
          <span>IRAQ COMPASS // AI GOVERNOR NETWORK v1.0</span>
          <span>SUPABASE → VERCEL → GITHUB</span>
          <span>AUTO-REFRESH: 30s</span>
        </div>
      </div>
    </main>
  );
}
