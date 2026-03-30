import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Edit2, RotateCw, Search, Filter, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';
import { VerifiedBusiness } from '../types';

export default function ApprovalHub() {
  const [businesses, setBusinesses] = useState<VerifiedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPendingBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .or('verification_status.eq.pending,status.eq.pending,needs_review.eq.true')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      await handleSupabaseError(err, OperationType.GET, 'businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBusinesses();

    const channel = supabase
      .channel('approval_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
        fetchPendingBusinesses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          verification_status: action === 'approve' ? 'approved' : 'rejected',
          status: action === 'approve' ? 'approved' : 'rejected',
          needs_review: false,
          approved_at: action === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      
      if (paginated.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      await handleSupabaseError(err, OperationType.UPDATE, `businesses/${id}`);
    }
  };

  const filtered = businesses.filter(b => 
    (b.name_en?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.name_ar?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.name_ku?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading queue...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={48} className="text-slate-700 mb-2" />
                        <p className="font-bold text-white">Queue Empty</p>
                        <p className="text-sm">All businesses have been reviewed</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        {b.name_en || b.name_ar || b.name_ku || 'Unnamed'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{b.city}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{b.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          b.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          b.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {b.status}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} pending reviews
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 bg-slate-800 rounded-lg text-slate-400 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
