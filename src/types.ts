export type Language = 'en' | 'ar' | 'ku';

export interface RawBusiness {
  id: string;
  name_raw: string;
  category_raw?: string;
  governorate?: string;
  city?: string;
  address?: string;
  phone?: string;
  source?: string;
  coordinates?: { lat: number; lng: number };
  created_at: string;
}

export interface VerifiedBusiness {
  id: string;
  raw_id?: string;
  name_ar?: string;
  name_ku?: string;
  name_en?: string;
  category?: string;
  governorate?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  coordinates?: { lat: number; lng: number };
  photos: string[];
  verification_score: number;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface AgentTask {
  id: string;
  type: string;
  instruction?: string;
  cities?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  progress: number;
  result_summary?: string;
  agent_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'ok' | 'warn' | 'agent' | 'error' | 'success' | 'warning';
  taskId?: string;
  agent_id?: string;
}
