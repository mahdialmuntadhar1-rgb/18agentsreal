import { BaseDiscoveryAdapter } from "./base.js";
import { DiscoveryInput, NormalizedBusiness } from "../types.js";
import { extractFirstPhone, searchSnippets } from "./web-search.js";

export class InstagramDiscoveryAdapter extends BaseDiscoveryAdapter {
  readonly source = "instagram" as const;

  async searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]> {
    const city = input.city || "Baghdad";
    const category = input.category || "restaurant";
    const query = `${category} ${city} Iraq site:instagram.com`;
    const snippets = await searchSnippets(query, input.limit || 10);

    return snippets
      .filter((s) => s.url.includes("instagram.com"))
      .map((s) => {
        const name = s.title.replace(/\(@.*?\)/, "").split("•")[0].trim();
        const phone = extractFirstPhone(`${s.title} ${s.snippet}`);
        const normalized = this.normalizeBusiness({
          name,
          city,
          governorate: input.governorate || city,
          category,
          instagram_url: s.url,
          source_url: s.url,
          phone,
          address: s.snippet,
          extraction_notes: "Instagram snippet extraction (partial fields expected)",
          confidence_score: phone ? 60 : 38,
          raw_payload: s,
        });
        return normalized;
      })
      .filter((b): b is NormalizedBusiness => !!b);
  }
}
