import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  History, 
  Settings, 
  Database, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Trash2,
  Plus,
  ChevronRight,
  Terminal,
  Bot,
  Compass,
  Info,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Agent {
  id: number;
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
  agent_name: string;
  status: string;
  prompt: string;
  result: string | null;
  created_at: string;
}

// --- Constants ---
const AGENTS: Agent[] = [
  { id: 1, name: 'Orchestrator', role: 'Queue Manager & Overseer' },
  { id: 2, name: 'Finder Agent', role: 'Business Lead Discovery' },
  { id: 3, name: 'Verifier Agent', role: 'Data Validation & Scoring' },
  { id: 4, name: 'Postcard Designer', role: 'Visual Card Creator' },
  { id: 5, name: 'Data Cleaner', role: 'Normalize & Deduplicate' },
  { id: 6, name: 'Translator', role: 'AR / EN / KU Translation' },
  { id: 7, name: 'Phone Normalizer', role: 'Iraqi Phone Format Fixer' },
  { id: 8, name: 'Category Classifier', role: 'Business Categorization' },
  { id: 9, name: 'Address Resolver', role: 'Geocoding & Maps' },
  { id: 10, name: 'Social Scraper', role: 'Instagram & Facebook' },
  { id: 11, name: 'Review Aggregator', role: 'Ratings & Feedback' },
  { id: 12, name: 'Image Hunter', role: 'Logo & Photo Discovery' },
  { id: 13, name: 'Hours Extractor', role: 'Opening Times Parser' },
  { id: 14, name: 'Duplicate Detector', role: 'Cross-Source Matching' },
  { id: 15, name: 'Score Calculator', role: 'Verification Scoring' },
  { id: 16, name: 'Export Agent', role: 'Data Export & Formats' },
  { id: 17, name: 'QA Inspector', role: 'Quality Assurance' },
  { id: 18, name: 'Iraq Compass AI', role: 'General Assistant' },
];

const AGENT_SYSTEM_PROMPTS: Record<number, string> = {
  1: `You are the Orchestrator for Iraq Compass. Manage 17 specialist agents. Assign tasks, monitor queue health (Pending→Processing→Completed), detect stalled agents, ensure data quality. Categories: restaurants, cafes, bakeries, hotels, gyms, beauty_salons, pharmacies, supermarkets. Be professional.`,
  2: `You are the Finder Agent for Iraq Compass. Discover real Iraqi business leads. Output JSON: [{raw_name, found_on, source_url, confidence:'high|medium|low', raw_phone, raw_address, notes}]. Never fabricate. HIGH = found on 2+ sources.`,
  3: `You are the Verifier Agent for Iraq Compass. Skeptical validator. Check phones (Zain:0750/0751, Korek:0770/0771, AsiaCell:0770/0772/3), name consistency, address. Score 0-100. Output: {verified, score, recommendation:'publish|hold|reject', failed_fields:[]}`,
  4: `You are the Postcard Designer for Iraq Compass. Create rich business cards: headline(EN/AR/KU max 6 words), tagline, description(2-3 factual sentences), highlights[3], badge(verified/new/popular), call_to_action. Warm local Iraqi tone. Only facts — never invent claims.`,
  5: `You are the Data Cleaner for Iraq Compass. Normalize raw Iraqi business data: deduplicate, fix names(no emojis, correct caps), standardize phones (+964 format), enforce categories: restaurants, cafes, bakeries, hotels, gyms, beauty_salons, pharmacies, supermarkets.`,
  6: `You are the AR/KU Translator for Iraq Compass. Translate between English, Iraqi Arabic, and Sorani Kurdish. Use established local names when they exist. Output trilingual JSON {en, ar, ku}.`,
  7: `You are the Phone Normalizer for Iraq Compass. Operators: Zain 0750/0751, Korek 0770/0771, AsiaCell 0770/0772/0773. Output: {original, normalized, operator, valid:bool}. Flag suspicious.`,
  8: `You are the Category Classifier for Iraq Compass. Classify into exactly one: restaurants, cafes, bakeries, hotels, gyms, beauty_salons, pharmacies, supermarkets. Know Iraqi naming patterns. Flag unclear cases for review.`,
  9: `You are the Address Resolver for Iraq Compass. Parse Iraqi addresses to: neighborhood, district, city, governorate, Iraq. Know all 18 Iraqi governorates. Infer location from context.`,
  10: `You are the Social Scraper for Iraq Compass. Analyze Iraqi business accounts on Instagram and Facebook: existence, follower count, last post (active = <6 months), extract contact info from bio. Flag inactive accounts.`,
  11: `You are the Review Aggregator for Iraq Compass. Analyze reviews from Google Maps, TripAdvisor, Facebook. Output: avg_rating, review_count, sentiment_summary, most_mentioned_features[].`,
  12: `You are the Image Hunter for Iraq Compass. Find logo_url and cover_image_url from Facebook, Instagram, or website. Provide real direct URLs only. Set null if not found. No placeholders.`,
  13: `You are the Hours Extractor for Iraq Compass. Parse business hours to standard format. Handle Iraqi patterns: Friday closure, Ramadan schedules, seasonal hours. Note unconfirmed hours.`,
  14: `You are the Duplicate Detector for Iraq Compass. Find duplicates: name similarity >80%, same phone, address proximity <50m. Output: {pair:[id1,id2], similarity_score, match_fields, recommendation:'merge|review|keep_both'}`,
  15: `You are the Score Calculator for Iraq Compass. Score 0-100 based on: completeness, source reliability, cross-source consistency, freshness, engagement. Output weighted score breakdown.`,
  16: `You are the Export Agent for Iraq Compass. Format data for: Supabase JSON upsert, CSV download, formatted tables. Ensure all required fields present before export. Output ready-to-use data.`,
  17: `You are the QA Inspector for Iraq Compass. Final check before publishing. Verify: all required fields, no placeholders, valid URLs, valid phone, category from allowed list, trilingual complete, score >= 60. Output: [{name, pass:bool, issues:[]}]`,
  18: `You are Iraq Compass AI. General assistant for the Iraq Compass business directory platform (Iraq + Kurdistan). Help with: strategy, Supabase schema, React/Vite/TypeScript/Tailwind, multilingual content (EN/AR/KU), 18-agent pipeline. Design: Navy #1B2B5E, Gold #C9A84C, Cream #F5F0E8.`,
};

