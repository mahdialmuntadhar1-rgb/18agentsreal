import { AlertCircle, CheckCircle, Loader2, Play } from 'lucide-react';

interface AgentCardProps {
  city: string;
  status: string;
  recordsFound?: number;
  recordsVerified?: number;
  onStart: () => void;
}

export function AgentCard({ city, status, recordsFound = 0, recordsVerified = 0, onStart }: AgentCardProps) {
  const statusConfig = {
    idle: { icon: Play, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Idle' },
    pending: { icon: Loader2, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Running' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Completed' },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-bold">{city}</h3>
        <span className={`${config.bg} ${config.color} flex items-center gap-1 rounded-full px-2 py-1 text-xs`}>
          <Icon className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`} />
          {config.label}
        </span>
      </div>
      <div className="mb-3 space-y-1 text-sm text-gray-600">
        <div>📊 Found: {recordsFound}</div>
        <div>✅ Verified: {recordsVerified}</div>
      </div>
      <button
        onClick={onStart}
        disabled={status === 'running' || status === 'pending'}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        <Play className="h-4 w-4" /> Run Agent
      </button>
    </div>
  );
}
