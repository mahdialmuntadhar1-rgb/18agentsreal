import React, { useState } from 'react';
import { CheckCircle2, XCircle, Edit2, RotateCw, Search, Filter, ShieldCheck } from 'lucide-react';

interface ProcessedBusiness {
  id: string;
  name: string;
  city: string;
  description: string;
  qcStatus: 'Approved' | 'Flagged' | 'Needs Review';
}

const MOCK_DATA: ProcessedBusiness[] = [
  { id: '1', name: 'Al Noor Pharmacy', city: 'Baghdad', description: 'A trusted local pharmacy providing essential medicines and health products.', qcStatus: 'Approved' },
  { id: '2', name: 'Golden Square Mall', city: 'Sulaymaniyah', description: 'A popular shopping destination with retail stores, restaurants, and family entertainment.', qcStatus: 'Approved' },
  { id: '3', name: 'Babylon Hotel', city: 'Erbil', description: 'Luxury accommodation with premium amenities in the heart of the city.', qcStatus: 'Needs Review' },
  { id: '4', name: 'Tigris Cafe', city: 'Basra', description: 'Local cafe serving traditional Iraqi tea and pastries.', qcStatus: 'Flagged' },
  { id: '5', name: 'FitZone Gym', city: 'Karbala', description: 'Modern fitness center with state-of-the-art equipment and personal trainers.', qcStatus: 'Approved' },
];

export default function ApprovalHub() {
  const [businesses, setBusinesses] = useState<ProcessedBusiness[]>(MOCK_DATA);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = (id: string, action: string) => {
    if (action === 'approve') {
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, qcStatus: 'Approved' } : b));
    } else if (action === 'reject') {
      setBusinesses(prev => prev.filter(b => b.id !== id));
    }
    // Mock edit/regenerate
  };

  const filtered = businesses.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={32} />
              APPROVAL HUB
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Review and approve AI-generated business listings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search businesses..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
              <Filter size={16} /> Filter
            </button>
          </div>
        </header>

        <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Business Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">City</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Generated Description</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">QC Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{b.name}</td>
                    <td className="px-6 py-4 text-slate-400">{b.city}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-md truncate">{b.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        b.qcStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        b.qcStatus === 'Flagged' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {b.qcStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleAction(b.id, 'approve')} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors" title="Approve">
                          <CheckCircle2 size={16} />
                        </button>
                        <button className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors" title="Regenerate">
                          <RotateCw size={16} />
                        </button>
                        <button onClick={() => handleAction(b.id, 'reject')} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
