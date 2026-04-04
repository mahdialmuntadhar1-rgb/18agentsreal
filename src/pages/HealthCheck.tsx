import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  database: string;
  activeJobs: number;
  agents: number;
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Checking API health...');
      const response = await fetch('/api/health');
      const data = await response.json();

      console.log('✅ Health check response:', data);
      setHealth(data);

      if (!response.ok) {
        setError(`Server returned ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Health check failed:', err);
      setError((err as any).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8">🔍 Backend Health Check</h1>

        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8 space-y-6">
          {/* Status Card */}
          <div className={`p-6 rounded-xl border-2 ${
            health?.status === 'healthy'
              ? 'border-green-500 bg-green-500/10'
              : health?.status === 'degraded'
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-red-500 bg-red-500/10'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {health?.status === 'healthy' && <CheckCircle2 className="w-6 h-6 text-green-400" />}
              {health?.status === 'degraded' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
              {health?.status === 'offline' && <AlertCircle className="w-6 h-6 text-red-400" />}
              <h2 className="text-2xl font-bold text-white capitalize">{health?.status || 'Checking...'}</h2>
            </div>

            {health && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Database:</span>
                  <span className={health.database === 'connected' ? 'text-green-300 font-bold' : 'text-red-300 font-bold'}>
                    {health.database}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Jobs:</span>
                  <span className="text-blue-300 font-bold">{health.activeJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Agents:</span>
                  <span className="text-blue-300 font-bold">{health.agents}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-300 text-sm font-mono break-all">{error}</p>
              </div>
            )}
          </div>

          {/* Diagnosis */}
          {health && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">📋 Diagnosis</h3>
              <div className="space-y-3 text-sm">
                {health.status === 'healthy' ? (
                  <p className="text-green-300">✅ Everything looks good! The API is working.</p>
                ) : health.database === 'not-configured' ? (
                  <div>
                    <p className="text-red-300 font-bold">❌ Database not configured</p>
                    <p className="text-slate-400 mt-2">
                      The backend can't find Supabase environment variables. Make sure these are set in your deployment:
                    </p>
                    <ul className="mt-2 text-xs font-mono text-slate-400 space-y-1 ml-4">
                      <li>• VITE_SUPABASE_URL</li>
                      <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-yellow-300">⚠️ The API is running but degraded. Check Supabase connection.</p>
                )}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={checkHealth}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>

          {/* Console Instructions */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-2">💡 To see more details:</p>
            <p className="text-xs text-slate-300 font-mono">Press F12 → Console → Check logs starting with 📡</p>
          </div>
        </div>
      </div>
    </div>
  );
}
