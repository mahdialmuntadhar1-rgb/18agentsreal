import { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { AgentJob, BusinessRecord, DashboardStats, DiscoveryRun, LogEvent } from '../types';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!hasSupabaseConfig) {
        setStats({
          totalRecords: 0,
          activeAgents: 0,
          staged: 0,
          readyToPush: 0,
          failedJobs: 0,
        });
        setLoading(false);
        return;
      }
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
          failedJobs: failedJobs || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Set up real-time subscription
    if (!hasSupabaseConfig) {
      return;
    }
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
      if (!hasSupabaseConfig) {
        setJobs([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('last_heartbeat_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data || []);
      }
      setLoading(false);
    }

    fetchJobs();

    if (!hasSupabaseConfig) {
      return;
    }
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
      if (!hasSupabaseConfig) {
        setRecords([]);
        setLoading(false);
        return;
      }
      let query = supabase.from('records').select('*');
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query.order('collected_at', { ascending: false });

      if (error) {
        console.error('Error fetching records:', error);
      } else {
        setRecords(data || []);
      }
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
      if (!hasSupabaseConfig) {
        setRuns([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('discovery_runs')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching discovery runs:', error);
      } else {
        setRuns(data || []);
      }
      setLoading(false);
    }

    fetchRuns();

    if (!hasSupabaseConfig) {
      return;
    }
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
      if (!hasSupabaseConfig) {
        setLogs([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('job_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data || []);
      }
      setLoading(false);
    }

    fetchLogs();

    if (!hasSupabaseConfig) {
      return;
    }
    const subscription = supabase
      .channel('logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_events' }, () => fetchLogs())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { logs, loading };
}
