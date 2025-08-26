# 🔌 PANDUAN TEST KONEKSI SUPABASE

## 📋 OPSI 1: TEST DI LOCAL ENVIRONMENT

### 1️⃣ Setup Environment Variables
```bash
# 1. Copy template
cp .env.example .env.local

# 2. Edit .env.local dengan credentials Supabase Anda
```

### 2️⃣ Dapatkan Credentials dari Supabase Dashboard
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project ITM Trading Anda
3. Go to **Settings** > **API**
4. Copy values berikut:
   - **Project URL** → NEXT_PUBLIC_SUPABASE_URL
   - **anon/public key** → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - **service_role key** → SUPABASE_SERVICE_ROLE_KEY

### 3️⃣ Update .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
HF_TOKEN=hf_your_token_here
CRON_SECRET=your_random_secret
```

### 4️⃣ Jalankan Test
```bash
node test-supabase-connection.js
```

---

## 📋 OPSI 2: TEST DI PRODUCTION (VERCEL)

### 🌐 Production URL
```
https://nextjs-boilerplate-97x38klbe-infinity-trade-minerals-projects.vercel.app
```

### ✅ Environment Variables di Vercel (Sudah Dikonfigurasi)
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ HF_TOKEN
- ✅ CRON_SECRET

### 🔍 Test Langsung di Browser
1. Buka production URL
2. Test login/register functionality
3. Check dashboard untuk real-time data
4. Verify semua modules berfungsi

---

## 📋 OPSI 3: TEST DATABASE SCHEMA

### 🗃️ Verifikasi Tables di Supabase
Pastikan tables berikut ada di Supabase:

**Core Tables:**
- ✅ profiles
- ✅ roles
- ✅ commodities
- ✅ customers
- ✅ sales_orders
- ✅ shipments

**Enterprise Tables:**
- ✅ tasks
- ✅ workflows
- ✅ security_events
- ✅ currency_exchange_rates
- ✅ ai_predictions

### 📊 Quick Database Check
```sql
-- Run di Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 🚨 TROUBLESHOOTING

### ❌ "relation does not exist"
- Install database schema terlebih dahulu
- Check RLS (Row Level Security) policies

### ❌ "Invalid API key"
- Verify anon key dari Supabase dashboard
- Pastikan project URL benar

### ❌ "Connection refused" 
- Check internet connection
- Verify Supabase project status

---

## 🎯 NEXT STEPS SETELAH KONEKSI BERHASIL

1. **👤 Setup Admin User**
2. **📊 Populate Sample Data** 
3. **🔐 Test Authentication**
4. **📱 Test All Modules**
5. **🚀 Go Live!**

---

**💡 Tip: Gunakan Vercel production URL untuk test cepat tanpa setup local environment!**
