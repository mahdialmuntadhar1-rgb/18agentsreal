import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileJson, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { businessService } from '../services/dashboardService';
import { VerifiedBusiness } from '../types';
import { motion } from 'motion/react';

const Export: React.FC = () => {
  const [businesses, setBusinesses] = useState<VerifiedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    city: 'All',
    minScore: 80
  });

  useEffect(() => {
    fetchApproved();
  }, [filters]);

  const fetchApproved = async () => {
    setLoading(true);
    try {
      const result = await businessService.getVerifiedBusinesses({
        status: 'approved',
        ...filters
      });
      setBusinesses(result.data);
    } catch (error) {
      console.error('Error fetching approved:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const exportData = businesses.map(b => ({
        name: {
          ar: b.name_ar,
          ku: b.name_ku,
          en: b.name_en
        },
        category: b.category,
        governorate: b.governorate,
        city: b.city,
        coordinates: b.coordinates,
        phone: b.phone,
        website: b.website,
        photos: b.photos,
        confidence_score: b.confidence_score
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iraq_compass_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setExporting(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">EXPORT DATA</h2>
        <p className="text-gray-500 font-medium">Generate clean JSON for the public directory</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by City</label>
            <select 
              value={filters.city}
              onChange={e => setFilters({...filters, city: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]"
            >
              <option>All</option>
              <option>Baghdad</option>
              <option>Basra</option>
              <option>Erbil</option>
              <option>Sulaymaniyah</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Minimum Confidence Score</label>
            <select 
              value={filters.minScore}
              onChange={e => setFilters({...filters, minScore: parseInt(e.target.value)})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]"
            >
              <option value="80">80% (Recommended)</option>
              <option value="90">90% (Strict)</option>
              <option value="100">100% (Perfect)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-[#1B2B5E]/5 rounded-2xl border border-[#1B2B5E]/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1B2B5E] text-white rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-black text-[#1B2B5E] uppercase tracking-tight">Ready for Export</h4>
              <p className="text-xs text-gray-500 font-bold uppercase">{businesses.length} Approved Records Found</p>
            </div>
          </div>
          <button 
            onClick={handleExport}
            disabled={businesses.length === 0 || exporting}
            className="bg-[#C9A84C] text-[#1B2B5E] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin" /> : <Download size={18} />}
            Download JSON
          </button>
        </div>

        {businesses.length === 0 && !loading && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">No approved records match your criteria. Please review more businesses first.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-[#1B2B5E] uppercase text-xs tracking-widest">Export Schema Preview</h4>
        </div>
        <div className="p-6 bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto">
          <pre>{`{
  "name": {
    "ar": "مطعم النهر",
    "ku": "چێشتخانەی ڕووبار",
    "en": "River Restaurant"
  },
  "category": "Restaurants",
  "city": "Baghdad",
  "district": "Karrada",
  "coordinates": { "lat": 33.312, "lng": 44.421 },
  "phone": "+964 770 123 4567",
  "website": "https://river-rest.iq",
  "photos": ["https://..."],
  "confidence_score": 95
}`}</pre>
        </div>
      </div>
    </div>
  );
};

export default Export;
