import { motion } from 'motion/react';
import { Loader2, ChevronDown } from 'lucide-react';
import type { Business } from '@/lib/supabase';
import BusinessCard from './BusinessCard';

interface BusinessGridProps {
  businesses: Business[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
  onBusinessClick?: (business: Business) => void;
}

export default function BusinessGrid({ 
  businesses, 
  loading, 
  loadingMore, 
  hasMore, 
  onLoadMore,
  totalCount = 0,
  onBusinessClick
}: BusinessGridProps) {
  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="px-4 mb-12">
      {/* Stats bar */}
      {!loading && businesses.length > 0 && (
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <span>
            Showing <strong className="text-gray-900">{businesses.length}</strong> of{' '}
            <strong className="text-gray-900">{totalCount}</strong> businesses
          </span>
          {hasMore && (
            <span className="text-xs text-gray-400">
              {Math.round((businesses.length / totalCount) * 100)}% loaded
            </span>
          )}
        </div>
      )}

      {/* Grid with new BusinessCard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {businesses.map((biz, index) => (
          <motion.div
            key={biz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
          >
            <BusinessCard 
              business={biz} 
              variant="compact"
              onClick={() => onBusinessClick?.(biz)}
            />
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                <span className="text-sm font-medium text-gray-500">Loading...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Load More ({businesses.length} / {totalCount})
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && businesses.length > 0 && !loading && (
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>✨ All {businesses.length} businesses loaded</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && businesses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No businesses found</p>
        </div>
      )}
    </div>
  );
}
