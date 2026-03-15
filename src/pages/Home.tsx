import React, { useState, useEffect, useMemo } from "react";
import { 
  MapPin, 
  Search, 
  Globe, 
  CheckCircle2, 
  Coffee, 
  Stethoscope, 
  Car, 
  ShoppingBag, 
  Activity,
  ArrowLeft,
  ExternalLink,
  Info,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { GovernorateGrid } from "../components/GovernorateGrid";

interface Business {
  id: number;
  name: string;
  category: string;
  city: string;
  government_rate: string;
  phone: string;
  website: string;
  verification_status: string;
  created_at: string;
}

const CATEGORIES = [
  { id: 'all', icon: <Info size={16} />, label: 'All' },
  { id: 'health', icon: <Stethoscope size={16} />, label: 'Health' },
  { id: 'cafes', icon: <Coffee size={16} />, label: 'Cafes' },
  { id: 'retail', icon: <ShoppingBag size={16} />, label: 'Retail' },
  { id: 'auto', icon: <Car size={16} />, label: 'Automotive' }
];

export default function Home() {
  const [selectedGov, setSelectedGov] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAgentStatuses();
    const subscription = supabase
      .channel("agent_status_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agents" }, (payload) => {
        setAgentStatuses(prev => ({
          ...prev,
          [payload.new.agent_name]: payload.new.status
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (selectedGov) {
      fetchBusinesses();
    }
  }, [selectedGov, selectedCat]);

  const fetchAgentStatuses = async () => {
    const { data } = await supabase.from("agents").select("agent_name, status");
    if (data) {
      const statusMap: Record<string, string> = {};
      data.forEach(a => {
        statusMap[a.agent_name] = a.status;
      });
      setAgentStatuses(statusMap);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    let query = supabase
      .from("businesses")
      .select("*")
      .eq("city", selectedGov);

    if (selectedCat !== "all") {
      query = query.eq("category", selectedCat);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) console.error("Error fetching businesses:", error);
    else setBusinesses(data || []);
    setLoading(false);
  };

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [businesses, searchTerm]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-vibrant-purple rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.5)]">
            <MapPin className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-glow">IRAQ COMPASS</h1>
        </div>
        <Link to="/admin" className="glass px-4 py-2 rounded-full text-sm font-medium hover:bg-vibrant-purple transition-colors">
          Admin Portal
        </Link>
      </header>

      <main className="max-w-7xl mx-auto mt-8">
        <AnimatePresence mode="wait">
          {!selectedGov ? (
            <motion.div
              key="gov-grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4 px-6">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase">
                  Select <span className="text-vibrant-purple">Governorate</span>
                </h2>
                <p className="text-white/60 max-w-xl mx-auto">
                  Access the real-time business directory factory powered by 18 autonomous agents.
                </p>
              </div>

              <GovernorateGrid onSelect={setSelectedGov} agentStatuses={agentStatuses} />
            </motion.div>
          ) : (
            <motion.div
              key="drill-down"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 px-6"
            >
              {/* Back & Title */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedGov(null)}
                    className="p-3 glass rounded-full hover:bg-vibrant-purple transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">
                      {selectedGov} <span className="text-vibrant-purple">Direct Rate</span>
                    </h2>
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <Activity size={14} className="text-vibrant-purple" />
                      <span>Clean Feed Active</span>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text"
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full glass pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:border-vibrant-purple transition-colors"
                  />
                </div>
              </div>

              {/* Category Grid (Horizontal Scroll) */}
              <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`flex-none px-6 py-2 rounded-full border transition-all flex items-center gap-2 ${
                      selectedCat === cat.id 
                        ? "bg-vibrant-purple/40 border-vibrant-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.3)]" 
                        : "bg-purple-900/40 border-purple-500/30 text-white hover:border-vibrant-purple/50"
                    }`}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>

              {/* Business List */}
              <div className="glass rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/40">Business Name</th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/40">Category</th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/40">Status</th>
                        <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={4} className="px-8 py-10">
                              <div className="h-4 bg-white/5 rounded w-full"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredBusinesses.length > 0 ? (
                        filteredBusinesses.map((b) => (
                          <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-bold text-lg">{b.name}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                  {b.category}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {b.verification_status === "verified" || b.phone === "Verified" ? (
                                <div className="flex items-center gap-2 text-vibrant-purple">
                                  <CheckCircle2 size={16} className="drop-shadow-[0_0_5px_rgba(188,19,254,0.8)]" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter">Verified ✅</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-white/20">
                                  <Clock size={16} />
                                  <span className="text-[10px] font-black uppercase tracking-tighter">Pending ⏳</span>
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button className="text-vibrant-purple text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 ml-auto">
                                [View Map] <ExternalLink size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center text-white/20">
                            <div className="flex flex-col items-center gap-4">
                              <Search size={40} />
                              <div className="font-bold uppercase tracking-widest">No businesses found in this sector</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
