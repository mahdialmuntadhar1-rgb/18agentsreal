import Queue from 'bull';
import { IRAQI_CITIES } from './types.js';
import { runCityAgent } from './agents/CityAgent.js';
import { runQualityManager } from './agents/QualityManager.js';

export const scrapeQueue = new Queue('scrape-city', process.env.REDIS_URL!);

scrapeQueue.process(async (job) => {
  const { city, jobId } = job.data;
  console.log(`[Queue] Starting agent for ${city}`);
  await runCityAgent(city, jobId);
});

export const qualityQueue = new Queue('quality-control', process.env.REDIS_URL!);

qualityQueue.process(async (job) => {
  const { jobId } = job.data;
  await runQualityManager(jobId);
});

export async function startAllAgents() {
  const jobs = [];

  for (const city of IRAQI_CITIES) {
    const job = await scrapeQueue.add(
      { city, jobId: null },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 }
      }
    );
    jobs.push(job);
  }

  return jobs;
}
