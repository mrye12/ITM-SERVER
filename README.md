# 🏭 ITM Trading - Enterprise Mineral Trading System

[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-cyan)](https://tailwindcss.com/)

## 🎯 **Overview**

**ITM Trading** adalah sistem perdagangan mineral enterprise-grade yang dirancang khusus untuk perusahaan trading tambang di Indonesia. Sistem ini menangani seluruh workflow dari pembelian IUP hingga penjualan ke smelter dengan AI-powered insights dan real-time monitoring.

## ✨ **Key Features**

### 💼 **Core Trading Business**
- 🛒 **Purchase from IUP** - Pembelian langsung dari pemegang IUP
- 🏭 **Sales to Smelter** - Penjualan ke pabrik peleburan
- 📈 **Commodity Trading** - Trading komoditas umum
- 💼 **Sales Management** - Manajemen penjualan
- 📋 **Order Management** - Manajemen pesanan

### 🏗️ **Operations & Logistics**
- 📦 **Inventory Management** - Manajemen stok real-time
- 🚢 **Logistics & Shipping** - Tracking pengiriman
- ⛏️ **Mining Operations** - Operasi pertambangan
- 🔧 **Equipment Management** - Manajemen peralatan
- ⛽ **Fuel Operations** - Operasi bahan bakar

### 💰 **Finance & Compliance**
- 💰 **Financial Management** - Manajemen keuangan
- 🛡️ **AI Compliance** - Kepatuhan otomatis dengan AI
- 📊 **Analytics & Reports** - Analitik dan pelaporan

### 🤖 **AI-Powered Features**
- 🧠 **AI Learning Engine** - Pembelajaran otomatis dari data
- 📈 **Sales Forecasting** - Prediksi penjualan
- 💎 **Nickel Price Monitor** - Monitor harga nikel real-time
- 🔍 **Intelligent Insights** - Wawasan bisnis AI

### 🎛️ **Advanced Features**
- ⚡ **Real-time Updates** - Pembaruan real-time
- 🔐 **Role-based Access Control** - Kontrol akses berbasis peran
- 📱 **Responsive Design** - Desain responsif
- 🌐 **Multi-language Support** - Dukungan multi-bahasa
- 📊 **Custom Dashboards** - Dashboard yang dapat disesuaikan

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 15.5.0** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Hook Form** - Form management
- **Zod** - Schema validation

### **Backend**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Database security
- **Real-time subscriptions** - Live updates

### **AI & Analytics**
- **Hugging Face** - AI model integration
- **Custom AI Engine** - Machine learning
- **Recharts** - Data visualization
- **Web scraping** - External data sources

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm atau yarn
- Supabase account

### **Installation**

1. **Clone repository**
```bash
git clone https://github.com/mrye12/Server-ITM.git
cd Server-ITM/itm-trading
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp env-template.txt .env.local
```

Edit `.env.local` dengan konfigurasi Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HF_TOKEN=your_hugging_face_token
CRON_SECRET=your_cron_secret
```

4. **Setup database**
```bash
# Jalankan SQL files di Supabase SQL Editor:
# 1. enterprise-complete-schema-final.sql
# 2. custom-commodities-enhancement.sql
# 3. purchase-smelter-tables.sql
```

5. **Run development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📁 **Project Structure**

```
itm-trading/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (protected)/        # Protected routes
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── commodity-trading/
│   │   │   ├── hr/             # Human resources
│   │   │   ├── mining-ops/     # Mining operations
│   │   │   ├── purchase/       # Purchase from IUP
│   │   │   ├── smelter-sales/  # Sales to smelter
│   │   │   └── ...
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # UI components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── forms/              # Form components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   └── styles/                 # Global styles
├── custom-commodities-enhancement.sql
├── enterprise-complete-schema-final.sql
└── purchase-smelter-tables.sql
```

## 🎨 **UI Components**

### **Reusable Components**
- ✅ **DynamicDropdown** - Dropdown dengan custom input
- ✅ **DataTable** - Tabel data dengan sorting/filtering
- ✅ **StatusBadge** - Badge status dengan warna
- ✅ **LoadingSpinner** - Loading indicator
- ✅ **Modal** - Modal dialog
- ✅ **Toast** - Notifikasi toast

### **Business Components**
- ✅ **KPIWidget** - Widget KPI dashboard
- ✅ **RealtimeChart** - Chart real-time
- ✅ **NotificationCenter** - Pusat notifikasi
- ✅ **AILearningDashboard** - Dashboard AI learning
- ✅ **NickelPriceMonitor** - Monitor harga nikel

## 🛡️ **Security Features**

- 🔐 **Row Level Security (RLS)** - Database level security
- 👤 **Role-based Access Control** - Admin, Manager, Staff roles
- 🔒 **JWT Authentication** - Secure token-based auth
- 🛡️ **API Rate Limiting** - Protection against abuse
- 📊 **Audit Logging** - Complete audit trail

## 📊 **Database Schema**

### **Core Tables**
- `profiles` - User profiles and roles
- `commodities` - Commodity master data
- `user_commodities` - Custom user commodities
- `purchases` - Purchase transactions
- `sales` - Sales transactions
- `inventory` - Inventory tracking

### **AI & Analytics**
- `ai_learning_data` - AI training data
- `ai_predictions` - AI predictions
- `ai_cache` - AI response cache
- `system_analytics` - System analytics

## 🤖 **AI Features**

### **Learning Engine**
- **Pattern Recognition** - Deteksi pola dalam data trading
- **Predictive Analytics** - Prediksi trend harga dan volume
- **Recommendation System** - Rekomendasi trading otomatis
- **Anomaly Detection** - Deteksi anomali transaksi

### **External Integrations**
- **APNI Price Scraping** - Auto-update harga nikel
- **Hugging Face Models** - AI model integration
- **Real-time Analytics** - Analitik real-time

## 📈 **Performance**

- ⚡ **Server-side Rendering** - Fast initial load
- 🚀 **Static Generation** - Optimized performance
- 📱 **Progressive Web App** - Mobile-optimized
- 🔄 **Real-time Updates** - Live data synchronization

## 🌐 **Deployment**

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

### **Docker**
```bash
docker build -t itm-trading .
docker run -p 3000:3000 itm-trading
```

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- 📧 Email: support@itmtrading.com
- 💬 Issues: [GitHub Issues](https://github.com/mrye12/Server-ITM/issues)

## 🎯 **Roadmap**

- [ ] Mobile app (React Native)
- [ ] Advanced AI models
- [ ] Blockchain integration
- [ ] IoT sensor integration
- [ ] Multi-currency support

---

**Built with ❤️ for the Indonesian mining industry**

© 2024 ITM Trading. All rights reserved.
# Updated 08/26/2025 11:45:07
