import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Eye,
  Loader2,
  Filter,
  Search,
  Building2,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PendingBusiness {
  id: string;
  business_name: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  created_by_agent?: string;
  scraped_at?: string;
}

const ApprovalHub: React.FC = () => {
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const fetchPendingBusinesses = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('verification_status', 'pending')
      .order('scraped_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setBusinesses(data);
    }
    
    setIsLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('businesses')
      .update({ verification_status: 'approved' })
      .eq('id', id);

    if (!error) {
      setBusinesses(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('businesses')
      .update({ verification_status: 'rejected' })
      .eq('id', id);

    if (!error) {
      setBusinesses(prev => prev.filter(b => b.id !== id));
    }
  };

  const filtered = businesses.filter(b => {
    const matchesSearch = b.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || b.category === filter;
    return matchesSearch && matchesFilter;
  });

  const selected = businesses.find(b => b.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">APPROVAL HUB</h2>
          <p className="text-gray-500 font-medium">Review and approve pending business records</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
          {isLoading ? '...' : `${businesses.length} Pending`}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C9A84C]"
          >
            <option value="All">All Categories</option>
            <option value="restaurants">Restaurants</option>
            <option value="cafes">Cafes</option>
            <option value="hotels">Hotels</option>
            <option value="pharmacies">Pharmacies</option>
            <option value="supermarkets">Supermarkets</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pending Records</h3>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
                <p className="text-sm">No pending records to approve!</p>
              </div>
            ) : (
              filtered.map((business) => (
                <div
                  key={business.id}
                  onClick={() => setSelectedId(business.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedId === business.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{business.business_name}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 size={12} />
                          {business.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {business.city}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                        {business.description || 'No description'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(business.id);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Approve"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(business.id);
                        }}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-6">
          {selected ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-[#1B2B5E] mb-2">{selected.business_name}</h3>
                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase">
                  {selected.category}
                </span>
              </div>

              <div className="space-y-3">
                {selected.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Address</p>
                      <p className="text-sm text-gray-900">{selected.address}</p>
                    </div>
                  </div>
                )}
                
                {selected.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Phone</p>
                      <p className="text-sm text-gray-900">{selected.phone}</p>
                    </div>
                  </div>
                )}
                
                {selected.website && (
                  <div className="flex items-start gap-3">
                    <Globe size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Website</p>
                      <a 
                        href={selected.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {selected.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selected.description && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Metadata</p>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>Source: {selected.created_by_agent || 'Unknown'}</p>
                  <p>Scraped: {selected.scraped_at ? new Date(selected.scraped_at).toLocaleString() : 'Unknown'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => handleApprove(selected.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selected.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <Eye size={48} className="mb-4" />
              <p className="text-sm">Select a record to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalHub;
