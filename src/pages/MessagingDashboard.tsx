import { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Users, Filter, Plus, Inbox, MessageSquare, Play, Pause, Check, X, Phone } from 'lucide-react';
import { 
  createCampaign, 
  fetchCampaigns,
  fetchTargetBusinesses,
  queueMessages,
  fetchPendingMessages,
  markMessageSent,
  markMessageFailed,
  fetchConversations,
  type Campaign,
  type Message,
  type Conversation,
  CATEGORIES,
  GOVERNORATES
} from '@/lib/messaging';

// ============================================================================
// RATE-LIMITED MESSAGE SENDER
// ============================================================================
const RATE_LIMIT_MS = 4000; // 15 messages per minute (4000ms between sends)

async function sendMessageWithRateLimit(message: Message): Promise<boolean> {
  console.log(`[sender] Sending message to ${message.phone_number}...`);
  
  // Simulate API call - replace with actual WhatsApp/SMS provider
  // Example: await whatsappAPI.send({ to: message.phone_number, text: message.message_text });
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
  
  // For MVP, simulate success 90% of the time
  const success = Math.random() > 0.1;
  
  if (success) {
    console.log(`[sender] ✓ Message sent to ${message.phone_number}`);
    await markMessageSent(message.id);
    return true;
  } else {
    console.log(`[sender] ✗ Failed to send to ${message.phone_number}`);
    await markMessageFailed(message.id, 'Simulated failure');
    return false;
  }
}

function useMessageSender() {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef(false);

  const startSending = useCallback(async (messages: Message[]) => {
    if (isSending || messages.length === 0) return;
    
    console.log(`[sender] Starting to send ${messages.length} messages...`);
    setIsSending(true);
    setProgress({ current: 0, total: messages.length });
    abortRef.current = false;
    
    for (let i = 0; i < messages.length; i++) {
      if (abortRef.current) {
        console.log('[sender] Sending aborted by user');
        break;
      }
      
      const msg = messages[i];
      setProgress({ current: i + 1, total: messages.length });
      
      await sendMessageWithRateLimit(msg);
      
      // Rate limiting delay (skip for last message)
      if (i < messages.length - 1 && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
      }
    }
    
    console.log('[sender] Sending completed');
    setIsSending(false);
    setProgress({ current: 0, total: 0 });
  }, [isSending]);

  const stopSending = useCallback(() => {
    abortRef.current = true;
    console.log('[sender] Stop requested...');
  }, []);

  return { isSending, progress, startSending, stopSending };
}

