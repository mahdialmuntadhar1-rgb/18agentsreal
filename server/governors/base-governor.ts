import { supabaseAdmin } from "../supabase-admin.js";

export abstract class BaseGovernor {
  protected supabase = supabaseAdmin;
  abstract category: string;
  abstract agentName: string;
  abstract governmentRate: string;

  async run() {
    await this.setStatus("active");
    try {
      // 1. Concurrency-safe task claim using RPC (FOR UPDATE SKIP LOCKED)
      const task = await this.claimTask();
      
      if (!task) {
        console.log(`${this.agentName}: No pending tasks found. Entering idle mode.`);
        await this.setStatus("idle");
        return;
      }

      console.log(`${this.agentName}: Processing task ${task.id} - ${task.category} in ${task.city}`);
      
      // 2. Scrape/Gather data
      const businesses = await this.gather(task.city, task.category);
      
      if (businesses.length > 0) {
        // 3. Validate and 4. Insert (Supabase handles duplicate protection via unique index)
        const validated = await this.validate(businesses);
        const { added, errors } = await this.store(validated, task.government_rate);
        
        await this.log("success", added, errors);
      }

      // 5. Mark task as complete
      await this.completeTask(task.id);
      
    } catch (err) {
      console.error(`Error in ${this.agentName}:`, err);
      await this.setStatus("error");
    }
    await this.setStatus("idle");
  }

  /**
   * Calls the Supabase RPC for concurrency-safe task claiming
   */
  private async claimTask() {
    // This RPC must be created in Supabase SQL editor:
    // CREATE OR REPLACE FUNCTION claim_next_task(agent_name TEXT)
    // RETURNS SETOF agent_tasks AS $$
    // DECLARE
    //   target_id BIGINT;
    // BEGIN
    //   SELECT id INTO target_id
    //   FROM agent_tasks
    //   WHERE status = 'pending'
    //   ORDER BY created_at
    //   LIMIT 1
    //   FOR UPDATE SKIP LOCKED;
    //
    //   IF target_id IS NOT NULL THEN
    //     RETURN QUERY
    //     UPDATE agent_tasks
    //     SET status = 'processing', assigned_agent = agent_name
    //     WHERE id = target_id
    //     RETURNING *;
    //   END IF;
    // END;
    // $$ LANGUAGE plpgsql;

    const { data, error } = await this.supabase.rpc("claim_next_task", {
      agent_name: this.agentName
    });

    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  private async completeTask(taskId: number) {
    await this.supabase
      .from("agent_tasks")
      .update({ status: "completed" })
      .eq("id", taskId);
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
        verification_status: "pending"
      };

      // Use upsert with onConflict to handle the unique index (name, city)
      const { error } = await this.supabase
        .from("businesses")
        .upsert(businessData, { onConflict: "name,city" });

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
        government_rate: this.governmentRate
      })
      .eq("agent_name", this.agentName);
  }

  async log(result: string, added: number, updated: number) {
    const { data: agent } = await this.supabase
      .from("agents")
      .select("id")
      .eq("agent_name", this.agentName)
      .single();
      
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
