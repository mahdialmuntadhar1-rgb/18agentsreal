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
    // Return mock jobs list for now
    return res.status(200).json([
      {
        id: "mock_1",
        agent_name: "Agent-01",
        status: "idle",
        records_found: 0,
        started_at: new Date().toISOString(),
        city: "Baghdad",
        category: "Restaurants & Dining"
      }
    ]);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: (error as any).message || 'Internal server error'
    });
  }
}
