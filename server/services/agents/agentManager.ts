import { supabaseAdmin } from "../../supabase-admin.js";

export type AgentStatus = "idle" | "running" | "stopped" | "error";
export type AgentSchedule = "manual" | "hourly" | "daily" | "weekly";

export type DirectoryRecord = {
  name: string;
  city: string;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  source?: string | null;
};

export type AgentRunStats = { inserted: number; duplicates: number; errors: number };
export type AgentRunResult = AgentRunStats & { logOutput?: string };

export type AgentDefinition = {
  id: string;
  name: string;
  description: string;
  schedule?: AgentSchedule;
  run: () => Promise<AgentRunResult>;
};

class AgentManager {
  private agents = new Map<string, AgentDefinition>();
  private statuses = new Map<string, AgentStatus>();
  private enabled = new Map<string, boolean>();
  private schedules = new Map<string, AgentSchedule>();
  private lastRun = new Map<string, string | null>();
  private recordsProcessed = new Map<string, number>();
  private errorCounts = new Map<string, number>();
  private schedulerTimer: NodeJS.Timeout | null = null;
  private abortControllers = new Map<string, AbortController>();

  registerAgents(agentDefinitions: AgentDefinition[]) {
    for (const agent of agentDefinitions) {
      this.agents.set(agent.id, agent);
      this.statuses.set(agent.id, "idle");
      this.enabled.set(agent.id, true);
      this.schedules.set(agent.id, agent.schedule || "manual");
      this.lastRun.set(agent.id, null);
      this.recordsProcessed.set(agent.id, 0);
      this.errorCounts.set(agent.id, 0);
      this.ensureAgentRow(agent).catch(console.error);
    }
  }

