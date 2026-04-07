-- ============================================================================
-- MESSAGING SYSTEM SCHEMA
-- Tables for campaigns, messages, and conversations
-- ============================================================================

-- ============================================================================
-- TABLE: campaigns
-- Purpose: Store marketing campaigns with targeting filters
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign info
    name text NOT NULL,
    message_text text NOT NULL,
    
    -- Filters used to target businesses
    governorate_filter text,           -- NULL means all governorates
    category_filter text,              -- NULL means all categories
    
    -- Status tracking
    status text DEFAULT 'draft' 
        CHECK (status IN ('draft', 'queued', 'sending', 'paused', 'completed', 'cancelled')),
    
    -- Testing mode (limits recipients to 20)
    is_testing_mode boolean DEFAULT false,
    
    -- Statistics
    total_selected integer DEFAULT 0,
    total_with_phone integer DEFAULT 0,
    total_queued integer DEFAULT 0,
    total_sent integer DEFAULT 0,
    total_delivered integer DEFAULT 0,
    total_replied integer DEFAULT 0,
    total_converted integer DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    scheduled_at timestamptz,          -- When to start sending
    started_at timestamptz,            -- When actually started
    completed_at timestamptz           -- When finished
);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON public.campaigns(created_at DESC);

-- Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Public read/write (for demo - in production use authenticated only)
DROP POLICY IF EXISTS "public_campaigns_access" ON public.campaigns;
CREATE POLICY "public_campaigns_access" ON public.campaigns
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

COMMENT ON TABLE public.campaigns IS 
    'Marketing campaigns with business targeting filters';


-- ============================================================================
-- TABLE: messages
-- Purpose: Individual messages queued for businesses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    
    -- Message content
    message_text text NOT NULL,
    phone_number text NOT NULL,
    
    -- Status tracking
    status text DEFAULT 'queued' 
        CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'replied', 'converted')),
    
    -- External message ID (from WhatsApp/SMS provider)
    external_message_id text,
    
    -- Error tracking
    error_message text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz,
    delivered_at timestamptz,
    replied_at timestamptz,
    converted_at timestamptz,
    
    -- Reply content (if applicable)
    reply_text text,
    
    -- Unique constraint: one message per business per campaign
    UNIQUE(campaign_id, business_id)
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_campaign ON public.messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_business ON public.messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_messages_access" ON public.messages;
CREATE POLICY "public_messages_access" ON public.messages
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

COMMENT ON TABLE public.messages IS 
    'Individual messages queued for delivery to businesses';


-- ============================================================================
-- TABLE: conversations
-- Purpose: Store two-way conversation threads
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
    
    -- Contact info
    phone_number text NOT NULL,
    business_name text,
    
    -- Status
    status text DEFAULT 'active' 
        CHECK (status IN ('active', 'archived', 'blocked')),
    
    -- Last activity
    last_message_at timestamptz NOT NULL DEFAULT now(),
    last_message_text text,
    last_message_direction text CHECK (last_message_direction IN ('inbound', 'outbound')),
    
    -- Unread count
    unread_count integer DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_business ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_campaign ON public.conversations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_conversations_access" ON public.conversations;
CREATE POLICY "public_conversations_access" ON public.conversations
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

COMMENT ON TABLE public.conversations IS 
    'Conversation threads for two-way messaging';


-- ============================================================================
-- TABLE: conversation_messages
-- Purpose: Individual messages within a conversation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    
    -- Message details
    direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_text text NOT NULL,
    
    -- Status
    status text DEFAULT 'sent' 
        CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    
    -- External ID from provider
    external_message_id text,
    
    -- Error tracking
    error_message text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz,
    read_at timestamptz
);

-- Indexes for conversation_messages
CREATE INDEX IF NOT EXISTS idx_conversation_msgs_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_msgs_created ON public.conversation_messages(created_at DESC);

-- Row Level Security
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_conversation_msgs_access" ON public.conversation_messages;
CREATE POLICY "public_conversation_msgs_access" ON public.conversation_messages
    FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

COMMENT ON TABLE public.conversation_messages IS 
    'Individual messages within conversation threads';


-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Auto-update campaigns.updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON public.campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update conversations.updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- VIEWS FOR DASHBOARD
-- ============================================================================

-- View: Campaign stats summary
CREATE OR REPLACE VIEW campaign_stats_summary AS
SELECT 
    c.id,
    c.name,
    c.status,
    c.is_testing_mode,
    c.total_selected,
    c.total_with_phone,
    c.total_queued,
    c.total_sent,
    c.total_delivered,
    c.total_replied,
    c.total_converted,
    c.created_at,
    c.started_at,
    c.completed_at,
    -- Calculated rates
    CASE 
        WHEN c.total_sent > 0 THEN ROUND((c.total_delivered::numeric / c.total_sent) * 100, 1)
        ELSE 0 
    END as delivery_rate,
    CASE 
        WHEN c.total_delivered > 0 THEN ROUND((c.total_replied::numeric / c.total_delivered) * 100, 1)
        ELSE 0 
    END as reply_rate,
    CASE 
        WHEN c.total_replied > 0 THEN ROUND((c.total_converted::numeric / c.total_replied) * 100, 1)
        ELSE 0 
    END as conversion_rate
