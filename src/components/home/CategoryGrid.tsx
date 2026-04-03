import { useState } from 'react';
import { useHomeStore } from '@/stores/homeStore';
import { motion } from 'motion/react';

const CATEGORIES = [
  { id: 'dining_cuisine', name: 'Dining & Cuisine', icon: '🍽️', color: 'bg-orange-100' },
  { id: 'cafe_coffee', name: 'Cafe & Coffee', icon: '☕', color: 'bg-amber-100' },
  { id: 'shopping_retail', name: 'Shopping & Retail', icon: '🛍️', color: 'bg-blue-100' },
  { id: 'entertainment_events', name: 'Entertainment & Events', icon: '🎬', color: 'bg-purple-100' },
  { id: 'accommodation_stays', name: 'Accommodation & Stays', icon: '🏨', color: 'bg-indigo-100' },
  { id: 'culture_heritage', name: 'Culture & Heritage', icon: '🏛️', color: 'bg-rose-100' },
  { id: 'business_services', name: 'Business & Services', icon: '💼', color: 'bg-slate-100' },
  { id: 'health_wellness', name: 'Health & Wellness', icon: '⚕️', color: 'bg-emerald-100' },
  { id: 'doctors', name: 'Doctors', icon: '👨‍⚕️', color: 'bg-teal-100' },
  { id: 'hospitals', name: 'Hospitals', icon: '🏥', color: 'bg-red-100' },
  { id: 'clinics', name: 'Clinics', icon: '🏥', color: 'bg-pink-100' },
  { id: 'transport_mobility', name: 'Transport & Mobility', icon: '🚗', color: 'bg-gray-100' },
  { id: 'public_essential', name: 'Public & Essential', icon: '🏛️', color: 'bg-cyan-100' },
  { id: 'lawyers', name: 'Lawyers', icon: '⚖️', color: 'bg-blue-200' },
  { id: 'education', name: 'Education', icon: '🎓', color: 'bg-yellow-100' }
];

export default function CategoryGrid() {
  const { selectedCategory, setCategory } = useHomeStore();

  return (
    <div className="w-full mb-12">
      <div className="grid grid-cols-4 gap-[10px] p-3">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(isActive ? null : cat.id)}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-[16px] transition-all duration-300 aspect-square shadow-[0_2px_8px_rgba(0,0,0,0.05)] border-2 ${
                isActive
                  ? "bg-gradient-to-br from-[#2CA6A4] to-[#1e7a78] text-white border-[#2CA6A4] shadow-lg scale-105"
                  : "bg-white text-[#2B2F33] border-[#E5E7EB] hover:border-[#2CA6A4]/30"
              }`}
            >
              <div className={`text-xl ${isActive ? 'text-white' : 'text-[#2CA6A4]'}`}>
                {cat.icon}
              </div>
              <span className={`text-[8px] font-bold text-center leading-tight uppercase tracking-tight ${
                isActive ? 'text-white' : 'text-[#6B7280]'
              }`}>
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
