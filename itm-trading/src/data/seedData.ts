// File ini untuk manage data yang bisa diedit dan auto-sync ke Supabase
export interface UserSeed {
  email: string
  password: string
  full_name: string
  role: 'superadmin' | 'admin' | 'staff'
}

export interface SalesData {
  customer_name: string
  product: string
  quantity: number
  price: number
}

export interface StockData {
  item_name: string
  quantity: number
}

export interface ShipmentData {
  tracking_number: string
  status: 'pending' | 'shipped' | 'delivered'
}

// ===== USER DATA =====
// Edit data user di sini, akan auto-sync ke Supabase
// AUTO-SYNC dengan master-sync.js - edit file ini akan otomatis update database
export const USERS_SEED: UserSeed[] = [
  {
    email: 'ilhamyahyaaji@infinitytrademineral.id',
    password: '@Bcdefg23',
    full_name: 'Ilham Yahya Aji',
    role: 'superadmin'
  },
  {
    email: 'admin@infinitytrademineral.id',
    password: 'admin123',
    full_name: 'Admin ITM',
    role: 'admin'
  },
  {
    email: 'mining@infinitytrademineral.id',
    password: 'mining123',
    full_name: 'Manager Mining',
    role: 'staff'
  },
  {
    email: 'trading@infinitytrademineral.id',
    password: 'trading123',
    full_name: 'Manager Trading',
    role: 'staff'
  },
  {
    email: 'logistics@infinitytrademineral.id',
    password: 'logistics123',
    full_name: 'Manager Logistics',
    role: 'staff'
  },
  {
    email: 'finance@infinitytrademineral.id',
    password: 'finance123',
    full_name: 'Finance Manager',
    role: 'staff'
  }
]

// ===== SALES DATA =====
// Edit data sales di sini, akan auto-sync ke Supabase
export const SALES_SEED: SalesData[] = [
  {
    customer_name: 'PT. Sinar Mas Mining',
    product: 'Coal Bituminous',
    quantity: 1000,
    price: 150.50
  },
  {
    customer_name: 'PT. Antam Tbk',
    product: 'Iron Ore',
    quantity: 2500,
    price: 89.75
  },
  {
    customer_name: 'PT. Vale Indonesia',
    product: 'Nickel Ore',
    quantity: 1800,
    price: 245.30
  },
  {
    customer_name: 'PT. Freeport Indonesia',
    product: 'Copper Concentrate',
    quantity: 850,
    price: 320.80
  },
  {
    customer_name: 'PT. Bukit Asam',
    product: 'Coal Sub-bituminous',
    quantity: 3200,
    price: 125.90
  },
  {
    customer_name: 'PT. Timah Tbk',
    product: 'Tin Ore',
    quantity: 450,
    price: 520.75
  },
  {
    customer_name: 'PT. Aneka Tambang Unit Geomin',
    product: 'Gold Ore',
    quantity: 25,
    price: 1850.00
  },
  {
    customer_name: 'PT. Krakatau Steel',
    product: 'Iron Pellets',
    quantity: 1200,
    price: 95.40
  }
]

// ===== STOCK DATA =====
// Edit data stock di sini, akan auto-sync ke Supabase
export const STOCK_SEED: StockData[] = [
  { item_name: 'Coal Bituminous', quantity: 50000 },
  { item_name: 'Coal Sub-bituminous', quantity: 75000 },
  { item_name: 'Iron Ore', quantity: 80000 },
  { item_name: 'Iron Pellets', quantity: 25000 },
  { item_name: 'Nickel Ore', quantity: 30000 },
  { item_name: 'Copper Concentrate', quantity: 15000 },
  { item_name: 'Tin Ore', quantity: 8000 },
  { item_name: 'Gold Ore', quantity: 500 },
  { item_name: 'Silver Ore', quantity: 1200 },
  { item_name: 'Bauxite', quantity: 45000 }
]

// ===== SHIPMENT DATA =====
// Edit data shipment di sini, akan auto-sync ke Supabase
export const SHIPMENT_SEED: ShipmentData[] = [
  { tracking_number: 'ITM-2025-001', status: 'delivered' },
  { tracking_number: 'ITM-2025-002', status: 'shipped' },
  { tracking_number: 'ITM-2025-003', status: 'pending' },
  { tracking_number: 'ITM-2025-004', status: 'shipped' },
  { tracking_number: 'ITM-2025-005', status: 'pending' }
]

// ===== COMPANY KPI DATA =====
// Edit KPI data di sini, akan auto-sync ke Supabase
export const KPI_SEED = [
  {
    date: '2025-01-20',
    realized_volume: 15500.75,
    revenue_usd: 2850000.50,
    margin_usd: 485000.25
  },
  {
    date: '2025-01-21',
    realized_volume: 18200.30,
    revenue_usd: 3250000.80,
    margin_usd: 520000.40
  },
  {
    date: '2025-01-22',
    realized_volume: 16800.90,
    revenue_usd: 2950000.75,
    margin_usd: 465000.60
  },
  {
    date: '2025-01-23',
    realized_volume: 21500.45,
    revenue_usd: 3850000.90,
    margin_usd: 620000.85
  },
  {
    date: '2025-01-24',
    realized_volume: 19750.80,
    revenue_usd: 3650000.40,
    margin_usd: 595000.75
  }
]

// ===== UTILITY FUNCTIONS =====
export function addNewUser(user: UserSeed) {
  USERS_SEED.push(user)
  console.log('✅ User added to seed data:', user.email)
}

export function addNewSale(sale: SalesData) {
  SALES_SEED.push(sale)
  console.log('✅ Sale added to seed data:', sale.customer_name)
}

export function updateStock(itemName: string, newQuantity: number) {
  const item = STOCK_SEED.find(s => s.item_name === itemName)
  if (item) {
    item.quantity = newQuantity
    console.log('✅ Stock updated:', itemName, newQuantity)
  } else {
    STOCK_SEED.push({ item_name: itemName, quantity: newQuantity })
    console.log('✅ New stock item added:', itemName, newQuantity)
  }
}
