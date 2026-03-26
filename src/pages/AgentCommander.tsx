import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, Trash2, Bot, Compass, FileJson, Info, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Agent {
  id: string;
  name: string;
  role: string;
}

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

interface AgentTask {
  id: number;
  agent_id: string;
  status: string;
  city: string;
  category: string;
  last_error: string | null;
  created_at: string;
}

const AGENTS: Agent[] = [
  { id: 'orchestrator', name: 'Orchestrator', role: 'Queue Manager & Overseer' },
  { id: 'finder', name: 'Finder Agent', role: 'Business Lead Discovery' },
  { id: 'verifier', name: 'Verifier Agent', role: 'Data Validation & Scoring' },
  { id: 'translator', name: 'Translator', role: 'AR / EN / KU Translation' },
  { id: 'inspector', name: 'QA Inspector', role: 'Quality Assurance' },
];

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  orchestrator: 'You coordinate agents and summarize operational outcomes. Be concise and factual.',
  finder: 'Find businesses with verifiable sources. Return strict JSON. Never fabricate evidence.',
  verifier: 'Verify consistency across phone, city, category, and source links. Return confidence and issues.',
  translator: 'Translate to English, Iraqi Arabic, and Sorani Kurdish with local naming conventions.',
  inspector: 'Perform final QA: completeness, validity, and policy compliance.',
};

