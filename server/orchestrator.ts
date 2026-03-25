import { runGovernor } from "./governors/index.js";
import { supabaseAdmin } from "./supabase-admin.js";

const JITTER_MIN_MS = 5000;
const JITTER_MAX_MS = 12000;
const QC_OVERSEER_NAME = "QC Overseer";

type AgentRow = { agent_name: string };

type OrchestratorState = {
  running: boolean;
  startedAt: string | null;
  lastHeartbeatAt: string | null;
  cycles: number;
  lastError: string | null;
};

const state: OrchestratorState = {
  running: false,
  startedAt: null,
  lastHeartbeatAt: null,
  cycles: 0,
  lastError: null,
};

function randomJitterMs() {
  return Math.floor(Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS + 1)) + JITTER_MIN_MS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pendingTaskCount() {
  const { count, error } = await supabaseAdmin
    .from("agent_tasks")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "processing"]);

  if (error) {
    console.error("COPDEX: Unable to read task queue state:", error);
    return 0;
  }

  return count ?? 0;
}

async function loadWorkerAgents() {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("agent_name")
    .neq("agent_name", QC_OVERSEER_NAME)
    .order("agent_name", { ascending: true });

  if (error || !data) {
    throw new Error(`Could not fetch agents: ${error?.message ?? "unknown error"}`);
  }

  return data as AgentRow[];
}

async function runCycle() {
  const workers = await loadWorkerAgents();

  console.log(`COPDEX: Running cycle with ${workers.length} workers (dynamic jitter enabled).`);

  for (const worker of workers) {
    if (!state.running) {
      return;
    }

    const now = new Date().toISOString();
    state.lastHeartbeatAt = now;
    await supabaseAdmin
      .from("agents")
      .update({ status: "active", last_run: now })
      .eq("agent_name", worker.agent_name);

    const result = await Promise.allSettled([runGovernor(worker.agent_name)]);
    if (result[0].status === "rejected") {
      console.error(`COPDEX: ${worker.agent_name} failed`, result[0].reason);
    }

    if (!state.running) {
      return;
    }

    const jitter = randomJitterMs();
    console.log(`COPDEX: waiting ${jitter}ms before next worker...`);
    await sleep(jitter);
  }

  if (state.running) {
    await Promise.allSettled([runGovernor(QC_OVERSEER_NAME)]);
  }
}

async function orchestratorLoop() {
  while (state.running) {
    state.cycles += 1;
    state.lastHeartbeatAt = new Date().toISOString();

    await runCycle();

    const queueCount = await pendingTaskCount();
    console.log(`COPDEX: queue depth after cycle ${state.cycles}: ${queueCount}`);

    if (queueCount === 0) {
      console.log("COPDEX: task queue is empty, stopping orchestrator loop.");
      state.running = false;
      break;
    }
  }
}

export function getOrchestratorState() {
  return {
    ...state,
    connectionStatus: state.running ? "LIVE" : "IDLE",
  };
}

export function stopOrchestrator() {
  state.running = false;
}

export async function runAllGovernors() {
  if (state.running) {
    return;
  }

  state.running = true;
  state.startedAt = new Date().toISOString();
  state.lastHeartbeatAt = state.startedAt;
  state.lastError = null;
  state.cycles = 0;

  try {
    await orchestratorLoop();
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : "Unknown orchestrator error";
    state.running = false;
    throw error;
  }
}
