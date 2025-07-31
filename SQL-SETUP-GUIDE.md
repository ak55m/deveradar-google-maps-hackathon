# 🗄️ SQL Setup Guide for DevRadar

## Step 1: Open Supabase SQL Editor

1. **Go to [Supabase](https://supabase.com)** and sign in
2. **Click on your project** (or create one if you haven't)
3. **In the left sidebar**, click **"SQL Editor"**
4. **Click "New query"** or the **"+" button**

## Step 2: Copy and Paste the SQL

Copy the entire content from `supabase-setup.sql` and paste it into the SQL Editor.

## Step 3: Run the SQL

1. **Click the "Run" button** (or press Ctrl+Enter)
2. **You should see success messages** and some data in the results

## Step 4: Verify Setup

After running the SQL, you should see:
- ✅ **Table created** with 6 columns
- ✅ **Sample data** (3 developers)
- ✅ **Indexes created** for performance

## Step 5: Get Your Credentials

1. **Go to Settings** → **API**
2. **Copy your Project URL** (looks like `https://abc123.supabase.co`)
3. **Copy your anon public key** (starts with `eyJ...`)

## Step 6: Update Your .env File

Create or update your `.env` file with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Step 7: Test Your App

1. **Restart your dev server**: `npm run dev`
2. **Open your app** at `http://localhost:5174`
3. **Check the top-right status** - should show "✅ Connected to Supabase"
4. **Try checking in** - it should work now!

## 🎯 What the SQL Does

- **Creates the `developers` table** with all necessary columns
- **Enables Row Level Security** (RLS) for security
- **Creates policies** to allow read/write operations
- **Adds indexes** for better performance
- **Inserts sample data** for testing
- **Verifies the setup** with queries

## 🚨 Troubleshooting

If you get errors:
- **Make sure you're in the right project**
- **Check that you have admin permissions**
- **Try running the SQL in smaller chunks**

The SQL script is designed to be safe to run multiple times (uses `IF NOT EXISTS`). 