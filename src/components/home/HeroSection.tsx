import { motion } from 'motion/react';
import { Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Business } from '@/lib/supabase';

interface HeroSectionProps {
  businesses: Business[];
  onBusinessClick?: (business: Business) => void;
}

// Category gradients for featured cards
const CATEGORY_GRADIENTS: Record<string, string> = {
  dining_cuisine: 'from-orange-600/90 to-red-700/90',
  cafe_coffee: 'from-amber-600/90 to-orange-700/90',
  shopping_retail: 'from-blue-600/90 to-indigo-700/90',
  entertainment_events: 'from-purple-600/90 to-pink-700/90',
  accommodation_stays: 'from-indigo-600/90 to-blue-700/90',
  culture_heritage: 'from-rose-600/90 to-red-700/90',
  business_services: 'from-slate-600/90 to-gray-700/90',
  health_wellness: 'from-emerald-600/90 to-teal-700/90',
  doctors: 'from-teal-600/90 to-cyan-700/90',
  hospitals: 'from-red-600/90 to-rose-700/90',
  clinics: 'from-pink-600/90 to-rose-700/90',
  transport_mobility: 'from-gray-600/90 to-slate-700/90',
  public_essential: 'from-cyan-600/90 to-blue-700/90',
  lawyers: 'from-blue-700/90 to-indigo-800/90',
  education: 'from-yellow-600/90 to-orange-700/90',
};

export default function HeroSection({ businesses, onBusinessClick }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Get featured businesses for carousel
  const featured = businesses
    .filter(b => b.isFeatured || b.confidence_score > 0.75)
    .slice(0, 5);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  }, [featured.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  }, [featured.length]);

  // Auto-advance carousel
  useEffect(() => {
    if (featured.length <= 1) return;
    
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [featured.length, nextSlide]);

  if (featured.length === 0) {
    return (
      <section className="relative h-[320px] bg-gradient-to-br from-[#8B1A1A] to-[#6b1414] mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Discover Iraq
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              The most comprehensive business directory across all 18 governorates
            </p>
            <div className="flex items-center gap-2 justify-center text-white/60 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Baghdad • Basra • Erbil • Mosul • Najaf • Karbala</span>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mb-8">
      {/* Main Carousel */}
      <div className="relative h-[380px] overflow-hidden rounded-b-[32px]">
        {featured.map((business, index) => {
          const isActive = index === currentIndex;
          const bgGradient = CATEGORY_GRADIENTS[business.category] || 'from-gray-700/90 to-slate-800/90';
          
          return (
            <motion.div
              key={business.id}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1 : 1.1,
              }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 ${isActive ? 'z-10' : 'z-0'}`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />
              
              {/* Pattern Overlay */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

              {/* Content */}
              <div 
                className="relative h-full flex flex-col justify-end p-6 cursor-pointer"
                onClick={() => onBusinessClick?.(business)}
              >
                {/* Top Badge */}
                <div className="absolute top-6 left-6">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 shadow-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Featured
                  </span>
                </div>

                {/* Business Info */}
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {business.business_name}
                  </h2>
                  
                  {business.arabic_name && (
                    <p className="text-white/80 text-lg">{business.arabic_name}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-white/70">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {business.city}, {business.governorate}
                    </span>
                    {business.phone_1 && (
                      <span className="hidden sm:inline">• {business.phone_1}</span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 self-start px-6 py-3 bg-white text-gray-900 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-colors"
                >
                  View Details
                </motion.button>
              </div>
            </motion.div>
          );
        })}

        {/* Navigation Arrows */}
        {featured.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {featured.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {featured.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Strip - Mini Cards */}
      {featured.length > 1 && (
        <div className="mt-4 px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {featured.map((business, index) => (
              <motion.button
                key={business.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  index === currentIndex
                    ? 'bg-white shadow-lg border-2 border-[#8B1A1A]'
                    : 'bg-white/80 hover:bg-white shadow-md border border-gray-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                  CATEGORY_GRADIENTS[business.category] || 'from-gray-500 to-slate-600'
                } flex items-center justify-center text-white text-lg`}>
                  {business.category.split('_')[0].charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${
                    index === currentIndex ? 'text-[#8B1A1A]' : 'text-gray-900'
                  }`}>
                    {business.business_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{business.city}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
