import '../db.ts';
import { supabaseAdmin } from '../db.ts';
import type { BusinessData } from '../sources/base-adapter.ts';
import {
  RestaurantsGovernor,
  CafesGovernor,
  HotelsGovernor,
  ShoppingGovernor,
  BanksGovernor,
  EducationGovernor,
  EntertainmentGovernor,
  TourismGovernor,
  DoctorsGovernor,
  LawyersGovernor,
  HospitalsGovernor,
  MedicalClinicsGovernor,
  RealEstateGovernor,
  EventsGovernor,
  OthersGovernor,
  PharmaciesGovernor,
  GymsGovernor,
  BakeriesGovernor,
  BeautySalonsGovernor,
  SupermarketsGovernor,
  FurnitureGovernor,
} from '../governors/index.ts';
import { normalizeBusinessRecord, type NormalizedBusinessRecord, type RawBusinessRecord } from '../../src/services/normalize.ts';
import { calculateCompletenessScore, validateBusinessRecord } from '../../src/services/validation.ts';
import { classifyRecordMatch, mergeMatchedRecords } from '../../src/services/matcher.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const STALE_JOB_MINUTES = Number(process.env.WORKER_STALE_MINUTES ?? '15');
const POLL_MS = Number(process.env.WORKER_POLL_MS ?? '3000');

type WorkerJobStatus = 'queued' | 'running' | 'retrying' | 'failed' | 'completed';

interface WorkerJob {
  id: string;
  status: WorkerJobStatus;
  governorate: string;
  city: string;
  category: string;
  source: string;
  retry_count: number;
  max_retries: number;
  started_at?: string;
  claimed_at?: string;
  finished_at?: string;
  failure_reason?: string;
  discovery_run_id?: string;
}

const governorFactory: Record<string, () => { run: (city?: string, category?: string) => Promise<BusinessData[]> }> = {
  restaurants: () => new RestaurantsGovernor(),
  cafes: () => new CafesGovernor(),
  hotels: () => new HotelsGovernor(),
  shopping: () => new ShoppingGovernor(),
  banks: () => new BanksGovernor(),
  education: () => new EducationGovernor(),
  entertainment: () => new EntertainmentGovernor(),
  tourism: () => new TourismGovernor(),
  doctors: () => new DoctorsGovernor(),
  lawyers: () => new LawyersGovernor(),
  hospitals: () => new HospitalsGovernor(),
  'medical-clinics': () => new MedicalClinicsGovernor(),
  'real-estate': () => new RealEstateGovernor(),
  events: () => new EventsGovernor(),
  others: () => new OthersGovernor(),
  pharmacies: () => new PharmaciesGovernor(),
  gyms: () => new GymsGovernor(),
  bakeries: () => new BakeriesGovernor(),
  'beauty-salons': () => new BeautySalonsGovernor(),
  supermarkets: () => new SupermarketsGovernor(),
  furniture: () => new FurnitureGovernor(),
};

const normalizeCategoryKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-');

async function insertLog(level: 'INFO' | 'WARN' | 'ERROR', source: string, message: string, metadata?: Record<string, unknown>) {
  await supabaseAdmin.from('logs').insert({
    level,
    source,
    message,
    metadata: metadata ?? null,
    timestamp: new Date().toISOString(),
  });
}

async function recoverStaleJobs() {
  const staleBefore = new Date(Date.now() - STALE_JOB_MINUTES * 60 * 1000).toISOString();
  const { data: staleJobs } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('status', 'running')
    .lt('claimed_at', staleBefore);

  if (!staleJobs?.length) return;

  for (const stale of staleJobs as WorkerJob[]) {
    const nextRetry = (stale.retry_count ?? 0) + 1;
    const maxRetries = stale.max_retries ?? 2;

    if (nextRetry > maxRetries) {
      await supabaseAdmin
        .from('jobs')
        .update({
          status: 'failed',
          retry_count: nextRetry,
          failure_reason: 'stale job exceeded retry budget',
          finished_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        })
        .eq('id', stale.id);
    } else {
      await supabaseAdmin
        .from('jobs')
        .update({
          status: 'retrying',
          retry_count: nextRetry,
          claimed_at: null,
          failure_reason: 'stale claim recovered',
          last_updated: new Date().toISOString(),
        })
        .eq('id', stale.id);
    }

    await insertLog('WARN', 'collection-worker', 'Recovered stale job claim', {
      jobId: stale.id,
      nextRetry,
      maxRetries,
    });
  }
}

