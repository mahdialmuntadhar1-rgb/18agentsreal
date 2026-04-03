import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Filter, Globe, AlertCircle, Star, 
  ShieldCheck, Clock, MessageCircle, Phone, ExternalLink,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';

interface Business {
  id: string;
  business_name: string;
  category: string;
  city: string;
  governorate?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  description?: string;
  rating?: number;
  review_count?: number;
  opening_hours?: string;
  images?: string[];
  scraped_photo_url?: string;
  is_verified?: boolean;
  verification_status?: string;
  confidence_score?: number;
  source_name?: string;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function DiscoveryFeed() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');

  const cities = ['All', 'Baghdad', 'Basra', 'Erbil', 'Sulaymaniyah', 'Najaf', 'Karbala', 'Mosul'];
  const categories = ['All', 'food_drink', 'cafe', 'shopping', 'events_entertainment', 'hotels_stays', 'culture_heritage', 'business_services', 'health_wellness', 'transport_mobility', 'public_essential', 'education', 'doctors', 'lawyers', 'clinics', 'hospitals'];
  const sources = ['All', 'Gemini AI Research', 'Google Places', 'Manual Import'];

  const fetchBusinesses = async (pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      
      if (selectedCity !== 'All') params.append('city', selectedCity);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedSource !== 'All') params.append('source', selectedSource);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/businesses?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setBusinesses(result.data || []);
      setPagination(result.pagination || {
        page: 1,
        pageSize: 12,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err: unknown) {
      console.error('Failed to fetch businesses:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      // Fallback to Supabase direct query
      const { data, error: sbError } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (!sbError && data) {
        setBusinesses(data);
        setPagination({
          page: 1,
          pageSize: 20,
          totalItems: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses(1);
  }, [selectedCity, selectedCategory, selectedSource]);

  const handleSearch = () => {
    fetchBusinesses(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchBusinesses(newPage);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove non-numeric characters except +
    return phone.replace(/[^\d+]/g, '');
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < fullStars ? "text-amber-400 fill-current" : i === fullStars && hasHalfStar ? "text-amber-400 fill-current opacity-50" : "text-slate-600"}
          />
        ))}
        <span className="text-[10px] text-slate-500 font-bold ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

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
            placeholder="Search businesses..."
            className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <button 
          onClick={handleSearch}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
        >
          Search
        </button>
      </div>
      
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl">
          <MapPin size={16} className="text-emerald-400" />
          <select 
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-300 focus:outline-none cursor-pointer"
          >
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl">
          <Filter size={16} className="text-emerald-400" />
          <select 
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-300 focus:outline-none cursor-pointer"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl">
          <Globe size={16} className="text-emerald-400" />
          <select 
            value={selectedSource}
            onChange={e => setSelectedSource(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-300 focus:outline-none cursor-pointer"
          >
            {sources.map(src => <option key={src} value={src}>{src}</option>)}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
          <AlertCircle size={20} />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Grid Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {businesses.map((business, index) => (
            <motion.div
              key={business.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              className="group bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col"
            >
              {/* Image Header */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={business.images?.[0] || business.scraped_photo_url || '/placeholder.svg'} 
                  alt={business.business_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  <div className="px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {business.category}
                  </div>
                  {business.city && (
                    <div className="px-3 py-1 bg-emerald-500/80 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                      {business.city}
                    </div>
                  )}
                </div>

                {business.verification_status === 'approved' && (
                  <div className="absolute top-4 right-4 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-lg">
                    <ShieldCheck size={16} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {business.business_name}
                  </h3>
                  {renderStars(business.rating)}
                </div>

                <div className="space-y-2 flex-1">
                  {business.address && (
                    <div className="flex items-start gap-2 text-slate-400">
                      <MapPin size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium leading-relaxed line-clamp-2">
                        {business.address}
                      </p>
                    </div>
                  )}
                  {business.opening_hours && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-xs font-medium">{business.opening_hours}</span>
                    </div>
                  )}
                  {business.source_name && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Globe size={14} className="shrink-0" />
                      <span className="text-[10px] uppercase tracking-wider">Source: {business.source_name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center gap-2">
                  {business.whatsapp ? (
                    <a 
                      href={`https://wa.me/${formatPhoneForWhatsApp(business.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  ) : business.phone ? (
                    <a 
                      href={`tel:${business.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <Phone size={14} /> Call
                    </a>
                  ) : (
                    <button className="flex-1 py-3 bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed">
                      No Contact
                    </button>
                  )}
                  <button 
                    onClick={() => business.website && window.open(business.website, '_blank')}
                    disabled={!business.website}
                    className="p-3 bg-slate-800 hover:bg-slate-700 disabled:hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl transition-all border border-slate-700"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-xl transition-colors font-bold"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (pagination.totalPages > 5 && pagination.page > 3) {
                pageNum = pagination.page - 2 + i;
              }
              if (pageNum > pagination.totalPages) {
                pageNum = pagination.totalPages - (4 - i);
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-xl font-bold transition-colors ${
                    pageNum === pagination.page 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-xl transition-colors font-bold"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">Loading businesses...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && businesses.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-full inline-block">
            <Search size={48} className="text-slate-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white uppercase">No Businesses Found</h3>
            <p className="text-sm text-slate-500 font-medium">
              {searchQuery || selectedCity !== 'All' || selectedCategory !== 'All' 
                ? 'Try adjusting your filters.' 
                : 'No businesses in database yet. Run a discovery to populate.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
