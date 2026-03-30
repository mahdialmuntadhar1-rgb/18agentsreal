import React, { useEffect, useState } from 'react';
import { Bot, Activity, CheckCircle2, Clock, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'Running' | 'Idle' | 'Failed';
  success_rate: number;
  last_run: string;
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setAgents(data || []);
      } catch (err) {
        await handleSupabaseError(err, OperationType.GET, 'agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();

    const channel = supabase
      .channel('agents_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        fetchAgents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAgentsCount = agents.filter(a => a.status === 'Running').length;

  const toggleAgentStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'Running' ? 'Idle' : 'Running';
    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agent.id);
      
      if (error) throw error;
    } catch (err) {
      await handleSupabaseError(err, OperationType.UPDATE, `agents/${agent.id}`);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">AGENT REGISTRY</h2>
          <p className="text-gray-500 font-medium">Mission control for your 18-agent workforce</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} />
            {activeAgentsCount} Agents Active
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search agents by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A84C]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#1B2B5E] border-t-transparent rounded-full animate-spin" />
              <span>Loading agents...</span>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300">
            <Bot size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">No agents found</p>
            <p className="text-sm">Try adjusting your search or check database</p>
          </div>
        ) : (
          filteredAgents.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 hover:shadow-md transition-all group relative overflow-hidden"
            >
              {/* Status Indicator */}
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-10 ${
                agent.status === 'Running' ? 'bg-emerald-500' : 'bg-gray-500'
              }`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                  agent.status === 'Running' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  <Bot size={28} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  agent.status === 'Running' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {agent.status}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-black text-[#1B2B5E] uppercase tracking-tight">{agent.name}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{agent.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-sm font-black text-[#1B2B5E]">{agent.success_rate}%</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Run</p>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    <span className="text-sm font-black text-[#1B2B5E]">{agent.last_run}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => toggleAgentStatus(agent)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    agent.status === 'Running' 
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                      : 'bg-[#1B2B5E] text-white hover:scale-105 shadow-lg'
                  }`}
                >
                  {agent.status === 'Running' ? 'Stop Agent' : 'Start Agent'}
                </button>
                <button className="px-3 py-2 bg-gray-50 text-gray-400 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 rounded-xl transition-all">
                  <Activity size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Agents;
