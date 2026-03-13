import { supabaseAdmin } from "./supabase-admin.js";
import type { BusinessRow, EnrichedBusinessPayload, Governorate } from "./types.js";

const BATCH_SIZE = 50;

const BUSINESS_COLUMNS =
  "id,name,category,phone_number,website,address,city,governorate,latitude,longitude,google_maps_url,opening_hours,facebook_url,instagram_url,logo_image_url,cover_image_url,gallery_images,short_description,status,enriched";

export class BusinessRepository {
  async fetchBatch(governorate: Governorate): Promise<BusinessRow[]> {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select(BUSINESS_COLUMNS)
      .eq("governorate", governorate)
      .or("enriched.is.null,enriched.eq.false")
      .limit(BATCH_SIZE);

    if (error) {
      throw error;
    }

    return (data ?? []) as BusinessRow[];
  }

  async updateEnrichedBusiness(id: string, payload: EnrichedBusinessPayload): Promise<void> {
    const { error } = await supabaseAdmin.from("businesses").update(payload).eq("id", id);
    if (error) {
      throw error;
    }
  }

  async updateAgentStatus(agentName: string, status: string, errorMessage?: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("agents")
      .upsert(
        {
          agent_name: agentName,
          status,
          error_message: errorMessage ?? null,
          last_run: new Date().toISOString(),
        },
        { onConflict: "agent_name" },
      );

    if (error) {
      throw error;
    }
  }

  async logAgentRun(agentName: string, metrics: Record<string, number>): Promise<void> {
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("agent_name", agentName)
      .single();

    if (agentError || !agent) {
      return;
    }

    await supabaseAdmin.from("agent_logs").insert({
      agent_id: agent.id,
      action: "enrichment_batch",
      result: metrics.failed > 0 ? "partial" : "success",
      records_processed: metrics.processed,
      records_updated: metrics.updated,
      records_failed: metrics.failed,
    });
  }
}
