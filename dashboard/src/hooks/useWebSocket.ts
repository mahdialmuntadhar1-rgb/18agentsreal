import { useEffect, useState } from 'react';

export function useWebSocket() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs((prev) => [log, ...prev].slice(0, 100));
    };

    return () => ws.close();
  }, []);

  return logs;
}
