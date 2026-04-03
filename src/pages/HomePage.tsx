import { useState, useEffect } from "react";
import { Search, User, PlusCircle } from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import LocationFilter from "@/components/home/LocationFilter";
import StoryRow from "@/components/home/StoryRow";
import CategoryGrid from "@/components/home/CategoryGrid";
import TrendingSection from "@/components/home/TrendingSection";
import BusinessGrid from "@/components/home/BusinessGrid";
import { useHomeStore } from "@/stores/homeStore";
import type { Business } from "@/lib/supabase";

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedGovernorate, selectedCategory, selectedCity } = useHomeStore();

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      try {
        const mockData = generateMockBusinesses();
        
        // Filter logic
        let filtered = mockData;
        if (selectedGovernorate) {
          filtered = filtered.filter(b => b.governorate === selectedGovernorate);
        }
        if (selectedCity) {
          filtered = filtered.filter(b => b.city === selectedCity);
        }
        if (selectedCategory) {
          filtered = filtered.filter(b => b.category === selectedCategory);
        }
        
        setBusinesses(filtered);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [selectedGovernorate, selectedCategory, selectedCity]);

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 group cursor-pointer">
            <div className="w-10 h-10 bg-[#2CA6A4] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-xl poppins-bold">H</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[#2B2F33] poppins-bold tracking-tight">HUMUS</h1>
              <p className="text-[8px] text-[#2CA6A4] font-bold uppercase tracking-[0.2em] -mt-1">Iraqi Directory</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 mx-4 max-w-md relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#F5F7F9] border border-[#E5E7EB] focus:border-[#2CA6A4] rounded-full focus:outline-none transition-all duration-300 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#2CA6A4] hover:text-[#1e7a78] transition-colors">
              <PlusCircle className="w-4 h-4" />
              List Business
            </button>
            <button className="w-9 h-9 rounded-full bg-[#F5F7F9] border border-[#E5E7EB] flex items-center justify-center transition-all hover:scale-105">
              <User className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* HERO / FEATURED CAROUSEL */}
        <HeroSection businesses={businesses} />

        {/* Governorate & City Filters */}
        <LocationFilter />

        {/* STORY ROW */}
        <StoryRow />

        <div className="max-w-6xl mx-auto">
          {/* CATEGORY GRID */}
          <CategoryGrid />

          {/* FEATURED BUSINESSES (Vertical Cards) */}
          <TrendingSection businesses={businesses} loading={loading} />

          {/* MAIN BUSINESS GRID (Compact Cards) */}
          <div className="px-4 mb-4 mt-12">
            <h2 className="text-xl font-bold text-[#2B2F33] poppins-bold">Explore Businesses</h2>
            <p className="text-sm text-[#6B7280]">Discover top-rated places in your area</p>
          </div>
          <BusinessGrid businesses={businesses} loading={loading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2B2F33] text-white py-20 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#8B1A1A] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg poppins-bold">H</span>
                </div>
                <h3 className="text-2xl font-bold poppins-bold tracking-tight">HUMUS</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Iraq's premier business discovery platform. We bridge the gap between local businesses and their community across all 18 governorates.
              </p>
              <div className="flex gap-4">
                {['fb', 'tw', 'ig', 'li'].map(social => (
                  <div key={social} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#8B1A1A] transition-all cursor-pointer">
                    <span className="text-xs font-bold uppercase">{social}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <p className="font-bold text-white mb-6 poppins-semibold uppercase tracking-widest text-xs">Company</p>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">About HUMUS</a></li>
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">Business Solutions</a></li>
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white mb-6 poppins-semibold uppercase tracking-widest text-xs">Support</p>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-[#8B1A1A] transition-colors">Community Standards</a></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white mb-6 poppins-semibold uppercase tracking-widest text-xs">Download App</p>
              <p className="text-xs text-gray-500 mb-6">Experience HUMUS on the go. Available on all major platforms.</p>
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="text-2xl">🍎</div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-gray-500">Download on the</p>
                    <p className="text-xs font-bold">App Store</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-gray-500">Get it on</p>
                    <p className="text-xs font-bold">Google Play</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/5 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} HUMUS IRAQ. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Mock data generator
function generateMockBusinesses(): Business[] {
  const categories = [
    'dining_cuisine', 'cafe_coffee', 'shopping_retail', 
    'entertainment_events', 'accommodation_stays', 'culture_heritage',
    'business_services', 'health_wellness', 'doctors', 'hospitals',
    'clinics', 'transport_mobility', 'public_essential', 'lawyers', 'education'
  ];
  
  const governorates = ["Baghdad", "Erbil", "Basra", "Mosul", "Sulaymaniyah"];
  const cities: Record<string, string[]> = {
    Baghdad: ["Central", "Kadhimiya", "Adhamiyah"],
    Erbil: ["Erbil Center", "Ankawa", "Shaqlawa"],
    Basra: ["Basra City", "Zubair"],
    Mosul: ["Mosul Center", "Hamdaniya"],
    Sulaymaniyah: ["Suli Center", "Halabja"]
  };

  return Array.from({ length: 24 }, (_, i) => {
    const gov = governorates[i % governorates.length];
    const cityList = cities[gov];
    const city = cityList[i % cityList.length];
    
    return {
      id: `biz-${i}`,
      name: `${['Al-Mansour', 'Babylon', 'Tigris', 'Euphrates', 'Mesopotamia'][i % 5]} ${['Plaza', 'Garden', 'Center', 'Hub', 'Lounge'][i % 5]}`,
      category: categories[i % categories.length],
      rating: 4 + (i % 10) / 10,
      reviewCount: 10 + i * 5,
      governorate: gov,
      city: city,
      address: `${city}, Iraq`,
      image: `https://picsum.photos/seed/biz${i}/600/400`,
      isFeatured: i < 8,
      phone: "+964 770 123 4567",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
}
