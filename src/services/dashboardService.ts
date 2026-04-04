import { supabase } from '../lib/supabase';
import {
  normalizeBusinessRecord,
  type RawBusinessRecord,
  type NormalizedBusinessRecord,
} from './normalize';
import { calculateCompletenessScore, validateBusinessRecord } from './validation';
import { classifyRecordMatch, mergeMatchedRecords, type MatchDecision } from './matcher';

export interface ProviderReport {
  provider: string;
  total: number;
  newCount: number;
  updateCount: number;
  duplicateCount: number;
  reviewCount: number;
  avgCompleteness: number;
  governorateCoverage: number;
}

export interface FinalReport {
  generatedAt: string;
  totalRecords: number;
  uniqueRecords: number;
  counts: Record<MatchDecision, number>;
  avgCompleteness: number;
  quality: {
    valid: number;
    invalid: number;
    completenessBuckets: Record<'high' | 'medium' | 'low', number>;
  };
  governorateCoverage: {
    covered: number;
    names: string[];
  };
  providerReports: ProviderReport[];
}

const IRAQI_GOVERNORATE_COUNT = 19;

const fetchRawRecords = async (): Promise<RawBusinessRecord[]> => {
  const attempts = ['iraqi_businesses', 'businesses', 'records'];

  for (const table of attempts) {
    const { data, error } = await supabase.from(table).select('*').limit(5000);
    if (!error && data) return data as RawBusinessRecord[];
  }

  return [];
};

const getMatchKey = (record: NormalizedBusinessRecord): string => {
  return [record.name.toLowerCase(), record.governorate.toLowerCase(), record.city.toLowerCase()].join('|');
};

export const buildFinalReport = (rawRecords: RawBusinessRecord[]): FinalReport => {
  const normalized = rawRecords.map((record, index) => normalizeBusinessRecord(record, `row-${index + 1}`));

  const mergedByKey = new Map<string, NormalizedBusinessRecord>();
  const decisionsById = new Map<string, MatchDecision>();
  const providerStats = new Map<string, Omit<ProviderReport, 'provider'>>();

  let totalCompleteness = 0;
  let valid = 0;
  let invalid = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const record of normalized) {
    const key = getMatchKey(record);
    const existing = mergedByKey.get(key);
    const decision = classifyRecordMatch(record, existing);
    decisionsById.set(record.id, decision);

    if (decision === 'UPDATE' && existing) {
      mergedByKey.set(key, mergeMatchedRecords(existing, record));
    } else if (!existing) {
      mergedByKey.set(key, record);
    }

    const validation = validateBusinessRecord(record);
    if (validation.isValid) valid += 1;
    else invalid += 1;

    const completeness = calculateCompletenessScore(record);
    totalCompleteness += completeness;
    if (completeness >= 80) high += 1;
    else if (completeness >= 50) medium += 1;
    else low += 1;

    const provider = record.sourceName || 'unknown';
    const prev = providerStats.get(provider) ?? {
      total: 0,
      newCount: 0,
      updateCount: 0,
      duplicateCount: 0,
      reviewCount: 0,
      avgCompleteness: 0,
      governorateCoverage: 0,
    };

    const decisionField: Record<MatchDecision, keyof typeof prev> = {
      NEW: 'newCount',
      UPDATE: 'updateCount',
      DUPLICATE: 'duplicateCount',
      REVIEW: 'reviewCount',
    };

    prev.total += 1;
    prev[decisionField[decision]] += 1;
    prev.avgCompleteness += completeness;
    providerStats.set(provider, prev);
  }

  const counts: Record<MatchDecision, number> = { NEW: 0, UPDATE: 0, DUPLICATE: 0, REVIEW: 0 };
  decisionsById.forEach((decision) => {
    counts[decision] += 1;
  });

  const governorates = [...new Set(normalized.map((r) => r.governorate).filter((x) => x !== 'Unknown'))];

  const providerReports: ProviderReport[] = [...providerStats.entries()].map(([provider, stats]) => {
    const providerGovernorates = new Set(
      normalized.filter((r) => r.sourceName === provider).map((r) => r.governorate).filter((x) => x !== 'Unknown'),
    );

    return {
      provider,
      ...stats,
      avgCompleteness: stats.total === 0 ? 0 : Math.round(stats.avgCompleteness / stats.total),
      governorateCoverage: Math.round((providerGovernorates.size / IRAQI_GOVERNORATE_COUNT) * 100),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalRecords: normalized.length,
    uniqueRecords: mergedByKey.size,
    counts,
    avgCompleteness: normalized.length === 0 ? 0 : Math.round(totalCompleteness / normalized.length),
    quality: {
      valid,
      invalid,
      completenessBuckets: { high, medium, low },
    },
    governorateCoverage: {
      covered: governorates.length,
      names: governorates.sort(),
    },
    providerReports,
  };
};

export const dashboardService = {
  async getFinalReport(): Promise<FinalReport> {
    const rawRecords = await fetchRawRecords();
    return buildFinalReport(rawRecords);
  },
};
