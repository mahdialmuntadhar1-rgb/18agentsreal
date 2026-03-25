import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Play, Filter, CheckCircle, Clock, XCircle, 
  MoreVertical, Eye, Edit2, Trash2, Globe, Phone, MapPin, 
  ExternalLink, ChevronRight, X, LayoutDashboard, Database,
  Activity, Settings, LogOut, Menu, Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- Types ---
interface Business {
  id: string;
  business_id: string;
  name: { en: string; ar: string; ku: string };
  category: string;
  subcategory: string;
  city: string;
  district: string;
  verified: boolean;
  verification_score: number;
  sources: string[];
  contact: {
    phone: string[];
    whatsapp: string;
    website: string;
    instagram: string;
    facebook: string;
  };
  location: {
    google_maps_url: string;
    address: { en: string; ar: string; ku: string };
  };
  postcard: {
    logo_url: string;
    cover_image_url: string;
    highlights: string[];
    description: { en: string; ar: string; ku: string };
  };
  agent_notes: string;
  last_verified: string;
}

const COLORS = {
  navy: '#1B2B5E',
  gold: '#C9A84C',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export default function Admin() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: 'All',
    category: 'All',
    status: 'All'
  });

  useEffect(() => {
    fetchBusinesses();
    const subscription = supabase
      .channel('businesses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, fetchBusinesses)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    // Handle trilingual name search
    const nameEn = b.name?.en || '';
    const nameAr = b.name?.ar || '';
    const nameKu = b.name?.ku || '';
    
    const matchesSearch = nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nameAr.includes(searchQuery) ||
                         nameKu.includes(searchQuery);
    const matchesCity = filters.city === 'All' || b.city === filters.city;
    const matchesCategory = filters.category === 'All' || b.category === filters.category;
    const matchesStatus = filters.status === 'All' || 
                         (filters.status === 'Verified' && b.verified) ||
                         (filters.status === 'Pending' && !b.verified);
    
    return matchesSearch && matchesCity && matchesCategory && matchesStatus;
  });

  const stats = {
    total: businesses.length,
    verified: businesses.filter(b => b.verified).length,
    pending: businesses.filter(b => !b.verified).length,
    rejected: 0, // Mock for now
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B2B5E] text-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="text-[#C9A84C]" size={24} />
            Iraq Compass
          </h1>
          <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">Admin Control</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<Database size={20} />} label="Directory" />
          <Link to="/supervisor">
            <NavItem icon={<Bot size={20} />} label="Supervisor Hub" />
          </Link>
          <Link to="/commander">
            <NavItem icon={<Bot size={20} />} label="Agent Commander" />
          </Link>
          <NavItem icon={<Activity size={20} />} label="Agent Network" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 w-full p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-gray-500">
                <Menu size={24} />
              </button>
              <h2 className="text-lg font-semibold text-gray-800">Directory Management</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg hover:bg-[#1B2B5E]/90 transition-all shadow-sm">
                <Plus size={18} />
                <span className="hidden sm:inline">Add Business</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C] text-[#C9A84C] rounded-lg hover:bg-[#C9A84C]/5 transition-all">
                <Play size={18} />
                <span className="hidden sm:inline">Run All Agents</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Records" value={stats.total} icon={<Database className="text-blue-500" />} />
            <StatCard label="Verified" value={stats.verified} icon={<CheckCircle className="text-emerald-500" />} />
            <StatCard label="Pending Review" value={stats.pending} icon={<Clock className="text-amber-500" />} />
            <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="text-rose-500" />} />
          </div>

          {/* Filter Row */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1B2B5E] focus:border-transparent outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <FilterSelect 
              label="City" 
              options={['All', 'Baghdad', 'Erbil', 'Sulaymaniyah', 'Basra', 'Najaf', 'Karbala']} 
              value={filters.city}
              onChange={(val) => setFilters({...filters, city: val})}
            />
            <FilterSelect 
              label="Category" 
              options={['All', 'Restaurant', 'Hotel', 'Hospital', 'Retail', 'Tech']} 
              value={filters.category}
              onChange={(val) => setFilters({...filters, category: val})}
            />
            <FilterSelect 
              label="Status" 
              options={['All', 'Verified', 'Pending', 'Rejected']} 
              value={filters.status}
              onChange={(val) => setFilters({...filters, status: val})}
            />
          </div>

          {/* Business Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-[#1B2B5E] border-t-transparent rounded-full animate-spin" />
                          <span>Loading directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBusinesses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Activity size={48} className="text-gray-300 mb-2" />
                          <p className="font-medium">No records found</p>
                          <p className="text-sm">Run Agents to populate the directory</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                              {b.postcard?.logo_url ? (
                                <img src={b.postcard.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Globe size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{b.name?.en || 'Unnamed'}</div>
                              <div className="text-xs text-gray-500">{b.business_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{b.city}</div>
                          <div className="text-xs text-gray-500">{b.district}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                            {b.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">{b.verification_score}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div 
                                className="bg-[#C9A84C] h-1.5 rounded-full" 
                                style={{ width: `${b.verification_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge verified={b.verified} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setSelectedBusiness(b); setIsDrawerOpen(true); }}
                              className="p-2 text-gray-400 hover:text-[#1B2B5E] hover:bg-blue-50 rounded-lg transition-all"
                              title="View Postcard"
                            >
                              <Eye size={18} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                              <Edit2 size={18} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Postcard Preview Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedBusiness && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <PostcardDrawer 
                business={selectedBusiness} 
                onClose={() => setIsDrawerOpen(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`
      flex items-center gap-3 w-full p-3 rounded-lg transition-all
      ${active ? 'bg-[#C9A84C] text-[#1B2B5E] font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}
    `}>
      {icon}
      <span>{label}</span>
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">
        {icon}
      </div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (val: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}:</span>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#1B2B5E] focus:border-[#1B2B5E] p-2 outline-none"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
      <CheckCircle size={12} />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
      <Clock size={12} />
      Pending
    </span>
  );
}

function PostcardDrawer({ business, onClose }: { business: Business; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'en' | 'ar' | 'ku'>('en');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative h-48 bg-gray-900">
        {business.postcard?.cover_image_url ? (
          <img src={business.postcard.cover_image_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1B2B5E] to-[#C9A84C] opacity-40" />
        )}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
        >
          <X size={20} />
        </button>
        
        <div className="absolute -bottom-8 left-6 flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
            {business.postcard?.logo_url ? (
              <img src={business.postcard.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Globe size={40} className="text-gray-300" />
            )}
          </div>
          <div className="mb-2">
            <StatusBadge verified={business.verified} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-12 px-6 pb-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{business.name?.[activeTab] || 'Unnamed'}</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['en', 'ar', 'ku'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === lang ? 'bg-white text-[#1B2B5E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed" dir={activeTab === 'en' ? 'ltr' : 'rtl'}>
            {business.postcard?.description?.[activeTab] || 'No description available in this language.'}
          </p>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2">
          {business.postcard?.highlights?.map((h, i) => (
            <span key={i} className="px-3 py-1 bg-[#F5F0E8] text-[#1B2B5E] text-xs font-semibold rounded-full border border-[#C9A84C]/20">
              {h}
            </span>
          ))}
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-2 gap-4">
          <ContactButton icon={<Phone size={18} />} label="Call" value={business.contact?.phone?.[0]} />
          <ContactButton icon={<Globe size={18} />} label="Website" value={business.contact?.website} />
          <ContactButton icon={<MapPin size={18} />} label="Location" value={business.city} />
          <ContactButton icon={<ExternalLink size={18} />} label="Maps" value="Open in Maps" />
        </div>

        {/* Agent Notes */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity size={14} />
            Agent Verification Notes
          </h4>
          <p className="text-sm text-gray-700 italic">
            "{business.agent_notes || 'No notes from verification agent.'}"
          </p>
          <div className="mt-3 text-[10px] text-gray-400 flex items-center justify-between">
            <span>Last Verified: {business.last_verified ? new Date(business.last_verified).toLocaleDateString() : 'Never'}</span>
            <span>Score: {business.verification_score}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactButton({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <button className="flex flex-col items-start p-3 bg-white border border-gray-200 rounded-xl hover:border-[#C9A84C] hover:shadow-md transition-all text-left">
      <div className="text-[#C9A84C] mb-1">{icon}</div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-medium text-gray-900 truncate w-full">{value || 'N/A'}</span>
    </button>
  );
}
