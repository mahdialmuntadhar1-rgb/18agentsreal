import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// Mock data for testing - replace with real implementation
const mockResults = {
  discoveredCount: 5,
  normalizedCount: 5,
  deduplicatedCount: 4,
  insertedCount: 4,
  updatedCount: 0,
  skippedCount: 0,
  successfulSources: ['gemini'],
  adapterErrors: []
};

const runSchema = z.object({
  city: z.string().trim().min(2),
  category: z.string().trim().min(2),
  sources: z.array(z.enum(['gemini', 'web_directory'])).min(1)
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST' && req.url === '/api/agents/run') {
    try {
      const parsed = runSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid payload",
          details: parsed.error.flatten()
        });
      }

      const input = parsed.data;
      
      // TODO: Implement real discovery logic here
      // For now, return mock success response
      console.log(`[API] Mock discovery run for ${input.category} in ${input.city}`);
      
      return res.json({ 
        ok: true, 
        summary: {
          ...mockResults,
          requestedSources: input.sources,
          attemptedSources: input.sources,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[API] Discovery run failed:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Discovery failed",
        details: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  if (req.method === 'GET' && req.url === '/api/debug') {
    try {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        environment: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
          hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
        },
        adapters: {
          gemini: { 
            configured: !!process.env.GEMINI_API_KEY,
            ok: !!process.env.GEMINI_API_KEY 
          },
          web_directory: { 
            configured: true, 
            ok: true 
          }
        },
        recommendations: {
          gemini: process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Missing GEMINI_API_KEY",
          supabase: process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY ? "✅ Configured" : "❌ Missing Supabase keys",
          webDirectory: "✅ Always available"
        }
      };

      return res.json(debugInfo);
    } catch (error) {
      return res.status(500).json({
        error: "Debug endpoint failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Handle other routes
  return res.status(404).json({ error: 'Not found' });
}
