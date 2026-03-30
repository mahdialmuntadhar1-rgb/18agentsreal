import { BaseDiscoveryAdapter } from "./base.js";
import { DiscoveryInput, NormalizedBusiness } from "../types.js";
import { searchSnippets, extractFirstPhone } from "./web-search.js";

export class FacebookDiscoveryAdapter extends BaseDiscoveryAdapter {
  readonly source = "facebook" as const;

  async searchBusinesses(input: DiscoveryInput): Promise<NormalizedBusiness[]> {
    const city = input.city || "Baghdad";
    const category = input.category || "business";
    const query = `${category} in ${city} Iraq site:facebook.com`;
    const snippets = await searchSnippets(query, input.limit || 12);

    return snippets
      .filter((s) => s.url.includes("facebook.com"))
      .map((s) => {
        const name = s.title.split("|")[0].trim();
        const normalized = this.normalizeBusiness({
          name,
          city,
          governorate: input.governorate || city,
          category,
          facebook_url: s.url,
          source_url: s.url,
          phone: extractFirstPhone(`${s.title} ${s.snippet}`),
          address: s.snippet,
          extraction_notes: "Extracted from Facebook search snippets",
          confidence_score: 35 + (s.snippet.length > 60 ? 20 : 0) + (extractFirstPhone(s.snippet) ? 20 : 0),
          raw_payload: s,
        });

        return normalized;
      })
      .filter((b): b is NormalizedBusiness => !!b)
      .map((b) => ({ ...b, source: "facebook" }));
  }
}
