# Installation Instructions

## Clean Installation for React 19 Compatibility

### 1. Clean existing node_modules and lock files
\`\`\`bash
rm -rf node_modules
rm package-lock.json
# or if using yarn
rm yarn.lock
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
# or with legacy peer deps if needed
npm install --legacy-peer-deps
\`\`\`

### 3. If you still get dependency conflicts, force install
\`\`\`bash
npm install --force
\`\`\`

### 4. Environment Variables
Create a `.env.local` file with:
\`\`\`env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Upstash Redis
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# SMTP Configuration
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM_NAME="Your App Name"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 5. Run the development server
\`\`\`bash
npm run dev
\`\`\`

## Troubleshooting

### If you get React 19 compatibility issues:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install --legacy-peer-deps`
3. If that doesn't work, try `npm install --force`

### If you get middleware errors:
1. Make sure Clerk environment variables are set
2. Check that the middleware.ts file is in the root directory
3. Restart the development server

### If you get fetch errors in dashboard:
1. Make sure you're signed in to Clerk
2. Check that the API routes are accessible
3. Check browser console for detailed errors
