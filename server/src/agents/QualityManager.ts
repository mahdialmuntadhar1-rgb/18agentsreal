import { supabase } from '../lib/supabase.js';
import { BusinessRaw, VerifiedBusiness } from '../types.js';

export async function runQualityManager(jobId: string) {
  console.log(`[QualityManager] Starting for job ${jobId}`);

  const { data: rawRecords, error } = await supabase
    .from('raw_businesses')
    .select('*')
    .eq('agent_job_id', jobId);

  if (error || !rawRecords) {
    console.error('Failed to fetch raw records:', error);
    return;
  }

  let verifiedCount = 0;

  for (const record of rawRecords) {
    const score = calculateQualityScore(record);
    let status: VerifiedBusiness['status'] = 'needs_review';

    if (score >= 80) status = 'approved';
    else if (score < 40) status = 'rejected';

    const verified: VerifiedBusiness = {
      ...record,
      verification_score: score,
      status,
      verified_at: new Date()
    };

    await supabase.from('verified_businesses').upsert(verified, {
      onConflict: 'id'
    });

    if (status === 'approved') verifiedCount++;
  }

  await supabase.from('agent_jobs').update({ records_verified: verifiedCount }).eq('id', jobId);

  console.log(`[QualityManager] Completed. Verified ${verifiedCount}/${rawRecords.length} businesses.`);
}

function calculateQualityScore(b: BusinessRaw): number {
  let score = 0;
  if (b.phone_numbers.length > 0) score += 30;
  if (b.social_media_urls.length > 0) score += 20;
  if (b.google_maps_url) score += 20;
  if (b.address_ar && b.address_en) score += 15;
  if (b.category) score += 10;
  if (b.latitude && b.longitude) score += 5;
  return Math.min(score, 100);
}
