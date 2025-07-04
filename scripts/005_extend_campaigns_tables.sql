-- Extend Email Campaigns Tables with missing features

-- Email credentials table for SMTP/API configurations
CREATE TABLE IF NOT EXISTS email_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alias_id UUID REFERENCES sender_aliases(id) ON DELETE CASCADE,
    credential_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('smtp', 'sendgrid', 'mailgun', 'ses', 'postmark')),
    
    -- SMTP Configuration
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT, -- Encrypted password
    smtp_use_tls BOOLEAN DEFAULT true,
    
    -- API Configuration (for services like SendGrid)
    api_key_encrypted TEXT, -- Encrypted API key
    api_endpoint VARCHAR(500),
    
    -- Configuration metadata
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(50) DEFAULT 'pending' CHECK (test_status IN ('pending', 'success', 'failed')),
    test_error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add cron scheduling to campaigns
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS cron_expression VARCHAR(100);
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0;

-- Add email template support
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    thumbnail_url VARCHAR(500),
    category VARCHAR(100) DEFAULT 'general',
    is_system BOOLEAN DEFAULT false,
    created_by VARCHAR(255), -- Clerk user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add A/B testing support
CREATE TABLE IF NOT EXISTS campaign_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- 'A', 'B', 'C', etc.
    subject_line VARCHAR(500),
    html_body TEXT,
    recipient_percentage INTEGER DEFAULT 50, -- Percentage of recipients for this variant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add delivery logs for better tracking
CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_id UUID REFERENCES campaign_emails(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    
    -- Delivery attempt details
    attempt_number INTEGER DEFAULT 1,
    delivery_status VARCHAR(50) NOT NULL CHECK (delivery_status IN ('queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'deferred')),
    
    -- Provider response
    provider_message_id VARCHAR(255),
    provider_response TEXT,
    smtp_response_code INTEGER,
    
    -- Error details
    error_type VARCHAR(100),
    error_message TEXT,
    retry_after TIMESTAMP WITH TIME ZONE,
    
    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add alias verification tokens
CREATE TABLE IF NOT EXISTS alias_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alias_id UUID REFERENCES sender_aliases(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_credentials_alias_id ON email_credentials(alias_id);
CREATE INDEX IF NOT EXISTS idx_email_credentials_provider ON email_credentials(provider_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_cron ON email_campaigns(cron_expression) WHERE cron_expression IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_next_run ON email_campaigns(next_run_at) WHERE next_run_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_variants_campaign_id ON campaign_variants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_email_id ON email_delivery_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON email_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON alias_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON alias_verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE email_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alias_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations for authenticated users" ON email_credentials FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON email_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON campaign_variants FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON email_delivery_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON alias_verification_tokens FOR ALL USING (true);
