import { BaseSourceAdapter, BusinessData, SearchQuery } from './base-adapter.js';

interface YelpBusiness {
  id: string;
  name: string;
  location: {
    address1?: string;
    city?: string;
    country?: string;
  };
  phone?: string;
  url?: string;
  rating?: number;
  review_count?: number;
  image_url?: string;
  categories?: Array<{ title: string }>;
  price?: string;
}

export class YelpAdapter extends BaseSourceAdapter {
  name = 'Yelp Fusion';
  requiresApiKey = true;
  private baseUrl = 'https://api.yelp.com/v3';

  async search(query: SearchQuery): Promise<BusinessData[]> {
    if (!this.apiKey) {
      console.warn('YelpAdapter: No API key provided');
      return [];
    }

    const term = encodeURIComponent(query.category);
    const location = encodeURIComponent(`${query.city}, ${query.country || 'Iraq'}`);
    const limit = query.limit || 20;
    const offset = ((query.page || 1) - 1) * limit;

    const url = `${this.baseUrl}/businesses/search?term=${term}&location=${location}&limit=${limit}&offset=${offset}`;

    try {
      const response = await this.fetchWithRetry(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.businesses) {
        console.error('Yelp API error:', data);
        return [];
      }

      return data.businesses.map((biz: YelpBusiness) => this.mapYelpBusiness(biz, query.city));
    } catch (error) {
      console.error('YelpAdapter search error:', error);
      return [];
    }
  }

  async getById(id: string): Promise<BusinessData | null> {
    if (!this.apiKey) return null;

    const url = `${this.baseUrl}/businesses/${id}`;

    try {
      const response = await this.fetchWithRetry(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      const biz: YelpBusiness = await response.json();
      return this.mapYelpBusiness(biz, '');
    } catch (error) {
      console.error('YelpAdapter getById error:', error);
      return null;
    }
  }

  private mapYelpBusiness(biz: YelpBusiness, fallbackCity: string): BusinessData {
    return {
      name: biz.name,
      category: biz.categories?.[0]?.title || 'business',
      city: biz.location?.city || fallbackCity,
      address: biz.location?.address1,
      phone: biz.phone,
      website: biz.url,
      rating: biz.rating,
      review_count: biz.review_count,
      photos: biz.image_url ? [biz.image_url] : undefined,
      price_range: biz.price,
      source_name: this.name,
      external_source_id: biz.id,
      source_url: biz.url,
    };
  }
}
