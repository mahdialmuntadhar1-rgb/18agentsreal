import { supabase } from '../lib/supabase';
import { RawBusiness, VerifiedBusiness, AgentTask } from '../types';

export const businessService = {
  async getStats() {
    const [
      verifiedCountResult,
      pendingCountResult,
      approvedCountResult,
      taskCountResult,
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      supabase.from('agent_tasks').select('*', { count: 'exact', head: true }),
    ]);

    return {
      verifiedCount: verifiedCountResult.count ?? 0,
      pendingCount: pendingCountResult.count ?? 0,
      approvedCount: approvedCountResult.count ?? 0,
      taskCount: taskCountResult.count ?? 0,
    };
  },

  async getVerifiedBusinesses(filters: any) {
    try {
      let query = supabase.from('businesses').select('*');
      
      if (filters.status && filters.status !== 'All') {
        query = query.eq('verification_status', filters.status.toLowerCase());
      }
      if (filters.city && filters.city !== 'All') {
        query = query.eq('city', filters.city);
      }
      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      if (filters.minScore) {
        query = query.gte('confidence_score', filters.minScore);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as VerifiedBusiness[];
    } catch (error) {
      console.error('Error in getVerifiedBusinesses:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('businesses')
      .update({ verification_status: status })
      .eq('id', id);
    if (error) throw error;
  },

  async batchApprove(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('businesses')
      .update({ verification_status: 'approved' })
      .in('id', ids);

    if (error) throw error;
  }
};

export const cleaningService = {
  repairText(text: string): string {
    if (!text) return '';
    try {
      // Basic repair for common encoding issues
      return text.replace(/[^\x20-\x7E\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    } catch (e) {
      return text;
    }
  },

  calculateScores(business: any) {
    let vScore = 0;
    let cScore = 0;

    const hasName = !!business.business_name;
    const hasLocation = !!business.city;
    const hasPhone = !!business.phone;

    if (hasName) vScore = 1;
    if (hasName && hasLocation) vScore = 2;
    if (hasName && hasLocation && hasPhone) vScore = 3;

    if (hasName) cScore += 40;
    if (hasLocation) cScore += 30;
    if (hasPhone) cScore += 30;

    return { vScore, cScore };
  },

  async pushToRaw(records: any[]) {
    const { error } = await supabase.from('businesses').insert(records);
    if (error) throw error;
  }
};

export const taskService = {
  async getTasks() {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AgentTask[];
    } catch (error) {
      console.error('Error in getTasks:', error);
      throw error;
    }
  },

  async createTask(task: Partial<AgentTask>) {
    const { error } = await supabase.from('agent_tasks').insert(task);
    if (error) throw error;
  },

  async getLogs(taskId: string) {
    try {
      const { data, error } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('taskId', taskId)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getLogs:', error);
      throw error;
    }
  }
};
