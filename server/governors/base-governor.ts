import { supabaseAdmin } from "../supabase-admin.ts";

export interface BusinessData {
  name: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  source_url?: string;
  source_name?: string;
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

export interface AgentTask {
  id: string | number;
  category: string;
  city: string;
  government_rate?: string;
}

export abstract class BaseGovernor {
  protected supabase = supabaseAdmin;
  abstract category: string;
  abstract agentName: string;
  abstract governmentRate: string;
  abstract city: string;

  /**
   * Gather business data for a given city and category
   */
  abstract gather(city?: string, category?: string): Promise<BusinessData[]>;

  /**
   * Validate business data
   */
  async validate(businesses: BusinessData[]): Promise<BusinessData[]> {
    return businesses.filter(b => b.name && b.category && b.city);
  }

  /**
   * Store validated businesses in Supabase
   */
  async store(businesses: BusinessData[], governmentRate?: string): Promise<{ added: number; errors: any[] }> {
    const errors = [];
    let added = 0;

    for (const business of businesses) {
      try {
        const { error } = await this.supabase
          .from("businesses")
          .insert({
            ...business,
            government_rate: governmentRate || this.governmentRate,
          });

        if (error) {
          errors.push({ business: business.name, error: error.message });
        } else {
          added++;
        }
      } catch (err) {
        errors.push({ business: business.name, error: (err as any).message });
      }
    }

    return { added, errors };
  }

  /**
   * Log operation results
   */
  async log(level: string, added: number, errors: any[]): Promise<void> {
    console.log(`[${this.agentName}] ${level.toUpperCase()}: ${added} added, ${errors.length} errors`);
  }
}
