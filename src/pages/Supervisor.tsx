import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Upload, FileText, Calendar, CheckCircle, 
  AlertCircle, ArrowLeft, Globe, User, Bot, Trash2,
  Download, Loader2, MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'supervisor';
  text: string;
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'pending' | 'cleaning' | 'completed' | 'error';
  rowCount?: number;
}

import { supabase } from '../lib/supabase';

export default function Supervisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'supervisor',
      text: "Welcome to the Iraq Compass Command Center. I am your AI Supervisor. How can I assist you with the data factory today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function importToSupabase(records: any[]) {
    setImportStatus('Importing...');
    const cleaned = records.map(r => ({
      name:        r.name || r.business_name || r.raw_name,
      category:    r.category || 'restaurants',
      city:        r.city || 'Sulaymaniyah',
      phone:       r.phone || r.raw_phone || null,
      address:     r.address || r.raw_address || null,
      score:       r.data_quality_score || r.score || 0,
      status:      'pending',
    })).filter(r => r.name);

    const { error } = await supabase
      .from('businesses')
      .upsert(cleaned, { onConflict: 'name,city' });

    setImportStatus(error
      ? `Error: ${error.message}`
      : `✅ Imported ${cleaned.length} records`
    );
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/llm/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          taskType: 'supervisor-chat',
          prompt: `You are the AI Supervisor for Iraq Compass, a business directory. You help the user manage data agents and clean business listings. User says: ${inputText}`,
        }),
      });

      if (!response.ok) {
        throw new Error('LLM request failed');
      }

      const result = await response.json();
      const supervisorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'supervisor',
        text: result?.data?.text || "I'm processing your request. Please stand by.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supervisorMsg]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      processFiles(Array.from(uploadedFiles));
    }
  };

  const processFiles = (newFiles: File[]) => {
    const fileObjects: UploadedFile[] = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...fileObjects]);

    fileObjects.forEach((fileObj, index) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        updateFileStatus(fileObj.id, 'cleaning');
        
        try {
          let records = [];
          if (fileObj.name.endsWith('.json')) {
            records = JSON.parse(content);
          } else {
            // Simple CSV parser for demo
            const lines = content.split('\n');
            const headers = lines[0].split(',');
            records = lines.slice(1).map(line => {
              const values = line.split(',');
              return headers.reduce((obj: any, header, i) => {
                obj[header.trim()] = values[i]?.trim();
                return obj;
              }, {});
            });
          }
          
          await importToSupabase(Array.isArray(records) ? records : [records]);
          updateFileStatus(fileObj.id, 'completed', Array.isArray(records) ? records.length : 1);
        } catch (err) {
          console.error('Error processing file:', err);
          updateFileStatus(fileObj.id, 'error');
        }
      };
      reader.readAsText(newFiles[index]);
    });
  };

  const updateFileStatus = (id: string, status: UploadedFile['status'], rowCount?: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status, rowCount } : f));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      processFiles(Array.from(droppedFiles));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#1E293B] border-b border-white/10 p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(201,168,76,0.3)]">
                <Bot className="text-[#1B2B5E]" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Supervisor Hub</h1>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  System Online
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Current Session</span>
              <span className="text-xs font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Column: Chat Session */}
        <section className="lg:col-span-7 flex flex-col bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden shadow-2xl h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-[#C9A84C]" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Supervisor Chat</h2>
            </div>
            <button className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest">Clear History</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-[#C9A84C]'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-[#1B2B5E]" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.text}
                    <div className={`text-[9px] mt-2 opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center">
                    <Bot size={16} className="text-[#1B2B5E]" />
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Talk to the supervisor..."
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-[#C9A84C] transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#C9A84C] text-[#1B2B5E] rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </section>

        {/* Right Column: Data Upload & Cleaning */}
        <section className="lg:col-span-5 space-y-6">
          {/* Upload Box */}
          <div 
            className={`bg-[#1E293B] rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-white/10 hover:border-white/20'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className={`transition-colors ${isDragging ? 'text-[#C9A84C]' : 'text-white/40'}`} size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Upload Raw Data</h3>
            <p className="text-sm text-white/40 mb-6">Drag and drop your CSV or JSON files here. We'll handle the cleaning and date normalization.</p>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              multiple
              accept=".csv,.json"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold hover:bg-white/10 transition-all uppercase tracking-widest"
            >
              Select Files
            </button>
          </div>

          {/* Processing Queue */}
          <div className="bg-[#1E293B] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Cleaning Queue</h2>
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                {files.filter(f => f.status !== 'completed').length} Active
              </span>
            </div>

            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {files.length === 0 ? (
                <div className="py-12 text-center text-white/20">
                  <FileText size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs uppercase tracking-widest">No files in queue</p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="bg-white/5 rounded-xl p-4 border border-white/5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          file.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                          file.status === 'cleaning' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'
                        }`}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold truncate max-w-[150px]">{file.name}</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-widest">{file.size}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                        className="p-1 text-white/20 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                        <span className={
                          file.status === 'completed' ? 'text-emerald-400' : 
                          file.status === 'cleaning' ? 'text-blue-400' : 'text-white/40'
                        }>
                          {file.status === 'cleaning' ? 'Cleaning Dates & Normalizing...' : 
                           file.status === 'completed' ? 'Cleaning Complete' : 'Waiting in Queue'}
                        </span>
                        {file.status === 'completed' && <span className="text-white/40">{file.rowCount} Records</span>}
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ 
                            width: file.status === 'completed' ? '100%' : 
                                   file.status === 'cleaning' ? '60%' : '5%' 
                          }}
                          className={`h-full transition-all duration-1000 ${
                            file.status === 'completed' ? 'bg-emerald-500' : 
                            file.status === 'cleaning' ? 'bg-blue-500' : 'bg-white/20'
                          }`}
                        />
                      </div>
                    </div>

                    {file.status === 'completed' && (
                      <div className="mt-4 flex items-center gap-2">
                        <button className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2">
                          <Download size={12} /> Download Cleaned
                        </button>
                        <button className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
                          View
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-blue-400" size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">Data Cleaning Note</h4>
              <p className="text-xs text-blue-400/80 leading-relaxed">
                Our AI Supervisor automatically detects date formats (YYYY-MM-DD, DD/MM/YYYY, etc.) and normalizes them to ISO 8601 for the database.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
