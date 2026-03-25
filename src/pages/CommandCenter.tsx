import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Play, Square, CheckCircle2, AlertCircle, 
  Activity, Database, ShieldCheck, FileText, 
  Search, Filter, Zap, Bot, Info, CheckCircle,
  Wand2, Compass, Globe, Trash2, RefreshCw,
  LayoutDashboard, Terminal as TerminalIcon,
  CheckSquare, AlertTriangle, Download, MapPin
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, where, doc, updateDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

const CITIES = [
  { id: 'sulaymaniyah', en: 'Sulaymaniyah City', ar: 'مدينة السليمانية', count: 5000 },
  { id: 'baghdad', en: 'Baghdad City', ar: 'مدينة بغداد', count: 16200 },
  { id: 'karbala', en: 'Karbala City', ar: 'مدينة كربلاء', count: 3900 },
  { id: 'erbil', en: 'Erbil City', ar: 'مدينة أربيل', count: 3300 },
  { id: 'basra', en: 'Basra City', ar: 'مدينة البصرة', count: 7000 },
  { id: 'najaf', en: 'Najaf City', ar: 'مدينة النجف', count: 2900 },
  { id: 'mosul', en: 'Mosul City', ar: 'مدينة الموصل', count: 4400 },
  { id: 'kirkuk', en: 'Kirkuk City', ar: 'مدينة كركوك', count: 1800 },
  { id: 'diyala', en: 'Diyala City', ar: 'مدينة ديالى', count: 3000 },
  { id: 'anbar', en: 'Anbar City', ar: 'مدينة الأنبار', count: 1800 },
  { id: 'dohuk', en: 'Dohuk City', ar: 'مدينة دهوك', count: 1600 },
  { id: 'wasit', en: 'Wasit City', ar: 'مدينة واسط', count: 1500 },
  { id: 'muthanna', en: 'Muthanna City', ar: 'مدينة المثنى', count: 1000 },
  { id: 'qadisiyah', en: 'Qadisiyah City', ar: 'مدينة القادسية', count: 1500 },
  { id: 'maysan', en: 'Maysan City', ar: 'مدينة ميسان', count: 1400 },
  { id: 'thi_qar', en: 'Thi-Qar City', ar: 'مدينة ذي قار', count: 3200 },
  { id: 'babil', en: 'Babil City', ar: 'مدينة بابل', count: 1600 },
  { id: 'saladin', en: 'Saladin City', ar: 'مدينة صلاح الدين', count: 1750 },
];

const AGENTS = [
  { id: 'cleaner', icon: <Wand2 size={20} />, name: 'Text Cleaner', desc: 'Repairs Arabic/Kurdish text', tasks: 1842, success: 98 },
  { id: 'enricher', icon: <Database size={20} />, name: 'Data Enrichment', desc: 'Fills phones, categories', tasks: 934, success: 94 },
  { id: 'validator', icon: <ShieldCheck size={20} />, name: 'Quality Validator', desc: 'Scores & flags entries', tasks: 721, success: 100 },
  { id: 'verifier', icon: <CheckCircle size={20} />, name: 'Human Verifier', desc: 'Queues for human review', tasks: 312, success: 100 },
  { id: 'social', icon: <Globe size={20} />, name: 'Social Finder', desc: 'Finds Instagram / Facebook', tasks: 0, success: 0 },
  { id: 'exporter', icon: <Download size={20} />, name: 'Export Agent', desc: 'Exports to Firestore', tasks: 24, success: 100 },
];

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'ok' | 'warn' | 'agent';
}