const TASK_TEMPLATES = [
  { label: 'Find businesses in Sulaymaniyah', prompt: 'Find 10 verified businesses in Sulaymaniyah Iraq. Output JSON: [{name, name_ar, name_ku, category, city, phone, address, website, score, sources:[]}]' },
  { label: 'Clean uploaded dataset', prompt: 'Clean and normalize the attached dataset. Remove duplicates, fix phone format (07XX-XXXXXXX), remove emojis from names. Output corrected JSON array.' },
  { label: 'Verify business list', prompt: 'Verify each business. Phone check: Zain 0750/0751, Korek 0770/0771, AsiaCell 0770/0772/3. Score 0-100. Output: [{name, score, recommendation, issues:[]}]' },
  { label: 'Create postcards (EN/AR/KU)', prompt: 'Create postcard JSON per business: headline(EN/AR/KU max 6 words), tagline, description(2-3 factual sentences), highlights[3], badge, call_to_action. Factual only.' },
  { label: 'Translate to Arabic & Kurdish', prompt: 'Translate all text fields to Iraqi Arabic and Sorani Kurdish. Output: [{en:\'\',ar:\'\',ku:\'\'}] per field.' },
  { label: 'Generate directory report', prompt: 'Analyze data. Output: total, by_category{}, by_city{}, verification_rate%, avg_score, top3_per_category[]' },
  { label: 'Fix phone numbers', prompt: 'Normalize all phones to Iraqi format. Output: [{original, normalized, operator, valid, issue}]' },
  { label: 'Detect duplicates', prompt: 'Find duplicates: name sim >80%, same phone, near address. Output: [{pair:[id1,id2], score, action}]' },
  { label: 'Assign categories', prompt: 'Categorize each business into one of: restaurants, cafes, bakeries, hotels, gyms, beauty_salons, pharmacies, supermarkets. Output updated JSON.' },
  { label: 'Final QA check', prompt: 'QA before publish. Check: all fields complete, no placeholders, score>=60, trilingual content present. Output: [{name, pass:bool, issues:[]}]' },
];

