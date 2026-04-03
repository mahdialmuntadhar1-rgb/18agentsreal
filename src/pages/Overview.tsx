import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  Activity,
  Database,
  ShieldCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalBusinesses: number;
  totalCities: number;
  totalCategories: number;
  activeAgents: number;
  pendingApprovals: number;
  recentAdditions: number;
}

const Overview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBusinesses: 0,
    totalCities: 0,
    totalCategories: 0,
    activeAgents: 0,
    pendingApprovals: 0,
    recentAdditions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    
    const [businessesRes, citiesRes, categoriesRes, agentsRes, pendingRes] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('city').order('city'),
      supabase.from('businesses').select('category').order('category'),
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    ]);

    const uniqueCities = new Set(citiesRes.data?.map(b => b.city) ?? []);
    const uniqueCategories = new Set(categoriesRes.data?.map(b => b.category) ?? []);

    setStats({
      totalBusinesses: businessesRes.count ?? 0,
      totalCities: uniqueCities.size,
      totalCategories: uniqueCategories.size,
      activeAgents: agentsRes.count ?? 0,
      pendingApprovals: pendingRes.count ?? 0,
      recentAdditions: businessesRes.count ?? 0,
    });
    
    setIsLoading(false);
  };

  const statCards = [
    { 
      label: 'Total Businesses', 
      value: stats.totalBusinesses, 
      icon: Building2, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+12%'
    },
    { 
      label: 'Cities Covered', 
      value: stats.totalCities, 
      icon: MapPin, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+3'
    },
    { 
      label: 'Categories', 
      value: stats.totalCategories, 
      icon: Database, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '+2'
    },
    { 
      label: 'Active Agents', 
      value: stats.activeAgents, 
      icon: Users, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'All online'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">DASHBOARD OVERVIEW</h2>
          <p className="text-gray-500 font-medium">Real-time system metrics and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
            <Activity size={12} className="inline mr-1" />
            System Active
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">
              {isLoading ? '...' : stat.value.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-black text-[#1B2B5E]">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <ArrowUpRight size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">New businesses added</p>
                    <p className="text-xs text-gray-400">Agent-01 gathered 24 restaurants in Baghdad</p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">2m ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-[#1B2B5E] p-6 rounded-[32px] text-white">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={20} className="text-[#C9A84C]" />
              <h3 className="text-sm font-black uppercase tracking-widest">Quality Score</h3>
            </div>
            <p className="text-4xl font-black mb-2">94.2%</p>
            <p className="text-xs text-white/60">Based on verification and review metrics</p>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={20} className="text-blue-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Uptime</h3>
            </div>
            <p className="text-4xl font-black text-gray-900 mb-2">99.9%</p>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={20} className="text-rose-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Pending Review</h3>
            </div>
            <p className="text-4xl font-black text-gray-900 mb-2">{isLoading ? '...' : stats.pendingApprovals}</p>
            <p className="text-xs text-gray-400">Records awaiting approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
