import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { AgentJob, BusinessRecord, DashboardStats, DiscoveryRun, LogEvent, RecordStatus } from '../types';

const mapJob = (row: any): AgentJob => ({
  id: String(row.id),
  agentName: row.assigned_agent_id ?? 'unassigned',
  governorate: row.governorate ?? 'Unknown',
  city: row.city ?? 'Unknown',
  category: row.category ?? 'unknown',
  status: (row.status ?? 'queued').toUpperCase(),
  recordsFound: row.result?.normalized_records ?? 0,
  lastUpdated: row.updated_at ?? row.created_at ?? '',
  errorCount: row.status === 'failed' ? 1 : 0,
});

const mapRecord = (row: any): BusinessRecord => ({
  id: String(row.id),
  nameAr: row.name_ar ?? '',
  nameEn: row.name ?? '',
  category: row.category ?? 'unknown',
  governorate: row.governorate ?? 'Unknown',
  city: row.city ?? 'Unknown',
  phone: row.phone ?? '',
  whatsapp: row.whatsapp ?? '',
  completenessScore: row.completeness_score ?? 0,
  status: row.status ?? 'RAW',
  lastUpdated: row.updated_at ?? row.collected_at ?? '',
  issues: row.validation_issues ?? [],
});

const mapRun = (row: any): DiscoveryRun => ({
  id: String(row.id),
  governorate: row.governorate ?? 'Unknown',
  category: row.category ?? 'unknown',
  status: (row.status ?? 'PENDING').toUpperCase(),
  sourceCount: 1,
  recordsFound: row.job_results?.normalized_records ?? 0,
  startedAt: row.started_at ?? row.created_at ?? '',
  completedAt: row.finished_at ?? undefined,
});

const mapLog = (row: any): LogEvent => ({
  id: String(row.id),
  created_at: row.created_at ?? '',
  timestamp: row.created_at ?? '',
  level: row.event_type === 'failed' ? 'ERROR' : row.event_type === 'retried' ? 'WARN' : 'INFO',
  source: row.agent_id ?? 'worker',
  message: row.message ?? row.event_type,
  metadata: row.metadata ?? undefined,
});

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!hasSupabaseConfig) {
        setStats({ totalRecords: 0, activeAgents: 0, staged: 0, readyToPush: 0, failedJobs: 0 });
        setLoading(false);
        return;
      }

      const { count: totalRecords } = await supabase.from('records').select('*', { count: 'exact', head: true });
      const { count: activeAgents } = await supabase.from('agent_states').select('*', { count: 'exact', head: true }).eq('status', 'running');
      const { count: staged } = await supabase.from('records').select('*', { count: 'exact', head: true }).eq('status', 'STAGED');
      const { count: readyToPush } = await supabase.from('records').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');
      const { count: failedJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'failed');

      setStats({
        totalRecords: totalRecords || 0,
        activeAgents: activeAgents || 0,
        staged: staged || 0,
        readyToPush: readyToPush || 0,
        failedJobs: failedJobs || 0,
      });
      setLoading(false);
    }

    void fetchStats();
  }, []);

  return { stats, loading };
}

export function useActiveJobs() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*,result:job_results(normalized_records)')
      .order('created_at', { ascending: false });

    if (!error) setJobs((data || []).map(mapJob));
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchJobs();
    const subscription = supabase
      .channel('active-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => void fetchJobs())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchJobs]);

  return { jobs, loading, refresh: fetchJobs };
}

export function useRecords(status?: string) {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let query = supabase.from('records').select('*');
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('updated_at', { ascending: false });
    if (!error) setRecords((data || []).map(mapRecord));
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  return { records, loading, refresh: fetchRecords };
}

export function useRecordStatusActions() {
  const [updating, setUpdating] = useState(false);

  const updateStatus = useCallback(async (recordIds: string[], status: RecordStatus): Promise<boolean> => {
    if (!hasSupabaseConfig || recordIds.length === 0) return false;

    setUpdating(true);
    const { error } = await supabase
      .from('records')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', recordIds);
    setUpdating(false);

    return !error;
  }, []);

  return { updateStatus, updating };
}

export function useDiscoveryRuns() {
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      if (!hasSupabaseConfig) {
        setRuns([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*,job_results(normalized_records)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error) setRuns((data || []).map(mapRun));
      setLoading(false);
    }

    void fetchRuns();
  }, []);

  return { runs, loading };
}

export function useLogs() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      if (!hasSupabaseConfig) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('job_events').select('*').order('created_at', { ascending: false }).limit(200);
      if (!error) setLogs((data || []).map(mapLog));
      setLoading(false);
    }

    void fetchLogs();
    const subscription = supabase
      .channel('job-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_events' }, () => void fetchLogs())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { logs, loading };
}
