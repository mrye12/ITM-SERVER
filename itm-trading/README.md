# ITM Trading - Website Internal

Website internal untuk perusahaan trading tambang (ITM) yang menggunakan Next.js dan Supabase.

## Setup Development

### Prerequisites
- Node.js 18+
- Akses ke Supabase project

### Installation

1. Clone repository dan install dependencies:
```bash
npm install
```

2. Setup environment variables:
- Copy `.env.local` yang sudah disediakan (dengan credentials Supabase)
- File `.env.local` sudah berisi semua konfigurasi yang diperlukan

3. Setup database di Supabase:
- Buka Supabase Console → SQL Editor
- Copy dan jalankan isi file `supabase-setup.sql`
- Buat storage bucket "documents" (public: false)

4. Jalankan development server:
```bash
npm run dev
```

5. Buka http://localhost:3000/login

## Fitur Tahap 1

### Autentikasi
- Login/logout menggunakan Supabase Auth
- Proteksi route dengan middleware
- Row Level Security (RLS) aktif

### Dashboard
- KPI overview
- User profile info
- Activity logs (placeholder untuk Tahap 2)

### Modul Core
- **Sales**: Manajemen data penjualan
- **Shipments**: Tracking pengiriman
- **Stock**: Inventory management
- **Invoices**: Pengelolaan invoice

## Arsitektur

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Database**: PostgreSQL dengan RLS
- **Authentication**: Supabase Auth dengan email/password

## Keamanan

- Environment variables terpisah untuk client dan server
- Service role key hanya digunakan di server-side
- Row Level Security aktif untuk semua tabel
- Tidak ada direct database connection dari browser

## Database Schema

Lihat file `supabase-setup.sql` untuk schema lengkap:
- `profiles` - Data profil user
- `sales` - Data penjualan
- `shipments` - Data pengiriman
- `stock` - Data inventori
- `invoices` - Data invoice
- `kpi_company_daily` - KPI harian perusahaan
- `audit_logs` - Log aktivitas (Tahap 2)

## Testing Checklist

- [ ] `.env.local` terpasang dengan benar
- [ ] `npm run dev` berjalan tanpa error
- [ ] Route `/login` bekerja (sign in via Supabase)
- [ ] Setelah login, protected layout render
- [ ] Tabel database sudah dibuat di Supabase
- [ ] RLS aktif dan policy terpasang
- [ ] Storage bucket "documents" dibuat
- [ ] Frontend tidak melakukan direct DB connection
- [ ] Service role key hanya dipakai di server

## Real-time Auto-Sync Feature ✨

**FITUR UNGGULAN**: Perubahan data di Cursor AI akan otomatis ter-update di Supabase secara real-time!

### Cara Kerja Auto-Sync:
1. **Real-time Subscriptions**: Menggunakan Supabase Realtime WebSocket
2. **Optimistic Updates**: UI update langsung tanpa delay
3. **Automatic Sync**: Data tersinkronisasi di semua browser tabs
4. **Live Dashboard**: KPI dan statistik update secara langsung

### Testing Auto-Sync:
1. Buka aplikasi di 2 browser tabs berbeda
2. Login di kedua tabs
3. Tambah data sales di tab pertama
4. Lihat data otomatis muncul di tab kedua tanpa refresh!

### Real-time Features:
- ✅ **Live Sales Updates**: Dashboard menampilkan total sales, revenue, dan activity secara real-time
- ✅ **Multi-tab Sync**: Perubahan data tersinkronisasi di semua browser tabs
- ✅ **Form Input**: Sales form dengan validation dan auto-submit
- ✅ **Live Status Indicators**: Green dots menunjukkan koneksi real-time aktif

## Tahap Selanjutnya

Tahap 2 akan mencakup:
- Form input untuk Shipments, Stock, dan Invoices  
- Audit logging dengan database triggers
- Grafik dan visualisasi data dengan Recharts
- Real-time notifications dengan toast messages
- Advanced filtering, search, dan export data