import { useWebSocket } from '../hooks/useWebSocket';

export function LiveLogs() {
  const logs = useWebSocket();

  return (
    <div className="h-64 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
      <div className="mb-2 text-gray-400">📡 Live Agent Logs</div>
      {logs.length === 0 && <div className="text-gray-500">Waiting for agent activity...</div>}
      {logs.map((log, idx) => (
        <div key={idx} className="border-b border-gray-800 py-1">
          <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
          <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
            {log.level.toUpperCase()}
          </span>{' '}
          {log.message}
        </div>
      ))}
    </div>
  );
}
