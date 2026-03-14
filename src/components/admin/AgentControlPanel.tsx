import React, { useEffect, useState } from "react";

interface Agent {
  name: string;
  status: "idle" | "processing" | "error";
  lastHeartbeat: string;
  processed: number;
  failures: number;
  currentTaskId?: number;
  processedCount: number;
  errors: number;
  lastHeartbeat: string;
}

interface AgentApiResponse {
  running: boolean;
  agents: Agent[];
  governorate: string;
  governmentRate: string;
  status: "running" | "idle" | "error";
  recordsInserted?: number;
  lastActivity?: string;
}

export const AgentControlPanel: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [running, setRunning] = useState(false);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (!response.ok) throw new Error("Failed to fetch agents");
      const data = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError("Failed to load agent status");
    }
  };

  const startAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orchestrator/start", { method: "POST" });
      if (!response.ok) throw new Error("Failed to start agents");
      await fetchAgents();
    } catch {
      setError("Failed to start agents");
    } finally {
      setLoading(false);
    }
  };

  const stopAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orchestrator/stop", { method: "POST" });
      if (!response.ok) throw new Error("Failed to stop agents");
      await fetchAgents();
    } catch {
      setError("Failed to stop agents");
    } finally {
      setLoading(false);
    }
    const response = await fetch("/api/agents");
    const data = (await response.json()) as AgentApiResponse;
    setAgents(data.agents);
    setRunning(data.running);
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-white">SUPABASE AGENT QUEUE CONTROL</h2>

      <div className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={startAgents}
          disabled={loading}
          className="rounded bg-blue-600 px-6 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          START AGENTS
        </button>
        <button
          onClick={stopAgents}
          disabled={loading}
          className="rounded bg-red-600 px-6 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          STOP AGENTS
        </button>
        <button
          onClick={fetchAgents}
          disabled={loading}
          className="rounded bg-neutral-700 px-6 py-2 text-sm text-white transition-colors hover:bg-neutral-600 disabled:opacity-50"
        >
          REFRESH STATUS
    <section className="space-y-3">
      <div className="flex gap-2">
        <button className="px-3 py-2 bg-emerald-600 rounded" onClick={async () => {
          await fetch("/api/orchestrator/start", { method: "POST" });
          fetchAgents();
        }}>
          Start
        </button>
        <button className="px-3 py-2 bg-red-600 rounded" onClick={async () => {
          await fetch("/api/orchestrator/stop", { method: "POST" });
          fetchAgents();
        }}>
          Stop
        </button>
        <span className="text-sm text-neutral-400 self-center">Manager: {running ? "running" : "stopped"}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {agents.map((agent) => (
          <div key={agent.name} className="border border-neutral-800 rounded p-3 bg-neutral-900 text-sm">
            <div className="font-semibold">{agent.name}</div>
            <div>Status: {agent.status}</div>
            <div>Tasks processed: {agent.processedCount}</div>
            <div>Errors: {agent.errors}</div>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3 px-4 py-2 bg-emerald-900/20 border border-emerald-800 rounded">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 font-mono text-xs font-bold tracking-widest">QC_OVERSEER: ACTIVE</span>
        </div>
      </div>

      {error && <div className="mb-4 border border-red-800 bg-red-900/30 p-3 text-xs text-red-400">ERROR: {error}</div>}

      <div className="overflow-hidden rounded border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-neutral-800 text-neutral-400">
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Current Task</th>
              <th className="px-4 py-3">Processed</th>
              <th className="px-4 py-3">Failures</th>
              <th className="px-4 py-3">Heartbeat</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Agent ID</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Gov Rate</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Records</th>
              <th className="px-4 py-3 font-bold uppercase tracking-wider">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {agents.length ? (
              agents.map((agent, idx) => (
                <tr key={agent.name} className={idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-900/50"}>
                  <td className="px-4 py-3 text-neutral-200">{agent.name}</td>
                <tr key={idx} className={idx % 2 === 0 ? "bg-neutral-900" : "bg-neutral-900/50"}>
                  <td className="px-4 py-3 text-neutral-300 font-bold">{agent.name}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{agent.governmentRate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        agent.status === "processing"
                          ? "text-emerald-400"
                          : agent.status === "error"
                            ? "text-red-400"
                            : "text-amber-400"
                      }
                    >
                      {agent.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{agent.currentTaskId ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-300">{agent.processed}</td>
                  <td className="px-4 py-3 text-neutral-300">{agent.failures}</td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(agent.lastHeartbeat).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 text-neutral-300 font-mono">{(agent.recordsInserted || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{agent.lastActivity || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No agents found.
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 italic">
                  No agents found or loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
