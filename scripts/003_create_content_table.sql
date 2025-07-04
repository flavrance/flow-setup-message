-- Create protected_content table
CREATE TABLE IF NOT EXISTS protected_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uuid TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Protected Content',
    content_html TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create content_views table to track who viewed what content
CREATE TABLE IF NOT EXISTS content_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_uuid TEXT NOT NULL,
    user_session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    email TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    access_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_protected_content_uuid ON protected_content(uuid);
CREATE INDEX IF NOT EXISTS idx_protected_content_active ON protected_content(is_active);
CREATE INDEX IF NOT EXISTS idx_protected_content_expires_at ON protected_content(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_views_content_uuid ON content_views(content_uuid);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at ON content_views(viewed_at);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_protected_content_updated_at ON protected_content;
CREATE TRIGGER update_protected_content_updated_at
    BEFORE UPDATE ON protected_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample content
INSERT INTO protected_content (uuid, title, content_html) VALUES 
(
    'sample-doc-001',
    'Confidential Financial Report',
    '
    <div class="space-y-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-red-600 font-semibold">🔒 CLASSIFIED DOCUMENT</span>
            </div>
            <p class="text-red-700 text-sm">
                This document contains sensitive financial information. Unauthorized disclosure is strictly prohibited.
            </p>
        </div>

        <div class="bg-white p-6 rounded-lg border shadow-sm">
            <h2 class="text-2xl font-bold mb-4 text-gray-900">Q4 Financial Summary</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-900">Revenue</h3>
                    <p class="text-2xl font-bold text-blue-700">$2.4M</p>
                    <p class="text-sm text-blue-600">+15% YoY</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-green-900">Profit</h3>
                    <p class="text-2xl font-bold text-green-700">$480K</p>
                    <p class="text-sm text-green-600">+22% YoY</p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-purple-900">Growth</h3>
                    <p class="text-2xl font-bold text-purple-700">18%</p>
                    <p class="text-sm text-purple-600">Above target</p>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-xl font-semibold">Key Highlights</h3>
                <ul class="list-disc pl-6 space-y-2">
                    <li>Successfully launched new product line generating $300K in Q4</li>
                    <li>Reduced operational costs by 8% through process optimization</li>
                    <li>Expanded to 3 new markets with strong initial performance</li>
                    <li>Customer retention rate improved to 94%</li>
                </ul>
            </div>

            <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 class="font-semibold text-yellow-800">Strategic Initiatives for Q1</h4>
                <p class="text-yellow-700 text-sm mt-1">
                    Focus on digital transformation and market expansion to achieve 25% growth target.
                </p>
            </div>
        </div>
    </div>
    '
),
(
    'tech-specs-002',
    'Technical Architecture Document',
    '
    <div class="space-y-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-blue-600 font-semibold">🔧 TECHNICAL SPECIFICATION</span>
            </div>
            <p class="text-blue-700 text-sm">
                Internal system architecture documentation. For authorized technical personnel only.
            </p>
        </div>

        <div class="bg-white p-6 rounded-lg border shadow-sm">
            <h2 class="text-2xl font-bold mb-4 text-gray-900">System Architecture Overview</h2>
            
            <div class="space-y-6">
                <div>
                    <h3 class="text-xl font-semibold mb-3">Core Components</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="border rounded-lg p-4">
                            <h4 class="font-semibold text-gray-900">Frontend Layer</h4>
                            <ul class="text-sm text-gray-600 mt-2 space-y-1">
                                <li>• Next.js 14 with App Router</li>
                                <li>• TypeScript for type safety</li>
                                <li>• Tailwind CSS for styling</li>
                                <li>• React Server Components</li>
                            </ul>
                        </div>
                        <div class="border rounded-lg p-4">
                            <h4 class="font-semibold text-gray-900">Backend Services</h4>
                            <ul class="text-sm text-gray-600 mt-2 space-y-1">
                                <li>• API Routes with rate limiting</li>
                                <li>• Redis for session management</li>
                                <li>• Supabase for data persistence</li>
                                <li>• SMTP email integration</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-3">Security Features</h3>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <ul class="space-y-2 text-sm">
                            <li class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                Multi-layer rate limiting (IP, email, session)
                            </li>
                            <li class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                Time-based verification codes with Redis TTL
                            </li>
                            <li class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                Content protection with DOM manipulation prevention
                            </li>
                            <li class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                Comprehensive audit logging in Supabase
                            </li>
                        </ul>
                    </div>
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-3">Performance Metrics</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-3 bg-green-50 rounded">
                            <div class="text-2xl font-bold text-green-700">99.9%</div>
                            <div class="text-sm text-green-600">Uptime</div>
                        </div>
                        <div class="text-center p-3 bg-blue-50 rounded">
                            <div class="text-2xl font-bold text-blue-700">&lt;200ms</div>
                            <div class="text-sm text-blue-600">Response Time</div>
                        </div>
                        <div class="text-center p-3 bg-purple-50 rounded">
                            <div class="text-2xl font-bold text-purple-700">10K+</div>
                            <div class="text-sm text-purple-600">Daily Requests</div>
                        </div>
                        <div class="text-center p-3 bg-orange-50 rounded">
                            <div class="text-2xl font-bold text-orange-700">0</div>
                            <div class="text-sm text-orange-600">Security Incidents</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    '
);
