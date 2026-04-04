import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { agentName, city, category } = req.body;

    if (!agentName || !city || !category) {
      return res.status(400).json({ error: "Missing required fields: agentName, city, category" });
    }

    // For now, return mock response
    // In production, this would call Supabase and create a job
    const mockJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return res.status(202).json({
      status: "started",
      jobId: mockJobId,
      agentName,
      city,
      category,
      message: "Agent started in background",
      debug: "This is a mock response. Supabase integration needed."
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: (error as any).message || 'Internal server error'
    });
  }
}
