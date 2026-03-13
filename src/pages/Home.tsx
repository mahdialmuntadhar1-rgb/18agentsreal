import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { MapPin, Search, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
const PAGE_SIZE = 24;
function catLabel(cat: string) { const m: any = {pharmacy:"Pharmacy",hospital:"Hospital",school:"School",university:"University",restaurant:"Restaurant",fast_food:"Fast Food",cafe:"Cafe",hotel:"Hotel",bank:"Bank",police:"Police",mosque:"Mosque",market:"Market",supermarket:"Supermarket",clinic:"Clinic",dentist:"Dentist",gym:"Gym",park:"Park",fuel:"Fuel",atm:"ATM",kindergarten:"Kindergarten"}; return m[cat] || (cat||"").replace(/_/g," "); }
function catIcon(cat: string) { const m: any = {pharmacy:"💊",hospital:"🏥",school:"🏫",university:"🎓",restaurant:"🍽️",fast_food:"🍔",cafe:"☕",hotel:"🏨",bank:"🏦",police:"🚓",mosque:"🕌",market:"🛒",supermarket:"🛒",clinic:"🩺",dentist:"🦷",gym:"💪",park:"🌳",fuel:"⛽",atm:"💳"}; return m[cat]||"📍"; }
function isRTL(s: string) { return /[\u0600-\u06FF]/.test(s); }
export default function Home() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cat, setCat] = useState("");
  const [gov, setGov] = useState("");
  const [city, setCity] = useState("");
  const [govs, setGovs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  useEffect(() => { const t = setTimeout(() => setSearch(searchInput), 400); return () => clearTimeout(t); }, [searchInput]);
  useEffect(() => { load(true); }, [search, cat, gov, city]);
  useEffect(() => { supabase.from("directory").select("governorate").limit(2000).then(({data}) => { if(data) setGovs([...new Set(data.map((r:any)=>r.governorate).filter(Boolean))].sort() as string[]); }); supabase.from("directory").select("category").limit(2000).then(({data}) => { if(data) setCats([...new Set(data.map((r:any)=>r.category).filter(Boolean))].sort() as string[]); }); }, []);
  useEffect(() => { if(!gov){setCities([]);setCity("");return;} supabase.from("directory").select("city").eq("governorate",gov).limit(2000).then(({data})=>{ if(data) setCities([...new Set(data.map((r:any)=>r.city).filter(Boolean))].sort() as string[]); }); setCity(""); }, [gov]);
  const load = useCallback(async (reset=true) => {
    setLoading(true);
    const off = reset ? 0 : offset;
    let q = supabase.from("directory").select("id,name,city,governorate,category",{count:"exact"}).order("id").range(off, off+PAGE_SIZE-1);
    if(search) q = q.ilike("name",`%${search}%`);
    if(cat) q = q.eq("category",cat);
    if(gov) q = q.eq("governorate",gov);
    if(city) q = q.eq("city",city);
    const {data,count,error} = await q;
    if(error){console.error(error);setLoading(false);return;}
    if(reset){setRows(data||[]);setOffset(PAGE_SIZE);}
    else{setRows(p=>[...p,...(data||[])]);setOffset(off+PAGE_SIZE);}
    setTotal(count||0);
    setLoading(false);
  }, [search,cat,gov,city,offset]);
  const topCats = ["hospital","pharmacy","school","restaurant","mosque","bank","hotel","fast_food","clinic","market"];
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="text-2xl">🧭</span><div><div className="font-bold text-lg text-amber-400">Iraq Compass</div><div className="text-xs text-neutral-400">Iraqi Business Directory</div></div></div>
          <div className="flex items-center gap-4"><span className="text-sm text-neutral-400 hidden sm:block"><span className="text-amber-400 font-medium">{total.toLocaleString()}</span> businesses</span><Link to="/admin" className="text-sm text-neutral-400 hover:text-white">Admin</Link></div>
        </div>
      </header>
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 py-12 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Discover Iraq Businesses</h1>
        <p className="text-neutral-400 mb-8">Search across 74,000+ businesses in all governorates</p>
        <div className="max-w-2xl mx-auto relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input type="text" className="w-full h-14 bg-neutral-800 border border-neutral-700 rounded-2xl pr-12 pl-4 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 text-base" placeholder="Search businesses..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} />
        </div>
        <div className="flex gap-3 justify-center flex-wrap max-w-3xl mx-auto mb-4">
          <select className="h-10 bg-neutral-800 border border-neutral-700 rounded-xl px-3 text-sm text-neutral-300 focus:outline-none focus:border-amber-500" value={gov} onChange={e=>setGov(e.target.value)}><option value="">All Governorates</option>{govs.map(g=><option key={g} value={g}>{g}</option>)}</select>
          {cities.length>0 && <select className="h-10 bg-neutral-800 border border-neutral-700 rounded-xl px-3 text-sm text-neutral-300 focus:outline-none focus:border-amber-500" value={city} onChange={e=>setCity(e.target.value)}><option value="">All Cities</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select>}
          <select className="h-10 bg-neutral-800 border border-neutral-700 rounded-xl px-3 text-sm text-neutral-300 focus:outline-none focus:border-amber-500" value={cat} onChange={e=>setCat(e.target.value)}><option value="">All Categories</option>{cats.map(c=><option key={c} value={c}>{catLabel(c)}</option>)}</select>
        </div>
        <div className="flex gap-2 justify-center flex-wrap max-w-3xl mx-auto">
          {topCats.map(c=><button key={c} onClick={()=>setCat(cat===c?"":c)} className={`h-9 px-4 rounded-full text-sm border transition-all ${cat===c?"bg-amber-500 border-amber-500 text-neutral-900 font-medium":"bg-transparent border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-400"}`}>{catIcon(c)} {catLabel(c)}</button>)}
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-sm text-neutral-500 mb-6">Showing <span className="text-amber-400 font-medium">{rows.length}</span> of <span className="text-white font-medium">{total.toLocaleString()}</span> results</div>
        {loading && rows.length===0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array(12).fill(0).map((_,i)=><div key={i} className="bg-neutral-900 rounded-xl h-32 animate-pulse border border-neutral-800"/>)}</div>
        : rows.length===0 ? <div className="text-center py-20 text-neutral-500"><div className="text-4xl mb-4">🔍</div><p>No results found</p></div>
        : <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{rows.map(b=><div key={b.id} onClick={()=>setSelected(b)} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 hover:bg-neutral-800 transition-all"><div className="flex items-center gap-1.5 mb-2"><span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">{catIcon(b.category)} {catLabel(b.category)}</span></div><h3 className="font-medium text-white mb-2 leading-snug line-clamp-2" dir={isRTL(b.name)?"rtl":"ltr"}>{b.name}</h3><div className="flex items-center gap-1.5 text-xs text-neutral-500"><MapPin className="h-3 w-3"/><span>{b.city}{b.city&&b.governorate?" · ":""}{b.governorate}</span></div></div>)}</div>
        {rows.length<total&&<div className="text-center mt-10"><button onClick={()=>load(false)} disabled={loading} className="h-12 px-8 border border-neutral-700 rounded-full text-neutral-300 hover:border-amber-500 hover:text-amber-400 transition-all disabled:opacity-40">{loading?"Loading...":"Load More"}</button></div>}</>}
      </main>
      {selected&&<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setSelected(null)}><div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full"><div className="flex justify-between items-start mb-4"><div><div className="text-xs text-amber-400 mb-1">{catIcon(selected.category)} {catLabel(selected.category)}</div><h2 className="text-xl font-semibold text-white" dir={isRTL(selected.name)?"rtl":"ltr"}>{selected.name}</h2></div><button onClick={()=>setSelected(null)} className="text-neutral-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800">✕</button></div><div className="space-y-3 text-sm">{selected.city&&<div className="flex justify-between border-b border-neutral-800 pb-3"><span className="text-neutral-500">City</span><span className="text-white">{selected.city}</span></div>}{selected.governorate&&<div className="flex justify-between border-b border-neutral-800 pb-3"><span className="text-neutral-500">Governorate</span><span className="text-white">{selected.governorate}</span></div>}{selected.phone&&<div className="flex justify-between border-b border-neutral-800 pb-3"><span className="text-neutral-500">Phone</span><span className="text-white" dir="ltr">{selected.phone}</span></div>}{selected.address&&<div className="flex justify-between border-b border-neutral-800 pb-3"><span className="text-neutral-500">Address</span><span className="text-white">{selected.address}</span></div>}</div></div></div>}
    </div>
  );
}
