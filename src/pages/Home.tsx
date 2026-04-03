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
  Clock,
  X,
  Phone,
  Instagram,
  Facebook,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { handleSupabaseError, OperationType } from "../lib/supabaseUtils";

interface Business {
  id: string;
  name_en: string;
  name_ar: string;
  name_ku: string;
  category: string;
  city: string;
  phone: string;
  address: string;
  website?: string;
  score: number;
  status: string;
  last_updated: string;
  logo_url?: string;
  cover_image_url?: string;
  description_en?: string;
  description_ar?: string;
  description_ku?: string;
  highlights?: string[];
}

const CATEGORIES = [
  { id: 'all', icon: <Info size={16} />, label: 'All' },
  { id: 'Restaurant', icon: <Coffee size={16} />, label: 'Restaurants' },
  { id: 'Hospital', icon: <Stethoscope size={16} />, label: 'Hospitals' },
  { id: 'Retail', icon: <ShoppingBag size={16} />, label: 'Retail' },
  { id: 'Car Dealer', icon: <Car size={16} />, label: 'Automotive' },
  { id: 'Pharmacy', icon: <Activity size={16} />, label: 'Pharmacy' }
];

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const fetchBusinesses = async () => {
      let query = supabase.from('businesses').select('*');

      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      if (selectedCat !== 'all') {
        query = query.eq('category', selectedCat);
      }

      const { data, error } = await query;

      if (error) {
        await handleSupabaseError(error, OperationType.GET, 'businesses');
        setLoading(false);
        return;
      }

      setBusinesses(data || []);
      setLoading(false);
    };

    fetchBusinesses().catch(() => {});

    // Set up real-time subscription
    const channel = supabase
      .channel('businesses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
        fetchBusinesses().catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCity, selectedCat]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const nameEn = b.name_en || '';
      const nameAr = b.name_ar || '';
      const nameKu = b.name_ku || '';
      return nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
             nameAr.includes(searchTerm) ||
             nameKu.includes(searchTerm);
    });
  }, [businesses, searchTerm]);

  return (
    <div className="min-h-screen pb-20 text-white">
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
          {!selectedCity ? (
            <motion.div
              key="gov-grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4 px-6">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase">
                  Select <span className="text-vibrant-purple">City</span>
                </h2>
                <p className="text-white/60 max-w-xl mx-auto">
                  Access the real-time business directory factory powered by 18 autonomous agents.
                </p>
              </div>

              {/* City Selection Placeholder */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {['Baghdad', 'Basra', 'Erbil', 'Sulaymaniyah'].map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className="p-6 glass rounded-2xl hover:bg-vibrant-purple/20 transition-all text-center"
                  >
                    <span className="text-white font-bold">{city}</span>
                  </button>
                ))}
              </div>
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
                    onClick={() => setSelectedCity(null)}
                    className="p-3 glass rounded-full hover:bg-vibrant-purple transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">
                      {selectedCity} <span className="text-vibrant-purple">Direct Rate</span>
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
                          <tr key={b.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedBusiness(b)}>
                            <td className="px-8 py-6">
                              <div className="font-bold text-lg">{b.name_en || 'Unnamed'}</div>
                              <div className="text-xs text-white/40">{b.address}</div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                  {b.category}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              {(b.status === 'verified' || b.status === 'approved') ? (
                                <div className="flex items-center gap-2 text-vibrant-purple">
                                  <CheckCircle2 size={16} className="drop-shadow-[0_0_5px_rgba(188,19,254,0.8)]" />
                                  <span className="text-[10px] font-black uppercase tracking-tighter">Verified ✅</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-white/20">
                                  <Clock size={16} />
                                  <span className="text-[10px] font-black uppercase tracking-tighter">{b.status || 'Pending'} ⏳</span>
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button className="text-vibrant-purple text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 ml-auto">
                                [View Postcard] <ExternalLink size={12} />
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

      {/* Postcard Modal */}
      <AnimatePresence>
        {selectedBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBusiness(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <BusinessPostcard business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BusinessPostcard({ business, onClose }: { business: Business; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'en' | 'ar' | 'ku'>('en');

  return (
    <div className="flex flex-col max-h-[90vh] overflow-y-auto">
      {/* Hero */}
      <div className="relative h-64">
        {business.cover_image_url ? (
          <img src={business.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 glass rounded-full hover:bg-white/20 transition-all"
        >
          <X size={20} />
        </button>

        <div className="absolute bottom-6 left-8 flex items-end gap-6">
          <div className="w-24 h-24 rounded-2xl glass p-1 shadow-2xl">
            {business.logo_url ? (
              <img src={business.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
                <Globe size={40} className="text-white/20" />
              </div>
            )}
          </div>
          <div className="mb-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter">
              {activeTab === 'en' ? business.name_en : activeTab === 'ar' ? business.name_ar : business.name_ku}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-vibrant-purple font-bold text-xs uppercase tracking-widest">{business.category}</span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-white/40 text-xs uppercase tracking-widest">{business.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Language Tabs */}
        <div className="flex justify-center bg-white/5 p-1 rounded-full w-fit mx-auto">
          {(['en', 'ar', 'ku'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setActiveTab(lang)}
              className={`px-6 py-2 text-xs font-black rounded-full transition-all ${activeTab === lang ? 'bg-vibrant-purple text-white' : 'text-white/40 hover:text-white'}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-lg text-white/80 leading-relaxed italic" dir={activeTab === 'en' ? 'ltr' : 'rtl'}>
            "{activeTab === 'en' ? business.description_en : activeTab === 'ar' ? business.description_ar : business.description_ku || 'Verification in progress...'}"
          </p>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap justify-center gap-3">
          {business.highlights?.map((h, i) => (
            <span key={i} className="px-4 py-1.5 glass rounded-full text-[10px] font-black uppercase tracking-widest text-vibrant-purple">
              {h}
            </span>
          ))}
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ContactIcon icon={<Phone size={20} />} label="Call" value={business.phone} />
          <ContactIcon icon={<MessageCircle size={20} />} label="WhatsApp" value={business.phone} />
          <ContactIcon icon={<Instagram size={20} />} label="Instagram" value="#" />
          <ContactIcon icon={<Facebook size={20} />} label="Facebook" value="#" />
        </div>

        {/* Footer Info */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span>Verified by AI Agent on {business.last_updated ? new Date(business.last_updated).toLocaleDateString() : 'Pending'}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name_en + ' ' + business.city)}`} target="_blank" rel="noreferrer" className="hover:text-vibrant-purple transition-colors flex items-center gap-1">
              [Google Maps] <ExternalLink size={10} />
            </a>
            {business.website && (
              <a href={business.website} target="_blank" rel="noreferrer" className="hover:text-vibrant-purple transition-colors flex items-center gap-1">
                [Official Site] <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactIcon({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
      <div className="text-vibrant-purple">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">{label}</span>
    </div>
  );
}
