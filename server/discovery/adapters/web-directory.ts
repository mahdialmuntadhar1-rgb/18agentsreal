import { BaseDiscoveryAdapter } from "./base.js";
import { DiscoveryInput, NormalizedBusiness } from "../types.js";
import { extractFirstPhone, searchSnippets } from "./web-search.js";

export class WebDirectoryAdapter extends BaseDiscoveryAdapter {
  readonly source = "web_directory" as const;

  async searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]> {
    const city = input.city || "Baghdad";
    const category = input.category || "business";
    const query = `${category} directory ${city} Iraq`;
    const snippets = await searchSnippets(query, input.limit || 10);

    return snippets
      .filter((s) => !/facebook|instagram|google\.com\/maps/.test(s.url))
      .map((s) => {
        const name = s.title.split("-")[0].trim();
        return this.normalizeBusiness({
          name,
          city,
          governorate: input.governorate || city,
          category,
          website: s.url,
          source_url: s.url,
          phone: extractFirstPhone(s.snippet),
          address: s.snippet,
          extraction_notes: "Generic web directory extraction",
          confidence_score: 30 + (extractFirstPhone(s.snippet) ? 20 : 0),
          raw_payload: s,
        });
      })
      .filter((b): b is NormalizedBusiness => !!b);
  }
}