export default function AgentCommander() {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'files' | 'history'>('task');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentHistory = useMemo(() => chatHistories[selectedAgent.id] ?? [], [chatHistories, selectedAgent.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, selectedAgent.id, isLoading]);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('id,agent_id,status,city,category,last_error,created_at')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) setHistoryError(error.message);
      else {
        setHistoryError(null);
        setTaskHistory((data ?? []) as AgentTask[]);
      }
      setHistoryLoading(false);
    };

    void loadHistory();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let fullPrompt = text;
    if (uploadedFiles.length > 0) {
      fullPrompt += '\n\n';
      uploadedFiles.forEach((file) => {
        fullPrompt += `--- Attached: ${file.name} (${file.size} bytes) ---\n${file.content.substring(0, 3000)}\n\n`;
      });
    }

    const userMessage: Message = { role: 'user', parts: [{ text: fullPrompt }] };
    const nextHistory = [...currentHistory, userMessage];
    setChatHistories((prev) => ({ ...prev, [selectedAgent.id]: nextHistory }));
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          systemInstruction: AGENT_SYSTEM_PROMPTS[selectedAgent.id],
          contents: nextHistory,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'AI request failed.');

      const agentResponse = payload.text || '⚠️ Agent unavailable. Please retry.';
      setChatHistories((prev) => ({
        ...prev,
        [selectedAgent.id]: [...nextHistory, { role: 'model', parts: [{ text: agentResponse }] }],
      }));
    } catch {
      setChatHistories((prev) => ({
        ...prev,
        [selectedAgent.id]: [...nextHistory, { role: 'model', parts: [{ text: '⚠️ Agent unavailable. Please retry.' }] }],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, size: file.size, content: String(event.target?.result ?? '') },
        ]);
      };
      reader.readAsText(file);
    });
  };

  const sha256Hex = async (value: string): Promise<string> => {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  };

  const importToSupabase = async () => {
    if (uploadedFiles.length === 0) return;
    setImportStatus('Importing...');

    try {
      const parsed: Array<Record<string, unknown>> = [];
      for (const file of uploadedFiles) {
        try {
          const json = JSON.parse(file.content);
          if (Array.isArray(json)) parsed.push(...json);
          else parsed.push(json as Record<string, unknown>);
        } catch {
          // Skip invalid files and continue valid ones
        }
      }

      const rows = [] as Array<Record<string, unknown>>;
      for (const record of parsed) {
        const name = String(record.name ?? record.business_name ?? record.raw_name ?? '').trim();
        if (!name) continue;

        const city = String(record.city ?? 'Unknown');
        const category = String(record.category ?? 'restaurants');
        const sourceUrl = String(record.source_url ?? record.website ?? '').trim() || null;
        const source = String(record.source ?? 'manual_import');
        const externalId = String(record.external_id ?? '').trim() || null;
        const sourceHash = await sha256Hex([name.toLowerCase(), city.toLowerCase(), sourceUrl ?? '', source].join('|'));

        rows.push({
          name,
          city,
          category,
          address: (record.address as string | undefined) ?? null,
          phone: (record.phone as string | undefined) ?? null,
          website: (record.website as string | undefined) ?? null,
          source,
          source_url: sourceUrl,
          external_id: externalId,
          source_hash: sourceHash,
          verification_status: 'pending',
          raw_payload: record,
          collected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (rows.length === 0) {
        setImportStatus('No valid records found in uploaded files.');
        return;
      }

      const { error } = await supabase.from('businesses').upsert(rows, { onConflict: 'source_hash' });
      if (error) throw error;

      setImportStatus(`✅ Imported ${rows.length} records to Supabase`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      setImportStatus(`Error: ${message}`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#F5F0E8] overflow-hidden">
      <div className="w-[200px] bg-[#1B2B5E] flex flex-col border-r border-white/10">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-[9px] font-black text-[#C9A84C] uppercase tracking-widest">Agents</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full text-left p-3 transition-all border-l-[3px] ${selectedAgent.id === agent.id ? 'bg-white/10 border-[#C9A84C]' : 'border-transparent hover:bg-white/5'}`}
            >
              <p className="text-[12px] font-medium text-white">{agent.name}</p>
              <p className="text-[10px] text-white/40 truncate">{agent.role}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1B2B5E] flex items-center justify-center text-white">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1B2B5E] uppercase tracking-tight">{selectedAgent.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{selectedAgent.role}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
          {currentHistory.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
              <Compass size={48} className="opacity-20" />
              <p className="text-sm font-medium uppercase tracking-widest opacity-50">Select an agent and assign a task</p>
            </div>
          )}

          {currentHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#1B2B5E] text-[#F5F0E8]' : 'bg-white border border-gray-100 text-[#1B2B5E]'}`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.parts[0].text}</pre>
              </div>
            </div>
          ))}

          {isLoading && <div className="text-sm text-gray-500">Agent is processing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage(inputText);
                }
              }}
              placeholder="Instructions should be specific and actionable for the selected agent."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#C9A84C]"
              rows={2}
            />
            <button onClick={() => void handleSendMessage(inputText)} disabled={!inputText.trim() || isLoading} className="absolute right-3 bottom-3 p-2 bg-[#1B2B5E] text-[#C9A84C] rounded-lg disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col">
        <div className="flex border-b border-gray-100">
          {(['task', 'files', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-[#1B2B5E] border-b-2 border-[#1B2B5E]' : 'text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'task' && (
            <div className="text-[10px] text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200">
              Task execution and queue state are sourced from Supabase runtime tables.
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept=".json,.txt" />
                <Paperclip className="mx-auto mb-2 text-gray-300" size={24} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drag or click to upload</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Loaded Files</h4>
                    <button onClick={() => setUploadedFiles([])} className="text-rose-500"><Trash2 size={14} /></button>
                  </div>
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 overflow-hidden"><FileJson size={14} className="text-[#1B2B5E]" /><span className="text-[10px] font-bold text-[#1B2B5E] truncate">{file.name}</span></div>
                      <span className="text-[8px] text-gray-400">{(file.size / 1024).toFixed(1)}KB</span>
                    </div>
                  ))}
                  <button onClick={() => void importToSupabase()} className="w-full bg-[#1B2B5E] text-[#C9A84C] py-3 rounded-xl font-black text-[11px] uppercase tracking-widest">Import to Supabase</button>
                  {importStatus && <p className="text-[10px] text-center font-bold text-[#1B2B5E]">{importStatus}</p>}
                </div>
              )}

              <div className="flex gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <Info size={16} className="text-emerald-600 shrink-0" />
                <p className="text-[10px] text-emerald-700 leading-relaxed">Imports are upserted to Supabase by source hash.</p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyLoading && <p className="text-xs text-gray-400">Loading task history…</p>}
              {historyError && <p className="text-xs text-rose-500">{historyError}</p>}
              {!historyLoading && !historyError && taskHistory.length === 0 && <p className="text-xs text-gray-400">No agent task history yet.</p>}
              {taskHistory.map((task) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-[#1B2B5E] uppercase">{task.agent_id}</span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-700">{task.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{task.city} · {task.category}</p>
                  {task.last_error && <p className="text-[9px] text-rose-500">{task.last_error}</p>}
                  <p className="text-[8px] text-gray-400">{new Date(task.created_at).toLocaleString()}</p>
                </div>
              ))}
              {!historyLoading && !historyError && taskHistory.length > 0 && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs"><CheckCircle2 size={14} /> Live task history from Supabase</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
