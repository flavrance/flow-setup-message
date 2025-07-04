-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all templates" ON email_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can create templates" ON email_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own templates" ON email_templates
    FOR UPDATE USING (created_by = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own templates" ON email_templates
    FOR DELETE USING (created_by = auth.jwt() ->> 'sub');

-- Insert some default templates
INSERT INTO email_templates (name, description, html_content, category, created_by) VALUES
(
    'Welcome Email',
    'A simple welcome email template',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Our Platform!</h1>
        </div>
        <div class="content">
            <h2>Hello and Welcome!</h2>
            <p>We''re excited to have you join our community. Here''s what you can expect:</p>
            <ul>
                <li>Access to exclusive content</li>
                <li>Regular updates and newsletters</li>
                <li>Special offers and promotions</li>
            </ul>
            <p style="text-align: center;">
                <a href="#" class="button">Get Started</a>
            </p>
        </div>
        <div class="footer">
            <p>Thank you for joining us!</p>
        </div>
    </div>
</body>
</html>',
    'welcome',
    'system'
),
(
    'Newsletter Template',
    'A clean newsletter template',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
        .article { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .article h2 { color: #4f46e5; margin-bottom: 10px; }
        .article img { max-width: 100%; height: auto; margin: 15px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Monthly Newsletter</h1>
            <p>Stay updated with our latest news and updates</p>
        </div>
        
        <div class="article">
            <h2>Article Title 1</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <a href="#" style="color: #4f46e5;">Read more →</a>
        </div>
        
        <div class="article">
            <h2>Article Title 2</h2>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <a href="#" style="color: #4f46e5;">Read more →</a>
        </div>
        
        <div class="footer">
            <p>You received this email because you subscribed to our newsletter.</p>
            <p><a href="#" style="color: #666;">Unsubscribe</a> | <a href="#" style="color: #666;">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>',
    'newsletter',
    'system'
),
(
    'Promotional Email',
    'A promotional email template with call-to-action',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Special Offer</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
        .hero h1 { margin: 0 0 10px 0; font-size: 32px; }
        .hero p { margin: 0; font-size: 18px; opacity: 0.9; }
        .offer { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0; }
        .offer h2 { color: #e74c3c; font-size: 36px; margin: 0 0 10px 0; }
        .button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .features { display: flex; justify-content: space-around; margin: 30px 0; }
        .feature { text-align: center; flex: 1; padding: 0 15px; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>🎉 Special Offer!</h1>
            <p>Limited time deal - Don''t miss out!</p>
        </div>
        
        <div class="offer">
            <h2>50% OFF</h2>
            <p>Get 50% off your first purchase</p>
            <p style="text-align: center;">
                <a href="#" class="button">Claim Your Discount</a>
            </p>
            <p style="font-size: 14px; color: #666;">*Offer expires in 48 hours</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <h3>Why Choose Us?</h3>
            <div class="features">
                <div class="feature">
                    <h4>✨ Quality</h4>
                    <p>Premium products</p>
                </div>
                <div class="feature">
                    <h4>🚚 Fast Shipping</h4>
                    <p>Free delivery</p>
                </div>
                <div class="feature">
                    <h4>💯 Guarantee</h4>
                    <p>Money back</p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This offer is exclusive to our subscribers.</p>
            <p><a href="#" style="color: #666;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>',
    'promotional',
    'system'
);
