import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { AgentJob, getAgentStatus, startAgent, startAllAgents } from '../lib/api';

const CITIES = [
  'Baghdad',
  'Mosul',
  'Basra',
  'Erbil',
  'Sulaymaniyah',
  'Kirkuk',
  'Najaf',
  'Karbala',
  'Hilla',
  'Ramadi',
  'Fallujah',
  'Amarah',
  'Diwaniyah',
  'Kut',
  'Samarra',
  'Tikrit',
  'Dohuk',
  'Zakho'
];

export function AgentDashboard() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    const data = await getAgentStatus();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const getJobForCity = (city: string): AgentJob | undefined => {
    return jobs.find((j) => j.city === city && j.status !== 'completed');
  };

  const handleStartAll = async () => {
    await startAllAgents();
    setTimeout(fetchStatus, 500);
  };

  if (loading) return <div className="p-10 text-center">Loading agents...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🤖 Iraqi City Agents</h1>
        <button
          onClick={handleStartAll}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <Play className="h-4 w-4" /> Run All 18 Agents
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CITIES.map((city) => {
          const job = getJobForCity(city);
          return (
            <AgentCard
              key={city}
              city={city}
              status={job?.status || 'idle'}
              recordsFound={job?.records_found}
              recordsVerified={job?.records_verified}
              onStart={() => startAgent(city)}
            />
          );
        })}
      </div>
    </div>
  );
}
