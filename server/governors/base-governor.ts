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
        return;
      }

      console.log(`${this.agentName}: Processing task ${task.id} - ${task.category} in ${task.city}`);

      const businesses = await this.gather(task.city, task.category);

      if (businesses.length > 0) {
        const validated = await this.validate(businesses);
        const { added, errors } = await this.store(validated, task.government_rate || this.governmentRate);

        await this.log("success", added, errors);
      }

      await this.completeTask(task.id);
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

    const { data: candidates, error: selectError } = await this.supabase
      .from("agent_tasks")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (selectError || !candidates || candidates.length === 0) {
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

    return null;
  }

  private async completeTask(taskId: number | string) {
    await this.supabase.from("agent_tasks").update({ status: "completed" }).eq("id", taskId);
  }

  async store(items: any[], govRate: string) {
    let added = 0;
    let errors = 0;

    for (const item of items) {
      const nameEn = item.name || item.name_en || item.name?.en || "Unnamed";
      const nameAr = item.local_name || item.name_ar || item.name?.ar || "";
      const nameKu = item.name_ku || item.name?.ku || "";
      const source = item.source || "unknown";
      const confidence = item.confidence_score || 0;
      const status = confidence >= 70 ? "approved" : confidence >= 45 ? "pending" : "flagged";

      const businessData: any = {
        name_en: nameEn,
        name_ar: nameAr,
        name_ku: nameKu,
        name: { en: nameEn, ar: nameAr, ku: nameKu },
        category: (item.category || this.category || "unknown").toLowerCase(),
        government_rate: govRate,
        governorate: item.governorate || item.city,
        city: item.city,
        address: item.address,
        phone: item.phone,
        website: item.website,
        source,
        source_url: item.source_url,
        facebook_url: item.facebook_url,
        instagram_url: item.instagram_url,
        latitude: item.latitude,
        longitude: item.longitude,
        confidence_score: confidence,
        extraction_notes: item.extraction_notes,
        status,
        created_by_agent: this.agentName,
        verification_status: status,
      };

      const { error } = await this.supabase.from("businesses").upsert(businessData, { onConflict: "name_en,city,phone" });

      if (error) {
        console.error(`Error inserting ${nameEn}:`, error.message);
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

    await this.supabase.from("agent_logs").insert({
      agent_id: agent?.id || this.agentName,
      action: "run",
      result,
      records_added: added,
      records_updated: updated,
      message: `${this.agentName} run ${result}. added=${added} errors=${updated}`,
      type: result === "success" ? "success" : "error",
    });
  }

  async logAdapterRuns(runs: Array<{ adapter: string; ok: boolean; count: number; error?: string }>) {
    for (const run of runs) {
      await this.supabase.from("agent_logs").insert({
        agent_id: this.agentName,
        action: "adapter_run",
        result: run.ok ? "success" : "failed",
        records_added: run.count,
        message: `${run.adapter}: ${run.ok ? "ok" : "failed"}${run.error ? ` (${run.error})` : ""}`,
        type: run.ok ? "info" : "warning",
      });
    }
  }

  abstract gather(city?: string, category?: string): Promise<any[]>;

  async validate(items: any[]) {
    return items.filter((i) => i?.name && (i?.address || i?.city || i?.phone));
  }
}
