import React, { useState } from 'react';
import { 
  Upload, 
  FileJson, 
  Wand2, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Database
} from 'lucide-react';
import { cleaningService } from '../services/dashboardService';
import { motion } from 'motion/react';

const DataCleaner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPushed, setIsPushed] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setPreviewData(Array.isArray(json) ? json.slice(0, 10) : [json]);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(uploadedFile);
    }
  };

  const runRepair = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      const repaired = previewData.map(item => ({
        ...item,
        name_raw: cleaningService.repairText(item.name_raw || item.name || ''),
        category_raw: cleaningService.repairText(item.category_raw || item.category || '')
      }));
      setPreviewData(repaired);
      setIsProcessing(false);
    }, 1500);
  };

  const pushToSupabase = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const records = (Array.isArray(json) ? json : [json]).map(item => ({
            name_raw: item.name || item.name_raw || 'Unknown',
            category_raw: item.category || item.category_raw || 'Uncategorized',
            city: item.city || 'Unknown',
            address: item.address || '',
            phone: item.phone || '',
            source: 'JSON Upload',
            coordinates: item.coordinates || { lat: 0, lng: 0 }
          }));
          
          if (records.length === 0) {
            throw new Error('No valid records found in JSON');
          }

          await cleaningService.pushToRaw(records);
          setIsPushed(true);
        } catch (err: any) {
          alert(`Push failed: ${err.message}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } catch (error) {
      alert('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">DATA CLEANER</h2>
        <p className="text-gray-500 font-medium">Repair encoding and normalize raw business data</p>
      </header>

      {!file ? (
        <div className="border-4 border-dashed border-gray-200 rounded-3xl p-20 flex flex-col items-center justify-center bg-white hover:border-[#C9A84C] transition-colors group">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:text-[#C9A84C] group-hover:bg-[#C9A84C]/5 transition-all mb-6">
            <Upload size={40} />
          </div>
          <h3 className="text-xl font-bold text-[#1B2B5E] mb-2">Upload Raw JSON</h3>
          <p className="text-gray-400 text-sm mb-8">Drag and drop your business data file here</p>
          <label className="bg-[#1B2B5E] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg">
            Browse Files
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileJson size={24} />
              </div>
              <div>
                <p className="font-bold text-[#1B2B5E]">{file.name}</p>
                <p className="text-xs text-gray-400 uppercase font-bold">{(file.size / 1024).toFixed(2)} KB • JSON Format</p>
              </div>
            </div>
            <button onClick={() => setFile(null)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all">
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={runRepair}
              disabled={isProcessing || isPushed}
              className="flex items-center justify-center gap-3 bg-[#C9A84C] text-[#1B2B5E] p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
              Run Encoding Repair
            </button>
            <button 
              onClick={pushToSupabase}
              disabled={isProcessing || isPushed}
              className="flex items-center justify-center gap-3 bg-[#1B2B5E] text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Database size={20} />}
              Push to raw_businesses
            </button>
          </div>

          {isPushed && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-700"
            >
              <CheckCircle2 size={20} />
              <p className="text-sm font-bold">Data successfully pushed to Supabase!</p>
            </motion.div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-[#1B2B5E] uppercase text-xs tracking-widest">Data Preview (First 10 Records)</h4>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Encoding: UTF-8</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-3">Raw Name</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewData.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-medium text-[#1B2B5E]">{item.name_raw || item.name}</td>
                      <td className="px-6 py-4 text-gray-500">{item.city}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Ready</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCleaner;
