import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  MapPin, 
  X,
  Copy,
  Navigation,
  Clock,
  Globe,
  Facebook,
  Instagram
} from 'lucide-react';
import type { Business } from '@/lib/supabase';

interface BusinessDetailsProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
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

// Category colors for image backgrounds
const CATEGORY_COLORS: Record<string, string> = {
  dining_cuisine: 'from-orange-600 to-red-700',
  cafe_coffee: 'from-amber-600 to-orange-700',
  shopping_retail: 'from-blue-600 to-indigo-700',
  entertainment_events: 'from-purple-600 to-pink-700',
  accommodation_stays: 'from-indigo-600 to-blue-700',
  culture_heritage: 'from-rose-600 to-red-700',
  business_services: 'from-slate-600 to-gray-700',
  health_wellness: 'from-emerald-600 to-teal-700',
  doctors: 'from-teal-600 to-cyan-700',
  hospitals: 'from-red-600 to-rose-700',
  clinics: 'from-pink-600 to-rose-700',
  transport_mobility: 'from-gray-600 to-slate-700',
  public_essential: 'from-cyan-600 to-blue-700',
  lawyers: 'from-blue-700 to-indigo-800',
  education: 'from-yellow-600 to-orange-600',
};

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  // Remove non-numeric characters
  return phone.replace(/[^\d]/g, '');
}

function getWhatsAppLink(phone: string | null): string {
  const formatted = formatPhone(phone);
  if (!formatted) return '#';
  // Iraqi numbers often start with 07, convert to +964
  let international = formatted;
  if (formatted.startsWith('07')) {
    international = '964' + formatted.substring(1);
  } else if (formatted.startsWith('7')) {
    international = '964' + formatted;
  }
  return `https://wa.me/${international}`;
}

export default function BusinessDetails({ business, isOpen, onClose }: BusinessDetailsProps) {
  const [copied, setCopied] = useState(false);

  if (!business) return null;

  const categoryIcon = CATEGORY_ICONS[business.category] || '🏢';
  const categoryGradient = CATEGORY_COLORS[business.category] || 'from-gray-600 to-slate-700';
  
  const hasPhone = business.phone_1 || business.phone_2 || business.whatsapp;
  const primaryPhone = business.whatsapp || business.phone_1 || business.phone_2;

  const handleCopyPhone = () => {
    if (primaryPhone) {
      navigator.clipboard.writeText(primaryPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCall = () => {
    if (primaryPhone) {
      window.location.href = `tel:${formatPhone(primaryPhone)}`;
    }
  };

  const handleWhatsApp = () => {
    const link = getWhatsAppLink(business.whatsapp || business.phone_1);
    if (link !== '#') {
      window.open(link, '_blank');
    }
  };

  const handleMaps = () => {
    if (business.address) {
      const query = encodeURIComponent(`${business.business_name}, ${business.city}, Iraq`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[85vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Header */}
            <div className={`relative h-48 bg-gradient-to-br ${categoryGradient} flex-shrink-0`}>
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-xl text-sm font-bold shadow-lg">
                  <span className="text-lg">{categoryIcon}</span>
                  <span className="text-gray-800 capitalize">
                    {business.category.replace(/_/g, ' ')}
                  </span>
                </span>
              </div>

              {/* Business Name Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {business.business_name}
                </h2>
                {business.arabic_name && (
                  <p className="text-white/80 text-lg font-medium">{business.arabic_name}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Location</p>
                  <p className="text-gray-900">
                    {business.city}{business.neighborhood ? `, ${business.neighborhood}` : ''}
                  </p>
                  <p className="text-sm text-gray-500">{business.governorate}</p>
                  {business.address && (
                    <p className="text-sm text-gray-600 mt-1">{business.address}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              {hasPhone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Contact</p>
                    <p className="text-gray-900 font-medium">{primaryPhone}</p>
                    {business.phone_2 && business.phone_2 !== primaryPhone && (
                      <p className="text-sm text-gray-600">{business.phone_2}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hours */}
              {business.opening_hours && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Opening Hours</p>
                    <p className="text-gray-900 text-sm">{business.opening_hours}</p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(business.website || business.facebook || business.instagram) && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Online</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {business.website && (
                        <a 
                          href={business.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Website
                        </a>
                      )}
                      {business.facebook && (
                        <a 
                          href={business.facebook} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                          Facebook
                        </a>
                      )}
                      {business.instagram && (
                        <a 
                          href={business.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {business.subcategory && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {business.subcategory}
                  </p>
                </div>
              )}

              {/* Verification Badge */}
              {business.verification_status === 'verified' && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">Verified Business</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              {hasPhone && (
                <>
                  <button
                    onClick={handleCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#8B1A1A] hover:bg-[#6b1414] text-white rounded-xl font-bold transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </button>
                  
                  <button
                    onClick={handleWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  
                  <button
                    onClick={handleCopyPhone}
                    className="w-12 flex items-center justify-center py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all"
                    title="Copy phone number"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </>
              )}
              
              <button
                onClick={handleMaps}
                disabled={!business.address}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Navigation className="w-5 h-5" />
                Maps
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
