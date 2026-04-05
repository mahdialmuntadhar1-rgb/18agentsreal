import { supabase } from './supabase';

// ============================================================================
// SCRAPER QUEUE API
// Handles sequential task execution and queue management
// ============================================================================

export interface ScraperTask {
  id: string;
  governorate: string;
  category: string;
  task_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  queue_position: number;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
  records_found: number;
  records_imported: number;
  error_message: string | null;
  logs: string[];
  created_at: string;
  updated_at: string;
}

export interface QueueProgress {
  pending_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  cancelled_count: number;
  total_count: number;
}

export interface QueueStatus {
  status: string;
  task_count: number;
  min_position: number | null;
  max_position: number | null;
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Create a new sequential queue for scraping
 */
export async function createScraperQueue(
  governorates: string[],
  categories: string[]
): Promise<{ success: boolean; tasks: ScraperTask[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('create_scraper_queue', {
        p_governorates: governorates,
        p_categories: categories,
      });

    if (error) throw error;

    return { success: true, tasks: data || [] };
  } catch (err) {
    console.error('[createScraperQueue] Failed:', err);
    return { success: false, tasks: [], error: String(err) };
  }
}

/**
 * Get all tasks in the queue
 */
export async function getScraperTasks(
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
): Promise<{ tasks: ScraperTask[]; error?: string }> {
  try {
    let query = supabase
      .from('scraper_tasks')
      .select('*')
      .order('queue_position', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { tasks: data || [] };
  } catch (err) {
    console.error('[getScraperTasks] Failed:', err);
    return { tasks: [], error: String(err) };
  }
}

/**
 * Get current queue progress
 */
export async function getQueueProgress(): Promise<{
  progress: QueueProgress | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('scraper_queue_progress')
      .select('*')
      .single();

    if (error) throw error;

    return { progress: data };
  } catch (err) {
    console.error('[getQueueProgress] Failed:', err);
    return { progress: null, error: String(err) };
  }
}

/**
 * Get queue status summary
 */
export async function getQueueStatus(): Promise<{
  status: QueueStatus[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('scraper_queue_status')
      .select('*');

    if (error) throw error;

    return { status: data || [] };
  } catch (err) {
    console.error('[getQueueStatus] Failed:', err);
    return { status: [], error: String(err) };
  }
}

// ============================================================================
// TASK EXECUTION
// ============================================================================

/**
 * Get the next pending task from the queue
 */
export async function getNextTask(): Promise<{
  task: ScraperTask | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_next_scraper_task');

    if (error) throw error;
    if (!data || data.length === 0) return { task: null };

    // Fetch full task details
    const { data: taskData, error: taskError } = await supabase
      .from('scraper_tasks')
      .select('*')
      .eq('id', data[0].task_id)
      .single();

    if (taskError) throw taskError;

    return { task: taskData };
  } catch (err) {
    console.error('[getNextTask] Failed:', err);
    return { task: null, error: String(err) };
  }
}

/**
 * Mark a task as running
 */
