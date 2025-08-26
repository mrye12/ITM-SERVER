#!/usr/bin/env node

/**
 * TAHAP 4: DASHBOARD INTERNAL ITM - AUTO SETUP
 * 
 * Script otomatis untuk setup:
 * - Fuel Management Tables & Data
 * - Enhanced Shipment Tables
 * - Equipment Management Tables & Data  
 * - Finance & Expense Tables & Data
 * - Sample data untuk testing
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ========================================
// TAHAP 4 SAMPLE DATA
// ========================================

const FUEL_ENTRIES_DATA = [
  {
    date: '2025-01-15',
    vendor: 'Pertamina',
    volume: 1500.00,
    price_per_liter: 15000.00,
    equipment_id: 'EXC-001',
    notes: 'Fuel untuk excavator utama'
  },
  {
    date: '2025-01-14',
    vendor: 'Shell Indonesia',
    volume: 2000.00,
    price_per_liter: 15200.00,
    equipment_id: 'TRUCK-001',
    notes: 'Fuel untuk dump truck mining'
  },
  {
    date: '2025-01-13',
    vendor: 'BP Indonesia',
    volume: 800.00,
    price_per_liter: 14800.00,
    equipment_id: 'GEN-001',
    notes: 'Fuel untuk generator camp'
  },
  {
    date: '2025-01-12',
    vendor: 'Total Energies',
    volume: 1200.00,
    price_per_liter: 15100.00,
    equipment_id: 'DRILL-001',
    notes: 'Fuel untuk drilling equipment'
  },
  {
    date: '2025-01-11',
    vendor: 'Pertamina',
    volume: 1800.00,
    price_per_liter: 14900.00,
    equipment_id: 'LOAD-001',
    notes: 'Fuel untuk wheel loader'
  }
]

const EQUIPMENT_DATA = [
  {
    name: 'Caterpillar 390F Excavator',
    category: 'Heavy Machinery',
    model: 'CAT 390F',
    serial_number: 'CAT390F2024001',
    purchase_date: '2024-03-15',
    purchase_cost: 2500000000.00,
    status: 'active',
    location: 'Site A - Mining Area',
    last_maintenance: '2025-01-01',
    next_maintenance: '2025-02-01',
    notes: 'Primary excavator untuk nickel mining'
  },
  {
    name: 'Komatsu HD785 Dump Truck',
    category: 'Transportation',
    model: 'HD785-8',
    serial_number: 'KOM785HD2024002',
    purchase_date: '2024-04-20',
    purchase_cost: 3200000000.00,
    status: 'active',
    location: 'Site A - Hauling Road',
    last_maintenance: '2024-12-15',
    next_maintenance: '2025-01-25',
    notes: 'Main hauling truck 90-ton capacity'
  },
  {
    name: 'Sandvik DR460i Drill Rig',
    category: 'Mining Equipment',
    model: 'DR460i',
    serial_number: 'SDV460I2024003',
    purchase_date: '2024-05-10',
    purchase_cost: 4500000000.00,
    status: 'maintenance',
    location: 'Workshop - Maintenance Bay 2',
    last_maintenance: '2025-01-10',
    next_maintenance: '2025-01-20',
    notes: 'Surface drilling rig - scheduled maintenance'
  },
  {
    name: 'Caterpillar 980M Wheel Loader',
    category: 'Heavy Machinery',
    model: '980M',
    serial_number: 'CAT980M2024004',
    purchase_date: '2024-06-05',
    purchase_cost: 1800000000.00,
    status: 'active',
    location: 'Site B - Loading Area',
    last_maintenance: '2024-12-20',
    next_maintenance: '2025-01-30',
    notes: 'Material handling and loading operations'
  },
  {
    name: 'Cummins QSK78 Generator',
    category: 'Power Tools',
    model: 'QSK78-G9',
    serial_number: 'CUM78G2024005',
    purchase_date: '2024-07-12',
    purchase_cost: 850000000.00,
    status: 'active',
    location: 'Power House - Main Campus',
    last_maintenance: '2024-12-01',
    next_maintenance: '2025-02-15',
    notes: 'Backup power generator 2500kW'
  },
  {
    name: 'Volvo A60H Articulated Hauler',
    category: 'Transportation',
    model: 'A60H',
    serial_number: 'VOL60H2024006',
    purchase_date: '2024-08-18',
    purchase_cost: 2100000000.00,
    status: 'broken',
    location: 'Workshop - Repair Bay 1',
    last_maintenance: '2024-11-15',
    next_maintenance: '2025-01-18',
    notes: 'Transmission failure - under repair'
  }
]

const EXPENSES_DATA = [
  {
    date: '2025-01-15',
    category: 'fuel',
    subcategory: 'Diesel',
    description: 'Pembelian solar untuk operasional mining',
    amount: 22500000.00,
    payment_method: 'Bank Transfer',
    vendor: 'Pertamina',
    receipt_number: 'PTM-2025-0115-001',
    status: 'paid',
    notes: 'Fuel untuk excavator dan dump truck'
  },
  {
    date: '2025-01-14',
    category: 'equipment',
    subcategory: 'Maintenance',
    description: 'Service rutin Caterpillar 390F',
    amount: 45000000.00,
    payment_method: 'Bank Transfer',
    vendor: 'PT Trakindo Utama',
    receipt_number: 'TRK-2025-0114-002',
    status: 'approved',
    notes: 'Ganti oli, filter, dan spare parts'
  },
  {
    date: '2025-01-13',
    category: 'operational',
    subcategory: 'Office Supplies',
    description: 'Pembelian alat tulis kantor',
    amount: 2500000.00,
    payment_method: 'Cash',
    vendor: 'Gramedia Business',
    receipt_number: 'GRM-2025-0113-003',
    status: 'paid',
    notes: 'Kertas, tinta printer, alat tulis'
  },
  {
    date: '2025-01-12',
    category: 'hr',
    subcategory: 'Training',
    description: 'Pelatihan K3 untuk karyawan baru',
    amount: 15000000.00,
    payment_method: 'Bank Transfer',
    vendor: 'PT Safety Training Indonesia',
    receipt_number: 'STI-2025-0112-004',
    status: 'pending',
    notes: 'Training untuk 20 karyawan baru'
  },
  {
    date: '2025-01-11',
    category: 'shipment',
    subcategory: 'Freight',
    description: 'Biaya pengiriman nickel ore ke China',
    amount: 180000000.00,
    payment_method: 'Bank Transfer',
    vendor: 'Evergreen Shipping',
    receipt_number: 'EVG-2025-0111-005',
    status: 'approved',
    notes: 'Shipping 5000 MT nickel ore'
  },
  {
    date: '2025-01-10',
    category: 'legal',
    subcategory: 'Permits',
    description: 'Perpanjangan izin lingkungan',
    amount: 25000000.00,
    payment_method: 'Bank Transfer',
    vendor: 'Kementerian Lingkungan Hidup',
    receipt_number: 'KLH-2025-0110-006',
    status: 'paid',
    notes: 'Environmental permit renewal'
  }
]

const ENHANCED_SHIPMENTS_DATA = [
  {
    vessel: 'MV Pacific Nickel',
    cargo_type: 'Nikel Ore',
    quantity: 15000.00,
    unit: 'MT',
    origin_port: 'Kendari, Indonesia',
    destination_port: 'Qingdao, China',
    departure_date: '2025-01-20',
    arrival_date: null,
    status: 'booked',
    tracking_number: 'ITM20250115001',
    notes: 'High grade nickel ore 1.8% Ni content'
  },
  {
    vessel: 'MV Asian Trader',
    cargo_type: 'Iron Ore',
    quantity: 25000.00,
    unit: 'MT',
    origin_port: 'Balikpapan, Indonesia',
    destination_port: 'Shanghai, China',
    departure_date: '2025-01-18',
    arrival_date: null,
    status: 'loading',
    tracking_number: 'ITM20250114002',
    notes: 'Iron ore pellets 65% Fe content'
  },
  {
    vessel: 'MV Mineral Express',
    cargo_type: 'Coal',
    quantity: 50000.00,
    unit: 'MT',
    origin_port: 'Samarinda, Indonesia',
    destination_port: 'Mumbai, India',
    departure_date: '2025-01-15',
    arrival_date: null,
    status: 'on_shipment',
    tracking_number: 'ITM20250112003',
    notes: 'Steam coal 6300 kcal/kg'
  },
  {
    vessel: 'MV Golden Cargo',
    cargo_type: 'Bauxite',
    quantity: 30000.00,
    unit: 'MT',
    origin_port: 'Pontianak, Indonesia',
    destination_port: 'Guangzhou, China',
    departure_date: '2025-01-10',
    arrival_date: '2025-01-22',
    status: 'arrived',
    tracking_number: 'ITM20250110004',
    notes: 'High quality bauxite for aluminium production'
  }
]

// ========================================
// MAIN EXECUTION
// ========================================

async function createTables() {
  console.log('🚀 Creating TAHAP 4 tables...')

  // Read and execute the SQL schema
  const fs = require('fs')
  const path = require('path')
  
  const schemaPath = path.join(__dirname, '..', 'tahap4-schema.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: schemaSql })
    
    if (error) {
      console.error('❌ Error executing schema:', error)
      return false
    }
    
    console.log('✅ TAHAP 4 tables created successfully!')
    return true
  } catch (err) {
    console.error('❌ Schema execution failed:', err.message)
    return false
  }
}

async function seedFuelEntries() {
  console.log('⛽ Seeding fuel entries...')
  
  // Get admin user for created_by
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No user profiles found, skipping fuel entries')
    return
  }
  
  const adminUserId = profiles[0].id
  
  const fuelData = FUEL_ENTRIES_DATA.map(entry => ({
    ...entry,
    created_by: adminUserId
  }))
  
  const { error } = await supabase
    .from('fuel_entries')
    .insert(fuelData)
  
  if (error) {
    console.error('❌ Fuel entries error:', error)
  } else {
    console.log(`✅ Inserted ${fuelData.length} fuel entries`)
  }
}

async function seedEquipment() {
  console.log('🔧 Seeding equipment...')
  
  // Get admin user for created_by
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No user profiles found, skipping equipment')
    return
  }
  
  const adminUserId = profiles[0].id
  
  const equipmentData = EQUIPMENT_DATA.map(equipment => ({
    ...equipment,
    created_by: adminUserId
  }))
  
  const { error } = await supabase
    .from('equipments')
    .insert(equipmentData)
  
  if (error) {
    console.error('❌ Equipment error:', error)
  } else {
    console.log(`✅ Inserted ${equipmentData.length} equipment records`)
  }
}

async function seedExpenses() {
  console.log('💰 Seeding expenses...')
  
  // Get admin user for created_by
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No user profiles found, skipping expenses')
    return
  }
  
  const adminUserId = profiles[0].id
  
  const expenseData = EXPENSES_DATA.map(expense => ({
    ...expense,
    created_by: adminUserId
  }))
  
  const { error } = await supabase
    .from('expenses')
    .insert(expenseData)
  
  if (error) {
    console.error('❌ Expenses error:', error)
  } else {
    console.log(`✅ Inserted ${expenseData.length} expense records`)
  }
}

async function seedEnhancedShipments() {
  console.log('🚢 Seeding enhanced shipments...')
  
  // Get admin user for created_by
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No user profiles found, skipping shipments')
    return
  }
  
  const adminUserId = profiles[0].id
  
  // First, clear existing shipments to avoid conflicts
  await supabase.from('shipments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  const shipmentData = ENHANCED_SHIPMENTS_DATA.map(shipment => ({
    ...shipment,
    created_by: adminUserId
  }))
  
  const { error } = await supabase
    .from('shipments')
    .insert(shipmentData)
  
  if (error) {
    console.error('❌ Enhanced shipments error:', error)
  } else {
    console.log(`✅ Inserted ${shipmentData.length} enhanced shipment records`)
  }
}

async function main() {
  console.log('🎯 TAHAP 4: DASHBOARD INTERNAL ITM - AUTO SETUP')
  console.log('================================================')
  
  try {
    // Step 1: Create tables
    const tablesCreated = await createTables()
    if (!tablesCreated) {
      console.log('❌ Failed to create tables, aborting...')
      return
    }
    
    // Step 2: Seed data
    await seedFuelEntries()
    await seedEquipment() 
    await seedExpenses()
    await seedEnhancedShipments()
    
    console.log('================================================')
    console.log('🎉 TAHAP 4 SETUP COMPLETED SUCCESSFULLY!')
    console.log('')
    console.log('✅ Modules Ready:')
    console.log('   ⛽ Fuel Management - /fuel')
    console.log('   🚢 Shipment Tracking - /shipment')
    console.log('   🔧 Equipment Management - /equipment')
    console.log('   💰 Finance & Expense - /finance')
    console.log('   📊 Reports & Analytics - /reports')
    console.log('')
    console.log('🚀 Dashboard Internal PT. Infinity Trade Mineral is ready!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main()
}

module.exports = { main }


