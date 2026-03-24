import { BaseAgent, AgentResult, BusinessRecord } from "./base.js";

const SYSTEM_PROMPT = `You are the Social Media Discovery Agent for Iraq Compass.
Your job: Given a list of Iraqi businesses (name, city, category), find or infer their Instagram and Facebook pages.

RULES:
- Use real naming patterns: Iraqi businesses often use their Arabic name transliterated, city name, or "official" suffix.
- Common Instagram patterns: @businessname_iq, @businessname_sulaymaniyah, @businessname.official
- Common Facebook patterns: facebook.com/businessname, facebook.com/businessname.iq
- ONLY output URLs/handles you are confident about. Set empty string "" if unsure.
- For each business, output a confidence: "high" (found real match), "medium" (likely match), "low" (guess).
- Never fabricate followers or engagement data.

OUTPUT FORMAT (strict JSON array):
[
  {
    "business_id": "string",
    "name_en": "string",
    "instagram": "@handle or empty",
    "instagram_url": "https://instagram.com/handle or empty",
    "facebook_url": "https://facebook.com/page or empty",
    "confidence": "high|medium|low",
    "notes": "string"
  }
]`;

export class SocialScraperAgent extends BaseAgent {
  constructor() {
    super("Social Scraper", "Instagram & Facebook Discovery");
  }

  async run(governorate: string, options?: { limit?: number; category?: string }): Promise<AgentResult> {
    const limit = options?.limit || 20;
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsInserted = 0;

    try {
      await this.setStatus("active");
      await this.log("started", `Social scan for ${governorate}, limit=${limit}`);

      // 1. Fetch businesses from Supabase that are missing social media
      let query = this.supabase
        .from("businesses")
        .select("*")
        .ilike("city", `%${governorate}%`)
        .eq("city_center_only", true)
        .limit(limit);

      if (options?.category) {
        query = query.eq("category", options.category);
      }

      const { data: businesses, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Supabase fetch error: ${fetchError.message}`);
      }

      if (!businesses || businesses.length === 0) {
        await this.log("info", `No businesses found in ${governorate} to scan`);
        await this.setStatus("idle");
        return {
          agent: this.name,
          governorate,
          status: "success",
          recordsProcessed: 0,
          recordsInserted: 0,
          errors: [],
          details: `No businesses found in ${governorate}`,
        };
      }

      recordsProcessed = businesses.length;
      await this.log("processing", `Found ${businesses.length} businesses to scan`);

      // 2. Build prompt with business list
      const businessList = businesses.map((b: any) => ({
        business_id: b.business_id || b.id,
        name_en: b.name?.en || b.name || "Unknown",
        name_ar: b.name?.ar || "",
        category: b.category || "unknown",
        city: governorate,
        existing_instagram: b.contact?.instagram || "",
        existing_facebook: b.contact?.facebook || "",
      }));

      const userPrompt = `Find Instagram and Facebook pages for these ${governorate} businesses:\n\n${JSON.stringify(businessList, null, 2)}`;

      // 3. Ask Gemini
      const raw = await this.askGemini(SYSTEM_PROMPT, userPrompt);
      let results: any[];

      try {
        results = this.parseJSON(raw);
      } catch (e) {
        errors.push(`Failed to parse Gemini response: ${(e as Error).message}`);
        await this.log("error", `JSON parse failed for ${governorate}`);
        await this.setStatus("error", { errors: (errors.length) });
        return {
          agent: this.name,
          governorate,
          status: "error",
          recordsProcessed,
          recordsInserted: 0,
          errors,
          details: raw.substring(0, 500),
        };
      }

      // 4. Update businesses in Supabase
      for (const result of results) {
        if (!result.business_id) continue;

        const updates: any = {};
        if (result.instagram || result.instagram_url) {
          updates["contact"] = {
            instagram: result.instagram || result.instagram_url || "",
            facebook: result.facebook_url || "",
          };
        }

        if (Object.keys(updates).length > 0) {
          // We need to merge contact, not overwrite it
          const existing = businesses.find(
            (b: any) => (b.business_id || b.id) === result.business_id
          );
          if (existing) {
            const mergedContact = {
              ...(existing.contact || {}),
              instagram: result.instagram || result.instagram_url || existing.contact?.instagram || "",
              facebook: result.facebook_url || existing.contact?.facebook || "",
            };

            const { error: updateError } = await this.supabase
              .from("businesses")
              .update({
                contact: mergedContact,
                agent_notes: `Social scan by ${this.name} (${result.confidence}): ${result.notes || ""}`,
              })
              .eq("id", existing.id);

            if (updateError) {
              errors.push(`Update failed for ${result.name_en}: ${updateError.message}`);
            } else {
              recordsInserted++;
              await this.log(
                "updated",
                `${result.name_en}: IG=${result.instagram || "none"}, FB=${result.facebook_url || "none"} (${result.confidence})`,
                existing.id
              );
            }
          }
        }
      }

      await this.setStatus("idle", {
        records_collected: recordsInserted,
      });
      await this.log("completed", `${governorate}: ${recordsInserted}/${recordsProcessed} businesses updated with social links`);

      return {
        agent: this.name,
        governorate,
        status: errors.length > 0 ? "partial" : "success",
        recordsProcessed,
        recordsInserted,
        errors,
        details: `Found social profiles for ${recordsInserted} of ${recordsProcessed} businesses in ${governorate}`,
      };
    } catch (err: any) {
      errors.push(err.message);
      await this.log("error", err.message);
      await this.setStatus("error");
      return {
        agent: this.name,
        governorate,
        status: "error",
        recordsProcessed,
        recordsInserted,
        errors,
        details: err.message,
      };
    }
  }
}
