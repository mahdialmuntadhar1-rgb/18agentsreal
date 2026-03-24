import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Terminal,
  Activity
} from 'lucide-react';
import { taskService } from '../services/dashboardService';
import { AgentTask } from '../types';
import { motion } from 'motion/react';

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    task_name: '',
    task_type: 'Verification',
    assigned_to: 'Agent-Alpha',
    governorate: 'All'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskService.createTask({
        ...newTask,
        status: 'pending'
      });
      setShowNewTask(false);
      fetchTasks();
    } catch (error) {
      alert('Failed to create task');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[#1B2B5E] tracking-tight">AGENT TASKS</h2>
          <p className="text-gray-500 font-medium">Automated data verification and enrichment</p>
        </div>
        <button 
          onClick={() => setShowNewTask(true)}
          className="bg-[#1B2B5E] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <Plus size={18} />
          New Task
        </button>
      </header>

      {showNewTask && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200"
        >
          <h3 className="text-xl font-black text-[#1B2B5E] mb-6 uppercase tracking-tight">Configure New Agent Task</h3>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Name</label>
              <input 
                required
                type="text" 
                value={newTask.task_name}
                onChange={e => setNewTask({...newTask, task_name: e.target.value})}
                placeholder="e.g., Verify Basra Restaurants"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Type</label>
              <select 
                value={newTask.task_type}
                onChange={e => setNewTask({...newTask, task_type: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]"
              >
                <option>Verification</option>
                <option>Cleaning</option>
                <option>Enrichment</option>
                <option>Deduplication</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Agent</label>
              <select 
                value={newTask.assigned_to}
                onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]"
              >
                <option>Agent-Alpha (Fast)</option>
                <option>Agent-Beta (Deep Scan)</option>
                <option>Agent-Gamma (Cleaning)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Governorate</label>
              <select 
                value={newTask.governorate}
                onChange={e => setNewTask({...newTask, governorate: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]"
              >
                <option>All</option>
                <option>Baghdad</option>
                <option>Basra</option>
                <option>Erbil</option>
                <option>Sulaymaniyah</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setShowNewTask(false)}
                className="px-6 py-3 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-[#C9A84C] text-[#1B2B5E] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
              >
                Launch Agent
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-[#C9A84C]" size={48} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border border-gray-200 text-center">
            <Bot size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest">No active tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-6 group hover:shadow-md transition-all">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                task.status === 'running' ? 'bg-blue-50 text-blue-600' :
                task.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                {task.status === 'running' ? <Loader2 className="animate-spin" /> : <Bot size={28} />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-black text-[#1B2B5E] uppercase tracking-tight">{task.task_name}</h4>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Activity size={10} /> {task.task_type}</span>
                  <span className="flex items-center gap-1"><Terminal size={10} /> {task.assigned_to}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(task.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 mb-2">{task.result_summary || 'Waiting for results...'}</p>
                <button className="text-[10px] font-black text-[#C9A84C] uppercase tracking-widest hover:underline">View Logs</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;
