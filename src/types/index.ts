/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JobStatus = 'QUEUED' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED';
export type RecordStatus = 'RAW' | 'NEEDS_CLEANING' | 'DUPLICATE_SUSPECT' | 'STAGED' | 'APPROVED' | 'REJECTED';

export interface AgentJob {
  id: string;
  agentName: string;
  governorate: string;
  city: string;
  category: string;
  status: JobStatus;
  progress: number;
  recordsFound: number;
  lastUpdated: string;
  errorCount: number;
}

export interface BusinessRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  governorate: string;
  city: string;
  phone: string;
  whatsapp: string;
  completenessScore: number;
  status: RecordStatus;
  lastUpdated: string;
  issues?: string[];
}

export interface DashboardStats {
  totalRecords: number;
  activeAgents: number;
  staged: number;
  readyToPush: number;
  failedJobs: number;
}

export interface DiscoveryRun {
  id: string;
  governorate: string;
  category: string;
  status: 'PENDING' | 'QUEUED' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED';
  sourceCount: number;
  recordsFound: number;
  startedAt: string;
  completedAt?: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}
