import { supabase } from './supabase';

// ============================================================================
// CORE TYPES (MVP)
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  message_text: string;
  governorate_filter: string | null;
  category_filter: string | null;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed';
  is_testing_mode: boolean;
  total_selected: number;
  created_at: string;
}

export interface Message {
  id: string;
  campaign_id: string;
  business_id: string;
  business_name: string;
  phone_number: string;
  message_text: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'replied';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Conversation {
  business_id: string;
  business_name: string;
  phone_number: string;
  last_message_at: string;
  unread_count: number;
  messages: MessageItem[];
}

export interface MessageItem {
  id: string;
  direction: 'outbound' | 'inbound';
  text: string;
  status: string;
  created_at: string;
}

// ============================================================================
// CAMPAIGN FUNCTIONS
// ============================================================================

export async function createCampaign(campaign: {
  name: string;
  message_text: string;
  governorate_filter: string | null;
  category_filter: string | null;
  is_testing_mode: boolean;
}): Promise<{ data: Campaign | null; error: Error | null }> {
  console.log('[messaging] Creating campaign:', campaign.name);
  
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ ...campaign, status: 'draft', total_selected: 0 })
      .select()
      .single();
    
    if (error) throw error;
    console.log('[messaging] Campaign created:', data.id);
    return { data, error: null };
  } catch (error) {
    console.error('[messaging] Failed to create campaign:', error);
    return { data: null, error: error as Error };
  }
}

export async function fetchCampaigns(): Promise<{ data: Campaign[]; error: Error | null }> {
  console.log('[messaging] Fetching campaigns...');
  
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    console.log(`[messaging] Fetched ${data?.length || 0} campaigns`);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('[messaging] Failed to fetch campaigns:', error);
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// BUSINESS TARGETING
// ============================================================================

export async function fetchTargetBusinesses(filters?: {
  governorate?: string | null;
  category?: string | null;
  limit?: number;
}): Promise<{ 
  businesses: { id: string; name: string; phone: string; governorate: string; category: string }[];
  total: number;
  error: Error | null 
}> {
  console.log('[messaging] Fetching target businesses:', filters);
  
  try {
    let query = supabase
      .from('businesses')
      .select('id, business_name, phone_1, whatsapp, governorate, category', { count: 'exact' })
      .eq('status', 'active')
      .or('phone_1.not.is.null,whatsapp.not.is.null');
    
    if (filters?.governorate) {
      query = query.eq('governorate', filters.governorate);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    const { data, error, count } = await query.order('created_at', { ascending: false }).limit(filters?.limit || 10000);
    
    if (error) throw error;
    
    const businesses = (data || []).map(b => ({
      id: b.id,
      name: b.business_name,
      phone: b.whatsapp || b.phone_1,
      governorate: b.governorate,
      category: b.category
    }));
    
    console.log(`[messaging] Found ${businesses.length} businesses with phone numbers`);
    return { businesses, total: count || businesses.length, error: null };
  } catch (error) {
    console.error('[messaging] Failed to fetch businesses:', error);
    return { businesses: [], total: 0, error: error as Error };
  }
}

// ============================================================================
// MESSAGE QUEUE & SEND
// ============================================================================

export async function queueMessages(
  campaignId: string,
  businesses: { id: string; name: string; phone: string }[],
  messageText: string
): Promise<{ count: number; error: Error | null }> {
  console.log(`[messaging] Queuing ${businesses.length} messages for campaign ${campaignId}`);
  
  try {
    const messages = businesses.map(b => ({
      campaign_id: campaignId,
      business_id: b.id,
      phone_number: b.phone,
      message_text: messageText,
      status: 'queued'
    }));
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messages)
      .select();
    
    if (error) throw error;
    
    // Update campaign status and count
    await supabase
      .from('campaigns')
      .update({ status: 'queued', total_selected: messages.length })
      .eq('id', campaignId);
    
    console.log(`[messaging] Queued ${data?.length || 0} messages`);
    return { count: data?.length || 0, error: null };
  } catch (error) {
    console.error('[messaging] Failed to queue messages:', error);
    return { count: 0, error: error as Error };
  }
}

export async function fetchPendingMessages(campaignId?: string): Promise<{ data: Message[]; error: Error | null }> {
  console.log('[messaging] Fetching pending messages...');
  
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .in('status', ['queued', 'pending'])
      .order('created_at', { ascending: true });
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    const { data, error } = await query.limit(100);
    
    if (error) throw error;
    console.log(`[messaging] Found ${data?.length || 0} pending messages`);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('[messaging] Failed to fetch pending messages:', error);
    return { data: [], error: error as Error };
  }
}

export async function markMessageSent(messageId: string): Promise<{ success: boolean; error: Error | null }> {
  console.log('[messaging] Marking message as sent:', messageId);
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', messageId);
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('[messaging] Failed to mark sent:', error);
    return { success: false, error: error as Error };
  }
}

export async function markMessageFailed(messageId: string, errorMsg: string): Promise<{ success: boolean; error: Error | null }> {
  console.log('[messaging] Marking message as failed:', messageId);
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'failed', error_message: errorMsg })
      .eq('id', messageId);
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// ============================================================================
// INBOX / CONVERSATIONS
// ============================================================================

export async function fetchConversations(): Promise<{ data: Conversation[]; error: Error | null }> {
  console.log('[messaging] Fetching conversations...');
  
  try {
    // First, get all conversations with their latest info
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    
    if (convError) throw convError;
    
    const result: Conversation[] = [];
    
    for (const conv of (conversations || [])) {
      // Get all messages for this conversation
      const { data: msgs, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
      
      if (!msgError && msgs) {
        result.push({
          business_id: conv.business_id,
          business_name: conv.business_name || 'Unknown',
          phone_number: conv.phone_number,
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count || 0,
          messages: msgs.map(m => ({
            id: m.id,
            direction: m.direction as 'outbound' | 'inbound',
            text: m.message_text,
            status: m.status,
            created_at: m.created_at
          }))
        });
      }
    }
    
    console.log(`[messaging] Found ${result.length} conversations`);
    return { data: result, error: null };
  } catch (error) {
    console.error('[messaging] Failed to fetch conversations:', error);
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// CATEGORIES & GOVERNORATES (re-export)
// ============================================================================

export { CATEGORIES, GOVERNORATES } from './supabase';