FROM public.campaigns c
ORDER BY c.created_at DESC;

-- View: Recent conversations with last message
CREATE OR REPLACE VIEW recent_conversations AS
SELECT 
    c.*,
    b.business_name as actual_business_name,
    b.phone_1 as business_phone
FROM public.conversations c
LEFT JOIN public.businesses b ON c.business_id = b.id
WHERE c.status = 'active'
ORDER BY c.last_message_at DESC;


-- ============================================================================
-- FUNCTIONS FOR CAMPAIGN OPERATIONS
-- ============================================================================

-- Function: Create messages for a campaign based on filters
CREATE OR REPLACE FUNCTION create_campaign_messages(p_campaign_id uuid)
RETURNS TABLE (
    created_count integer,
    businesses_with_phone integer,
    total_selected integer
) AS $$
DECLARE
    v_campaign_record record;
    v_created integer := 0;
    v_with_phone integer := 0;
    v_total integer := 0;
    v_limit integer;
BEGIN
    -- Get campaign details
    SELECT * INTO v_campaign_record 
    FROM public.campaigns 
    WHERE id = p_campaign_id;
    
    IF v_campaign_record IS NULL THEN
        RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
    END IF;
    
    -- Set limit based on testing mode
    v_limit := CASE WHEN v_campaign_record.is_testing_mode THEN 20 ELSE 10000 END;
    
    -- Count total matching businesses
    SELECT COUNT(*) INTO v_total
    FROM public.businesses b
    WHERE b.status = 'active'
        AND (v_campaign_record.governorate_filter IS NULL OR b.governorate = v_campaign_record.governorate_filter)
        AND (v_campaign_record.category_filter IS NULL OR b.category = v_campaign_record.category_filter);
    
    -- Count businesses with phone
    SELECT COUNT(*) INTO v_with_phone
    FROM public.businesses b
    WHERE b.status = 'active'
        AND (b.phone_1 IS NOT NULL OR b.whatsapp IS NOT NULL)
        AND (v_campaign_record.governorate_filter IS NULL OR b.governorate = v_campaign_record.governorate_filter)
        AND (v_campaign_record.category_filter IS NULL OR b.category = v_campaign_record.category_filter);
    
    -- Insert messages for businesses with phone numbers
    WITH inserted AS (
        INSERT INTO public.messages (
            campaign_id, 
            business_id, 
            message_text, 
            phone_number,
            status
        )
        SELECT 
            p_campaign_id,
            b.id,
            v_campaign_record.message_text,
            COALESCE(b.whatsapp, b.phone_1),
            'queued'
        FROM public.businesses b
        WHERE b.status = 'active'
            AND (b.phone_1 IS NOT NULL OR b.whatsapp IS NOT NULL)
            AND (v_campaign_record.governorate_filter IS NULL OR b.governorate = v_campaign_record.governorate_filter)
            AND (v_campaign_record.category_filter IS NULL OR b.category = v_campaign_record.category_filter)
        ORDER BY b.confidence_score DESC, b.created_at DESC
        LIMIT v_limit
        ON CONFLICT (campaign_id, business_id) DO NOTHING
        RETURNING id
    )
    SELECT COUNT(*) INTO v_created FROM inserted;
    
    -- Update campaign statistics
    UPDATE public.campaigns
    SET 
        total_selected = v_total,
        total_with_phone = v_with_phone,
        total_queued = v_created,
        status = CASE WHEN v_created > 0 THEN 'queued' ELSE 'completed' END,
        updated_at = now()
    WHERE id = p_campaign_id;
    
    RETURN QUERY SELECT v_created, v_with_phone, v_total;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table counts
SELECT 'campaigns' as table_name, COUNT(*) as count FROM public.campaigns
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM public.messages
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as count FROM public.conversations
UNION ALL
SELECT 'conversation_messages' as table_name, COUNT(*) as count FROM public.conversation_messages;

\echo '✅ Messaging System Schema Created Successfully!'
\echo ''
\echo 'Tables created:'
\echo '  - campaigns (marketing campaigns with filters)'
\echo '  - messages (queued messages for delivery)'
\echo '  - conversations (conversation threads)'
\echo '  - conversation_messages (individual conversation messages)'
\echo ''
\echo 'Views created:'
\echo '  - campaign_stats_summary (dashboard stats)'
\echo '  - recent_conversations (active conversations)'
\echo ''
\echo 'Functions created:'
\echo '  - create_campaign_messages(campaign_id) - creates queued messages'
