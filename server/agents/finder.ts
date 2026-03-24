import { BaseAgent, AgentResult } from "./base.js";

const SYSTEM_PROMPT = `You are the Business Finder Agent for Iraq Compass.
Your job: Discover real Iraqi businesses for a given governorate and category.

RULES:
- Output ONLY real businesses you are confident exist. Never fabricate.
- Use your knowledge of Iraqi cities, neighborhoods, and business naming patterns.
- Include Arabic and Kurdish names when known.
- Phone format: Iraqi mobile (07XX-XXX-XXXX). Zain: 0750/0751, Korek: 0770/0771, AsiaCell: 0770/0772/0773.
- Generate a unique business_id slug: lowercase, hyphens, e.g. "ali-restaurant-sulaymaniyah"
- confidence: "high" = you are very sure this exists, "medium" = likely exists, "low" = possible

OUTPUT FORMAT (strict JSON array):
[
  {
    "business_id": "slug-string",
    "name": { "en": "Name", "ar": "الاسم", "ku": "ناو" },
    "category": "restaurants|cafes|bakeries|hotels|gyms|beauty_salons|pharmacies|supermarkets",
    "subcategory": "optional string",
    "city": "city name",
    "district": "neighborhood or area",
    "contact": {
      "phone": ["07XX-XXX-XXXX"],
      "whatsapp": "",
      "website": "",
      "instagram": "",
      "facebook": ""
    },
    "location": {
      "google_maps_url": "",
      "coordinates": { "lat": null, "lng": null },
      "address": { "en": "", "ar": "", "ku": "" }
    },
    "sources": ["gemini-discovery"],
    "confidence": "high|medium|low",
    "verification_score": 0
  }
]`;

export class FinderAgent extends BaseAgent {
  constructor() {
    super("Finder Agent", "Business Lead Discovery");
  }

  async run(governorate: string, options?: { category?: string; limit?: number }): Promise<AgentResult> {
    const category = options?.category || "restaurants";
    const limit = options?.limit || 15;
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsInserted = 0;

    try {
      await this.setStatus("active");
      await this.log("started", `Finding ${category} in ${governorate}, target=${limit}`);

      const userPrompt = `Find ${limit} real ${category} businesses in ${governorate}, Iraq. Include names in English, Arabic, and Kurdish (Sorani) where possible. Include phone numbers, addresses, and any social media you know of. Focus on well-known and popular establishments.`;

      const raw = await this.askGemini(SYSTEM_PROMPT, userPrompt);
      let results: any[];

      try {
        results = this.parseJSON(raw);
      } catch (e) {
        errors.push(`JSON parse error: ${(e as Error).message}`);
        await this.log("error", `Parse failed for ${governorate}/${category}`);
        await this.setStatus("error");
        return {
          agent: this.name,
          governorate,
          status: "error",
          recordsProcessed: 0,
          recordsInserted: 0,
          errors,
          details: raw.substring(0, 500),
        };
      }

      recordsProcessed = results.length;
      await this.log("processing", `Gemini returned ${results.length} businesses`);

      // Insert into Supabase
      for (const biz of results) {
        if (!biz.business_id || !biz.name) continue;

        const record = {
          business_id: biz.business_id,
          name: biz.name,
          category: biz.category || category,
          subcategory: biz.subcategory || null,
          governorate,
          city: `${governorate} City`,
          district: biz.district || null,
          latitude: biz.location?.coordinates?.lat ?? null,
          longitude: biz.location?.coordinates?.lng ?? null,
          city_center_only: true,
          verified: false,
          verification_score: biz.verification_score || 0,
          sources: biz.sources || ["gemini-discovery"],
          contact: biz.contact || { phone: [], whatsapp: "", website: "", instagram: "", facebook: "" },
          location: biz.location || { google_maps_url: "", coordinates: { lat: null, lng: null }, address: { en: "", ar: "", ku: "" } },
          postcard: { logo_url: "", cover_image_url: "", tagline: { en: "", ar: "", ku: "" }, description: { en: "", ar: "", ku: "" }, highlights: [] },
          agent_notes: `Discovered by ${this.name} (${biz.confidence || "medium"})`,
        };

        const { error: insertError } = await this.supabase
          .from("businesses")
          .upsert(record, { onConflict: "business_id" });

        if (insertError) {
          errors.push(`Insert failed for ${biz.business_id}: ${insertError.message}`);
        } else {
          recordsInserted++;
        }
      }

      await this.setStatus("idle", { records_collected: recordsInserted });
      await this.log("completed", `${governorate}/${category}: inserted ${recordsInserted}/${recordsProcessed}`);

      return {
        agent: this.name,
        governorate,
        status: errors.length > 0 ? "partial" : "success",
        recordsProcessed,
        recordsInserted,
        errors,
        details: `Discovered ${recordsInserted} ${category} in ${governorate}`,
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
