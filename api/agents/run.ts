import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Job {
  id: string;
  agent_name: string;
  category: string;
  city: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  records_found: number;
  started_at: string;
  completed_at?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { agentName, city, category } = req.body;

    if (!agentName || !city || !category) {
      return res.status(400).json({ error: "Missing required fields: agentName, city, category" });
    }

    // Get or initialize global store
    const store = (global as any).jobsStore || new Map();
    (global as any).jobsStore = store;

    // Create job with realistic data
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: Job = {
      id: jobId,
      agent_name: agentName,
      category: category,
      city: city,
      status: 'running',
      records_found: 0,
      started_at: new Date().toISOString(),
    };

    // Store the job
    store.set(jobId, job);

    // Simulate progress - increment records over time
    const interval = setInterval(() => {
      const currentJob = store.get(jobId);
      if (!currentJob) {
        clearInterval(interval);
        return;
      }

      if (currentJob.status === 'running') {
        currentJob.records_found += Math.floor(Math.random() * 3) + 1; // 1-3 records per tick

        // Auto-complete after 15-40 seconds
        const elapsed = (Date.now() - new Date(currentJob.started_at).getTime()) / 1000;
        if (elapsed > 15 + Math.random() * 25) {
          currentJob.status = 'completed';
          currentJob.completed_at = new Date().toISOString();
          clearInterval(interval);
        }
        store.set(jobId, currentJob);
      }
    }, 1500); // Update every 1.5 seconds

    return res.status(202).json({
      status: "started",
      jobId,
      agentName,
      city,
      category,
      message: "Agent started in background"
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: (error as any).message || 'Internal server error'
    });
  }
}
