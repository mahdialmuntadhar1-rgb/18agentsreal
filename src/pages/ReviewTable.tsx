import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ChevronRight,
  MoreVertical,
  CheckSquare
} from 'lucide-react';
import { businessService } from '../services/dashboardService';
import { VerifiedBusiness } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const ReviewTable: React.FC = () => {
  const [businesses, setBusinesses] = useState<VerifiedBusiness[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [filters, setFilters] = useState({
    status: 'All Status',
    city: 'All Cities',
    category: 'All Categories',
    search: '',
    minScore: 0
  });

  useEffect(() => {
    fetchBusinesses();
  }, [filters, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.city, filters.category, filters.search, filters.minScore]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const result = await businessService.getVerifiedBusinesses(filters, { page, pageSize });
      setBusinesses(result.data);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await businessService.updateStatus(id, status);
      fetchBusinesses();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      await businessService.batchApprove(selectedIds);
      setSelectedIds([]);
      fetchBusinesses();
    } catch (error) {
      alert('Batch approval failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">BUSINESS REVIEW</h2>
          <p className="text-gray-500 font-medium">Verify and approve records for the public directory</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBatchApprove}
              className="bg-[#C9A84C] text-[#1B2B5E] px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
            >
              Batch Approve ({selectedIds.length})
            </motion.button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C9A84C]"
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Flagged</option>
          </select>
        </div>
        <select 
          value={filters.city}
          onChange={(e) => setFilters({...filters, city: e.target.value})}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C9A84C]"
        >
          <option>All Cities</option>
          <option>Baghdad</option>
          <option>Erbil</option>
          <option>Sulaymaniyah</option>
          <option>Basra</option>
        </select>
        <div className="flex-1" />
        <select 
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C9A84C]"
        >
          <option>All Categories</option>
          <option>restaurants</option>
          <option>cafes</option>
          <option>bakeries</option>
          <option>hotels</option>
          <option>gyms</option>
          <option>beauty_salons</option>
          <option>pharmacies</option>
          <option>supermarkets</option>
        </select>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search businesses..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedIds(e.target.checked ? businesses.map(b => b.id) : [])}
                    className="rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Business Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Location</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Scores</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-300 italic">No records found matching filters</td>
                </tr>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        className="rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1B2B5E]">{b.name_ar || b.name_en || b.name_ku}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{b.phone || 'No Phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-gray-600">{b.city}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">{b.city}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase">
                        {b.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(s => (
                            <div key={s} className={`w-2 h-2 rounded-full ${s <= (b.verification_score || 0) ? 'bg-[#C9A84C]' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <span className={`text-[10px] font-black ${(b.confidence_score || 0) >= 80 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {b.confidence_score || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleStatusUpdate(b.id, 'approved')}
                          disabled={(b.confidence_score || 0) < 80}
                          className={`p-2 rounded-lg transition-all ${(b.confidence_score || 0) >= 80 ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-200 cursor-not-allowed'}`}
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(b.id, 'flagged')}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Flag"
                        >
                          <AlertTriangle size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(b.id, 'rejected')}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 px-2">
        <p>Showing {businesses.length} of {totalCount} filtered records.</p>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    flagged: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
};

export default ReviewTable;
