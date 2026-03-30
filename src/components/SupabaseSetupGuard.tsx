import React from 'react';
import { AlertTriangle, ExternalLink, Settings } from 'lucide-react';

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && url !== 'https://placeholder.supabase.co' && key && key !== 'placeholder';
};

export const SupabaseSetupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isSupabaseConfigured()) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 font-mono">
      <div className="max-w-2xl w-full bg-navy-light border border-gold/30 rounded-2xl p-8 shadow-2xl space-y-8">
        <div className="flex items-center gap-4 text-gold">
          <div className="p-3 bg-gold/10 rounded-xl">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest">Supabase Not Configured</h1>
            <p className="text-xs text-slate-400 mt-1">Environment variables missing or using placeholders</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black/30 border border-gold/10 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} className="text-gold" />
              Setup Instructions
            </h2>
            
            <ol className="space-y-4 text-xs text-slate-400 list-decimal list-inside">
              <li className="leading-relaxed">
                Go to your <span className="text-gold">Supabase Dashboard</span> and select your project.
              </li>
              <li className="leading-relaxed">
                Navigate to <span className="text-gold">Project Settings &gt; API</span>.
              </li>
              <li className="leading-relaxed">
                Copy the <span className="text-gold">Project URL</span> and <span className="text-gold">anon public key</span>.
              </li>
              <li className="leading-relaxed">
                In AI Studio, open the <span className="text-gold">Settings</span> menu (gear icon).
              </li>
              <li className="leading-relaxed">
                Add the following environment variables:
                <div className="mt-2 p-3 bg-navy rounded border border-gold/5 font-mono text-slate-300 space-y-1">
                  <div>VITE_SUPABASE_URL</div>
                  <div>VITE_SUPABASE_ANON_KEY</div>
                </div>
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold hover:bg-gold-bright text-navy font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(201,168,76,0.2)]"
            >
              Open Supabase <ExternalLink size={14} />
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 py-3 bg-transparent border border-gold/30 text-gold hover:bg-gold/5 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              I've set them up, reload
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gold/10 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            18-AGENTS · Production Readiness Mode
          </p>
        </div>
      </div>
    </div>
  );
};