export async function markTaskRunning(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('scraper_tasks')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[markTaskRunning] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Mark a task as completed
 */
export async function markTaskComplete(
  taskId: string,
  recordsFound: number,
  recordsImported: number,
  logMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('update_scraper_task_status', {
      p_task_id: taskId,
      p_status: 'completed',
      p_records_found: recordsFound,
      p_records_imported: recordsImported,
      p_log_message: logMessage || `Completed: ${recordsImported} records imported`,
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[markTaskComplete] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Mark a task as failed
 */
export async function markTaskFailed(
  taskId: string,
  errorMessage: string,
  logMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('update_scraper_task_status', {
      p_task_id: taskId,
      p_status: 'failed',
      p_error_message: errorMessage,
      p_log_message: logMessage || `Failed: ${errorMessage}`,
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[markTaskFailed] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Add a log entry to a task
 */
export async function addTaskLog(
  taskId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('update_scraper_task_status', {
      p_task_id: taskId,
      p_status: 'running', // Keep status as running
      p_log_message: `[${new Date().toLocaleTimeString()}] ${message}`,
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[addTaskLog] Failed:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// SCRAPER EXECUTION ENGINE
// ============================================================================

export interface ScraperCallbacks {
  onTaskStart?: (task: ScraperTask) => void;
  onTaskProgress?: (task: ScraperTask, message: string) => void;
  onTaskComplete?: (task: ScraperTask, result: { found: number; imported: number }) => void;
  onTaskError?: (task: ScraperTask, error: string) => void;
  onQueueComplete?: () => void;
}

/**
 * Execute the scraper for a single task
 * This is a placeholder - replace with actual Gemini API call
 */
async function executeScraperTask(
  task: ScraperTask,
  callbacks?: ScraperCallbacks
): Promise<{ success: boolean; found: number; imported: number; error?: string }> {
  try {
    callbacks?.onTaskProgress?.(task, 'Starting Gemini API call...');

    // Simulate delay for API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Replace with actual Gemini API implementation
    // Example structure:
    // const prompt = `Find ${task.category} businesses in ${task.governorate}, Iraq...`;
    // const result = await callGeminiAPI(prompt);

    // For now, simulate results
    const found = Math.floor(Math.random() * 20) + 5;
    const imported = Math.floor(found * 0.8);

    callbacks?.onTaskProgress?.(
      task,
      `Found ${found} businesses, imported ${imported}`
    );

    // Add to staging table
    await addTaskLog(task.id, `Found ${found} businesses via Gemini`);

    return { success: true, found, imported };
  } catch (err) {
    const error = String(err);
    callbacks?.onTaskError?.(task, error);
    return { success: false, found: 0, imported: 0, error };
  }
}

/**
 * Run the sequential queue
 * Executes one task at a time automatically
 */
export async function runSequentialQueue(
  callbacks?: ScraperCallbacks,
  options?: {
    delayBetweenTasks?: number; // ms delay between tasks
    stopOnError?: boolean;
  }
): Promise<{ completed: number; failed: number; stopped: boolean }> {
  const { delayBetweenTasks = 1000, stopOnError = false } = options || {};
  let completed = 0;
  let failed = 0;
  let stopped = false;

  console.log('[runSequentialQueue] Starting sequential execution...');

  while (!stopped) {
    // Get next task
    const { task, error: nextError } = await getNextTask();

    if (nextError) {
      console.error('[runSequentialQueue] Error getting next task:', nextError);
      if (stopOnError) {
        stopped = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    if (!task) {
      console.log('[runSequentialQueue] No more pending tasks');
      break;
    }

    console.log(`[runSequentialQueue] Starting task ${task.queue_position}: ${task.task_name}`);

    // Mark as running
    const { success: markSuccess, error: markError } = await markTaskRunning(task.id);
    if (!markSuccess) {
      console.error('[runSequentialQueue] Failed to mark task running:', markError);
      failed++;
      if (stopOnError) {
        stopped = true;
        break;
      }
      continue;
    }

    callbacks?.onTaskStart?.(task);

    // Execute the scraper
    const result = await executeScraperTask(task, callbacks);

    if (result.success) {
      // Mark as complete
      await markTaskComplete(
        task.id,
        result.found,
        result.imported,
        `Successfully imported ${result.imported} businesses`
      );
      callbacks?.onTaskComplete?.(task, {
        found: result.found,
        imported: result.imported,
      });
      completed++;
    } else {
      // Mark as failed
      await markTaskFailed(task.id, result.error || 'Unknown error');
      failed++;

      if (stopOnError) {
        stopped = true;
        break;
      }
    }

    // Delay before next task
    if (delayBetweenTasks > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenTasks));
    }
  }

  callbacks?.onQueueComplete?.();
  console.log(
    `[runSequentialQueue] Queue complete. Completed: ${completed}, Failed: ${failed}`
  );

  return { completed, failed, stopped };
}

/**
 * Check if queue is currently running
 */
export async function isQueueRunning(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('scraper_tasks')
      .select('id')
      .eq('status', 'running')
      .limit(1);

    if (error) throw error;

    return (data?.length || 0) > 0;
  } catch (err) {
    console.error('[isQueueRunning] Failed:', err);
    return false;
  }
}

/**
 * Cancel all pending tasks
 */
export async function cancelPendingTasks(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('scraper_tasks')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('status', 'pending')
      .select();

    if (error) throw error;

    return { success: true, count: data?.length || 0 };
  } catch (err) {
    console.error('[cancelPendingTasks] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Retry all failed tasks
 */
export async function retryFailedTasks(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('retry_failed_scraper_tasks');

    if (error) throw error;

    return { success: true, count: data };
  } catch (err) {
    console.error('[retryFailedTasks] Failed:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// DATA RESET
// ============================================================================

/**
 * Reset all scraper data (staging, queue, incomplete batches)
 * SAFE: Does NOT touch production businesses table
 */
export async function resetScraperData(): Promise<{
  success: boolean;
  deleted?: { table_name: string; records_deleted: number }[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('reset_scraper_data', {
      p_delete_staging: true,
      p_delete_queue: true,
      p_delete_batches: true,
    });

    if (error) throw error;

    return { success: true, deleted: data };
  } catch (err) {
    console.error('[resetScraperData] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Get counts of what would be deleted in a reset
 */
export async function getResetPreview(): Promise<{
  staging_count: number;
  queue_count: number;
  batch_count: number;
}> {
  try {
    const [stagingResult, queueResult, batchResult] = await Promise.all([
      supabase
        .from('businesses_import')
        .select('id', { count: 'exact', head: true })
        .in('processing_status', ['pending', 'cleaning', 'deduped']),
      supabase.from('scraper_tasks').select('id', { count: 'exact', head: true }),
      supabase
        .from('import_batches')
        .select('id', { count: 'exact', head: true })
        .in('status', ['running', 'failed']),
    ]);

    return {
      staging_count: stagingResult.count || 0,
      queue_count: queueResult.count || 0,
      batch_count: batchResult.count || 0,
    };
  } catch (err) {
    console.error('[getResetPreview] Failed:', err);
    return { staging_count: 0, queue_count: 0, batch_count: 0 };
  }
}
