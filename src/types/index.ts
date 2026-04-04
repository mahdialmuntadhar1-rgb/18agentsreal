/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JobStatus = 'RUNNING' | 'COMPLETED' | 'WAITING' | 'FAILED';
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
