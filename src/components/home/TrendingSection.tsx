import React from 'react';
import { motion } from 'motion/react';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Business } from '@/lib/supabase';

interface TrendingSectionProps {
  businesses: Business[];
  loading?: boolean;
}

export default function TrendingSection({ businesses, loading }: TrendingSectionProps) {
  const featured = businesses.filter(b => b.isFeatured).slice(0, 6);

  if (loading) return (
    <div className="w-full h-[320px] bg-gray-100 animate-pulse rounded-2xl mb-12" />
  );

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between px-4 mb-6">
        <h2 className="text-xl font-bold text-[#2B2F33] poppins-bold">Featured Businesses</h2>
        <button className="text-sm font-bold text-[#2CA6A4] flex items-center gap-1">
          See All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-6">
        {featured.map((biz) => (
          <motion.div
            key={biz.id}
            whileHover={{ y: -5 }}
            className="flex-shrink-0 w-[240px] h-[320px] bg-white rounded-[18px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] border border-[#E5E7EB] flex flex-col group cursor-pointer"
          >
            {/* Image Section (60%) */}
            <div className="relative h-[60%] overflow-hidden">
              <img 
                src={biz.image} 
                alt={biz.business_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-[#2CA6A4] text-white text-[10px] font-bold rounded-md shadow-md uppercase tracking-wider">
                  {biz.category.split('_')[0]}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                  <Star className="w-3 h-3 text-[#E87A41] fill-[#E87A41]" />
                  <span className="text-[10px] font-bold text-[#2B2F33]">{biz.rating}</span>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2B2F33] mb-1 line-clamp-1 poppins-semibold">
                  {biz.business_name}
                </h3>
                <div className="flex items-center gap-1 text-[#6B7280] text-[11px]">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{biz.city}, {biz.governorate}</span>
                </div>
              </div>

              <button className="w-full py-2 bg-[#F5F7F9] hover:bg-[#2CA6A4] hover:text-white text-[#2CA6A4] text-xs font-bold rounded-xl transition-all duration-300">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
        {/* Peek Effect Spacer */}
        <div className="flex-shrink-0 w-4" />
      </div>
    </div>
  );
}
