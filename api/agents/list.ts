import type { VercelRequest, VercelResponse } from '@vercel/node';

// Global jobs storage - shared across requests
global.jobsStore = global.jobsStore || new Map();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const store = (global as any).jobsStore as Map<string, any>;

    // Get all jobs and convert to array
    const jobsList = Array.from(store.values()).map(job => ({
      id: job.id,
      agent_name: job.agent_name,
      category: job.category,
      city: job.city,
      status: job.status,
      records_found: job.records_found,
      started_at: job.started_at,
      completed_at: job.completed_at
    }));

    return res.status(200).json(jobsList);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: (error as any).message || 'Internal server error'
    });
  }
}
