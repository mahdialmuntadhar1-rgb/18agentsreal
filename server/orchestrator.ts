import { getGovernorNames, runAllGovernors } from "./governors/index.js";

type AgentStatus = "idle" | "running" | "stopped" | "error";

type Agent = {
  id: string;
  name: string;
  status: AgentStatus;
};

export class AgentOrchestrator {
  private agents: Agent[] = getGovernorNames().map((name, index) => ({
    id: `gov-${String(index + 1).padStart(2, "0")}`,
    name,
    status: "idle",
  }));

  private scheduleTimer: NodeJS.Timeout | null = null;

  private get intervalMs() {
    const intervalMinutes = Number(process.env.AGENT_INTERVAL_MINUTES ?? "60");
    return Math.max(intervalMinutes, 1) * 60_000;
  }

  getAgents() {
    return this.agents;
  }

  private setAllStatuses(status: AgentStatus) {
    this.agents = this.agents.map((agent) => ({ ...agent, status }));
  }

  private async runCycle() {
    console.log("[Orchestrator] Running governor cycle...");
    this.setAllStatuses("running");
    try {
      await runAllGovernors();
      this.setAllStatuses("idle");
      console.log("[Orchestrator] Governor cycle finished.");
    } catch (error) {
      this.setAllStatuses("error");
      console.error("[Orchestrator] Governor cycle failed:", error);
    }
  }

  async startAll() {
    console.log("[Orchestrator] Starting all agents...");

    if (!this.scheduleTimer) {
      this.scheduleTimer = setInterval(() => {
        void this.runCycle();
      }, this.intervalMs);
    }

    void this.runCycle();

    return {
      status: "started",
      schedule_minutes: this.intervalMs / 60_000,
      agents: this.agents,
    };
  }

  async stopAll() {
    console.log("[Orchestrator] Stopping all agents...");
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }

    this.setAllStatuses("stopped");
    return { status: "stopped", agents: this.agents };
  }
}
