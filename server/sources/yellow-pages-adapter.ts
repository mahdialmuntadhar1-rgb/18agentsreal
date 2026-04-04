import { BaseSourceAdapter, BusinessData, SearchQuery } from './base-adapter.js';

export class YellowPagesAdapter extends BaseSourceAdapter {
  name = 'Yellow Pages';
  requiresApiKey = false;
  private baseUrls: Record<string, string> = {
    'US': 'https://www.yellowpages.com',
    'CA': 'https://www.yellowpages.ca',
  };

  async search(query: SearchQuery): Promise<BusinessData[]> {
    const country = query.country || 'US';
    const baseUrl = this.baseUrls[country] || this.baseUrls['US'];

    const searchTerm = encodeURIComponent(query.category);
    const location = encodeURIComponent(query.city);

    const url = `${baseUrl}/search?search_terms=${searchTerm}&geo_location_terms=${location}`;

    console.warn(`YellowPagesAdapter: Web scraping approach required for ${url}`);
    console.warn('This adapter requires a scraping service or headless browser.');

    return [];
  }

  async scrapeWithGemini(html: string, geminiApiKey: string): Promise<BusinessData[]> {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({ apiKey: geminiApiKey });

      const prompt = `
Extract business listings from this Yellow Pages HTML content.
Return a JSON array of objects with these fields:
- name: business name (required)
- address: full address
- phone: phone number
- website: website URL if available
- rating: numeric rating if shown
- review_count: number of reviews if shown
- category: business category

HTML content:
${html.substring(0, 50000)}

Respond with ONLY valid JSON array, no markdown formatting.
`;

      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const businesses = JSON.parse(jsonMatch[0]);
        return businesses.map((b: any) => ({
          ...b,
          source_name: this.name,
          source_url: 'https://www.yellowpages.com',
        }));
      }

      return [];
    } catch (error) {
      console.error('YellowPagesAdapter Gemini extraction error:', error);
      return [];
    }
  }
}
