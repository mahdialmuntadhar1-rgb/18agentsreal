import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase.js';
import { getPlacesClient, GooglePlaceResult } from '../lib/googlePlaces.js';
import { extractBusinessInfoWithGemini } from '../lib/gemini.js';
import { AgentLog, BusinessRaw } from '../types.js';
import { qualityQueue } from '../queue.js';

export async function runCityAgent(city: string, existingJobId?: string) {
  const jobId = existingJobId || uuidv4();
  let recordsFound = 0;

  try {
    await supabase.from('agent_jobs').insert({
      id: jobId,
      city,
      status: 'running',
      started_at: new Date().toISOString(),
      records_found: 0,
      records_verified: 0
    });

    await addLog(jobId, 'info', `Starting agent for ${city}`);

    const places = await searchGooglePlaces(city);
    await addLog(jobId, 'info', `Found ${places.length} places from Google Places`);

    for (const place of places) {
      const rawBusiness = await convertPlaceToRaw(place, city, jobId);
      if (rawBusiness) {
        await supabase.from('raw_businesses').insert(rawBusiness);
        recordsFound++;
      }
    }

    await supabase
      .from('agent_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_found: recordsFound
      })
      .eq('id', jobId);

    await addLog(jobId, 'info', `Agent finished. Found ${recordsFound} businesses. Triggering quality control.`);

    await qualityQueue.add({ jobId });
  } catch (error: any) {
    await supabase
      .from('agent_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: error.message
      })
      .eq('id', jobId);

    await addLog(jobId, 'error', `Agent failed: ${error.message}`);
  }
}

async function searchGooglePlaces(city: string): Promise<GooglePlaceResult[]> {
  const client = getPlacesClient();
  const response = await client.searchText({
    textQuery: `businesses in ${city}, Iraq`,
    pageSize: 50
  });

  return (response.places || []) as GooglePlaceResult[];
}

async function convertPlaceToRaw(place: GooglePlaceResult, city: string, jobId: string): Promise<BusinessRaw | null> {
  try {
    const raw: BusinessRaw = {
      city,
      name_en: place.displayName?.text || null,
      name_ar: null,
      phone_numbers: place.internationalPhoneNumber ? [place.internationalPhoneNumber] : [],
      social_media_urls: [],
      google_maps_url: place.googleMapsUri || null,
      address_en: place.formattedAddress || null,
      address_ar: null,
      category: place.types?.[0] || null,
      latitude: place.location?.latitude || null,
      longitude: place.location?.longitude || null,
      source: 'google_places',
      agent_job_id: jobId
    };

    if (place.displayName?.text) {
      const combinedText = `
        Name: ${place.displayName.text}
        Address: ${place.formattedAddress || ''}
        Types: ${place.types?.join(', ') || ''}
      `;

      const enriched = await extractBusinessInfoWithGemini(combinedText, city, place.displayName.text);
      raw.name_ar = enriched.name_ar || null;
      raw.social_media_urls = enriched.social_media_urls || [];
      raw.address_ar = enriched.address_ar || null;
      if (enriched.category) raw.category = enriched.category;
    }

    return raw;
  } catch (err) {
    console.error(`Failed to process place ${place.id}:`, err);
    return null;
  }
}

async function addLog(jobId: string, level: AgentLog['level'], message: string) {
  await supabase.from('agent_logs').insert({
    job_id: jobId,
    level,
    message,
    timestamp: new Date().toISOString()
  });
}
