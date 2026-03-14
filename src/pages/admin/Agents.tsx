import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  status: string;
  enabled: boolean;
  schedule: string;
  description: string;
  last_run: string | null;
  records_processed: number;
  errors: number;
};

type AgentLog = {
  id: string;
  started_at: string;
  finished_at: string;
  records_inserted: number;
  duplicates_skipped: number;
  errors: number;
  status: string;
  log_output: string;
};

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<AgentLog[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");

  const loadAgents = async () => {
    const response = await fetch("/api/agents");
    const data = await response.json();
    setAgents(data);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const runAgent = async (agentId: string) => {
    await fetch(`/api/agents/${agentId}/run`, { method: "POST" });
    await loadAgents();
  };

  const toggleEnabled = async (agent: Agent) => {
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !agent.enabled }),
    });
    await loadAgents();
  };

  const viewLogs = async (agentId: string, name: string) => {
    const response = await fetch(`/api/agents/${agentId}/logs`);
    const data = await response.json();
    setSelectedName(name);
    setSelectedLogs(data);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Agent Manager</h1>
      <div className="overflow-auto border border-neutral-800 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3">Agent name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Last run</th>
              <th className="px-4 py-3">Records inserted</th>
              <th className="px-4 py-3">Errors</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-xs text-neutral-500">{agent.description}</div>
                </td>
                <td className="px-4 py-3">{agent.status}</td>
                <td className="px-4 py-3">{agent.schedule}</td>
                <td className="px-4 py-3">{agent.last_run ? new Date(agent.last_run).toLocaleString() : "Never"}</td>
                <td className="px-4 py-3">{agent.records_processed}</td>
                <td className="px-4 py-3">{agent.errors}</td>
                <td className="px-4 py-3">{agent.enabled ? "Yes" : "No"}</td>
                <td className="px-4 py-3 space-x-2">
                  <button className="bg-blue-600 px-3 py-1 rounded" onClick={() => runAgent(agent.id)}>
                    Run agent
                  </button>
                  <button className="bg-amber-600 px-3 py-1 rounded" onClick={() => toggleEnabled(agent)}>
                    {agent.enabled ? "Disable agent" : "Enable agent"}
                  </button>
                  <button className="bg-neutral-700 px-3 py-1 rounded" onClick={() => viewLogs(agent.id, agent.name)}>
                    View logs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLogs.length > 0 && (
        <div className="mt-8 border border-neutral-800 rounded-lg p-4 bg-neutral-900">
          <h2 className="text-xl font-semibold mb-3">Logs: {selectedName}</h2>
          <div className="space-y-3">
            {selectedLogs.map((log) => (
              <div key={log.id} className="border border-neutral-700 rounded p-3 text-sm">
                <div>Status: {log.status}</div>
                <div>Started: {new Date(log.started_at).toLocaleString()}</div>
                <div>Inserted: {log.records_inserted} | Duplicates: {log.duplicates_skipped} | Errors: {log.errors}</div>
                <div className="text-neutral-400">{log.log_output}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
