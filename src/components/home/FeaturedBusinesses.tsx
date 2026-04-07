import { motion } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';
import BusinessCard from './BusinessCard';
import type { Business } from '@/lib/supabase';

interface FeaturedBusinessesProps {
  businesses: Business[];
  title?: string;
  subtitle?: string;
  locationName?: string;
  onBusinessClick?: (business: Business) => void;
  onSeeAllClick?: () => void;
}

export default function FeaturedBusinesses({ 
  businesses, 
  title = "Featured Businesses",
  subtitle,
  locationName,
  onBusinessClick,
  onSeeAllClick
}: FeaturedBusinessesProps) {
  // Filter featured businesses (high confidence or manually flagged)
  const featured = businesses
    .filter(b => b.isFeatured || b.confidence_score > 0.8)
    .slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="w-full mb-12">
      {/* Header */}
      <div className="flex items-end justify-between px-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⭐</span>
            <h2 className="text-xl font-bold text-gray-900">
              {locationName ? `${title} in ${locationName}` : title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        
        {onSeeAllClick && (
          <button 
            onClick={onSeeAllClick}
            className="flex items-center gap-1 text-sm font-bold text-[#8B1A1A] hover:text-[#6b1414] transition-colors"
          >
            See All
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x snap-mandatory">
          {featured.map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 snap-start"
            >
              <BusinessCard 
                business={business} 
                variant="featured"
                onClick={() => onBusinessClick?.(business)}
              />
            </motion.div>
          ))}
          
          {/* Spacer for peek effect */}
          <div className="flex-shrink-0 w-4" />
        </div>

        {/* Fade edges indicator */}
        <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-[#F5F7F9] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
