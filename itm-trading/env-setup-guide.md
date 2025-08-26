# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Hugging Face Token (for AI features)
HF_TOKEN=your_hugging_face_token

# Cron Secret (for scheduled tasks)
CRON_SECRET=your_cron_secret_key
```

## How to Get These Values:

### 1. Supabase Values:
1. Go to your Supabase dashboard
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

### 2. Service Role Key:
1. In the same API settings page
2. Copy the service_role key (keep this secret!)

### 3. Hugging Face Token:
1. Sign up at https://huggingface.co
2. Go to Settings > Access Tokens
3. Create a new token

### 4. Cron Secret:
1. Generate a random secure string
2. Use this for Vercel cron job authentication

## Testing Connection:

After setting up `.env.local`, run:
```bash
node test-supabase.js
```
