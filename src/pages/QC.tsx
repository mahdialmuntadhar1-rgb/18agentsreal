import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search,
  XCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RawBusiness {
  id: string;
  business_name: string;
  city: string;
  category: string;
  phone?: string;
  address?: string;
  confidence_score?: number;
}

interface FlaggedBusiness extends RawBusiness {
  issue: string;
}

interface QCCounts {
  missingPhone: number;
  missingAddress: number;
  lowConfidence: number;
  total: number;
}

const QC: React.FC = () => {
  const [records, setRecords] = useState<FlaggedBusiness[]>([]);
  const [counts, setCounts] = useState<QCCounts>({ missingPhone: 0, missingAddress: 0, lowConfidence: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQCData();
  }, []);

  const fetchQCData = async () => {
    setIsLoading(true);

    const [missingPhoneRes, missingAddressRes, lowConfRes, flaggedRes] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }).is('phone', null),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).is('address', null),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).lt('confidence_score', 0.5).not('confidence_score', 'is', null),
      supabase.from('businesses')
        .select('id, business_name, city, category, phone, address, confidence_score')
        .is('phone', null)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setCounts({
      missingPhone: missingPhoneRes.count ?? 0,
      missingAddress: missingAddressRes.count ?? 0,
      lowConfidence: lowConfRes.count ?? 0,
      total: (missingPhoneRes.count ?? 0) + (missingAddressRes.count ?? 0),
    });

    const flagged: FlaggedBusiness[] = (flaggedRes.data ?? []).map((b: RawBusiness) => ({
      ...b,
      issue: !b.phone ? 'Missing Phone' : !b.address ? 'Missing Address' : 'Low Confidence',
    }));
    setRecords(flagged);
    setIsLoading(false);
  };

  const handleDiscard = async (id: string) => {
    await supabase.from('businesses').update({ verification_status: 'rejected' }).eq('id', id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const filtered = records.filter(r =>
    r.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">QUALITY CONTROL</h2>
          <p className="text-gray-500 font-medium">Automated flags requiring human intervention</p>
        </div>
        <div className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={14} />
          {isLoading ? '...' : `${counts.total} Records Flagged`}
        </div>
      </header>

      {/* QC Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Missing Phone', count: counts.missingPhone, color: 'text-amber-600' },
          { label: 'Missing Address', count: counts.missingAddress, color: 'text-rose-600' },
          { label: 'Low Confidence Score', count: counts.lowConfidence, color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>
              {isLoading ? <span className="text-gray-300">...</span> : stat.count}
            </p>
          </div>
        ))}
      </div>

      {/* QC Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search flagged records..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#C9A84C] w-64"
              />
            </div>
          </div>
          {isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">Record Name</th>
                <th className="px-6 py-4">Issue Type</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                    {records.length === 0 ? 'No flagged records found. Collect some businesses first.' : 'No records match your search.'}
                  </td>
                </tr>
              )}
              {filtered.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#1B2B5E]">{record.business_name}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{record.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-rose-500" />
                      <span className="text-xs font-bold text-rose-700">{record.issue}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {record.confidence_score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${record.confidence_score > 0.7 ? 'bg-emerald-500' : record.confidence_score > 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.round(record.confidence_score * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-500">{Math.round(record.confidence_score * 100)}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{record.city}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDiscard(record.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Reject / Discard"
                      >
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

      {/* QC Rules Config */}
      <div className="bg-[#1B2B5E] p-8 rounded-[32px] text-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black uppercase tracking-tight">QC Agent Ruleset</h3>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Informational</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { rule: 'Phone Validation', desc: 'Must match Iraqi mobile/landline patterns', status: 'Active' },
            { rule: 'Coordinate Check', desc: 'Must fall within Iraqi borders', status: 'Active' },
            { rule: 'Duplicate Threshold', desc: 'Flag if name + city similarity > 85%', status: 'Active' },
          ].map((rule, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-[#C9A84C]">{rule.rule}</p>
                <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">{rule.status}</span>
              </div>
              <p className="text-[10px] text-white/60">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QC;
