-- Email Campaigns Tables

-- Sender aliases table
CREATE TABLE IF NOT EXISTS sender_aliases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    real_email VARCHAR(255) NOT NULL,
    alias_email VARCHAR(255) NOT NULL UNIQUE,
    alias_name VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    from_alias_id UUID REFERENCES sender_aliases(id),
    html_body TEXT NOT NULL,
    recipients TEXT[], -- Array of email addresses
    recipient_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255), -- Clerk user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Analytics fields
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0
);

-- Individual email sends table
CREATE TABLE IF NOT EXISTS campaign_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    
    -- Tracking IDs
    tracking_id UUID DEFAULT gen_random_uuid() UNIQUE,
    
    -- Status and timestamps
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement tracking
    opened_at TIMESTAMP WITH TIME ZONE,
    first_opened_at TIMESTAMP WITH TIME ZONE,
    open_count INTEGER DEFAULT 0,
    last_opened_at TIMESTAMP WITH TIME ZONE,
    
    -- Click tracking
    clicked_at TIMESTAMP WITH TIME ZONE,
    first_clicked_at TIMESTAMP WITH TIME ZONE,
    click_count INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Reading engagement
    reading_time_seconds INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    bounce_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email opens tracking table (for detailed analytics)
CREATE TABLE IF NOT EXISTS email_opens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email_id UUID REFERENCES campaign_emails(id) ON DELETE CASCADE,
    tracking_id UUID NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    
    -- Tracking details
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Reading engagement
    reading_time_seconds INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email clicks tracking table
CREATE TABLE IF NOT EXISTS email_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email_id UUID REFERENCES campaign_emails(id) ON DELETE CASCADE,
    tracking_id UUID NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    
    -- Click details
    clicked_url TEXT NOT NULL,
    original_url TEXT NOT NULL,
    link_text TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Tracking details
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON email_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_tracking_id ON campaign_emails(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_status ON campaign_emails(status);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_recipient ON campaign_emails(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_opens_campaign_id ON email_opens(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_opens_tracking_id ON email_opens(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_opens_opened_at ON email_opens(opened_at);

CREATE INDEX IF NOT EXISTS idx_email_clicks_campaign_id ON email_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_clicks_tracking_id ON email_clicks(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_clicks_clicked_at ON email_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_email_clicks_url ON email_clicks(clicked_url);

-- Enable RLS
ALTER TABLE sender_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users - adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON sender_aliases FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON email_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON campaign_emails FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON email_opens FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON email_clicks FOR ALL USING (true);
