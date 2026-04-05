import { supabase } from './supabase';

// ============================================================================
// SIMPLIFIED PIPELINE - No agents, no queues
// Just: for governorate in governorates: for category in categories: scrape()
// ============================================================================

export interface PipelineConfig {
  governorates: string[];
  categories: string[];
  delayBetweenSteps?: number; // ms
}

export interface PipelineStatus {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentGovernorate: string | null;
  currentCategory: string | null;
  totalGovernorates: number;
  totalCategories: number;
  completedCount: number;
  failedCount: number;
  recordsFound: number;
  recordsImported: number;
  percentComplete: number;
  startedAt: string | null;
  errorMessage: string | null;
}

export interface PipelineCallbacks {
  onStepStart?: (governorate: string, category: string, stepNum: number, totalSteps: number) => void;
  onStepProgress?: (message: string) => void;
  onStepComplete?: (governorate: string, category: string, found: number, imported: number) => void;
  onStepError?: (governorate: string, category: string, error: string) => void;
  onPipelineComplete?: () => void;
}

// ============================================================================
// PIPELINE CONTROL
// ============================================================================

/**
 * Start a new pipeline run
 */
export async function startPipeline(
  governorates: string[],
  categories: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('start_pipeline', {
      p_governorates: governorates,
      p_categories: categories,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[startPipeline] Failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Get current pipeline status
 */
export async function getPipelineStatus(): Promise<{
  status: PipelineStatus | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('current_pipeline_status')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    return {
      status: data
        ? {
            id: '', // Not in view
            status: data.status,
            currentGovernorate: data.current_governorate,
            currentCategory: data.current_category,
            totalGovernorates: data.total_governorates,
            totalCategories: data.total_categories,
            completedCount: data.completed_count,
            failedCount: data.failed_count,
            recordsFound: data.records_found,
            recordsImported: data.records_imported,
            percentComplete: data.percent_complete || 0,
            startedAt: data.started_at,
            errorMessage: data.error_message,
          }
        : null,
    };
  } catch (err) {
    console.error('[getPipelineStatus] Failed:', err);
    return { status: null, error: String(err) };
  }
}

/**
 * Check if pipeline is currently running
 */
export async function isPipelineRunning(): Promise<boolean> {
  const { status } = await getPipelineStatus();
  return status?.status === 'running';
}

/**
 * Pause the pipeline
 */
export async function pausePipeline(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.rpc('pause_pipeline');
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Resume the pipeline
 */
export async function resumePipeline(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.rpc('resume_pipeline');
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Reset/clear the pipeline
 */
export async function resetPipeline(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.rpc('reset_pipeline');
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Finish the pipeline (mark as completed)
 */
export async function finishPipeline(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.rpc('finish_pipeline');
    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ============================================================================
// PIPELINE EXECUTION
// ============================================================================

/**
 * Execute a single scraping step
 * REPLACE THIS with actual Gemini API implementation
 */
async function executeScrapeStep(
  governorate: string,
  category: string
): Promise<{ success: boolean; found: number; imported: number; error?: string }> {
  try {
    // TODO: Replace with actual Gemini API call
    // Example:
    // const response = await fetch('/api/scrape', {
    //   method: 'POST',
    //   body: JSON.stringify({ governorate, category })
    // });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate results
    const found = Math.floor(Math.random() * 15) + 5;
    const imported = Math.floor(found * 0.9);

    // Add to staging table
    const { error } = await supabase.from('businesses_import').insert({
      governorate,
      city: governorate + ' Center',
      category,
      source: 'scraper_pipeline',
      processing_status: 'pending',
      raw_data: {
        scraped_at: new Date().toISOString(),
        governorate,
        category,
      },
    });

    if (error) throw error;

    return { success: true, found, imported };
  } catch (err) {
    return { success: false, found: 0, imported: 0, error: String(err) };
  }
}

/**
 * Run the complete pipeline sequentially
 * Simple nested loop: for gov in govs: for cat in cats: scrape()
 */
export async function runPipeline(
  config: PipelineConfig,
  callbacks?: PipelineCallbacks
): Promise<{ completed: number; failed: number; stopped: boolean }> {
  const { governorates, categories, delayBetweenSteps = 1000 } = config;
  let completed = 0;
  let failed = 0;
  let stopped = false;

  const totalSteps = governorates.length * categories.length;
  let currentStep = 0;

  console.log(`[runPipeline] Starting: ${totalSteps} steps total`);
  console.log(`[runPipeline] Governorates: ${governorates.join(', ')}`);
  console.log(`[runPipeline] Categories: ${categories.join(', ')}`);

  // Start pipeline tracking
  await startPipeline(governorates, categories);

  for (const governorate of governorates) {
    if (stopped) break;

    for (const category of categories) {
      if (stopped) break;

      currentStep++;

      // Check if paused
      const { status } = await getPipelineStatus();
      if (status?.status === 'paused') {
        console.log('[runPipeline] Paused, waiting...');
        while ((await getPipelineStatus()).status?.status === 'paused') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `[runPipeline] Step ${currentStep}/${totalSteps}: ${governorate} + ${category}`
      );

      callbacks?.onStepStart?.(governorate, category, currentStep, totalSteps);

      // Update progress
      await supabase.rpc('update_pipeline_progress', {
        p_governorate: governorate,
        p_category: category,
        p_records_found: 0,
        p_records_imported: 0,
      });

      // Execute scrape
      callbacks?.onStepProgress?.('Fetching data...');
      const result = await executeScrapeStep(governorate, category);

      if (result.success) {
        // Mark as complete
        await supabase.rpc('complete_pipeline_step', {
          p_governorate: governorate,
          p_category: category,
          p_status: 'completed',
          p_records_found: result.found,
          p_records_imported: result.imported,
        });

        callbacks?.onStepComplete?.(governorate, category, result.found, result.imported);
        completed++;
      } else {
        // Mark as failed but continue
        await supabase.rpc('complete_pipeline_step', {
          p_governorate: governorate,
          p_category: category,
          p_status: 'failed',
          p_records_found: 0,
          p_records_imported: 0,
          p_error_message: result.error,
        });

        callbacks?.onStepError?.(governorate, category, result.error || 'Unknown error');
        failed++;
        // Continue to next step - don't stop
      }

      // Delay before next step
      if (delayBetweenSteps > 0 && currentStep < totalSteps) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenSteps));
      }
    }
  }

  // Finish pipeline
  await finishPipeline();
  callbacks?.onPipelineComplete?.();

  console.log(`[runPipeline] Complete: ${completed} succeeded, ${failed} failed`);
  return { completed, failed, stopped };
}

// ============================================================================
// DATA CLEANING & UPSERT
// ============================================================================

/**
 * Clean and move data from staging to production
 */
export async function cleanAndPublishData(): Promise<{
  success: boolean;
  processed?: number;
  error?: string;
}> {
  try {
    // Get pending records from staging
    const { data: pending, error: fetchError } = await supabase
      .from('businesses_import')
      .select('*')
      .eq('processing_status', 'pending')
      .limit(100);

    if (fetchError) throw fetchError;
    if (!pending || pending.length === 0) {
      return { success: true, processed: 0 };
    }

    let processed = 0;

    for (const record of pending) {
      // Clean the data
      const cleaned = {
        business_name: record.business_name?.trim(),
        governorate: record.governorate?.trim(),
        city: record.city?.trim(),
        category: record.category?.trim(),
        phone_1: record.phone_1
          ? record.phone_1.replace(/\s/g, '').replace(/^0/, '+964')
          : null,
        source: record.source,
        confidence_score: 0.7,
        status: 'active',
      };

      // Upsert to production (avoid duplicates by phone or name+city)
      const { error: upsertError } = await supabase.from('businesses').upsert(cleaned, {
        onConflict: 'phone_1',
        ignoreDuplicates: true,
      });

      if (upsertError) {
        console.error('[cleanAndPublishData] Upsert failed:', upsertError);
        continue;
      }

      // Mark as processed
      await supabase
        .from('businesses_import')
        .update({ processing_status: 'published' })
        .eq('id', record.id);

      processed++;
    }

    return { success: true, processed };
  } catch (err) {
    console.error('[cleanAndPublishData] Failed:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================================================
// STAGING DATA MANAGEMENT
// ============================================================================

/**
 * Get count of records in staging
 */
export async function getStagingCount(): Promise<{
  pending: number;
  cleaning: number;
  published: number;
}> {
  try {
    const { data, error } = await supabase
      .from('businesses_import')
      .select('processing_status', { count: 'exact' });

    if (error) throw error;

    const counts = { pending: 0, cleaning: 0, published: 0 };
    data?.forEach((r) => {
      if (r.processing_status in counts) {
        counts[r.processing_status as keyof typeof counts]++;
      }
    });

    return counts;
  } catch {
    return { pending: 0, cleaning: 0, published: 0 };
  }
}

/**
 * Clear all staging data
 */
export async function clearStagingData(): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('businesses_import')
      .delete()
      .in('processing_status', ['pending', 'cleaning']);

    if (error) throw error;
    return { success: true };
  } catch {
    return { success: false };
  }
}