export default function CommandCenter() {
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set(['sulaymaniyah']));
  const [selectedTask, setSelectedTask] = useState('social');
  const [isRunning, setIsRunning] = useState(false);
  const [instruction, setInstruction] = useState('Search for Instagram and Facebook pages for each business in selected cities. Add found URLs to the directory list.');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cityProgress, setCityProgress] = useState<Record<string, number>>({});
  const [doneCount, setDoneCount] = useState(0);
  const [serverTime, setServerTime] = useState(new Date().toLocaleTimeString([], { hour12: false }));
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setServerTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for logs from Firestore
  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: (doc.data().timestamp?.toDate?.() || new Date()).toLocaleTimeString([], { hour12: false })
      })) as LogEntry[];
      setLogs(firestoreLogs.reverse());
    });
    return () => unsubscribe();
  }, []);

  // Listen for task progress
  useEffect(() => {
    if (!currentTaskId) return;
    const unsubscribe = onSnapshot(doc(db, 'agent_tasks', currentTaskId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status === 'completed' || data.status === 'stopped') {
          setIsRunning(false);
        }
        // Update local progress if needed (though we simulate it for UI smoothness)
      }
    });
    return () => unsubscribe();
  }, [currentTaskId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = async (type: LogEntry['type'], message: string) => {
    try {
      await addDoc(collection(db, 'logs'), {
        timestamp: serverTimestamp(),
        message,
        type,
        taskId: currentTaskId
      });
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  const toggleCity = (id: string) => {
    if (isRunning) return;
    const next = new Set(selectedCities);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCities(next);
  };

  const selectAll = () => {
    if (isRunning) return;
    setSelectedCities(new Set(CITIES.map(c => c.id)));
  };

  const clearAll = () => {
    if (isRunning) return;
    setSelectedCities(new Set());
  };

  const launchTasks = async () => {
    if (selectedCities.size === 0) {
      addLog('warn', 'No cities selected. Tick at least one city.');
      return;
    }
    if (!selectedTask) {
      addLog('warn', 'No task selected.');
      return;
    }

    setIsRunning(true);
    setDoneCount(0);
    
    const cities = Array.from(selectedCities) as string[];
    const initialProgress: Record<string, number> = {};
    cities.forEach((id: string) => (initialProgress as any)[id] = 0);
    setCityProgress(initialProgress);

    try {
      const taskRef = await addDoc(collection(db, 'agent_tasks'), {
        type: selectedTask,
        instruction,
        cities,
        status: 'running',
        progress: 0,
        created_at: serverTimestamp()
      });
      setCurrentTaskId(taskRef.id);

      await addLog('info', `▶ Task launched: "${instruction}"`);
      await addLog('info', `Cities: ${cities.map(id => CITIES.find(c => c.id === id)?.en).join(', ')}`);
      await addLog('agent', `${selectedTask.toUpperCase()} agent activated`);

      // Simulation logic (in a real app, a backend function would handle this)
      const messages: Record<string, ((c: string) => string)[]> = {
        social: [
          (c) => `🔍 Searching Instagram for businesses in ${c}…`,
          (c) => `📘 Scanning Facebook pages for ${c}…`,
          (c) => `✅ Found ${Math.floor(Math.random() * 120 + 30)} social profiles in ${c}`,
          (c) => `💾 Writing Instagram URLs to directory for ${c}`,
          (c) => `💾 Writing Facebook URLs to directory for ${c}`,
          (c) => `✔ ${c} — social enrichment complete`,
        ],
        text: [(c) => `Repairing Arabic text in ${c}…`, (c) => `Fixed encoding in ${c}`],
        enrich: [(c) => `Filling phones/coords in ${c}…`, (c) => `Enrichment done for ${c}`],
        qc: [(c) => `Running QC on ${c}…`, (c) => `QC complete for ${c}`],
        export: [(c) => `Exporting ${c} to Supabase…`, (c) => `Export done for ${c}`],
      };

      let interval = setInterval(async () => {
        const currentCities = [...selectedCities] as string[];
        const cityId = currentCities[Math.floor(Math.random() * currentCities.length)];
        const cityName = (CITIES.find(c => c.id === cityId)?.en || cityId) as string;
        const msgsForTask = ((messages as any)[selectedTask] || messages.social) as any[];
        const msgFn = msgsForTask[Math.floor(Math.random() * msgsForTask.length)] as (c: string) => string;
        
        await addLog('ok', msgFn(cityName));

        setCityProgress((prev: Record<string, number>) => {
          const next = { ...prev } as any;
          let allDone = true;
          let completedCount = 0;

          currentCities.forEach((id: string) => {
            if (next[id] < 100) {
              next[id] = Math.min(100, next[id] + Math.random() * 15 + 5);
              if (next[id] < 100) allDone = false;
              else {
                addLog('ok', `✔ ${CITIES.find(c => c.id === id)?.en} — task complete`);
              }
            }
            if (next[id] >= 100) completedCount++;
          });

          setDoneCount(completedCount);

          if (allDone) {
            clearInterval(interval);
            setIsRunning(false);
            updateDoc(doc(db, 'agent_tasks', taskRef.id), { status: 'completed', progress: 100 });
            addLog('info', `🏁 All tasks complete · ${currentCities.length} cities processed`);
          }
          return next;
        });
      }, 1500);

    } catch (error) {
      console.error("Error launching task:", error);
      setIsRunning(false);
    }
  };

  const stopAll = async () => {
    if (currentTaskId) {
      await updateDoc(doc(db, 'agent_tasks', currentTaskId), { status: 'stopped' });
    }
    setIsRunning(false);
    addLog('warn', '■ All agents stopped by user');
  };

  return (
    <div className="min-h-screen text-[#e2d9c8] font-mono p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-gold/20">
          <div>
            <h1 className="text-2xl font-bold text-gold tracking-wider flex items-center gap-3">
              <Zap className="text-gold animate-pulse" size={28} />
              AGENT COMMAND CENTER
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
              AI Operations Cockpit · 18 Cities · <span className="text-gold">74,049</span> records
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-slate-500 font-mono">
              Server · {serverTime}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Running', value: isRunning ? ([...selectedCities] as string[]).filter((id: string) => ((cityProgress as any)[id] || 0) < 100).length : 0, color: 'text-gold' },
            { label: 'Queued', value: isRunning ? ([...selectedCities] as string[]).filter((id: string) => ((cityProgress as any)[id] || 0) === 0).length : 0, color: 'text-gold' },
            { label: 'Done', value: doneCount, color: 'text-gold', delta: doneCount > 0 ? `+${doneCount} completed` : '' },
            { label: 'Cities', value: 18, color: 'text-gold' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-gold/10 rounded-xl p-4 shadow-xl">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
              {stat.delta && <div className="text-[10px] text-green-500 mt-1">{stat.delta}</div>}
            </div>
          ))}
        </div>

        {/* Agent Status Row */}
        <div className="space-y-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
            Agent Status
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENTS.map(agent => {
              const isActive = isRunning && (
                (selectedTask === 'text' && agent.id === 'cleaner') ||
                (selectedTask === 'enrich' && agent.id === 'enricher') ||
                (selectedTask === 'social' && agent.id === 'social') ||
                (selectedTask === 'qc' && agent.id === 'validator') ||
                (selectedTask === 'export' && agent.id === 'exporter')
              );
              return (
                <div key={agent.id} className="bg-white/5 border border-gold/10 rounded-xl p-3 flex items-center gap-4">
                  <div className="text-gold/60">{agent.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-200">{agent.name}</div>
                    <div className="text-[9px] text-slate-500 truncate">{agent.desc}</div>
                  </div>
                  <div className={`text-[8px] px-2 py-1 rounded-full font-bold uppercase tracking-widest ${
                    isActive ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-white/5 text-slate-500'
                  }`}>
                    {isActive ? 'Running' : 'Idle'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Command Box */}
        <div className="bg-navy/80 border border-gold rounded-2xl p-6 shadow-[0_0_40px_rgba(201,168,76,0.08)] space-y-6">
          <div className="flex items-center gap-4">
            <div className="text-2xl">🎯</div>
            <div>
              <h2 className="text-sm font-bold text-gold uppercase tracking-widest">Task Commander</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Select cities + task type → write instruction → launch</p>
            </div>
          </div>

          {/* Task Type Chips */}
          <div className="space-y-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Task Type</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'text', label: '🔤 Text Repair', color: 'bg-blue-500' },
                { id: 'enrich', label: '📍 Enrich Data', color: 'bg-purple-500' },
                { id: 'social', label: '📱 Collect Socials', color: 'bg-green-500' },
                { id: 'qc', label: '✅ Quality Check', color: 'bg-orange-500' },
                { id: 'export', label: '📤 Export Data', color: 'bg-gold' }
              ].map(task => (
                <button
                  key={task.id}
                  onClick={() => !isRunning && setSelectedTask(task.id)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedTask === task.id 
                      ? `${task.color} text-navy border-transparent` 
                      : 'bg-white/5 text-slate-400 border-transparent hover:border-white/20'
                  }`}
                >
                  {task.label}
                </button>
              ))}
            </div>
          </div>

          {/* City Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Select Cities</div>
              <div className="flex gap-4">
                <button onClick={selectAll} className="text-[9px] text-gold underline underline-offset-2 hover:text-gold-bright">Select All</button>
                <button onClick={clearAll} className="text-[9px] text-gold underline underline-offset-2 hover:text-gold-bright">Clear All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {CITIES.map(city => {
                const isSelected = selectedCities.has(city.id);
                const progress = cityProgress[city.id] || 0;
                const isCityRunning = isRunning && isSelected && progress < 100;
                return (
                  <div
                    key={city.id}
                    onClick={() => toggleCity(city.id)}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer group ${
                      isCityRunning ? 'border-green-500/50 bg-green-500/5 animate-running-pulse' :
                      isSelected ? 'border-gold bg-gold/10' : 'border-gold/10 bg-white/5 hover:border-gold/30'
                    }`}
                  >
                    <div className={`absolute top-2 right-2 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-gold border-gold text-navy' : 'border-gold/20'
                    }`}>
                      {isSelected && <CheckCircle2 size={10} />}
                    </div>
                    <div className="text-[11px] font-bold text-slate-200">{city.en}</div>
                    <div className="text-[10px] text-slate-500 font-ar mt-0.5">{city.ar}</div>
                    <div className="text-[9px] text-slate-600 mt-2">{city.count.toLocaleString()} records</div>
                    
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between items-center text-[8px] uppercase tracking-tighter">
                        <span className={isCityRunning ? 'text-green-400' : 'text-slate-500'}>
                          {progress >= 100 ? 'Done' : isCityRunning ? 'Running' : 'Idle'}
                        </span>
                        {isRunning && isSelected && <span className="text-slate-400">{Math.floor(progress)}%</span>}
                      </div>
                      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full ${progress >= 100 ? 'bg-blue-400' : 'bg-green-500'}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instruction + Launch */}
          <div className="space-y-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">Custom Instruction</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="flex-1 bg-white/5 border border-gold/20 rounded-xl p-4 text-xs text-slate-200 outline-none focus:border-gold transition-all min-h-[60px] resize-none"
                placeholder="Enter specific instructions for the agents..."
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={launchTasks}
                  disabled={isRunning}
                  className="px-8 py-3 bg-gold hover:bg-gold-bright text-navy font-bold text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(201,168,76,0.2)]"
                >
                  ▶ Launch
                </button>
                {isRunning && (
                  <button
                    onClick={stopAll}
                    className="px-8 py-3 bg-transparent border border-rose-500 text-rose-500 hover:bg-rose-500/10 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    ■ Stop
                  </button>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 italic">
              {selectedCities.size > 0 
                ? <span className="text-gold">{selectedCities.size} cities selected</span> 
                : 'No cities selected'} · Task: <span className="text-gold">{selectedTask.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
            Live Activity Log
            <div className="h-px flex-1 bg-gold/10" />
          </div>
          <div className="bg-black/30 border border-gold/10 rounded-xl p-4 h-[250px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                <div className="text-2xl">📡</div>
                <div className="uppercase tracking-widest">Awaiting system activity...</div>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-4 items-start">
                  <span className="text-slate-600 shrink-0">{log.time}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest shrink-0 ${
                    log.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
                    log.type === 'ok' ? 'bg-green-500/20 text-green-400' :
                    log.type === 'warn' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gold/20 text-gold'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300 leading-relaxed">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
