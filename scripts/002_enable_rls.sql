-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions (allow all operations for now - adjust based on your auth needs)
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions
    FOR ALL USING (true);

-- Create policies for page_views
CREATE POLICY "Allow all operations on page_views" ON page_views
    FOR ALL USING (true);
