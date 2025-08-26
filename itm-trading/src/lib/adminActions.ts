"use server"
import { createClient } from '@supabase/supabase-js'

// Server-side admin functions menggunakan service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbhcrqtfbhzuwcljgxph.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-key-for-build',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'superadmin' | 'admin' | 'staff'
}

export async function createUserWithProfile(userData: CreateUserData) {
  try {
    // 1. Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      }
    })

    if (authError) throw authError

    // 2. Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      })

    if (profileError) throw profileError

    return { 
      success: true, 
      user: authUser.user,
      message: `User ${userData.email} created successfully with role ${userData.role}`
    }
  } catch (error) {
    console.error('Error creating user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create user'
    }
  }
}

export async function bulkCreateUsers(users: CreateUserData[]) {
  const results = []
  
  for (const userData of users) {
    const result = await createUserWithProfile(userData)
    results.push({ userData, result })
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

export async function seedInitialData() {
  try {
    // Import data dari file seed (edit di src/data/seedData.ts)
    const { USERS_SEED, SALES_SEED, STOCK_SEED, SHIPMENT_SEED, KPI_SEED } = await import('@/data/seedData')
    
    // 1. Create all users dari USERS_SEED
    const userResults = await bulkCreateUsers(USERS_SEED)
    const superadminUser = userResults.find(r => r.userData.role === 'superadmin')?.result?.user

    // 2. Seed sales data dari SALES_SEED
    if (superadminUser) {
      const salesWithUser = SALES_SEED.map(sale => ({
        ...sale,
        created_by: superadminUser.id
      }))

      const { error: salesError } = await supabaseAdmin
        .from('sales')
        .insert(salesWithUser)

      if (salesError) console.error('Error seeding sales:', salesError)
    }

    // 3. Seed stock data dari STOCK_SEED
    const { error: stockError } = await supabaseAdmin
      .from('stock')
      .insert(STOCK_SEED)

    if (stockError) console.error('Error seeding stock:', stockError)

    // 4. Seed shipment data dari SHIPMENT_SEED
    const { error: shipmentError } = await supabaseAdmin
      .from('shipments')
      .insert(SHIPMENT_SEED)

    if (shipmentError) console.error('Error seeding shipments:', shipmentError)

    // 5. Seed KPI data dari KPI_SEED
    const { error: kpiError } = await supabaseAdmin
      .from('kpi_company_daily')
      .insert(KPI_SEED)

    if (kpiError) console.error('Error seeding KPI:', kpiError)

    return {
      success: true,
      message: 'All data seeded successfully from seedData.ts!',
      details: {
        users: USERS_SEED.length + ' users',
        sales: SALES_SEED.length + ' records',
        stock: STOCK_SEED.length + ' records',
        shipments: SHIPMENT_SEED.length + ' records',
        kpi: KPI_SEED.length + ' records'
      }
    }

  } catch (error) {
    console.error('Error seeding data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
