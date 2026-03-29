export interface BusinessRaw {
  id?: string;
  city: string;
  name_ar: string | null;
  name_en: string | null;
  phone_numbers: string[];
  social_media_urls: string[];
  google_maps_url: string | null;
  address_ar: string | null;
  address_en: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  source: 'google_places' | 'gemini_extraction' | 'fallback_scraper';
  agent_job_id: string;
  created_at?: Date;
}

export interface VerifiedBusiness extends BusinessRaw {
  verification_score: number;
  status: 'approved' | 'needs_review' | 'rejected';
  verified_at: Date;
}

export interface AgentJob {
  id: string;
  city: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: Date | null;
  completed_at: Date | null;
  records_found: number;
  records_verified: number;
  error_log: string | null;
}

export interface AgentLog {
  id?: string;
  job_id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

export const IRAQI_CITIES = [
  'Baghdad',
  'Mosul',
  'Basra',
  'Erbil',
  'Sulaymaniyah',
  'Kirkuk',
  'Najaf',
  'Karbala',
  'Hilla',
  'Ramadi',
  'Fallujah',
  'Amarah',
  'Diwaniyah',
  'Kut',
  'Samarra',
  'Tikrit',
  'Dohuk',
  'Zakho'
] as const;
