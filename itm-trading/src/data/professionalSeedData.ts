// PROFESSIONAL SEED DATA untuk ITM Trading
// Edit file ini, lalu run: npm run sync
// Data akan otomatis ter-update ke Supabase

export interface CustomerSeed {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  country: string
  tax_id?: string
  payment_terms?: string
  credit_limit?: number
}

export interface SupplierSeed {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  country: string
  tax_id?: string
}

export interface ProductSeed {
  name: string
  description: string
  spec: string
  unit: string
  price_usd: number
  category: string
  hs_code?: string
}

export interface OfficeStockSeed {
  item_name: string
  description: string
  category: string
  quantity: number
  unit: string
  unit_price_usd: number
  location: string
  minimum_stock: number
}

// ===== CUSTOMERS DATA (EDIT DI SINI) =====
export const CUSTOMERS_SEED: CustomerSeed[] = [
  {
    name: 'Tsingshan Holdings China',
    contact_person: 'Li Wei Ming',
    email: 'liwei@tsingshan.com.cn',
    phone: '+86-571-8888-4004',
    address: 'Wenzhou Industrial Zone, Zhejiang Province',
    country: 'China',
    payment_terms: '60 days',
    credit_limit: 15000000
  },
  {
    name: 'Vale Indonesia Operations',
    contact_person: 'Sarah Chen',
    email: 'sarah.chen@vale.com',
    phone: '+62-21-5555-2002',
    address: 'Sorowako, Luwu Timur, Sulawesi Selatan',
    country: 'Indonesia',
    payment_terms: '45 days',
    credit_limit: 10000000
  },
  {
    name: 'Nornickel Trading Singapore',
    contact_person: 'Dmitri Volkov',
    email: 'dmitri.volkov@nornickel.com',
    phone: '+65-6666-5005',
    address: '1 Raffles Place, Singapore',
    country: 'Singapore',
    payment_terms: '30 days',
    credit_limit: 12000000
  },
  {
    name: 'PT. Sinar Mas Mining Indonesia',
    contact_person: 'Budi Santoso',
    email: 'budi.santoso@sinarmas.com',
    phone: '+62-21-5555-1001',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    country: 'Indonesia',
    payment_terms: '30 days',
    credit_limit: 5000000
  },
  {
    name: 'Antam Nickel Division',
    contact_person: 'Ahmad Rahman',
    email: 'ahmad.rahman@antam.com',
    phone: '+62-21-5555-3003',
    address: 'Jl. Letjen TB Simatupang, Jakarta Selatan',
    country: 'Indonesia',
    payment_terms: '30 days',
    credit_limit: 7500000
  }
]

// ===== SUPPLIERS DATA (EDIT DI SINI) =====
export const SUPPLIERS_SEED: SupplierSeed[] = [
  {
    name: 'CV. Tambang Mulia Sejahtera',
    contact_person: 'Hendro Wijaya',
    email: 'hendro@tambangmulia.co.id',
    phone: '+62-541-555-1001',
    address: 'Jl. Sungai Kunjang, Samarinda, Kalimantan Timur',
    country: 'Indonesia',
    tax_id: '11.111.111.1-111.000'
  },
  {
    name: 'PT. Konawe Mineral Resources',
    contact_person: 'Siti Marlina',
    email: 'siti@konawe.co.id',
    phone: '+62-401-555-2002',
    address: 'Pomalaa, Kolaka, Sulawesi Tenggara',
    country: 'Indonesia',
    tax_id: '22.222.222.2-222.000'
  },
  {
    name: 'PT. Borneo Coal Mining',
    contact_person: 'Joko Priyanto',
    email: 'joko@borneocoal.co.id',
    phone: '+62-541-555-3003',
    address: 'Tenggarong, Kutai Kartanegara, Kalimantan Timur',
    country: 'Indonesia',
    tax_id: '33.333.333.3-333.000'
  }
]

// ===== PRODUCTS DATA (EDIT DI SINI) =====
export const PRODUCTS_SEED: ProductSeed[] = [
  {
    name: 'Nickel Ore Limonite',
    description: 'High quality nickel ore from Sulawesi',
    spec: 'Ni: 1.8-2.2%, Fe: 15-25%, SiO2: 35-45%, Moisture: 25-35%',
    unit: 'WMT',
    price_usd: 45.50,
    category: 'Nickel Ore',
    hs_code: '2604.00.00'
  },
  {
    name: 'Nickel Ore Saprolite',
    description: 'Premium saprolite nickel ore',
    spec: 'Ni: 2.5-3.0%, Fe: 8-15%, SiO2: 25-35%, Moisture: 15-25%',
    unit: 'WMT',
    price_usd: 65.75,
    category: 'Nickel Ore',
    hs_code: '2604.00.00'
  },
  {
    name: 'Iron Ore Fines',
    description: 'High grade iron ore fines',
    spec: 'Fe: 62-65%, SiO2: 3-5%, Al2O3: 1-3%, Moisture: 8-10%',
    unit: 'DMT',
    price_usd: 95.25,
    category: 'Iron Ore',
    hs_code: '2601.11.00'
  },
  {
    name: 'Coal Bituminous',
    description: 'Low sulfur bituminous coal',
    spec: 'CV: 6200-6500 kcal/kg, TM: 35%, Sulfur: 0.6%, Ash: 8%',
    unit: 'MT',
    price_usd: 85.40,
    category: 'Coal',
    hs_code: '2701.12.00'
  },
  {
    name: 'Bauxite Ore',
    description: 'Premium grade bauxite ore',
    spec: 'Al2O3: 50-55%, SiO2: 2-5%, Fe2O3: 15-20%, Moisture: 12%',
    unit: 'WMT',
    price_usd: 55.80,
    category: 'Bauxite',
    hs_code: '2606.00.00'
  }
]

// ===== OFFICE STOCK DATA (EDIT DI SINI) =====
export const OFFICE_STOCK_SEED: OfficeStockSeed[] = [
  {
    item_name: 'HP LaserJet Printer',
    description: 'HP LaserJet Pro M404dn',
    category: 'Electronics',
    quantity: 5,
    unit: 'pcs',
    unit_price_usd: 250.00,
    location: 'IT Storage Room',
    minimum_stock: 2
  },
  {
    item_name: 'Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    category: 'Furniture',
    quantity: 25,
    unit: 'pcs',
    unit_price_usd: 180.00,
    location: 'Furniture Warehouse',
    minimum_stock: 5
  },
  {
    item_name: 'Paper A4',
    description: 'Premium copy paper 80gsm',
    category: 'Stationery',
    quantity: 100,
    unit: 'ream',
    unit_price_usd: 4.50,
    location: 'Supply Cabinet',
    minimum_stock: 20
  },
  {
    item_name: 'Laptop Dell',
    description: 'Dell Latitude 5520 i7 16GB 512GB SSD',
    category: 'Electronics',
    quantity: 8,
    unit: 'pcs',
    unit_price_usd: 1200.00,
    location: 'IT Storage Room',
    minimum_stock: 3
  },
  {
    item_name: 'Wireless Mouse',
    description: 'Logitech MX Master 3',
    category: 'Electronics',
    quantity: 15,
    unit: 'pcs',
    unit_price_usd: 65.00,
    location: 'IT Storage Room',
    minimum_stock: 5
  }
]