  async runAgent(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} is not registered.`);
    if (!this.enabled.get(agentId)) throw new Error(`Agent ${agentId} is disabled.`);
    if (this.statuses.get(agentId) === "running") throw new Error(`Agent ${agentId} is already running.`);

    const startedAt = new Date().toISOString();
    this.lastRun.set(agentId, startedAt);
    this.statuses.set(agentId, "running");
    await this.updateStatus(agentId, "running", this.errorCounts.get(agentId) || 0);

    const controller = new AbortController();
    this.abortControllers.set(agentId, controller);

    let status: AgentStatus = "idle";
    let stats: AgentRunStats = { inserted: 0, duplicates: 0, errors: 0 };
    let logOutput = "";

    try {
      const result = await agent.run();
      stats = { inserted: result.inserted, duplicates: result.duplicates, errors: result.errors };
      logOutput = result.logOutput || "Run finished successfully.";
      status = result.errors > 0 ? "error" : "idle";
      await this.reportResults(agentId, stats);
      return { status, ...stats };
    } catch (error: any) {
      status = "error";
      stats.errors += 1;
      this.errorCounts.set(agentId, (this.errorCounts.get(agentId) || 0) + 1);
      logOutput = error?.message || "Unhandled run failure.";
      throw error;
    } finally {
      this.abortControllers.delete(agentId);
      this.statuses.set(agentId, status);
      await this.updateStatus(agentId, status, this.errorCounts.get(agentId) || 0);
      await this.writeLog(agentId, {
        startedAt,
        finishedAt: new Date().toISOString(),
        ...stats,
        status,
        logOutput,
      });
    }
  }

  stopAgent(agentId: string) {
    const controller = this.abortControllers.get(agentId);
    if (controller) controller.abort();
    this.statuses.set(agentId, "stopped");
    return this.updateStatus(agentId, "stopped", this.errorCounts.get(agentId) || 0);
  }

  getAgentStatus(agentId: string) {
    return this.statuses.get(agentId) || "idle";
  }

  async setEnabled(agentId: string, isEnabled: boolean) {
    if (!this.agents.has(agentId)) throw new Error("Unknown agent");
    this.enabled.set(agentId, isEnabled);
    const { error } = await supabaseAdmin.from("agents").update({ enabled: isEnabled }).eq("name", agentId);
    if (error) console.error(error.message);
  }

  async setSchedule(agentId: string, schedule: AgentSchedule) {
    this.schedules.set(agentId, schedule);
    const { error } = await supabaseAdmin.from("agents").update({ schedule }).eq("name", agentId);
    if (error) throw error;
  }

  listAgents() {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: this.statuses.get(agent.id) || "idle",
      enabled: this.enabled.get(agent.id) ?? true,
      schedule: this.schedules.get(agent.id) || "manual",
      last_run: this.lastRun.get(agent.id),
      records_processed: this.recordsProcessed.get(agent.id) || 0,
      errors: this.errorCounts.get(agent.id) || 0,
    }));
  }

  startScheduler() {
    if (this.schedulerTimer) return;
    this.schedulerTimer = setInterval(() => {
      this.runScheduledAgents().catch(console.error);
    }, 60_000);
  }

  private async runScheduledAgents() {
    const now = new Date();
    for (const agent of this.agents.values()) {
      const schedule = this.schedules.get(agent.id) || "manual";
      if (schedule === "manual" || !this.enabled.get(agent.id)) continue;
      const shouldRun =
        (schedule === "hourly" && now.getMinutes() === 0) ||
        (schedule === "daily" && now.getHours() === 0 && now.getMinutes() === 0) ||
        (schedule === "weekly" && now.getDay() === 0 && now.getHours() === 0 && now.getMinutes() === 0);
      if (shouldRun && this.getAgentStatus(agent.id) !== "running") {
        this.runAgent(agent.id).catch(console.error);
      }
    }
  }

  async writeLog(agentId: string, input: { startedAt: string; finishedAt: string; inserted: number; duplicates: number; errors: number; status: string; logOutput: string }) {
    const agentRow = await this.getAgentRow(agentId);
    if (!agentRow) return;
    await supabaseAdmin.from("agent_logs").insert({
      agent_id: agentRow.id,
      started_at: input.startedAt,
      finished_at: input.finishedAt,
      records_inserted: input.inserted,
      duplicates_skipped: input.duplicates,
      errors: input.errors,
      status: input.status,
      log_output: input.logOutput,
    });
  }

  async getLogs(agentId: string) {
    const agentRow = await this.getAgentRow(agentId);
    if (!agentRow) return [];
    const { data, error } = await supabaseAdmin.from("agent_logs").select("id, started_at, finished_at, records_inserted, duplicates_skipped, errors, status, log_output").eq("agent_id", agentRow.id).order("started_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  }

  async reportResults(agentId: string, stats: AgentRunStats) {
    this.recordsProcessed.set(agentId, (this.recordsProcessed.get(agentId) || 0) + stats.inserted);
    this.errorCounts.set(agentId, (this.errorCounts.get(agentId) || 0) + stats.errors);

    const { error } = await supabaseAdmin.from("agents").update({
      last_run: new Date().toISOString(),
      records_processed: this.recordsProcessed.get(agentId),
      errors: this.errorCounts.get(agentId),
    }).eq("name", agentId);

    if (error) console.error(error.message);
  }

  async insertDirectoryRecords(records: DirectoryRecord[]) {
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    for (const record of records) {
      if (await this.isDuplicate(record)) {
        duplicates += 1;
        continue;
      }
      const { error } = await supabaseAdmin.from("directory").insert(record);
      if (error) errors += 1;
      else inserted += 1;
    }
    return { inserted, duplicates, errors };
  }

  private async isDuplicate(record: DirectoryRecord) {
    if (record.phone) {
      const { data } = await supabaseAdmin.from("directory").select("id").eq("phone", record.phone).limit(1);
      if (data?.length) return true;
    }
    const name = record.name?.trim();
    if (!name) return false;
    if (record.city) {
      const { data } = await supabaseAdmin.from("directory").select("id").ilike("name", name).ilike("city", record.city).limit(1);
      if (data?.length) return true;
    }
    if (typeof record.latitude === "number" && typeof record.longitude === "number") {
      const { data } = await supabaseAdmin.from("directory").select("id").ilike("name", name).eq("latitude", record.latitude).eq("longitude", record.longitude).limit(1);
      if (data?.length) return true;
    }
    return false;
  }

  private async ensureAgentRow(agent: AgentDefinition) {
    await supabaseAdmin.from("agents").upsert({
      name: agent.id,
      description: agent.description,
      status: "idle",
      enabled: true,
      schedule: agent.schedule || "manual",
      records_processed: 0,
      errors: 0,
    }, { onConflict: "name" });
  }

  private async updateStatus(agentId: string, status: AgentStatus, errors: number) {
    await supabaseAdmin.from("agents").update({ status, last_run: new Date().toISOString(), errors }).eq("name", agentId);
  }

  private async getAgentRow(agentId: string) {
    const { data, error } = await supabaseAdmin.from("agents").select("id").eq("name", agentId).maybeSingle();
    if (error) throw error;
    return data;
  }
}

export const agentManager = new AgentManager();
