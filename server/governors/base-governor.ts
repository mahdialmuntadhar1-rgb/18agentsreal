import { supabaseAdmin } from "../supabase-admin.js";

export abstract class BaseGovernor {
  protected supabase = supabaseAdmin;
  abstract category: string;
  abstract agentName: string;
  abstract governmentRate: string;

  async run() {
    await this.setStatus("active");
    try {
      const task = await this.claimTask();

      if (!task) {
        console.log(`${this.agentName}: No pending tasks found. Entering idle mode.`);
        await this.setStatus("idle");
        return { status: "no_task" as const, added: 0, errors: 0 };
      }

      console.log(`${this.agentName}: Processing task ${task.id} - ${task.category} in ${task.city}`);

      const businesses = await this.gather(task.city, task.category);

      let added = 0;
      let errors = 0;

      if (businesses.length > 0) {
        const validated = await this.validate(businesses);
        const storeResult = await this.store(validated, task.government_rate || this.governmentRate);
        added = storeResult.added;
        errors = storeResult.errors;

        await this.log("success", added, errors);
      }

      await this.completeTask(task.id);
      return { status: "completed" as const, taskId: task.id, added, errors };
    } catch (err) {
      console.error(`Error in ${this.agentName}:`, err);
      await this.setStatus("error");
      throw err;
    } finally {
      await this.setStatus("idle");
    }
  }

  private async claimTask() {
    const rpcResult = await this.supabase.rpc("claim_next_task", {
      agent_name: this.agentName,
    });

    if (!rpcResult.error && rpcResult.data && rpcResult.data.length > 0) {
      return rpcResult.data[0];
    }

    if (rpcResult.error) {
      console.warn(`${this.agentName}: claim_next_task RPC unavailable, falling back to direct claim.`, rpcResult.error.message);
    }

    const { data: candidates, error: selectError } = await this.supabase
      .from("agent_tasks")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (selectError || !candidates || candidates.length === 0) {
      if (selectError) {
        console.error(`${this.agentName}: Failed to fetch pending tasks.`, selectError.message);
      }
      return null;
    }

    const candidate = candidates[0];
    const assignment = await this.supabase
      .from("agent_tasks")
      .update({ status: "processing", assigned_agent: this.agentName })
      .eq("id", candidate.id)
      .eq("status", "pending")
      .select("*")
      .limit(1);

    if (!assignment.error && assignment.data && assignment.data.length > 0) {
      return assignment.data[0];
    }

    const statusOnlyAssignment = await this.supabase
      .from("agent_tasks")
      .update({ status: "processing" })
      .eq("id", candidate.id)
      .eq("status", "pending")
      .select("*")
      .limit(1);

    if (statusOnlyAssignment.error || !statusOnlyAssignment.data || statusOnlyAssignment.data.length === 0) {
      if (statusOnlyAssignment.error) {
        console.error(`${this.agentName}: Failed to claim task ${candidate.id}.`, statusOnlyAssignment.error.message);
      }
      return null;
    }

    return statusOnlyAssignment.data[0];
  }

  private async completeTask(taskId: number | string) {
    await this.supabase.from("agent_tasks").update({ status: "completed" }).eq("id", taskId);
  }

  async store(items: any[], govRate: string) {
    let added = 0;
    let errors = 0;

    for (const item of items) {
      const businessData = {
        name: item.name,
        category: item.category.toLowerCase(),
        government_rate: govRate,
        city: item.city,
        address: item.address,
        phone: item.phone,
        website: item.website,
        description: item.description,
        source_url: item.source_url,
        created_by_agent: this.agentName,
        verification_status: "pending",
      };

      const { error } = await this.supabase.from("businesses").upsert(businessData, { onConflict: "name,city" });

      if (error) {
        console.error(`Error inserting ${item.name}:`, error.message);
        errors++;
      } else {
        added++;
      }
    }
    return { added, errors };
  }

  async setStatus(status: string) {
    await this.supabase
      .from("agents")
      .update({
        status,
        last_run: new Date(),
        category: this.category,
        government_rate: this.governmentRate,
      })
      .eq("agent_name", this.agentName);
  }

  async log(result: string, added: number, updated: number) {
    const { data: agent } = await this.supabase.from("agents").select("id").eq("agent_name", this.agentName).single();

    if (agent) {
      await this.supabase.from("agent_logs").insert({
        agent_id: agent.id,
        action: "run",
        result,
        records_added: added,
        records_updated: updated,
      });
    }
  }

  abstract gather(city?: string, category?: string): Promise<any[]>;

  async validate(items: any[]) {
    return items.filter((i) => i.name && (i.address || i.city));
  }
}
