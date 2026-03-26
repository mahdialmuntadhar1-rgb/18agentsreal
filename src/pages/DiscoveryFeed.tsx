import React, { useState, useEffect } from 'react';
import { 
  MapPin, Phone, ExternalLink, ShieldCheck, 
  MessageCircle, Search, Filter, Navigation,
  ChevronRight, Star, Clock, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function DiscoveryFeed() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNearby = async (lat: number, lng: number) => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_nearby_businesses', {
      lat,
      lng,
      radius_km: radius
    });

    if (error) {
      // Fallback to all businesses if RPC fails
      const { data: allData } = await supabase.from('businesses').select('*').limit(20);
      setBusinesses(allData || []);
    } else {
      setBusinesses(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchNearby(loc.lat, loc.lng);
        },
        () => {
          fetchNearby(33.3152, 44.3661); // Default to Baghdad
        }
      );
    }
  }, [radius]);

  const filteredBusinesses = businesses.filter(b => 
    String(b.name?.en ?? b.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-xl sticky top-4 z-30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search businesses, categories..."
            className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl">
            <Navigation className="text-emerald-400" size={18} />
            <select 
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={5}>5km</option>
              <option value={10}>10km</option>
              <option value={25}>25km</option>
              <option value={50}>50km</option>
            </select>
          </div>
          <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Grid Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBusinesses.map((business, index) => (
            <motion.div
              key={business.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col"
            >
              {/* Image Header */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={business.scraped_photo_url || `https://picsum.photos/seed/${business.id}/800/600`} 
                  alt={business.name?.en ?? business.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {business.category}
                  </div>
                </div>

                {business.is_verified && (
                  <div className="absolute top-4 right-4 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg">
                    <ShieldCheck size={16} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">
                    {business.name?.en ?? business.name}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} className="opacity-30" />
                    <span className="text-[10px] text-slate-500 font-bold ml-1">(4.2)</span>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-2 text-slate-400">
                    <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium leading-relaxed line-clamp-2">
                      {business.governorate}, Iraq
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium">Open · Closes 10 PM</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center gap-2">
                  <a 
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700">
                    <Navigation size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">Scanning Iraq Compass Network...</p>
        </div>
      )}

      {!isLoading && filteredBusinesses.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-full inline-block">
            <Search size={48} className="text-slate-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white uppercase">No Businesses Found</h3>
            <p className="text-sm text-slate-500 font-medium">Try adjusting your radius or search query.</p>
          </div>
        </div>
      )}
    </div>
  );
}
