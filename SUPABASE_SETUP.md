# 🚀 Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project name**: `cryptointel-pro`
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you (e.g., Europe West)
4. Click "Create new project" (takes ~2 minutes)

---

## Step 2: Get API Credentials

1. In your Supabase project, go to **Project Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (DO NOT SHARE!)
```

---

## Step 3: Configure Environment Variables

Create/update `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: AI API Keys (for real AI analysis)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
```

**⚠️ Important**: Add `.env.local` to `.gitignore` (already done)

---

## Step 4: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

### Option B: Using SQL Editor (Manual)

1. Go to **SQL Editor** in Supabase Dashboard
2. Run these migrations in order:

#### 1. Initial Schema
Copy content from `supabase/migrations/20240101000000_initial_schema.sql`
→ Paste→ Run

#### 2. Learning System
Copy content from `supabase/migrations/20240102000000_learning_system.sql`
→ Paste → Run

---

## Step 5: Verify Installation

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- `activity_logs`
- `ai_analyses`
- `ai_costs`
- **`ai_model_learning`** ✅ (NEW)
- **`analysis_sessions`** ✅ (NEW)
- **`learning_insights`** ✅ (NEW)
- **`market_patterns`** ✅ (NEW)
- `performance_tracking`
- `portfolios`
- `profiles`
- `trading_signals`
- `trades`
- `user_settings`

---

## Step 6: Setup Row Level Security (RLS)

RLS is **already configured** in the migrations. Verify:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

You should see policies like:
- `Users view own sessions`
- `Users insert own sessions`
- `Users manage own learning`
- etc.

---

## Step 7: Test the Connection

### In your app:

1. **Restart dev server**:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

2. **Open browser**: http://localhost:3000

3. **Check console** for:
```
✅ Supabase client initialized
📚 Learning Session Saved to DB: BTC/EUR - STRONG_BUY LONG
```

### Test Manual Query:

Create `test-supabase.ts`:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/client'

async function test() {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from('profiles').select('count')
    
    if (error) {
        console.error('❌ Supab ase connection failed:', error)
    } else {
        console.log('✅ Supabase connected!', data)
    }
}

test()
```

Run: `npx tsx test-supabase.ts`

---

## Step 8: Enable Realtime (Optional)

For live updates of trades/sessions:

1. Go to **Database** → **Replication**
2. Enable for these tables:
   - `trades`
   - `analysis_sessions`
   - `trading_signals`

---

## Common Issues & Fixes

### 1. "Invalid API Key"
- Check `.env.local` variables
- Restart dev server
- Verify keys in Supabase Dashboard → Settings → API

### 2. "Row-level security policy violation"
- Make sure you're logged in (auth.uid() returns value)
- Temporarily disable RLS for testing:
  ```sql
  ALTER TABLE analysis_sessions DISABLE ROW LEVEL SECURITY;
  ```

### 3. "relation does not exist"
- Migrations not run
- Go back to Step 4

### 4. "Failed to save analysis session"
- Check browser console for errors
- Verify column names match schema
- Check Supabase Logs: Dashboard → Logs

---

## Production Checklist

Before deploying:

- [ ] Environment variables set on Vercel/hosting
- [ ] Supabase project in production mode
- [ ] RLS policies reviewed and tested
- [ ] Database backups enabled (Supabase → Settings → Database)
- [ ] Rate limiting configured
- [ ] API keys rotated and secured

---

## Useful SQL Queries

### Check Learning Data
```sql
SELECT 
    symbol,
    signal_strength,
    signal_direction,
    consensus_confidence,
    actual_outcome,
    actual_pnl_percent,
    timestamp
FROM analysis_sessions
ORDER BY timestamp DESC
LIMIT 10;
```

### Model Performance
```sql
SELECT 
    model_name,
    symbol,
    accuracy,
    total_predictions,
    correct_predictions
FROM ai_model_learning
ORDER BY accuracy DESC;
```

### Export Training Data
```sql
SELECT 
    technical_data,
    macro_data,
    news_data,
    consensus_sentiment,
    actual_outcome
FROM analysis_sessions
WHERE actual_outcome IS NOT NULL;
```

---

## Next Steps

Once Supabase is connected:

1. **Test paper trading** with live data persistence
2. **Review learning dashboard**: http://localhost:3000/learning
3. **Export training data** and analyze patterns
4. **Set up alerts** (Supabase Functions) for high-confidence signals
5. **Add authentication** so users have personal portfolios

---

**🎉 Supabase is now your AI Trading Brain's permanent memory!**
