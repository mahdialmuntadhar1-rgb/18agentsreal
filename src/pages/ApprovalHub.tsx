import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

type VerificationStatus = 'pending' | 'verified' | 'rejected';

interface BusinessRow {
  id: string;
  name: string;
  city: string;
  category: string;
  address: string | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export default function ApprovalHub() {
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('businesses')
      .select('id,name,city,category,address,verification_status,created_at')
      .in('verification_status', ['pending', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(200);

    if (fetchError) {
      setError(fetchError.message);
      setRows([]);
    } else {
      setRows((data ?? []) as BusinessRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadBusinesses();
  }, []);

  const handleStatusChange = async (id: string, status: VerificationStatus) => {
    setSavingId(id);
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    setSavingId(null);
  };

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(normalized) ||
        row.city.toLowerCase().includes(normalized) ||
        row.category.toLowerCase().includes(normalized),
    );
  }, [rows, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={32} />
              APPROVAL HUB
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Review pending businesses from Supabase runtime data.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by name, city, or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
        </header>

        {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200 text-sm">{error}</div>}

        <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Business</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">City</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Address</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading && (
                  <tr>
                    <td className="px-6 py-8 text-slate-400" colSpan={6}>
                      Loading review queue…
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-slate-400" colSpan={6}>
                      No pending/rejected records found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{b.name}</td>
                      <td className="px-6 py-4 text-slate-400">{b.city}</td>
                      <td className="px-6 py-4 text-slate-300">{b.category}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm max-w-sm truncate">{b.address ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          {b.verification_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={savingId === b.id}
                            onClick={() => void handleStatusChange(b.id, 'verified')}
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            disabled={savingId === b.id}
                            onClick={() => void handleStatusChange(b.id, 'rejected')}
                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
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
      </div>
    </div>
  );
}
