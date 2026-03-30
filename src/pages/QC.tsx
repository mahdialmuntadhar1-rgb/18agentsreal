import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';
import { VerifiedBusiness } from '../types';

type QCIssueType = 'missing_phone' | 'low_confidence' | 'possible_duplicate';
type QCRecord = VerifiedBusiness & { issueTypes: QCIssueType[] };

const QC: React.FC = () => {
  const [records, setRecords] = useState<QCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [issueCounts, setIssueCounts] = useState({
    missingPhone: 0,
    lowConfidence: 0,
    possibleDuplicates: 0,
  });

  const getIssueTypes = (
    business: VerifiedBusiness,
    duplicateIds: Set<string>,
  ): QCIssueType[] => {
    const issues: QCIssueType[] = [];
    if (!business.phone?.trim()) issues.push('missing_phone');
    if ((business.confidence_score ?? 0) < 70) issues.push('low_confidence');
    if (duplicateIds.has(business.id)) issues.push('possible_duplicate');
    return issues;
  };

  const fetchQCRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .or('needs_review.eq.true,verification_status.eq.pending,status.eq.pending')
        .order('confidence_score', { ascending: true });

      if (error) throw error;
      const incoming = (data || []) as VerifiedBusiness[];
      const duplicateMap = new Map<string, number>();

      for (const business of incoming) {
        const key = `${(business.name_en || business.name_ar || business.name_ku || '').trim().toLowerCase()}|${(business.city || '').trim().toLowerCase()}`;
        if (!key || key === '|') continue;
        duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
      }

      const duplicateIds = new Set(
        incoming
          .filter((business) => {
            const key = `${(business.name_en || business.name_ar || business.name_ku || '').trim().toLowerCase()}|${(business.city || '').trim().toLowerCase()}`;
            return (duplicateMap.get(key) || 0) > 1;
          })
          .map((business) => business.id)
      );

      const enhancedRecords = incoming
        .map((business) => ({
          ...business,
          issueTypes: getIssueTypes(business, duplicateIds),
        }))
        .filter((business) => business.issueTypes.length > 0);

      setIssueCounts({
        missingPhone: enhancedRecords.filter((r) => r.issueTypes.includes('missing_phone')).length,
        lowConfidence: enhancedRecords.filter((r) => r.issueTypes.includes('low_confidence')).length,
        possibleDuplicates: enhancedRecords.filter((r) => r.issueTypes.includes('possible_duplicate')).length,
      });
      setRecords(enhancedRecords);
    } catch (err) {
      await handleSupabaseError(err, OperationType.GET, 'businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQCRecords();

    const channel = supabase
      .channel('qc_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
        fetchQCRecords();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'discard') => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          needs_review: false,
          verification_status: action === 'approve' ? 'approved' : 'rejected',
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_at: action === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await handleSupabaseError(err, OperationType.UPDATE, 'businesses');
    }
  };

  const filtered = records.filter(r => 
    r.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIssueLabel = (issue: QCIssueType) => {
    switch (issue) {
      case 'missing_phone':
        return 'Missing Phone';
      case 'low_confidence':
        return 'Low Confidence';
      case 'possible_duplicate':
        return 'Possible Duplicate';
      default:
        return 'Needs Review';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">QUALITY CONTROL</h2>
          <p className="text-gray-500 font-medium">Automated flags requiring human intervention</p>
        </div>
        <div className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={14} />
          {records.length} Records Flagged
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Missing Phones</p>
          <p className="text-2xl font-black text-[#1B2B5E] mt-2">{issueCounts.missingPhone}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Low Confidence</p>
          <p className="text-2xl font-black text-[#1B2B5E] mt-2">{issueCounts.lowConfidence}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Possible Duplicates</p>
          <p className="text-2xl font-black text-[#1B2B5E] mt-2">{issueCounts.possibleDuplicates}</p>
        </div>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#C9A84C] w-64"
              />
            </div>
          </div>
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading QC records...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No records flagged for review</td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1B2B5E]">{record.name_ar || record.name_en}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{record.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-500" />
                        <span className="text-xs font-bold text-rose-700">
                          {record.issueTypes.map(getIssueLabel).join(' • ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${record.confidence_score > 70 ? 'bg-emerald-500' : record.confidence_score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${record.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-500">{record.confidence_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase">{record.city}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleAction(record.id, 'approve')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" 
                          title="Approve"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleAction(record.id, 'discard')}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                          title="Discard"
                        >
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
      </div>
    </div>
  );
};

export default QC;
