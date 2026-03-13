import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { MapPin, Star, Phone, Globe, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchBusinesses();
  }, [category]);

  async function fetchBusinesses() {
    setLoading(true);
    try {
      let query = supabase.from("businesses").select("*").order("rating", { ascending: false });
      
      if (category !== "All") {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    "All",
    "Restaurants",
    "Cafes",
    "Bakeries",
    "Hotels",
    "Gyms",
    "Beauty Salons",
    "Barbershops",
    "Pharmacies",
    "Supermarkets",
    "Electronics",
    "Clothing Stores",
    "Car Services",
    "Dentists",
    "Clinics",
    "Schools",
    "Co-working Spaces",
    "Entertainment",
    "Tourism Locations",
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-emerald-600 h-6 w-6" />
            <span className="font-bold text-xl text-neutral-900 tracking-tight">Iraq Compass</span>
          </div>
          <Link
            to="/admin"
            className="text-sm font-medium text-neutral-600 hover:text-emerald-600 transition-colors"
          >
            Admin Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-emerald-900 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Discover Iraq's Best Businesses
        </h1>
        <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
          The most comprehensive directory powered by 18 AI Agents working around the clock.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-transparent rounded-xl leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-lg"
            placeholder="Search for restaurants, cafes, hotels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 shrink-0">
            <h2 className="font-semibold text-neutral-900 mb-4">Categories</h2>
            <div className="space-y-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === c
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Business Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 animate-pulse h-48"></div>
                ))}
              </div>
            ) : filteredBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-lg leading-tight mb-1">
                          {business.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                          {business.category}
                        </span>
                      </div>
                      {business.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-sm font-medium">
                          <Star className="h-4 w-4 fill-current" />
                          {business.rating}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-neutral-600">
                      {business.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-neutral-400" />
                          <span>{business.address}, {business.city}</span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 shrink-0 text-neutral-400" />
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline truncate"
                          >
                            {business.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
                <MapPin className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No businesses found</h3>
                <p className="text-neutral-500">
                  Try adjusting your search or category filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
