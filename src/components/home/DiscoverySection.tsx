import { motion } from 'motion/react';
import { Clock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import BusinessCard from './BusinessCard';
import type { Business } from '@/lib/supabase';

interface DiscoverySectionProps {
  businesses: Business[];
  onBusinessClick?: (business: Business) => void;
}

export default function DiscoverySection({ businesses, onBusinessClick }: DiscoverySectionProps) {
  // Get recently added (newest first - assuming higher ID or recent created_at)
  const recentlyAdded = [...businesses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Get trending (highest confidence score)
  const trending = [...businesses]
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
    .slice(0, 6);

  return (
    <section className="w-full mb-12">
      {/* Recently Added Section */}
      {recentlyAdded.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Recently Added</h2>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
            {recentlyAdded.map((business) => (
              <motion.div
                key={business.id}
                whileHover={{ y: -4 }}
                className="flex-shrink-0 w-[200px]"
              >
                <BusinessCard 
                  business={business} 
                  variant="compact"
                  onClick={() => onBusinessClick?.(business)}
                />
              </motion.div>
            ))}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      )}

      {/* Trending Section */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Sparkles className="w-3 h-3" />
              <span>Most viewed</span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
            {trending.map((business) => (
              <motion.div
                key={business.id}
                whileHover={{ y: -4 }}
                className="flex-shrink-0 w-[200px]"
              >
                <BusinessCard 
                  business={business} 
                  variant="compact"
                  onClick={() => onBusinessClick?.(business)}
                />
              </motion.div>
            ))}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      )}
    </section>
  );
}
