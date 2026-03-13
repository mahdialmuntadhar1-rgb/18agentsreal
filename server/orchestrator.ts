import { EnrichmentAgent } from "./enrichment-agent.js";
import { GOVERNORATES, type Governorate } from "./types.js";

export class AgentOrchestrator {
  private readonly agents = GOVERNORATES.map((governorate, index) => new EnrichmentAgent(governorate, index + 1));
  private readonly abortController = new AbortController();

  listAgents() {
    return this.agents.map((agent) => agent.name);
  }

  async runAgent(governorate: Governorate) {
    const agent = this.agents.find((item) => item.governorate === governorate);
    if (!agent) {
      throw new Error(`No agent found for governorate: ${governorate}`);
    }

    return agent.runSingleBatch();
  }

  runAllContinuously() {
    return Promise.all(this.agents.map((agent) => agent.runForever(this.abortController.signal)));
  }

  stop() {
    this.abortController.abort();
  }
}

export const orchestrator = new AgentOrchestrator();