async function claimNextJob(): Promise<WorkerJob | null> {
  const { data: candidate } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .in('status', ['queued', 'retrying'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!candidate) return null;

  const now = new Date().toISOString();
  const { data: claimed } = await supabaseAdmin
    .from('jobs')
    .update({
      status: 'running',
      claimed_at: now,
      started_at: candidate.started_at ?? now,
      last_updated: now,
      failure_reason: null,
    })
    .eq('id', candidate.id)
    .eq('status', candidate.status)
    .select('*')
    .maybeSingle();

  return (claimed as WorkerJob | null) ?? null;
}

function mapExisting(row: Record<string, unknown>, fallbackId: string): NormalizedBusinessRecord {
  const raw: RawBusinessRecord = {
    id: String(row.id ?? fallbackId),
    name: row.name_en as string,
    name_ar: row.name_ar as string,
    category: row.category as string,
    city: row.city as string,
    governorate: row.governorate as string,
    phone: row.phone as string,
    whatsapp: row.whatsapp as string,
    email: row.email as string,
    website: row.website as string,
    source_name: row.source_name as string,
    latitude: row.latitude as number | string,
    longitude: row.longitude as number | string,
    isVerified: Boolean(row.is_verified),
  };
  return normalizeBusinessRecord(raw, fallbackId);
}

async function upsertNormalizedRecord(job: WorkerJob, business: BusinessData, index: number): Promise<'new' | 'updated' | 'duplicate' | 'review'> {
  const normalized = normalizeBusinessRecord({
    id: business.external_source_id ?? `${job.id}-${index + 1}`,
    name: business.name,
    category: business.category,
    city: job.city || business.city,
    governorate: job.governorate,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    source_name: business.source_name,
    latitude: business.latitude,
    longitude: business.longitude,
    verified: Boolean(business.rating && business.rating >= 4),
  }, `${job.id}-${index + 1}`);

  const validation = validateBusinessRecord(normalized);
  const completenessScore = calculateCompletenessScore(normalized);

  const { data: existingRows } = await supabaseAdmin
    .from('records')
    .select('*')
    .eq('name_en', normalized.name)
    .eq('governorate', normalized.governorate)
    .eq('city', normalized.city)
    .limit(1);

  const existingRow = existingRows?.[0] as Record<string, unknown> | undefined;
  const existingNormalized = existingRow ? mapExisting(existingRow, `existing-${index}`) : undefined;

  const decision = classifyRecordMatch(normalized, existingNormalized);

  const payload = {
    external_id: business.external_source_id ?? null,
    name_en: normalized.name,
    name_ar: normalized.nameAr ?? null,
    category: normalized.category,
    governorate: normalized.governorate,
    city: normalized.city,
    address: business.address ?? null,
    phone: normalized.phone ?? null,
    whatsapp: normalized.whatsapp ?? null,
    email: normalized.email ?? null,
    website: normalized.website ?? null,
    source_name: normalized.sourceName,
    source_url: business.source_url ?? null,
    latitude: normalized.latitude ?? null,
    longitude: normalized.longitude ?? null,
    is_verified: normalized.isVerified,
    completeness_score: completenessScore,
    validation_issues: validation.issues,
    status: validation.isValid ? 'STAGED' : 'NEEDS_CLEANING',
    match_decision: decision,
    last_updated: new Date().toISOString(),
  };

  if (!existingRow || decision === 'NEW' || decision === 'REVIEW') {
    await supabaseAdmin.from('records').insert(payload);
    return decision === 'REVIEW' ? 'review' : 'new';
  }

  if (decision === 'DUPLICATE') {
    return 'duplicate';
  }

  const merged = mergeMatchedRecords(existingNormalized!, normalized);
  await supabaseAdmin
    .from('records')
    .update({
      ...payload,
      name_en: merged.name,
      source_name: merged.sourceName,
      is_verified: merged.isVerified,
      phone: merged.phone ?? null,
      whatsapp: merged.whatsapp ?? null,
      email: merged.email ?? null,
      website: merged.website ?? null,
      latitude: merged.latitude ?? null,
      longitude: merged.longitude ?? null,
    })
    .eq('id', existingRow.id as string);

  return 'updated';
}

async function executeJob(job: WorkerJob) {
  const provider = (job.source || 'gemini').toLowerCase();
  if (provider !== 'gemini') {
    throw new Error(`Unsupported provider for runner: ${provider}`);
  }

  const categoryKey = normalizeCategoryKey(job.category);
  const buildGovernor = governorFactory[categoryKey];
  if (!buildGovernor) {
    throw new Error(`Unsupported governor category: ${job.category}`);
  }

  const governor = buildGovernor();
  const items = await governor.run(job.city, categoryKey);

  let inserted = 0;
  let updated = 0;
  let duplicate = 0;
  let review = 0;

  for (let i = 0; i < items.length; i += 1) {
    const result = await upsertNormalizedRecord(job, items[i], i);
    if (result === 'new') inserted += 1;
    if (result === 'updated') updated += 1;
    if (result === 'duplicate') duplicate += 1;
    if (result === 'review') review += 1;
  }

  return {
    sourceCount: 1,
    recordsFound: items.length,
    inserted,
    updated,
    duplicate,
    review,
  };
}

async function markRunStatus(discoveryRunId: string | undefined, status: WorkerJobStatus, patch: Record<string, unknown>) {
  if (!discoveryRunId) return;
  await supabaseAdmin
    .from('discovery_runs')
    .update({ status, ...patch })
    .eq('id', discoveryRunId);
}

export async function processSingleJob() {
  await recoverStaleJobs();
  const claimed = await claimNextJob();
  if (!claimed) return false;

  await insertLog('INFO', 'collection-worker', 'Claimed queued collection job', {
    jobId: claimed.id,
    category: claimed.category,
    city: claimed.city,
    governorate: claimed.governorate,
    provider: claimed.source,
  });

  await markRunStatus(claimed.discovery_run_id, 'running', {
    started_at: claimed.started_at ?? claimed.claimed_at ?? new Date().toISOString(),
    records_found: 0,
    source_count: 0,
  });

  try {
    const summary = await executeJob(claimed);
    const finishedAt = new Date().toISOString();

    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'completed',
        finished_at: finishedAt,
        failure_reason: null,
        records_found: summary.recordsFound,
        error_count: 0,
        last_updated: finishedAt,
      })
      .eq('id', claimed.id);

    await markRunStatus(claimed.discovery_run_id, 'completed', {
      completed_at: finishedAt,
      records_found: summary.recordsFound,
      source_count: summary.sourceCount,
      summary,
    });

    await insertLog('INFO', 'collection-worker', 'Completed collection job', {
      jobId: claimed.id,
      ...summary,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown worker failure';
    const nextRetry = (claimed.retry_count ?? 0) + 1;
    const maxRetries = claimed.max_retries ?? 2;
    const willRetry = nextRetry <= maxRetries;
    const failedAt = new Date().toISOString();

    await supabaseAdmin
      .from('jobs')
      .update({
        status: willRetry ? 'retrying' : 'failed',
        retry_count: nextRetry,
        failure_reason: reason,
        finished_at: willRetry ? null : failedAt,
        last_updated: failedAt,
      })
      .eq('id', claimed.id);

    await markRunStatus(claimed.discovery_run_id, willRetry ? 'retrying' : 'failed', {
      completed_at: willRetry ? null : failedAt,
      error_message: reason,
    });

    await insertLog('ERROR', 'collection-worker', 'Collection job failed', {
      jobId: claimed.id,
      reason,
      nextRetry,
      maxRetries,
      willRetry,
    });
  }

  return true;
}

export async function startCollectionWorker() {
  await insertLog('INFO', 'collection-worker', 'Collection worker booted', {
    pollMs: POLL_MS,
    staleMinutes: STALE_JOB_MINUTES,
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const processed = await processSingleJob();
      if (!processed) await sleep(POLL_MS);
    } catch (error) {
      await insertLog('ERROR', 'collection-worker', 'Worker loop error', {
        error: error instanceof Error ? error.message : String(error),
      });
      await sleep(POLL_MS);
    }
  }
}
