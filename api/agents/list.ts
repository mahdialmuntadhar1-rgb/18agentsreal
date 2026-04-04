import type { VercelRequest, VercelResponse } from '@vercel/node';

interface MockJob {
  id: string;
  agent_name: string;
  category: string;
  city: string;
  status: 'running' | 'completed';
  records_found: number;
  started_at: string;
  completed_at?: string;
}

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
    const jobIds = (req.query.jobIds as string)?.split(',').filter(Boolean) || [];

    if (jobIds.length === 0) {
      return res.status(200).json([]);
    }

    // Generate mock progress for each job ID
    const jobs: MockJob[] = jobIds.map((jobId: string) => {
      // Decode job info from ID
      // Format: job_TIMESTAMP_RANDOMID
      const parts = jobId.split('_');
      const timestamp = parseInt(parts[1]) || Date.now();
      const timeSinceCreation = (Date.now() - timestamp) / 1000; // seconds

      // Simulate progress: grow records over time
      const maxRecords = 15 + Math.floor(Math.random() * 20);
      let recordsFound = Math.floor(timeSinceCreation * 2); // ~2 records/second
      recordsFound = Math.min(recordsFound, maxRecords);

      // Auto-complete after 20-45 seconds
      const isCompleted = timeSinceCreation > 20 + Math.random() * 25;

      // Extract agent and category from the job ID (stored in session memory)
      // For now, use mock data based on hash
      const hash = jobId.charCodeAt(0) + jobId.charCodeAt(Math.floor(jobId.length / 2));
      const agents = ['Agent-01', 'Agent-02', 'Agent-03', 'Agent-04', 'Agent-05'];
      const categories = ['Restaurants & Dining', 'Cafes & Coffee', 'Bakeries', 'Hotels & Stays', 'Gyms & Fitness'];
      const cities = ['Baghdad', 'Basra', 'Erbil', 'Najaf', 'Karbala'];

      return {
        id: jobId,
        agent_name: agents[hash % agents.length],
        category: categories[hash % categories.length],
        city: cities[hash % cities.length],
        status: isCompleted ? 'completed' : 'running',
        records_found: recordsFound,
        started_at: new Date(timestamp).toISOString(),
        ...(isCompleted && { completed_at: new Date().toISOString() })
      };
    });

    return res.status(200).json(jobs);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: (error as any).message || 'Internal server error'
    });
  }
}
