import { supabaseAdmin } from "../supabase-admin.ts";

export interface BusinessData {
  name: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  source_url?: string;
  source_name?: string;
  external_source_id?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  photos?: string[];
  opening_hours?: string;
  price_range?: string;
  email?: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp?: string;
}

export interface AgentTask {
  id: string | number;
  category: string;
  city: string;
  government_rate?: string;
}

export abstract class BaseGovernor {
  protected supabase = supabaseAdmin;
  abstract category: string;
  abstract agentName: string;
  abstract governmentRate: string;
  abstract city: string;

  async run() {
    await this.setStatus("active");
    try {
<<<<<<< Updated upstream
      // 1. Concurrency-safe task claim using RPC (FOR UPDATE SKIP LOCKED)
      const task = await this.claimTask();
      
      if (!task) {
        console.log(`${this.agentName}: No pending tasks found. Entering idle mode.`);
=======
      let task: AgentTask | null = null;
      
      if (taskOverride?.city && taskOverride?.category) {
        task = {
          id: taskOverride.id || `direct_${Date.now()}`,
          category: taskOverride.category,
          city: taskOverride.city,
          government_rate: taskOverride.government_rate || this.governmentRate,
        };
        console.log(`${this.agentName}: Direct run mode for ${task.category} in ${task.city}`);
      } else {
        try {
          task = await this.claimTask();
        } catch (claimErr) {
          console.warn(`${this.agentName}: Task claiming failed, using defaults:`, claimErr);
          task = {
            id: `fallback_${Date.now()}`,
            category: this.category,
            city: this.city,
            government_rate: this.governmentRate,
          };
        }
      }

      if (!task || !task.city) {
        console.log(`${this.agentName}: No valid task. Entering idle mode.`);
>>>>>>> Stashed changes
        await this.setStatus("idle");
        return;
      }

      console.log(`${this.agentName}: Processing task ${task.id} - ${task.category} in ${task.city}`);
<<<<<<< Updated upstream
      
      // 2. Scrape/Gather data
      const businesses = await this.gather(task.city, task.category);
      
=======

      // Check if task is still valid before proceeding
      if (task.id && !String(task.id).startsWith('direct_') && !String(task.id).startsWith('fallback_')) {
        const { data: taskStatus } = await this.supabase
          .from('agent_tasks')
          .select('status')
          .eq('id', task.id)
          .single();
        
        if (taskStatus?.status === 'failed' || taskStatus?.status === 'cancelled') {
          console.log(`${this.agentName}: Task ${task.id} is ${taskStatus.status}, aborting run`);
          await this.setStatus("idle");
          return;
        }
      }

      const businesses = await this.gather(task.city, task.category);

      // Re-check task status after potentially long gather operation
      if (task.id && !String(task.id).startsWith('direct_') && !String(task.id).startsWith('fallback_')) {
        const { data: taskStatus } = await this.supabase
          .from('agent_tasks')
          .select('status')
          .eq('id', task.id)
          .single();
        
        if (taskStatus?.status === 'failed' || taskStatus?.status === 'cancelled') {
          console.log(`${this.agentName}: Task ${task.id} was stopped during gather, aborting store`);
          await this.setStatus("idle");
          return;
        }
      }

>>>>>>> Stashed changes
      if (businesses.length > 0) {
        // 3. Validate and 4. Insert (Supabase handles duplicate protection via unique index)
        const validated = await this.validate(businesses);
        const { added, errors } = await this.store(validated, task.government_rate);
        
        await this.log("success", added, errors);
      }

<<<<<<< Updated upstream
      // 5. Mark task as complete
      await this.completeTask(task.id);
      
=======
      if (!taskOverride?.city && task.id && !String(task.id).startsWith('fallback_')) {
        await this.completeTask(task.id);
      }
>>>>>>> Stashed changes
    } catch (err) {
      console.error(`Error in ${this.agentName}:`, err);
      await this.setStatus("error");
<<<<<<< Updated upstream
=======
      throw err;
>>>>>>> Stashed changes
    }
    await this.setStatus("idle");
  }

<<<<<<< Updated upstream
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
=======
  private async claimTask(): Promise<AgentTask | null> {
    try {
      const { data, error } = await this.supabase.rpc("claim_next_task", {
        agent_name: this.agentName,
      });
>>>>>>> Stashed changes

      if (error) {
        console.warn(`${this.agentName}: RPC claim_next_task failed:`, error.message);
        return null;
      }
      if (!data || data.length === 0) return null;
      return data[0];
    } catch (err) {
      console.warn(`${this.agentName}: claimTask exception:`, err);
      return null;
    }
  }

<<<<<<< Updated upstream
  private async completeTask(taskId: number) {
    await this.supabase
      .from("agent_tasks")
      .update({ status: "completed" })
      .eq("id", taskId);
=======
  private async completeTask(taskId: string | number) {
    try {
      await this.supabase.from("agent_tasks").update({ status: "completed" }).eq("id", taskId);
    } catch (err) {
      console.warn(`${this.agentName}: completeTask failed:`, err);
      // Non-fatal: task completion failure shouldn't stop the flow
    }
>>>>>>> Stashed changes
  }

  async store(items: BusinessData[], govRate: string) {
    let added = 0;
    let errors = 0;

    for (const item of items) {
      // Quick check if we're still in a valid state before each insert
      const { data: agentStatus } = await this.supabase
        .from('agents')
        .select('status')
        .eq('agent_name', this.agentName)
        .single();
      
      if (agentStatus?.status === 'idle' || agentStatus?.status === 'error') {
        console.log(`${this.agentName}: Agent stopped during store, aborting remaining inserts`);
        break;
      }

      const businessData = {
        business_name: item.name,
        category: item.category.toLowerCase(),
        government_rate: govRate,
        city: item.city,
        address: item.address,
        phone: item.phone,
        website: item.website,
        description: item.description,
        source_url: item.source_url,
        source_name: item.source_name,
        external_source_id: item.external_source_id,
        latitude: item.latitude,
        longitude: item.longitude,
        rating: item.rating,
        review_count: item.review_count,
        images: item.photos,
        opening_hours: item.opening_hours,
        price_range: item.price_range,
        email: item.email,
        facebook_url: item.facebook_url,
        instagram_url: item.instagram_url,
        whatsapp: item.whatsapp,
        created_by_agent: this.agentName,
<<<<<<< Updated upstream
        verification_status: "pending"
      };

      // Use upsert with onConflict to handle the unique index (name, city)
      const { error } = await this.supabase
        .from("businesses")
        .upsert(businessData, { onConflict: "name,city" });
=======
        verification_status: "pending",
        scraped_at: new Date().toISOString(),
      };

      const { error } = await this.supabase.from("businesses").upsert(businessData, { onConflict: "business_name,address,city" });
>>>>>>> Stashed changes

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

  abstract gather(city?: string, category?: string): Promise<BusinessData[]>;

  async validate(items: BusinessData[]) {
    return items.filter((i) => i.name && (i.address || i.city));
  }
}
