import { supabaseAdmin } from "../supabase-admin.js";

type IntakeBusiness = {
  name?: string;
  name_primary?: string;
  name_en?: string;
  category?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  source_url?: string;
  latitude?: number;
  longitude?: number;
  link_instagram?: string;
  link_facebook?: string;
  scope_status?: "in_scope" | "out_of_scope";
  [key: string]: unknown;
type GovernorTask = {
  id: number;
  category?: string;
  city?: string;
  government_rate: string;
  prompt?: string | null;
  city_center_only?: boolean;
  language_priority?: "native-first" | "balanced";
};

type EnrichmentConfig = {
  cityCenterOnly: boolean;
  languagePriority: "native-first" | "balanced";
};

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
      const config = this.getTaskConfig(task);
      const processed: any[] = [];
      let skipped = 0;

      for (const record of businesses) {
        const result = await this.processBusiness(record, config);
        if (result.status === "processed" && result.record) {
          processed.push(result.record);
          continue;
        }

        skipped++;
        console.log(`${this.agentName}: skipped "${record?.name ?? "unknown"}" (${result.reason})`);
      }
      
      if (businesses.length > 0) {
        // 3. Analyze & Localize loop: Think -> Verify -> Translate
        const analyzed = await this.validate(businesses);
        // 4. Insert (Supabase handles duplicate protection via unique index)
        const validated = analyzed.filter((item) => item.scope_status !== "out_of_scope");
      if (processed.length > 0) {
        // 3. Validate and 4. Insert (Supabase handles duplicate protection via unique index)
        const validated = await this.validate(processed);
        const { added, errors } = await this.store(validated, task.government_rate);
        await this.log("success", added, errors + skipped);
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
  private async claimTask(): Promise<GovernorTask | null> {
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

  async store(items: IntakeBusiness[], govRate: string) {
    let added = 0;
    let errors = 0;

    for (const item of items) {
      const businessData = {
        name: item.name_en || item.name_primary || item.name,
        name_primary: item.name_primary || item.name,
        name_en: item.name_en || item.name,
        category: String(item.category || this.category).toLowerCase(),
        name: item.name,
        name_native: item.name_native ?? item.name,
        name_ar: item.name_ar ?? null,
        name_en: item.name_en ?? item.name,
        name_ku: item.name_ku ?? null,
        category: item.category.toLowerCase(),
        government_rate: govRate,
        city: item.city,
        address: item.address,
        phone: item.phone,
        website: item.website,
        link_instagram: item.link_instagram ?? "Requires Human Review",
        link_facebook: item.link_facebook ?? "Requires Human Review",
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        scope_status: item.scope_status || "in_scope",
        link_instagram: item.link_instagram || item.instagram || null,
        link_facebook: item.link_facebook || item.facebook || null,
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

  async validate(items: IntakeBusiness[]) {
    return items
      .filter((i) => i.name && (i.address || i.city))
      .map((item) => this.analyzeAndLocalize(item));
  }

  private analyzeAndLocalize(item: IntakeBusiness) {
    const scopeStatus: IntakeBusiness["scope_status"] = this.withinSulaymaniyahCityCenter(item)
      ? "in_scope"
      : "out_of_scope";
    const primaryName = item.name_primary || String(item.name || "").trim();
    const sourceScript = this.detectScript(primaryName);
    const commercialEnglishName =
      item.name_en ||
      this.toCommercialEnglishName(primaryName, sourceScript, String(item.category || this.category));

    return {
      ...item,
      name_primary: primaryName,
      name_en: commercialEnglishName,
      scope_status: scopeStatus
    };
  }

  private detectScript(value: string): "sorani_kurdish" | "arabic" | "latin_or_other" {
    if (/[\u0750-\u077F\u08A0-\u08FF]/.test(value)) return "sorani_kurdish";
    if (/[\u0600-\u06FF]/.test(value)) return "arabic";
    return "latin_or_other";
  }

  private toCommercialEnglishName(name: string, script: string, category: string): string {
    const normalizedCategory = category.replace(/_/g, " ").toLowerCase();
    if (script === "latin_or_other") return name;
    const cleaned = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
    return `${cleaned} ${normalizedCategory}`.replace(/\s+/g, " ").trim();
  }

  private withinSulaymaniyahCityCenter(item: IntakeBusiness): boolean {
    const address = String(item.address || "").toLowerCase();
    if (address.includes("bakrajo") || address.includes("bakrajow")) return false;
    if (address.includes("pira magrun") || address.includes("piramagrun")) return false;

    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;

    // Saray Square city center geofence (6km radius)
    const sarayLat = 35.5613;
    const sarayLng = 45.4340;
    const distanceKm = this.haversineKm(lat, lng, sarayLat, sarayLng);
    return distanceKm <= 6;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private getTaskConfig(task: GovernorTask): EnrichmentConfig {
    const prompt = (task.prompt ?? "").toLowerCase();
    const forceCityCenter = task.city_center_only ?? prompt.includes("city center only");
    const nativeFirst = task.language_priority
      ? task.language_priority === "native-first"
      : prompt.includes("language priority");

    return {
      cityCenterOnly: forceCityCenter,
      languagePriority: nativeFirst ? "native-first" : "balanced",
    };
  }

  protected async processBusiness(record: any, config: EnrichmentConfig) {
    if (config.cityCenterOnly && !this.isWithinCityCenter(record)) {
      return { status: "skipped" as const, reason: "Outside City Center" };
    }

    const localizedNames = this.getLocalizedNames(record.name, config.languagePriority);
    const socials = this.findSocialLinks(record);

    return {
      status: "processed" as const,
      record: {
        ...record,
        ...localizedNames,
        link_instagram: socials.instagram,
        link_facebook: socials.facebook,
      },
    };
  }

  protected isWithinCityCenter(record: any): boolean {
    const city = String(record.city ?? "").toLowerCase();
    const address = String(record.address ?? "").toLowerCase();
    const excludedSuburbs = ["bazyan", "tasluja", "bakrajo"];

    if (excludedSuburbs.some((suburb) => city.includes(suburb) || address.includes(suburb))) {
      return false;
    }

    if (!city.includes("sulaymaniyah") && !city.includes("sulaymani")) {
      return true;
    }

    const lat = Number(record.latitude);
    const lng = Number(record.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return true;
    }

    const center = { lat: 35.5613, lng: 45.4302 };
    const distanceKm = this.distanceKm(center.lat, center.lng, lat, lng);
    return distanceKm <= 6;
  }

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  private getLocalizedNames(name: string, priority: "native-first" | "balanced") {
    const raw = String(name ?? "").trim();
    const hasArabicScript = /[\u0600-\u06FF]/.test(raw);
    const hasSoraniMarkers = /[ێۆڵڕڤگچژ]/.test(raw);
    const isKurdish = hasSoraniMarkers;

    const name_native = raw;
    const name_ku = isKurdish ? raw : null;
    const name_ar = hasArabicScript && !isKurdish ? raw : raw;
    const name_en = hasArabicScript
      ? (priority === "native-first" ? `Transliteration required: ${raw}` : `English translation required: ${raw}`)
      : raw;

    return { name_native, name_ku, name_ar, name_en };
  }

  private findSocialLinks(record: any) {
    const text = `${record.website ?? ""} ${record.source_url ?? ""} ${record.description ?? ""}`;
    const ig = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._-]+/i)?.[0];
    const fb = text.match(/https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9._-]+/i)?.[0];

    return {
      instagram: ig ?? "Requires Human Review",
      facebook: fb ?? "Requires Human Review",
    };
  }
}
