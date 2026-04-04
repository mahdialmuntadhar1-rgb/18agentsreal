import React, { useState, useMemo } from 'react';
import { FilterBar } from '../components/FilterBar';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { DiscoveryRun } from '../types';
import { Play, Search, MapPin, Tag, Loader2, AlertCircle } from 'lucide-react';
import { useDiscoveryRuns } from '../hooks/useSupabase';
import { StatCard } from '../components/StatCard';

export const DiscoveryRuns: React.FC = () => {
  const { runs, loading, error } = useDiscoveryRuns();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const matchesSearch = 
        run.governorate.toLowerCase().includes(search.toLowerCase()) ||
        run.category.toLowerCase().includes(search.toLowerCase()) ||
        run.id.toLowerCase().includes(search.toLowerCase());
      
      const matchesGov = !filters.gov || run.governorate === filters.gov;
      const matchesCat = !filters.cat || run.category === filters.cat;

      return matchesSearch && matchesGov && matchesCat;
    });
  }, [runs, search, filters]);

  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRuns.slice(start, start + pageSize);
  }, [filteredRuns, currentPage, pageSize]);

  const columns: Column<DiscoveryRun>[] = [
    { 
      header: 'Pipeline ID', 
      accessor: (run: DiscoveryRun) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <span className="font-mono text-xs font-bold text-slate-600">{run.id}</span>
        </div>
      ),
      sortKey: 'id'
    },
    { 
      header: 'Target Area', 
      accessor: (run: DiscoveryRun) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{run.governorate}</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{run.category}</span>
        </div>
      ),
      sortKey: 'governorate'
    },
    { 
      header: 'Status', 
      accessor: (run: DiscoveryRun) => <StatusBadge status={run.status as any} />,
      sortKey: 'status'
    },
    { 
      header: 'Sources', 
      accessor: (run: DiscoveryRun) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-700">{run.sourceCount}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">Points</span>
        </div>
      ),
      sortKey: 'sourceCount'
    },
    { 
      header: 'Yield', 
      accessor: (run: DiscoveryRun) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-blue-600">{run.recordsFound}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">Records</span>
        </div>
      ),
      sortKey: 'recordsFound'
    },
    { 
      header: 'Timeline', 
      accessor: (run: DiscoveryRun) => (
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Start: {run.startedAt}</span>
          {run.completedAt && (
            <span className="text-[10px] text-emerald-500 font-mono uppercase tracking-tighter">End: {run.completedAt}</span>
          )}
        </div>
      ),
      sortKey: 'startedAt'
    },
  ];

  if (loading && runs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading discovery history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Discovery Runs</h2>
          <p className="text-slate-500 text-lg">Launch and monitor automated data discovery pipelines.</p>
        </div>
        <button className="flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
          <Play className="w-4 h-4 mr-2 fill-current" />
          New Discovery Run
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Runs" 
          value={runs.length.toString()} 
          icon={Search} 
          trend="+12% vs last month"
          trendUp={true}
        />
        <StatCard 
          label="Governorates Covered" 
          value="100%" 
          icon={MapPin} 
          subValue="18/18 Regions"
        />
        <StatCard 
          label="Active Categories" 
          value="24" 
          icon={Tag} 
          subValue="Across all sectors"
        />
      </div>

      <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
        <FilterBar 
          searchPlaceholder="Search by governorate, category, or run ID..."
          onSearchChange={setSearch}
          filters={[
            { id: 'gov', label: 'All Governorates', options: [
              { value: 'Baghdad', label: 'Baghdad' }, 
              { value: 'Basra', label: 'Basra' },
              { value: 'Erbil', label: 'Erbil' }
            ] },
            { id: 'cat', label: 'All Categories', options: [
              { value: 'Restaurants', label: 'Restaurants' }, 
              { value: 'Hotels', label: 'Hotels' },
              { value: 'Industrial', label: 'Industrial' }
            ] }
          ]}
          onFilterChange={(id, val) => {
            setFilters(prev => ({ ...prev, [id]: val }));
            setCurrentPage(1);
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-3 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Failed to sync discovery data: {error}</p>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={paginatedRuns} 
        keyExtractor={(run) => run.id}
        onRowClick={(run) => console.log('Run clicked:', run)}
        pagination={{
          currentPage,
          totalPages: Math.ceil(filteredRuns.length / pageSize),
          onPageChange: setCurrentPage,
          pageSize,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          totalCount: filteredRuns.length
        }}
      />
    </div>
  );
};
