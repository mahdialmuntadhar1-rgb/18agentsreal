import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Business type matching the production table schema
export interface Business {
  id: string;
  business_name: string;
  arabic_name: string | null;
  english_name: string | null;
  category: string;
  subcategory: string | null;
  governorate: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  phone_1: string | null;
  phone_2: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  telegram: string | null;
  opening_hours: string | null;
  status: 'active' | 'closed' | 'suspended';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  confidence_score: number;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  
  // Frontend-only computed fields (not in DB)
  image?: string;  // Will be computed from business name or placeholder
  rating?: number; // Computed from confidence_score
  reviewCount?: number; // Placeholder for UI
  isFeatured?: boolean; // Computed based on confidence_score
}

// Helper function to map DB record to Business with frontend fields
export function enrichBusiness(dbRecord: any): Business {
  const confidence = dbRecord.confidence_score || 0;
  
  return {
    ...dbRecord,
    // Generate placeholder image based on business name
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(dbRecord.business_name)}&background=8B1A1A&color=fff&size=256`,
    // Derive rating from confidence score (0.5-1.0 maps to 3.0-5.0)
    rating: Math.max(3, Math.min(5, 3 + (confidence * 2))),
    // Placeholder review count based on confidence
    reviewCount: Math.floor(confidence * 100),
    // Featured if high confidence
    isFeatured: confidence > 0.7,
  };
}

// Helper function to fetch businesses
export async function fetchBusinesses(filters?: {
  city?: string;
  governorate?: string;
  category?: string;
  limit?: number;
  featured?: boolean;
}) {
  try {
    console.log('[fetchBusinesses] Starting fetch with filters:', filters);
    
    let query = supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .order('confidence_score', { ascending: false });

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.governorate) {
      query = query.ilike('governorate', `%${filters.governorate}%`);
    }
    if (filters?.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('[fetchBusinesses] Database error:', error);
      throw error;
    }
    
    console.log(`[fetchBusinesses] Fetched ${data?.length || 0} businesses`);
    
    // Enrich with frontend-only fields
    const enriched = (data || []).map(enrichBusiness);
    
    // Filter featured if requested
    if (filters?.featured) {
      return enriched.filter(b => b.isFeatured);
    }
    
    return enriched;
  } catch (error) {
    console.error('[fetchBusinesses] Failed:', error);
    throw error;
  }
}

// Helper to fetch single business
export async function fetchBusinessById(id: string) {
  try {
    console.log('[fetchBusinessById] Fetching:', id);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('[fetchBusinessById] Database error:', error);
      throw error;
    }
    
    return data ? enrichBusiness(data) : null;
  } catch (error) {
    console.error('[fetchBusinessById] Failed:', error);
    throw error;
  }
}

// Helper to search businesses by name
export async function searchBusinesses(query: string, limit: number = 10) {
  try {
    console.log('[searchBusinesses] Searching:', query);
    
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .ilike('business_name', `%${query}%`)
      .limit(limit);
      
    if (error) {
      console.error('[searchBusinesses] Database error:', error);
      throw error;
    }
    
    return (data || []).map(enrichBusiness);
  } catch (error) {
    console.error('[searchBusinesses] Failed:', error);
    throw error;
  }
}

// Categories for the UI
export const CATEGORIES = [
  { id: 'dining_cuisine', label: 'Dining', icon: '🍽️' },
  { id: 'cafe_coffee', label: 'Cafes', icon: '☕' },
  { id: 'shopping_retail', label: 'Shopping', icon: '🛍️' },
  { id: 'health_wellness', label: 'Health', icon: '💊' },
  { id: 'entertainment_events', label: 'Entertainment', icon: '🎭' },
  { id: 'accommodation_stays', label: 'Hotels', icon: '🏨' },
  { id: 'business_services', label: 'Services', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
];

// Governorates for the UI
export const GOVERNORATES = [
  'Baghdad',
  'Basra',
  'Mosul',
  'Erbil',
  'Sulaymaniyah',
  'Najaf',
  'Karbala',
  'Kirkuk',
  'Duhok',
  'Anbar',
  'Babil',
  'Dhi Qar',
  'Diyala',
  'Karbala',
  'Maysan',
  'Muthanna',
  'Qadisiyyah',
  'Saladin',
  'Wasit',
];
