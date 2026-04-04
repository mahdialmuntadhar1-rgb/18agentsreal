import { BaseSourceAdapter, BusinessData, SearchQuery } from './base-adapter.js';

export class WebCrawlerAdapter extends BaseSourceAdapter {
  name = 'Web Crawler';
  requiresApiKey = false;

  async search(query: SearchQuery): Promise<BusinessData[]> {
    console.warn(`WebCrawlerAdapter: Direct web crawling for "${query.category} in ${query.city}"`);
    console.warn('This adapter requires a crawling service or headless browser for production use.');
    return [];
  }

  async crawlWithGemini(url: string, geminiApiKey: string): Promise<BusinessData[]> {
    try {
      const response = await this.fetchWithRetry(url);
      const html = await response.text();

      return this.extractWithGemini(html, geminiApiKey, url);
    } catch (error) {
      console.error('WebCrawlerAdapter crawl error:', error);
      return [];
    }
  }

  async extractWithGemini(html: string, geminiApiKey: string, sourceUrl: string): Promise<BusinessData[]> {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({ apiKey: geminiApiKey });

      const prompt = `
Extract business listings from this webpage HTML content.
The page may contain multiple business listings or a single business profile.

Return a JSON array of objects with these fields:
- name: business name (required)
- address: full address
- city: city name
- phone: phone number
- website: website URL
- email: email address if found
- facebook_url: Facebook page URL if found
- instagram_url: Instagram profile URL if found
- description: business description
- rating: numeric rating (e.g., 4.5)
- review_count: number of reviews
- category: business category/type
- opening_hours: business hours as string
- price_range: price level ($, $$, $$$, $$$$)

HTML content (first 50000 chars):
${html.substring(0, 50000)}

Source URL: ${sourceUrl}

Respond with ONLY valid JSON array, no markdown formatting, no code blocks.
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
          source_url: sourceUrl,
        }));
      }

      return [];
    } catch (error) {
      console.error('WebCrawlerAdapter Gemini extraction error:', error);
      return [];
    }
  }
}
