import type { BusinessData } from '../sources/base-adapter.js';

export class GeminiEnrichmentService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichBatch(businesses: BusinessData[]): Promise<BusinessData[]> {
    const enriched: BusinessData[] = [];

    for (const business of businesses) {
      try {
        const enrichedBusiness = await this.enrich(business);
        enriched.push(enrichedBusiness);
      } catch (error) {
        console.error(`Gemini enrichment failed for ${business.name}:`, error);
        enriched.push(business);
      }
    }

    return enriched;
  }

  async enrich(business: BusinessData): Promise<BusinessData> {
    if (!this.apiKey) {
      return business;
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({ apiKey: this.apiKey });

      const prompt = `
You are a business data normalizer. Given the following raw business data, normalize and enrich it.

Input business data:
${JSON.stringify(business, null, 2)}

Tasks:
1. Normalize the category to one of: restaurants, cafes, bakeries, hotels, gyms, beauty_salons, pharmacies, supermarkets, or keep original if no match
2. Generate a brief, professional description if missing
3. Normalize phone number format
4. Extract any social media URLs from description or website if present
5. Identify subcategory based on business name and category
6. Calculate a confidence score (0.0-1.0) based on data completeness

Return ONLY a JSON object with these fields:
{
  "category": "normalized category",
  "subcategory": "specific subcategory",
  "description": "generated or cleaned description",
  "phone": "normalized phone",
  "whatsapp": "whatsapp number if derivable",
  "facebook_url": "extracted facebook url",
  "instagram_url": "extracted instagram url",
  "confidence_score": 0.85,
  "tags": ["tag1", "tag2"]
}

No markdown, no code blocks, just valid JSON.
`;

      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const enrichment = JSON.parse(jsonMatch[0]);
        return {
          ...business,
          ...enrichment,
        };
      }

      return business;
    } catch (error) {
      console.error('Gemini enrichment error:', error);
      return business;
    }
  }

  async normalizeCategories(categories: string[]): Promise<Record<string, string>> {
    const uniqueCategories = [...new Set(categories)];

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({ apiKey: this.apiKey });

      const prompt = `
Normalize these business categories to canonical values.
Input categories: ${JSON.stringify(uniqueCategories)}

Canonical categories to map to:
- restaurants
- cafes
- bakeries
- hotels
- gyms
- beauty_salons
- pharmacies
- supermarkets
- retail
- services
- entertainment
- healthcare
- education
- automotive
- other

Return a JSON object mapping each input category to its canonical form.
Example: {"restaurant": "restaurants", "cafe shop": "cafes"}

No markdown, just valid JSON object.
`;

      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error) {
      console.error('Category normalization error:', error);
      return {};
    }
  }

  async detectDuplicates(businesses: BusinessData[]): Promise<Array<[string, string]>> {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({ apiKey: this.apiKey });

      const businessList = businesses.map((b, i) => ({
        index: i,
        name: b.name,
        address: b.address,
        city: b.city,
        phone: b.phone,
      }));

      const prompt = `
Analyze these business records and identify likely duplicates.
Businesses:
${JSON.stringify(businessList, null, 2)}

Return a JSON array of pairs of indices that appear to be duplicates.
Format: [[0, 5], [3, 8]] means index 0 and 5 are duplicates, etc.
Only include high-confidence duplicates (same name + similar address or same phone).

No markdown, just valid JSON array.
`;

      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return [];
    }
  }
}
