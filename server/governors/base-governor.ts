import { supabaseAdmin } from "../supabase-admin.js";

export abstract class BaseGovernor {
  protected supabase = supabaseAdmin;
  abstract category: string;
  abstract agentName: string;
  abstract governmentRate: string;

  async run() {
    await this.setStatus("running");
    try {
      const task = await this.claimTask();

      if (!task) {
        console.log(`${this.agentName}: No pending tasks found. Entering idle mode.`);
        await this.setStatus("idle");
        return;
      }

      console.log(`${this.agentName}: Processing task ${task.id} - ${task.category} in ${task.city}`);
      const businesses = await this.gather(task.city, task.category);

      if (businesses.length > 0) {
        const validated = await this.validate(businesses);
        const { added, errors } = await this.store(validated, task.government_rate);
        await this.log("success", `Run completed. added=${added}, errors=${errors}`);
      } else {
        await this.log("info", "Run completed with no collected records.");
      }

      await this.completeTask(task.id);
    } catch (err) {
      console.error(`Error in ${this.agentName}:`, err);
      await this.log("error", `Run failed: ${err instanceof Error ? err.message : String(err)}`);
      await this.setStatus("error");
      return;
    }
    await this.setStatus("idle");
  }

  private async claimTask() {
    const { data, error } = await this.supabase.rpc("claim_next_task", {
      agent_name: this.agentName,
    });

    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  private async completeTask(taskId: string | number) {
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
        last_run: new Date().toISOString(),
        category: this.category,
      })
      .eq("agent_name", this.agentName);
  }

  async log(type: "info" | "success" | "warning" | "error", message: string) {
    await this.supabase.from("agent_logs").insert({
      agent_id: this.agentName,
      type,
      message,
      created_at: new Date().toISOString(),
    });
  }

  abstract gather(city?: string, category?: string): Promise<any[]>;

  async validate(items: any[]) {
    return items.filter((i) => i.name && (i.address || i.city));
  }
}
