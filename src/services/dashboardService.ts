import { supabase } from '../lib/supabase';
import { RawBusiness, VerifiedBusiness, AgentTask } from '../types';
import { handleSupabaseError, OperationType } from '../lib/supabaseUtils';

export const businessService = {
  async getStats() {
    try {
      const [
        { count: rawCount, error: rawError },
        { count: verifiedCount, error: verifiedError },
        { count: pendingCount, error: pendingError },
        { count: approvedCount, error: approvedError },
        { count: taskCount, error: taskError }
      ] = await Promise.all([
        supabase.from('raw_businesses').select('*', { count: 'exact', head: true }),
        supabase.from('businesses').select('*', { count: 'exact', head: true }),
        supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('agent_tasks').select('*', { count: 'exact', head: true })
      ]);

      if (rawError) await handleSupabaseError(rawError, OperationType.GET, 'raw_businesses');
      if (verifiedError) await handleSupabaseError(verifiedError, OperationType.GET, 'businesses');
      if (pendingError) await handleSupabaseError(pendingError, OperationType.GET, 'businesses/pending');
      if (approvedError) await handleSupabaseError(approvedError, OperationType.GET, 'businesses/approved');
      if (taskError) await handleSupabaseError(taskError, OperationType.GET, 'agent_tasks');

      return {
        rawCount: rawCount || 0,
        verifiedCount: verifiedCount || 0,
        pendingCount: pendingCount || 0,
        approvedCount: approvedCount || 0,
        taskCount: taskCount || 0
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        rawCount: 0,
        verifiedCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        taskCount: 0
      };
    }
  },

  async getVerifiedBusinesses(filters: any) {
    try {
      let query = supabase.from('businesses').select('*');
      
      if (filters.status && filters.status !== 'All') {
        query = query.eq('status', filters.status.toLowerCase());
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
      if (error) {
        await handleSupabaseError(error, OperationType.GET, 'businesses');
        throw error;
      }
      return data as VerifiedBusiness[];
    } catch (error) {
      console.error('Error in getVerifiedBusinesses:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status, 
          approved_at: status === 'approved' ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) {
        await handleSupabaseError(error, OperationType.UPDATE, `businesses/${id}`);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw error;
    }
  },

  async batchApprove(ids: string[]) {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString() 
        })
        .in('id', ids);
      if (error) {
        await handleSupabaseError(error, OperationType.UPDATE, 'businesses/batch');
        throw error;
      }
    } catch (error) {
      console.error('Error in batchApprove:', error);
      throw error;
    }
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

  calculateScores(business: Partial<VerifiedBusiness>) {
    let vScore = 0;
    let cScore = 0;

    const hasName = !!(business.name_ar || business.name_ku || business.name_en);
    const hasLocation = !!(business.city);
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
    try {
      const { error } = await supabase.from('raw_businesses').insert(records);
      if (error) {
        await handleSupabaseError(error, OperationType.WRITE, 'raw_businesses');
        throw error;
      }
    } catch (error) {
      console.error('Error in pushToRaw:', error);
      throw error;
    }
  }
};

export const taskService = {
  async getTasks() {
    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        await handleSupabaseError(error, OperationType.GET, 'agent_tasks');
        throw error;
      }
      return data as AgentTask[];
    } catch (error) {
      console.error('Error in getTasks:', error);
      throw error;
    }
  },

  async createTask(task: Partial<AgentTask>) {
    try {
      const { error } = await supabase.from('agent_tasks').insert({
        ...task,
        created_at: new Date().toISOString()
      });
      if (error) {
        await handleSupabaseError(error, OperationType.WRITE, 'agent_tasks');
        throw error;
      }
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  },

  async getLogs(taskId: string) {
    try {
      const { data, error } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('taskId', taskId)
        .order('timestamp', { ascending: false });
      if (error) {
        await handleSupabaseError(error, OperationType.GET, `agent_logs/${taskId}`);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in getLogs:', error);
      throw error;
    }
  }
};
