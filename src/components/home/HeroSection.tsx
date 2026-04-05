import React from 'react';
import { motion } from 'motion/react';
import { Star, MapPin } from 'lucide-react';
import { Business } from '@/lib/supabase';

interface HeroSectionProps {
  businesses: Business[];
}

export default function HeroSection({ businesses }: HeroSectionProps) {
  const featured = businesses.filter(b => b.isFeatured).slice(0, 5);
  
  if (featured.length === 0) return null;

  return (
    <section className="w-full overflow-hidden mb-8">
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {featured.map((biz) => (
          <div 
            key={biz.id} 
            className="flex-shrink-0 w-full snap-center px-4"
          >
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="relative h-[280px] w-full rounded-[20px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.12)] group cursor-pointer"
            >
              {/* Background Image */}
              <img 
                src={biz.image} 
                alt={biz.business_name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-[#2CA6A4] text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {biz.category.replace('_', ' & ')}
                  </span>
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                    <Star className="w-3 h-3 text-[#E87A41] fill-[#E87A41]" />
                    <span className="text-[10px] font-bold">{biz.rating}</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-1 poppins-bold">{biz.business_name}</h2>
                
                <div className="flex items-center gap-1 text-white/70 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{biz.city}, {biz.governorate}</span>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      
      {/* Scroll Indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {featured.map((_, idx) => (
          <div 
            key={idx}
            className="w-1.5 h-1.5 rounded-full bg-[#2CA6A4]/30"
          />
        ))}
      </div>
    </section>
  );
}
