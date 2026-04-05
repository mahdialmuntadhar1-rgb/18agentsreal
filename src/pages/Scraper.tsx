import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
  Activity,
  ChevronRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  runPipeline,
  getPipelineStatus,
  pausePipeline,
  resumePipeline,
  resetPipeline,
  isPipelineRunning,
  clearStagingData,
  getStagingCount,
  cleanAndPublishData,
  type PipelineStatus,
} from '@/lib/pipeline';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOVERNORATES = [
  'Sulaymaniyah',
  'Baghdad',
  'Erbil',
  'Basra',
  'Mosul',
  'Duhok',
  'Kirkuk',
  'Najaf',
  'Karbala',
  'Nasiriyah',
];

const CATEGORIES = [
  { id: 'restaurants', name: 'Restaurants' },
  { id: 'cafes', name: 'Cafes' },
  { id: 'pharmacies', name: 'Pharmacies' },
  { id: 'hotels', name: 'Hotels' },
  { id: 'hospitals', name: 'Hospitals' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'services', name: 'Services' },
  { id: 'education', name: 'Education' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function ProgressBar({
  current,
  total,
  failed = 0,
}: {
  current: number;
  total: number;
  failed?: number;
}) {
  const percent = total > 0 ? (current / total) * 100 : 0;
  const failedPercent = total > 0 ? (failed / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600">
          {current} of {total} completed
        </span>
        {failed > 0 && <span className="text-red-600">{failed} failed</span>}
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="flex h-full">
          <div
            className="bg-[#2CA6A4] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
          {failed > 0 && (
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${failedPercent}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function Scraper() {
  const [selectedGovernorates, setSelectedGovernorates] = useState<string[]>(['Sulaymaniyah']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['restaurants', 'cafes']);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [stagingCount, setStagingCount] = useState({ pending: 0, cleaning: 0, published: 0 });
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const loadStatus = useCallback(async () => {
    if (!isMounted.current) return;
    const [statusResult, runningResult, stagingResult] = await Promise.all([
      getPipelineStatus(),
      isPipelineRunning(),
      getStagingCount(),
    ]);
    if (isMounted.current) {
      setStatus(statusResult.status);
      setIsRunning(runningResult);
      setIsPaused(statusResult.status?.status === 'paused');
      setStagingCount(stagingResult);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    refreshInterval.current = setInterval(loadStatus, 2000);
    return () => {
      isMounted.current = false;
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [loadStatus]);

  const handleStart = async () => {
    if (selectedGovernorates.length === 0 || selectedCategories.length === 0) {
      alert('Select at least one governorate and category');
      return;
    }
    setIsRunning(true);
    setLogs([]);
    addLog('Starting pipeline...');
    addLog(`Order: ${selectedGovernorates.join(' → ')}`);
    addLog(`Categories: ${selectedCategories.join(', ')}`);

    await runPipeline(
      {
        governorates: selectedGovernorates,
        categories: selectedCategories,
        delayBetweenSteps: 1500,
      },
      {
        onStepStart: (gov, cat, step, total) => {
          setCurrentStep(`${gov} + ${cat}`);
          addLog(`[${step}/${total}] ${gov} → ${cat}`);
        },
        onStepProgress: (msg) => addLog(`  → ${msg}`),
        onStepComplete: (gov, cat, found, imported) => {
          addLog(`  ✓ ${found} found, ${imported} imported`);
        },
        onStepError: (gov, cat, error) => addLog(`  ✗ ${error}`),
        onPipelineComplete: () => {
          addLog('Pipeline complete!');
          setIsRunning(false);
          setCurrentStep('');
        },
      }
    );
    await loadStatus();
  };

  const handlePause = async () => {
    await pausePipeline();
    setIsPaused(true);
    addLog('Paused');
  };

  const handleResume = async () => {
    await resumePipeline();
    setIsPaused(false);
    addLog('Resumed');
  };

  const handleReset = async () => {
    await resetPipeline();
    await clearStagingData();
    setLogs([]);
    setCurrentStep('');
    addLog('Reset complete');
    await loadStatus();
  };

  const handleCleanPublish = async () => {
    addLog('Publishing to production...');
    const result = await cleanAndPublishData();
    if (result.success) {
      addLog(`Published ${result.processed} records`);
    } else {
      addLog(`Error: ${result.error}`);
    }
    await loadStatus();
  };

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev].slice(0, 50));
  };

  const totalSteps = selectedGovernorates.length * selectedCategories.length;
  const completedSteps = status?.completedCount || 0;

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2B2F33]">Data Pipeline</h1>
              <p className="text-sm text-gray-500 mt-1">Simple sequential scraping for belive</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">{stagingCount.pending} pending</span>
              </div>
              <button
                onClick={() => setShowResetDialog(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2CA6A4]" />
                  <h2 className="font-semibold text-gray-900">Governorates</h2>
                </div>
                <span className="text-sm text-gray-500">{selectedGovernorates.length}</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {GOVERNORATES.map((gov) => (
                  <label key={gov} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGovernorates.includes(gov)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGovernorates([...selectedGovernorates, gov]);
                        } else {
                          setSelectedGovernorates(selectedGovernorates.filter((g) => g !== gov));
                        }
                      }}
                      className="w-4 h-4 text-[#2CA6A4] rounded"
                    />
                    <span className="text-sm">{gov}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#E87A41]" />
                  <h2 className="font-semibold text-gray-900">Categories</h2>
                </div>
                <span className="text-sm text-gray-500">{selectedCategories.length}</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((c) => c !== cat.id));
                        }
                      }}
                      className="w-4 h-4 text-[#E87A41] rounded"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Progress</h2>
                {isRunning && (
                  <span className={`flex items-center gap-1.5 text-sm ${isPaused ? 'text-yellow-600' : 'text-blue-600'}`}>
                    <Activity className="w-4 h-4 animate-pulse" />
                    {isPaused ? 'Paused' : 'Running'}
                  </span>
                )}
              </div>

              {isRunning || status ? (
                <>
                  <ProgressBar current={completedSteps} total={totalSteps} failed={status?.failedCount || 0} />
                  {currentStep && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 uppercase">Currently</p>
                      <p className="font-medium text-blue-900">{currentStep}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-700">{status?.recordsImported || 0}</div>
                      <div className="text-xs text-green-600">Imported</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-700">{status?.recordsFound || 0}</div>
                      <div className="text-xs text-blue-600">Found</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-700">{Math.round(status?.percentComplete || 0)}%</div>
                      <div className="text-xs text-gray-600">Done</div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">Select and click Start</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Controls</h2>
              <div className="space-y-2">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    disabled={totalSteps === 0}
                    className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Pipeline
                  </button>
                ) : isPaused ? (
                  <button
                    onClick={handleResume}
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="w-full py-2.5 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                )}
                <button
                  onClick={handleCleanPublish}
                  disabled={stagingCount.pending === 0}
                  className="w-full py-2.5 bg-[#2CA6A4] text-white font-medium rounded-lg hover:bg-[#238B89] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Publish ({stagingCount.pending})
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Flow</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">1</div>
                  <span>Scrape</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-700">2</div>
                  <span>Staging</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">3</div>
                  <span>Clean & Publish</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-100 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Log
                </h2>
                <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
              </div>
              <div className="max-h-80 overflow-y-auto p-4 space-y-1 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500 italic">No activity...</p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={`${
                        log.includes('✓') ? 'text-green-400' : log.includes('✗') ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Staging</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-yellow-600">{stagingCount.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning</span>
                  <span className="font-medium text-blue-600">{stagingCount.cleaning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Published</span>
                  <span className="font-medium text-green-600">{stagingCount.published}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reset?</h3>
                <p className="text-sm text-gray-500">Clears progress and staging</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-green-600">Production data is NOT affected</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowResetDialog(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => { handleReset(); setShowResetDialog(false); }}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
