import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { ALLOWED_CATEGORIES } from "../../shared-categories";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ALLOWED_CATEGORIES } from "../lib/categories";

type Business = {
  id: number;
  name: string;
  category: string;
  city: string | null;
  government_rate: string | null;
  phone: string | null;
  website: string | null;
  verification_status: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

export default function Home() {
  const [rows, setRows] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALLOWED_CATEGORIES[0]);
  const [selectedRate, setSelectedRate] = useState<string>("A");

  async function refreshGrid() {
    setLoading(true);
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("category", selectedCategory)
      .eq("government_rate", selectedRate)
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (error) {
      console.error("Failed to load businesses", error);
      setRows([]);
    } else {
      setRows((data ?? []) as Business[]);

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBusinesses();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [governmentRate, setGovernmentRate] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    fetchBusinesses();

    // Set up real-time subscription
    const channel = supabase
      .channel("public:businesses")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "businesses" },
        (payload) => {
          console.log("New business added:", payload.new);
          // If the new business matches current filters, we might want to refresh
          // For simplicity, we'll just refresh the first page if we're on it
          if (currentPage === 1) {
            fetchBusinesses();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, governmentRate, currentPage]);

  async function fetchRecentBusinesses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("businesses")
      .select("id,name,category,city,government_rate,phone,website,verification_status,created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Failed to fetch businesses", error);
      setBusinesses([]);
    } else {
      setBusinesses((data as Business[]) ?? []);
    try {
      let query = supabase
        .from("businesses")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      
      if (category !== "All") {
        query = query.eq("category", category);
      }

      if (governmentRate !== "All") {
        query = query.eq("government_rate", governmentRate);
      }
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      setBusinesses(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    refreshGrid();
  }, [selectedCategory, selectedRate]);

  useEffect(() => {
    const channel = supabase
      .channel("business_updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "businesses" },
        () => {
          refreshGrid();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, selectedRate]);

  const rateOptions = useMemo(() => ["A", "B", "C"], []);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Business Directory Grid</h1>

        <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {ALLOWED_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Government Rate
            <select
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2"
              value={selectedRate}
              onChange={(event) => setSelectedRate(event.target.value)}
            >
              {rateOptions.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Business Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Government Rate</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>
                    Loading businesses...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>
                    No rows found for this category and government rate.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.city ?? "-"}</td>
                    <td className="px-4 py-3">{row.government_rate ?? "-"}</td>
                    <td className="px-4 py-3">{row.phone ?? "-"}</td>
                    <td className="px-4 py-3">
                      {row.website ? (
                        <a href={row.website} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                          {row.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">{row.verification_status ?? "pending"}</td>
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  const categories = [
    "All",
    "restaurants",
    "cafes",
    "bakeries",
    "hotels",
    "gyms",
    "beauty_salons",
    "pharmacies",
    "supermarkets",
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4">
          <div className="font-bold text-neutral-900">AI Business Directory</div>
          <Link to="/admin" className="text-emerald-600 font-medium">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Latest verified businesses</h1>
        <p className="text-neutral-600 mb-6">Allowed categories: {ALLOWED_CATEGORIES.join(", ")}</p>

        {loading ? (
          <p className="text-neutral-600">Loading…</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => (
              <article key={business.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                <h2 className="font-semibold text-neutral-900">{business.name}</h2>
                <p className="text-sm text-neutral-600 mt-1">{business.category}</p>
                <p className="text-sm text-neutral-600 mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {business.city ?? "Unknown city"}
                </p>
                <p className="text-sm text-neutral-600 mt-2">Status: {business.verification_status ?? "pending"}</p>
              </article>
            ))}
          </div>
        )}
      </main>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Categories</h2>
            <nav className="space-y-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setCurrentPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all capitalize ${
                    category === c
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  {c.replace("_", " ")}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Results Area */}
        <main className="flex-1 min-w-0">
          {/* Filters Header */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Business Listings</h2>
                <p className="text-sm text-neutral-500">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} businesses collected
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Government Rate</label>
                  <select
                    value={governmentRate}
                    onChange={(e) => { setGovernmentRate(e.target.value); setCurrentPage(1); }}
                    className="block w-48 pl-3 pr-10 py-2 text-sm border-neutral-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg bg-neutral-50"
                  >
                    <option value="All">All Government Rates</option>
                    <option value="Rate Level 1">Rate Level 1</option>
                    <option value="Rate Level 2">Rate Level 2</option>
                    <option value="Rate Level 3">Rate Level 3</option>
                    <option value="Rate Level 4">Rate Level 4</option>
                    <option value="Rate Level 5">Rate Level 5</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Business Name</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">City</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Government Rate</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Phone</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Website</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Verification Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Date Added</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-6 py-4"><div className="h-4 bg-neutral-100 rounded w-full"></div></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredBusinesses.length > 0 ? (
                    filteredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-neutral-900">{b.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-md uppercase tracking-wider">
                            {b.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{b.city || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-neutral-500">{b.government_rate || "Level 1"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{b.phone || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {b.website ? (
                            <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
                              <Globe className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                            b.verification_status === "verified" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {b.verification_status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 italic">
                        No businesses found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                          currentPage === pageNum 
                            ? "bg-emerald-600 text-white" 
                            : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {Math.ceil(totalCount / pageSize) > 5 && <span className="text-neutral-400 px-2">...</span>}
                </div>
                <button
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
              <div className="text-xs text-neutral-400 font-medium">
                Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
