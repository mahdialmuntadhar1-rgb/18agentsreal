import { GoogleGenAI } from "@google/genai";
import { BaseDiscoveryAdapter } from "./base.js";
import { DiscoveryInput, NormalizedBusiness } from "../types.js";

type GeminiResponse = { businesses: Array<Partial<NormalizedBusiness>> };

function tryParseJson(text: string): GeminiResponse | null {
  try {
    return JSON.parse(text);
  } catch {
    const block = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text.match(/\{[\s\S]*\}/)?.[0];
    if (!block) return null;
    try {
      return JSON.parse(block);
    } catch {
      return null;
    }
  }
}

export class GeminiResearchAdapter extends BaseDiscoveryAdapter {
  readonly source = "gemini" as const;
  private client: GoogleGenAI | null;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  private buildPrompt(input: DiscoveryInput) {
    const city = input.city || "Baghdad";
    const governorate = input.governorate || city;
    const category = input.category || "businesses";
    const limit = input.limit || 15;

    return [
      "You are extracting Iraqi business leads with strict anti-hallucination behavior.",
      "Return JSON only with this shape: {\"businesses\":[...]}",
      "Only include businesses you can tie to a source_url or map_url. If uncertain, skip it.",
      "Support Arabic and Kurdish local_name when known.",
      `Find up to ${limit} ${category} in ${city}, ${governorate}, Iraq for query: ${input.query}`,
      "Each item must include: name, local_name, category, city, governorate, address, phone, website, facebook_url, instagram_url, map_url, opening_hours, source_url, confidence_score, extraction_notes.",
      "confidence_score must be 0-100 based on evidence quality.",
      "Never output markdown or explanation outside JSON.",
    ].join("\n");
  }

  async searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]> {
    if (!this.client) return [];

    const prompt = this.buildPrompt(input);
    const attempts = 2;
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await this.client.models.generateContent({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          config: { responseMimeType: "application/json", temperature: 0.1 },
          contents: prompt,
        });

        const parsed = tryParseJson(result.text || "");
        if (!parsed?.businesses?.length) continue;

        return parsed.businesses
          .map((b) => this.normalizeBusiness({ ...b, source: this.source }))
          .filter((b): b is NormalizedBusiness => !!b)
          .map((b) => ({ ...b, confidence_score: b.confidence_score ?? this.scoreBusiness(b) }));
      } catch (error) {
        if (i === attempts - 1) {
          console.warn("Gemini adapter failed:", error);
        }
      }
    }

    return [];
  }
}
