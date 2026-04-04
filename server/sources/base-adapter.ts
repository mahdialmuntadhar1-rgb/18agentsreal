export interface BusinessData {
  name: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  source_url?: string;
  source_name: string;
  external_source_id?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  photos?: string[];
  opening_hours?: string;
  price_range?: string;
  email?: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp?: string;
}

export interface SourceAdapter {
  name: string;
  requiresApiKey: boolean;
  search(query: SearchQuery): Promise<BusinessData[]>;
  getById?(id: string): Promise<BusinessData | null>;
}

export interface SearchQuery {
  category: string;
  city: string;
  country?: string;
  limit?: number;
  page?: number;
  radius?: number;          // Search radius in meters (for city center targeting)
  strictCityCenter?: boolean; // Filter results to strict city center radius
}

export abstract class BaseSourceAdapter implements SourceAdapter {
  abstract name: string;
  abstract requiresApiKey: boolean;
  protected apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  abstract search(query: SearchQuery): Promise<BusinessData[]>;

  protected async fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        if (response.status === 429) {
          await this.delay(1000 * (i + 1));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
    throw new Error('Max retries exceeded');
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
