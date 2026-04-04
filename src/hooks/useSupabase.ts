import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AgentJob, BusinessRecord, DashboardStats, DiscoveryRun, LogEvent } from '../types';

const mapJob = (row: any): AgentJob => ({
  id: String(row.id),
  agentName: row.agent_name ?? row.agentName ?? row.source ?? 'collection-runner',
  governorate: row.governorate ?? 'Unknown',
  city: row.city ?? 'Unknown',
  category: row.category ?? 'unknown',
  status: (row.status ?? 'queued').toUpperCase(),
  progress: row.progress ?? 0,
  recordsFound: row.records_found ?? row.recordsFound ?? 0,
  lastUpdated: row.last_updated ?? row.updated_at ?? row.created_at ?? '',
  errorCount: row.error_count ?? 0,
});

const mapRecord = (row: any): BusinessRecord => ({
  id: String(row.id),
  nameAr: row.name_ar ?? '',
  nameEn: row.name_en ?? row.name ?? '',
  category: row.category ?? 'unknown',
  governorate: row.governorate ?? 'Unknown',
  city: row.city ?? 'Unknown',
  phone: row.phone ?? '',
  whatsapp: row.whatsapp ?? '',
  completenessScore: row.completeness_score ?? 0,
  status: row.status ?? 'RAW',
  lastUpdated: row.last_updated ?? row.updated_at ?? row.created_at ?? '',
  issues: row.validation_issues ?? [],
});

const mapRun = (row: any): DiscoveryRun => ({
  id: String(row.id),
  governorate: row.governorate ?? 'Unknown',
  category: row.category ?? 'unknown',
  status: (row.status ?? 'PENDING').toUpperCase(),
  sourceCount: row.source_count ?? 0,
  recordsFound: row.records_found ?? 0,
  startedAt: row.started_at ?? row.created_at ?? '',
  completedAt: row.completed_at ?? undefined,
});

const mapLog = (row: any): LogEvent => ({
  id: String(row.id),
  timestamp: row.timestamp ?? row.created_at ?? '',
  level: row.level ?? 'INFO',
  source: row.source ?? 'system',
  message: row.message ?? '',
  metadata: row.metadata ?? undefined,
});

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: totalRecords } = await supabase.from('records').select('*', { count: 'exact', head: true });
        const { count: activeAgents } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'running');
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
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    const subscription = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { stats, loading };
}

export function useActiveJobs() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase.from('jobs').select('*').order('last_updated', { ascending: false });
      if (error) console.error('Error fetching jobs:', error);
      else setJobs((data || []).map(mapJob));
      setLoading(false);
    }

    fetchJobs();
    const subscription = supabase
      .channel('active-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => fetchJobs())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { jobs, loading };
}

export function useRecords(status?: string) {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      let query = supabase.from('records').select('*');
      if (status) query = query.eq('status', status);
      const { data, error } = await query.order('last_updated', { ascending: false });
      if (error) console.error('Error fetching records:', error);
      else setRecords((data || []).map(mapRecord));
      setLoading(false);
    }

    fetchRecords();
  }, [status]);

  return { records, loading };
}

export function useDiscoveryRuns() {
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      const { data, error } = await supabase.from('discovery_runs').select('*').order('started_at', { ascending: false });
      if (error) console.error('Error fetching discovery runs:', error);
      else setRuns((data || []).map(mapRun));
      setLoading(false);
    }

    fetchRuns();
    const subscription = supabase
      .channel('discovery-runs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discovery_runs' }, () => fetchRuns())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { runs, loading };
}

export function useLogs() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(100);
      if (error) console.error('Error fetching logs:', error);
      else setLogs((data || []).map(mapLog));
      setLoading(false);
    }

    fetchLogs();
    const subscription = supabase
      .channel('logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, () => fetchLogs())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { logs, loading };
}
