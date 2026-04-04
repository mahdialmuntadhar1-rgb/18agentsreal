import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId parameter" });
    }

    // Return mock logs for now
    return res.status(200).json([
      {
        id: "log_1",
        job_id: jobId,
        level: "INFO",
        message: "[JOB_START] Starting data collection",
        created_at: new Date().toISOString()
      },
      {
        id: "log_2",
        job_id: jobId,
        level: "INFO",
        message: "[GOVERNOR_INITIALIZED] Governor ready",
        created_at: new Date().toISOString()
      }
    ]);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: (error as any).message || 'Internal server error'
    });
  }
}