// ============================================================================
// CREATE CAMPAIGN FORM (SIMPLIFIED)
// ============================================================================
function CreateCampaignForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [category, setCategory] = useState('');
  const [isTesting, setIsTesting] = useState(true);
  const [preview, setPreview] = useState<{ count: number; businesses: any[] } | null>(null);
  const [creating, setCreating] = useState(false);

  // Load preview when filters change
  useEffect(() => {
    const loadPreview = async () => {
      if (!governorate && !category) {
        setPreview(null);
        return;
      }
      
      const limit = isTesting ? 20 : undefined;
      const { businesses, total } = await fetchTargetBusinesses({ 
        governorate: governorate || null, 
        category: category || null,
        limit 
      });
      
      setPreview({ count: total, businesses: businesses.slice(0, 5) });
    };

    const timeout = setTimeout(loadPreview, 300);
    return () => clearTimeout(timeout);
  }, [governorate, category, isTesting]);

  const handleCreate = async () => {
    if (!name.trim() || !message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!preview || preview.count === 0) {
      alert('No businesses match your filters');
      return;
    }

    setCreating(true);
    console.log('[CreateCampaign] Creating campaign...');

    // 1. Create campaign
    const { data: campaign, error } = await createCampaign({
      name: name.trim(),
      message_text: message.trim(),
      governorate_filter: governorate || null,
      category_filter: category || null,
      is_testing_mode: isTesting
    });

    if (error || !campaign) {
      alert('Failed to create campaign: ' + error?.message);
      setCreating(false);
      return;
    }

    console.log('[CreateCampaign] Campaign created:', campaign.id);

    // 2. Get full business list for queuing
    const limit = isTesting ? 20 : undefined;
    const { businesses } = await fetchTargetBusinesses({
      governorate: governorate || null,
      category: category || null,
      limit
    });

    // 3. Queue messages
    const { count, error: queueError } = await queueMessages(
      campaign.id,
      businesses,
      message.trim()
    );

    if (queueError) {
      alert('Failed to queue messages: ' + queueError.message);
      setCreating(false);
      return;
    }

    console.log('[CreateCampaign] Queued', count, 'messages');
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">New Campaign</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Promotion"
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! Check out our new offers..."
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-lg resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length} chars</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Governorate</label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
              >
                <option value="">All</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
              >
                <option value="">All</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <input
              type="checkbox"
              id="testing"
              checked={isTesting}
              onChange={(e) => setIsTesting(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="testing" className="text-sm cursor-pointer">
              Testing mode (limit 20 businesses)
            </label>
          </div>

          {preview && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-900">
                {preview.count} businesses will be messaged
              </p>
              {preview.businesses.length > 0 && (
                <p className="text-blue-700 mt-1">
                  Sample: {preview.businesses.map(b => b.name).join(', ')}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={!name.trim() || !message.trim() || !preview || creating}
            className="w-full py-3 bg-[#8B1A1A] text-white rounded-lg font-medium disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create & Queue Messages'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SENDER PANEL
// ============================================================================
function SenderPanel() {
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const { isSending, progress, startSending, stopSending } = useMessageSender();

  const loadPending = useCallback(async () => {
    const { data } = await fetchPendingMessages();
    setPendingMessages(data);
  }, []);

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 5000);
    return () => clearInterval(interval);
  }, [loadPending]);

  const handleStart = () => startSending(pendingMessages);

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold flex items-center gap-2">
          <Send className="w-5 h-5" />
          Message Sender
        </h2>
        <span className="text-sm text-gray-500">
          {pendingMessages.length} pending
        </span>
      </div>

      {isSending ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="font-medium">Sending messages...</p>
              <p className="text-sm text-gray-500">
                {progress.current} / {progress.total}
              </p>
            </div>
          </div>
          <button
            onClick={stopSending}
            className="w-full py-2 bg-gray-100 rounded-lg font-medium"
          >
            Stop Sending
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMessages.length > 0 ? (
            <>
              <p className="text-sm text-gray-600">
                {pendingMessages.length} messages ready to send
              </p>
              <p className="text-xs text-gray-500">
                Rate limit: ~15 messages/minute
              </p>
              <button
                onClick={handleStart}
                className="w-full py-2 bg-[#8B1A1A] text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Sending
              </button>
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No pending messages
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INBOX PANEL
// ============================================================================
function InboxPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await fetchConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <Inbox className="w-5 h-5" />
        <h2 className="font-bold">Inbox</h2>
        <span className="ml-auto text-sm text-gray-500">
          {conversations.length} conversations
        </span>
      </div>

      <div className="grid grid-cols-3 h-[400px]">
        {/* Conversation List */}
        <div className="col-span-1 border-r overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.business_id}
              onClick={() => setSelected(conv)}
              className={`w-full p-3 text-left border-b hover:bg-gray-50 ${
                selected?.business_id === conv.business_id ? 'bg-blue-50 border-l-4 border-l-[#8B1A1A]' : ''
              }`}
            >
              <p className="font-medium text-sm truncate">{conv.business_name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" />
                {conv.phone_number}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">
                  {new Date(conv.last_message_at).toLocaleDateString()}
                </span>
                {conv.unread_count > 0 && (
                  <span className="bg-[#8B1A1A] text-white text-xs px-2 py-0.5 rounded-full">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="p-4 text-center text-gray-400 text-sm">No conversations yet</p>
          )}
        </div>

        {/* Message Thread */}
        <div className="col-span-2 flex flex-col">
          {selected ? (
            <>
              <div className="p-3 border-b bg-gray-50">
                <p className="font-medium">{selected.business_name}</p>
                <p className="text-xs text-gray-500">{selected.phone_number}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-xl text-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-[#8B1A1A] text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.direction === 'outbound' && <span className="ml-2">{msg.status === 'sent' ? '✓' : '⏳'}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CAMPAIGNS LIST
// ============================================================================
function CampaignsList({ campaigns, onRefresh }: { campaigns: Campaign[]; onRefresh: () => void }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-bold">Campaigns</h2>
        <button onClick={onRefresh} className="text-sm text-[#8B1A1A]">Refresh</button>
      </div>
      <div className="divide-y">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{campaign.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {campaign.total_selected} businesses • {campaign.status}
                </p>
                {campaign.is_testing_mode && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                    TEST
                  </span>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                campaign.status === 'completed' ? 'bg-green-100 text-green-700' :
                campaign.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status}
              </span>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="p-8 text-center text-gray-400">No campaigns yet</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function MessagingDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const loadData = useCallback(async () => {
    const { data } = await fetchCampaigns();
    setCampaigns(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-6 h-6 text-[#8B1A1A]" />
            <h1 className="font-bold text-lg">Outreach</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B1A1A] text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <SenderPanel />
          <CampaignsList campaigns={campaigns} onRefresh={loadData} />
        </div>
        <InboxPanel />
      </main>

      {/* Create Campaign Modal */}
      {showForm && (
        <CreateCampaignForm 
          onClose={() => setShowForm(false)} 
          onCreated={loadData}
        />
      )}
    </div>
  );
}
