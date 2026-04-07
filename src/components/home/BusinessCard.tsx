import { motion } from 'motion/react';
import { Phone, MessageCircle, ExternalLink, MapPin } from 'lucide-react';
import type { Business } from '@/lib/supabase';
import * as React from 'react';

interface BusinessCardProps {
  business: Business;
  onClick?: () => void;
  variant?: 'default' | 'featured' | 'compact';
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  dining_cuisine: '🍽️',
  cafe_coffee: '☕',
  shopping_retail: '🛍️',
  entertainment_events: '🎬',
  accommodation_stays: '🏨',
  culture_heritage: '🏛️',
  business_services: '💼',
  health_wellness: '⚕️',
  doctors: '👨‍⚕️',
  hospitals: '🏥',
  clinics: '🏥',
  transport_mobility: '🚗',
  public_essential: '🏛️',
  lawyers: '⚖️',
  education: '🎓',
};

// Category gradients for postcard backgrounds
const CATEGORY_GRADIENTS: Record<string, string> = {
  dining_cuisine: 'from-orange-500/90 to-red-600/90',
  cafe_coffee: 'from-amber-500/90 to-orange-600/90',
  shopping_retail: 'from-blue-500/90 to-indigo-600/90',
  entertainment_events: 'from-purple-500/90 to-pink-600/90',
  accommodation_stays: 'from-indigo-500/90 to-blue-600/90',
  culture_heritage: 'from-rose-500/90 to-red-600/90',
  business_services: 'from-slate-500/90 to-gray-600/90',
  health_wellness: 'from-emerald-500/90 to-teal-600/90',
  doctors: 'from-teal-500/90 to-cyan-600/90',
  hospitals: 'from-red-500/90 to-rose-600/90',
  clinics: 'from-pink-500/90 to-rose-600/90',
  transport_mobility: 'from-gray-500/90 to-slate-600/90',
  public_essential: 'from-cyan-500/90 to-blue-600/90',
  lawyers: 'from-blue-600/90 to-indigo-700/90',
  education: 'from-yellow-500/90 to-orange-600/90',
};

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

function getWhatsAppLink(phone: string | null): string {
  const formatted = formatPhone(phone);
  if (!formatted) return '#';
  let international = formatted;
  if (formatted.startsWith('07')) {
    international = '964' + formatted.substring(1);
  } else if (formatted.startsWith('7')) {
    international = '964' + formatted;
  }
  return `https://wa.me/${international}`;
}

export default function BusinessCard({ business, onClick, variant = 'default' }: BusinessCardProps) {
  const categoryIcon = CATEGORY_ICONS[business.category] || '🏢';
  const categoryGradient = CATEGORY_GRADIENTS[business.category] || 'from-gray-500/90 to-slate-600/90';
  
  // Get primary phone (prefer WhatsApp, then phone_1)
  const primaryPhone = business.whatsapp || business.phone_1;
  const hasPhone = primaryPhone || business.phone_2;

  // Build location string - short format
  const locationParts = [];
  if (business.city && business.city !== business.governorate) {
    locationParts.push(business.city);
  }
  if (business.neighborhood) {
    locationParts.push(business.neighborhood);
  }
  const locationString = locationParts.join(', ') || business.city || business.governorate || 'Iraq';

  // Handle phone click
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryPhone) {
      window.location.href = `tel:${formatPhone(primaryPhone)}`;
    }
  };

  // Handle WhatsApp click
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = getWhatsAppLink(business.whatsapp || business.phone_1);
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  // Featured variant - larger card with more details
  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex-shrink-0 w-[280px] h-[380px] bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col cursor-pointer group"
      >
        {/* Image Section with Category Gradient */}
        <div className={`relative h-[55%] bg-gradient-to-br ${categoryGradient} overflow-hidden`}>
          {/* Category Icon Overlay */}
          <div className="absolute top-4 left-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              {categoryIcon}
            </div>
          </div>
          
          {/* Featured Badge */}
          {business.isFeatured && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-[#8B1A1A] shadow-lg">
                ⭐ Featured
              </span>
            </div>
          )}

          {/* Business Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-xl font-bold text-white leading-tight">
              {business.business_name}
            </h3>
            {business.arabic_name && (
              <p className="text-white/80 text-sm mt-1">{business.arabic_name}</p>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div className="space-y-3">
            {/* Location */}
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{locationString}</span>
            </div>

            {/* Phone - only if exists */}
            {primaryPhone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{primaryPhone}</span>
              </div>
            )}

            {/* Subcategory/Description - only if exists */}
            {business.subcategory && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {business.subcategory}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {hasPhone ? (
              <>
                <button
                  onClick={handleCall}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#8B1A1A] hover:bg-[#6b1414] text-white rounded-xl text-sm font-bold transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </>
            ) : (
              <button className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold">
                <ExternalLink className="w-4 h-4" />
                View Details
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact variant - for grid layouts
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="bg-white rounded-[16px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col cursor-pointer group"
      >
        {/* Image Section */}
        <div className={`relative aspect-[4/3] bg-gradient-to-br ${categoryGradient} overflow-hidden`}>
          <div className="absolute top-3 left-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg shadow-md">
              {categoryIcon}
            </div>
          </div>
          
          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-bold text-gray-700 shadow-md uppercase tracking-wider">
              {business.category.split('_')[0]}
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
            {business.business_name}
          </h3>
          
          <div className="flex items-center gap-1 text-gray-500 text-[10px] mb-2">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{locationString}</span>
          </div>

          {/* Phone - clickable */}
          {primaryPhone && (
            <button
              onClick={handleCall}
              className="flex items-center gap-1.5 text-[#8B1A1A] text-xs font-medium mt-auto hover:underline"
            >
              <Phone className="w-3 h-3" />
              {primaryPhone}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant - postcard style
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-[20px] overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col cursor-pointer group"
    >
      {/* Image Section - Postcard Top */}
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${categoryGradient} overflow-hidden`}>
        {/* Category Badge with Icon */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
            <span className="text-xl">{categoryIcon}</span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {business.category.split('_')[0]}
            </span>
          </div>
        </div>

        {/* Featured Badge */}
        {business.isFeatured && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 text-amber-900 rounded-lg text-[10px] font-bold shadow-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
          </div>
        )}

        {/* Business Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <h3 className="text-lg font-bold text-white leading-tight">
            {business.business_name}
          </h3>
        </div>
      </div>

      {/* Info Section - Postcard Bottom */}
      <div className="p-4 flex flex-col flex-1">
        {/* Location */}
        <div className="flex items-center gap-2 text-gray-500 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{locationString}</span>
        </div>

        {/* Phone - if exists */}
        {primaryPhone && (
          <div className="flex items-center gap-2 text-gray-700 mb-3">
            <Phone className="w-4 h-4 flex-shrink-0 text-[#8B1A1A]" />
            <span className="text-sm font-medium">{primaryPhone}</span>
          </div>
        )}

        {/* Description - only if exists */}
        {business.subcategory && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">
            {business.subcategory}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          {hasPhone ? (
            <>
              <button
                onClick={handleCall}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-[#8B1A1A] hover:text-white text-gray-700 rounded-xl text-sm font-bold transition-all"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 hover:bg-green-600 hover:text-white text-green-700 rounded-xl text-sm font-bold transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                className="w-10 flex items-center justify-center py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </button>
            </>
          ) : (
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#8B1A1A] text-white rounded-xl text-sm font-bold">
              <ExternalLink className="w-4 h-4" />
              View Details
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
