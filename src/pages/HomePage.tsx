import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import HeroSection from "@/components/home/HeroSection";
import LocationFilter from "@/components/home/LocationFilter";
import CategoryGrid from "@/components/home/CategoryGrid";
import TrendingSection from "@/components/home/TrendingSection";
import FeedComponent from "@/components/home/FeedComponent";
import { useHomeStore } from "@/stores/homeStore";
import type { Business } from "@/lib/supabase";

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedGovernorate } = useHomeStore();

  useEffect(() => {
    // Simulate loading businesses from Supabase
    // This will be replaced with actual Supabase query
    const loadBusinesses = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual Supabase fetch
        const mockData = generateMockBusinesses();
        setBusinesses(mockData);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [selectedGovernorate]);

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5dada] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-br from-[#8B1A1A] to-[#6b1414] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-xl poppins-bold">H</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-[#2B2F33] poppins-bold tracking-tight">HUMUS</h1>
              <p className="text-[9px] text-[#8B1A1A] font-bold uppercase tracking-[0.2em] -mt-1">Iraqi Directory</p>
            </div>
          </div>

          {/* Search Bar - Premium */}
          <div className="flex-1 mx-8 max-w-md hidden md:block relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B1A1A]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input
              type="text"
              placeholder="Search businesses, services, or places..."
              className="w-full pl-12 pr-4 py-3 bg-[#FFF5F5] border-2 border-transparent focus:border-[#8B1A1A] rounded-2xl focus:outline-none transition-all duration-300 text-sm font-medium shadow-inner"
            />
          </div>

          {/* Account Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 text-sm font-bold text-[#8B1A1A] hover:text-[#6b1414] transition-colors">
              List Your Business
            </button>
            <button className="w-11 h-11 rounded-xl bg-[#FFF5F5] hover:bg-[#fce8e8] border border-[#f5dada] flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-sm">
              <span className="text-xl">👤</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Carousel */}
        <HeroSection businesses={businesses} />

        {/* Location Filter Bar */}
        <LocationFilter />

        <div className="max-w-6xl mx-auto px-4">
          {/* Category Chips Grid */}
          <CategoryGrid />

          {/* Trending Section */}
          {businesses.length > 0 && (
            <div className="my-12 rounded-[32px] overflow-hidden shadow-premium">
              <TrendingSection businesses={businesses.filter(b => b.isFeatured).slice(0, 5)} />
            </div>
          )}

          {/* Main Feed Header */}
          <div className="flex items-center justify-between mt-16 mb-2">
            <div>
              <h2 className="text-2xl font-bold text-[#2B2F33] poppins-bold">Local Feed</h2>
              <p className="text-sm text-[#8B1A1A]/60">Discover what's happening around you</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 bg-white border border-[#f5dada] rounded-xl text-[#8B1A1A] hover:bg-[#8B1A1A] hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
              </button>
            </div>
          </div>

          {/* Main Feed */}
          <FeedComponent businesses={businesses} loading={loading} />
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
  return [
    {
      id: "1",
      name: "Abu Ali Restaurant",
      nameAr: "مطعم أبو علي",
      nameKu: "Restoran Abu Ali",
      category: "dining_cuisine",
      governorate: "Baghdad",
      city: "Kadhimiya",
      address: "Baghdad, Kadhimiya",
      phone: "+9647701234567",
      rating: 4.8,
      reviewCount: 120,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1504674900759-b58551b1efc8?w=400&h=300&fit=crop",
      website: "https://abuali.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Coffee House",
      nameAr: "كافية",
      nameKu: "Kava House",
      category: "cafe_coffee",
      governorate: "Baghdad",
      city: "Adhamiyah",
      address: "Baghdad, Adhamiyah",
      phone: "+9647702234567",
      rating: 4.5,
      reviewCount: 85,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Clinic Dr. Fatima",
      nameAr: "عيادة د. فاطمة",
      nameKu: "Klinika Dr. Fatima",
      category: "clinics",
      governorate: "Baghdad",
      city: "Adhamiyah",
      address: "Baghdad, Adhamiyah",
      phone: "+9647703234567",
      rating: 4.9,
      reviewCount: 89,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1576091160550-112173f31c74?w=400&h=300&fit=crop",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      name: "Fashion Store Erbil",
      nameAr: "متجر الموضة",
      nameKu: "Fashion Store",
      category: "shopping_retail",
      governorate: "Erbil",
      city: "Erbil Center",
      address: "Erbil, City Center",
      phone: "+9647704234567",
      rating: 4.3,
      reviewCount: 45,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1555529669-e69e7fa0ba9b?w=400&h=300&fit=crop",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      name: "Basra Tech Services",
      nameAr: "خدمات تقنية البصرة",
      nameKu: "Basra Tech Services",
      category: "business_services",
      governorate: "Basra",
      city: "Basra City",
      address: "Basra, City Center",
      phone: "+9647705234567",
      rating: 4.6,
      reviewCount: 120,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}
