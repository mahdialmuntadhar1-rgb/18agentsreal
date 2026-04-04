import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      agents: 18,
      activeJobs: 0,
      database: "mock-mode",
      message: "API is responding. Database integration pending."
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(503).json({
      status: "degraded",
      error: (error as any).message || 'Service unavailable'
    });
  }
}
