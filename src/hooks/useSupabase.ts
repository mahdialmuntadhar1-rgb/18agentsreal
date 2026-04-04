import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AgentJob, BusinessRecord, DashboardStats, DiscoveryRun, LogEvent } from '../types';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: totalRecords, error: e1 } = await supabase.from('records').select('*', { count: 'exact', head: true });
        const { count: activeAgents, error: e2 } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'RUNNING');
        const { count: staged, error: e3 } = await supabase.from('records').select('*', { count: 'exact', head: true }).eq('status', 'STAGED');
        const { count: readyToPush, error: e4 } = await supabase.from('records').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');
        const { count: failedJobs, error: e5 } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'FAILED');

        if (e1 || e2 || e3 || e4 || e5) {
          throw new Error('Failed to fetch some stats');
        }

        setStats({
          totalRecords: totalRecords || 0,
          activeAgents: activeAgents || 0,
          staged: staged || 0,
          readyToPush: readyToPush || 0,
          failedJobs: failedJobs || 0
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Connection error');
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

  return { stats, loading, error };
}

export function useActiveJobs() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .order('last_updated', { ascending: false });

        if (error) throw error;
        setJobs(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err instanceof Error ? err.message : 'Fetch failed');
      } finally {
        setLoading(false);
      }
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

  return { jobs, loading, error };
}

export function useRecords(status?: string) {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecords() {
      try {
        let query = supabase.from('records').select('*');
        if (status) {
          query = query.eq('status', status);
        }
        
        const { data, error } = await query.order('last_updated', { ascending: false });

        if (error) throw error;
        setRecords(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching records:', err);
        setError(err instanceof Error ? err.message : 'Fetch failed');
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();
  }, [status]);

  return { records, loading, error };
}

export function useDiscoveryRuns() {
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const { data, error } = await supabase
          .from('discovery_runs')
          .select('*')
          .order('started_at', { ascending: false });

        if (error) throw error;
        setRuns(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching discovery runs:', err);
        setError(err instanceof Error ? err.message : 'Fetch failed');
      } finally {
        setLoading(false);
      }
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

  return { runs, loading, error };
}

export function useLogs() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLogs(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError(err instanceof Error ? err.message : 'Fetch failed');
      } finally {
        setLoading(false);
      }
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

  return { logs, loading, error };
}