export default function AgentCommander() {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [chatHistories, setChatHistories] = useState<Record<number, Message[]>>({});
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'files' | 'history'>('task');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | ''>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const [importStatus, setImportStatus] = useState('');
  const [cityCenterOnly, setCityCenterOnly] = useState(true);
  const [localScriptPriority, setLocalScriptPriority] = useState(true);
  const [forceColumnWrite, setForceColumnWrite] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistories, selectedAgent.id, isLoading]);

  useEffect(() => {
    fetchTaskHistory();
  }, []);

  const fetchTaskHistory = async () => {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) console.error('Error fetching tasks:', error);
    else setTaskHistory(data || []);
  };

  const currentHistory = chatHistories[selectedAgent.id] || [];

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let fullPrompt = text;
    const intelligenceControls = [
      cityCenterOnly
        ? "- City Center Only: enforce 6km geofence from Saray Square, exclude Bakrajo and Pira Magrun."
        : "- City Center Only: disabled.",
      localScriptPriority
        ? "- Kurdish/Arabic Priority: preserve native script in name_primary, provide commercial English in name_en."
        : "- Kurdish/Arabic Priority: disabled.",
      forceColumnWrite
        ? "- Force Column Write: write social links directly to link_instagram and link_facebook columns."
        : "- Force Column Write: disabled."
    ].join("\n");
    fullPrompt = `Intelligence Layer Controls:\n${intelligenceControls}\n\n${fullPrompt}`;
    if (uploadedFiles.length > 0) {
      fullPrompt += "\n\n";
      uploadedFiles.forEach(file => {
        fullPrompt += `--- Attached: ${file.name} (${file.size} bytes) ---\n${file.content.substring(0, 3000)}\n\n`;
      });
    }

    const userMessage: Message = { role: 'user', parts: [{ text: fullPrompt }] };
    const newHistory = [...currentHistory, userMessage];
    
    setChatHistories(prev => ({
      ...prev,
      [selectedAgent.id]: newHistory
    }));
    setInputText('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Authentication required");
      }

      const promptWithContext = [
        AGENT_SYSTEM_PROMPTS[selectedAgent.id],
        ...newHistory.map((m) => `${m.role.toUpperCase()}: ${m.parts[0].text}`),
      ].join("\n\n");

      const response = await fetch('/api/llm/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          taskType: 'agent-run',
          prompt: promptWithContext,
        }),
      });

      if (!response.ok) {
        throw new Error('LLM request failed');
      }

      const result = await response.json();
      const agentResponse = result?.data?.text || "⚠️ Agent unavailable. Please retry.";
      const agentMessage: Message = { role: 'model', parts: [{ text: agentResponse }] };
      
      setChatHistories(prev => ({
        ...prev,
        [selectedAgent.id]: [...newHistory, agentMessage]
      }));

      // Save task to Supabase
      await supabase.from('agent_tasks').insert({
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        task_type: 'chat',
        prompt: text,
        status: 'completed',
        result: agentResponse
      });
      
      fetchTaskHistory();

    } catch (error) {
      console.error('LLM proxy error:', error);
      const errorMessage: Message = { role: 'model', parts: [{ text: "⚠️ Agent unavailable. Please retry." }] };
      setChatHistories(prev => ({
        ...prev,
        [selectedAgent.id]: [...newHistory, errorMessage]
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
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          content: event.target?.result as string
        }]);
      };
      reader.readAsText(file);
    });
  };

  const importToSupabase = async () => {
    if (uploadedFiles.length === 0) return;
    setImportStatus('Importing...');
    
    try {
      let allRecords: any[] = [];
      uploadedFiles.forEach(file => {
        try {
          const json = JSON.parse(file.content);
          if (Array.isArray(json)) allRecords = [...allRecords, ...json];
          else allRecords.push(json);
        } catch (e) {
          console.error('Error parsing file:', file.name);
        }
      });

      const cleaned = allRecords.map(r => ({
        name: r.name || r.business_name || r.raw_name,
        name_ar: r.name_ar || null,
        name_ku: r.name_ku || null,
        category: r.category || 'restaurants',
        city: r.city || 'Sulaymaniyah',
        phone: r.phone || r.raw_phone || null,
        address: r.address || r.raw_address || null,
        score: r.data_quality_score || r.score || 0,
        status: 'pending',
      })).filter(r => r.name);

      const { error } = await supabase
        .from('businesses')
        .upsert(cleaned, { onConflict: 'name,city' });

      if (error) throw error;
      setImportStatus(`✅ Imported ${cleaned.length} records`);
    } catch (error: any) {
      setImportStatus(`Error: ${error.message}`);
    }
  };

  const assignTask = () => {
    if (!customPrompt.trim()) return;
    handleSendMessage(customPrompt);
    setCustomPrompt('');
    setSelectedTemplate('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#F5F0E8] overflow-hidden">
      {/* LEFT: AGENT ROSTER */}
      <div className="w-[200px] bg-[#1B2B5E] flex flex-col border-r border-white/10">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-[9px] font-black text-[#C9A84C] uppercase tracking-widest">18 AGENTS</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full text-left p-3 transition-all border-l-[3px] ${
                selectedAgent.id === agent.id 
                  ? 'bg-white/10 border-[#C9A84C]' 
                  : 'border-transparent hover:bg-white/5'
              }`}
            >
              <p className="text-[9px] font-black text-[#C9A84C]/50 uppercase">AGENT {agent.id.toString().padStart(2, '0')}</p>
              <p className={`text-[12px] font-medium ${selectedAgent.id === agent.id ? 'text-white' : 'text-white/60'}`}>
                {agent.name}
              </p>
              <p className="text-[10px] text-white/40 truncate">{agent.role}</p>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/10">
          <p className="text-[10px] text-[#C9A84C] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            6 Agents active
          </p>
        </div>
      </div>

      {/* CENTER: LIVE CHAT */}
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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setChatHistories(prev => ({ ...prev, [selectedAgent.id]: [] }))}
              className="text-[10px] font-black text-gray-400 uppercase hover:text-rose-500 transition-colors"
            >
              Clear
            </button>
            <div className="px-2 py-0.5 bg-[#1B2B5E]/5 rounded text-[10px] font-black text-[#1B2B5E]">
              {currentHistory.length} MSGS
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
              <div className={`max-w-[80%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#1B2B5E] text-[#F5F0E8]' 
                  : 'bg-white border border-gray-100 text-[#1B2B5E]'
              }`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.parts[0].text}</pre>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
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
                  handleSendMessage(inputText);
                }
              }}
              placeholder="Type a message or assign a task..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#C9A84C] resize-none"
              rows={2}
            />
            <button 
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-3 bottom-3 p-2 bg-[#1B2B5E] text-[#C9A84C] rounded-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: CONTROL PANEL */}
      <div className="w-[280px] bg-white border-l border-gray-100 flex flex-col">
        <div className="flex border-b border-gray-100">
          {(['task', 'files', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'text-[#1B2B5E] border-b-2 border-[#1B2B5E]' : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'task' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Agent {selectedAgent.id} ready
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Task Template</label>
                <select 
                  value={selectedTemplate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTemplate(val === '' ? '' : parseInt(val));
                    if (val !== '') setCustomPrompt(TASK_TEMPLATES[parseInt(val)].prompt);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C9A84C]"
                >
                  <option value="">Select a template...</option>
                  {TASK_TEMPLATES.map((t, i) => (
                    <option key={i} value={i}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custom Prompt</label>
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#C9A84C] h-32 resize-none"
                  placeholder="Describe the task..."
                />
              </div>

              <button 
                onClick={assignTask}
                disabled={!customPrompt.trim() || isLoading}
                className="w-full bg-[#C9A84C] text-[#1B2B5E] py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                Assign task to agent
              </button>

              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <h4 className="text-[10px] font-black text-[#1B2B5E] uppercase">Agent Commander Update</h4>
                <label className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                  City Center Only
                  <input type="checkbox" checked={cityCenterOnly} onChange={(e) => setCityCenterOnly(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                  Kurdish/Arabic Priority
                  <input type="checkbox" checked={localScriptPriority} onChange={(e) => setLocalScriptPriority(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                  Force Column Write
                  <input type="checkbox" checked={forceColumnWrite} onChange={(e) => setForceColumnWrite(e.target.checked)} />
                </label>
              </div>

              <div className="p-4 bg-[#1B2B5E]/5 rounded-2xl border border-[#1B2B5E]/10">
                <h4 className="text-[10px] font-black text-[#1B2B5E] uppercase mb-2">Agent Specialty</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {AGENT_SYSTEM_PROMPTS[selectedAgent.id].split('.')[0]}.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#C9A84C] transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  className="hidden" 
                  accept=".json,.csv,.txt"
                />
                <Paperclip className="mx-auto mb-2 text-gray-300 group-hover:text-[#C9A84C]" size={24} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drag or click to upload</p>
                <p className="text-[8px] text-gray-300 mt-1">JSON, CSV, TXT</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Loaded Files</h4>
                    <button onClick={() => setUploadedFiles([])} className="text-rose-500"><Trash2 size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileJson size={14} className="text-[#1B2B5E] shrink-0" />
                          <span className="text-[10px] font-bold text-[#1B2B5E] truncate">{file.name}</span>
                        </div>
                        <span className="text-[8px] text-gray-400">{(file.size / 1024).toFixed(1)}KB</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={importToSupabase}
                    className="w-full bg-[#1B2B5E] text-[#C9A84C] py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all"
                  >
                    Import to Supabase
                  </button>
                  {importStatus && <p className="text-[10px] text-center font-bold text-[#1B2B5E]">{importStatus}</p>}
                </div>
              )}

              <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Info size={16} className="text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Files are also attached to your next agent message. Max 3000 chars per file.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recent Tasks</h4>
                <button 
                  onClick={async () => {
                    await supabase.from('agent_tasks').delete().eq('status', 'completed');
                    fetchTaskHistory();
                  }}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest"
                >
                  Clear history
                </button>
              </div>

              <div className="space-y-3">
                {taskHistory.map(task => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-[#1B2B5E] uppercase">{task.agent_name}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{task.prompt}"</p>
                    <p className="text-[8px] text-gray-400">{new Date(task.created_at).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
