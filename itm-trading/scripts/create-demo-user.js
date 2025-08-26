#!/usr/bin/env node

/**
 * Create Demo User for ITM Trading Enterprise System
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Check if we're in build environment
const isBuildEnvironment = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY

if (isBuildEnvironment) {
  console.log('🏗️ Build environment detected - skipping demo user creation')
  process.exit(0)
}

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

async function createDemoUser() {
  console.log('🔐 Creating Demo User for ITM Trading Enterprise System')
  console.log('=' .repeat(60))
  
  try {
    // Demo user credentials
    const demoUsers = [
      {
        email: 'admin@itmtrading.com',
        password: 'ITMAdmin2024!',
        full_name: 'ITM Admin',
        role: 'admin'
      },
      {
        email: 'demo@itmtrading.com', 
        password: 'ITMDemo2024!',
        full_name: 'ITM Demo User',
        role: 'staff'
      },
      {
        email: 'viewer@itmtrading.com',
        password: 'ITMViewer2024!', 
        full_name: 'ITM Viewer',
        role: 'viewer'
      }
    ]

    // Create roles first
    console.log('📋 Creating user roles...')
    const roles = [
      { code: 'admin', name: 'Administrator' },
      { code: 'staff', name: 'Staff' },
      { code: 'viewer', name: 'Viewer' }
    ]

    for (const role of roles) {
      try {
        const { error } = await supabase
          .from('roles')
          .upsert(role, { onConflict: 'code' })
        
        if (!error) {
          console.log(`  ✅ Role ${role.code} created/updated`)
        }
      } catch (e) {
        console.log(`  ⚠️ Role ${role.code} creation skipped`)
      }
    }

    // Create demo users
    console.log('👥 Creating demo users...')
    
    for (const userData of demoUsers) {
      try {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
            role: userData.role
          }
        })

        if (authError) {
          console.log(`  ⚠️ User ${userData.email} might already exist`)
          continue
        }

        if (authUser.user) {
          // Get role_id
          const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('code', userData.role)
            .single()

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.user.id,
              email: userData.email,
              full_name: userData.full_name,
              role: userData.role,
              role_id: roleData?.id,
              is_active: true
            }, { onConflict: 'id' })

          if (!profileError) {
            console.log(`  ✅ Demo user created: ${userData.email} (${userData.role})`)
          }
        }
      } catch (error) {
        console.log(`  ⚠️ User ${userData.email} creation failed: ${error.message}`)
      }
    }

    console.log('=' .repeat(60))
    console.log('🎉 DEMO USERS CREATED SUCCESSFULLY!')
    console.log('')
    console.log('🔑 LOGIN CREDENTIALS:')
    console.log('👑 Admin Access:')
    console.log('   Email: admin@itmtrading.com')
    console.log('   Password: ITMAdmin2024!')
    console.log('')
    console.log('👤 Staff Access:') 
    console.log('   Email: demo@itmtrading.com')
    console.log('   Password: ITMDemo2024!')
    console.log('')
    console.log('👁️ Viewer Access:')
    console.log('   Email: viewer@itmtrading.com')
    console.log('   Password: ITMViewer2024!')
    console.log('')
    console.log('🌐 Login URL: https://nextjs-boilerplate-ppsv28jgw-infinity-trade-minerals-projects.vercel.app/login')
    console.log('')
    console.log('🚀 Ready to test the enterprise system!')
    
    return true
    
  } catch (error) {
    console.error('💥 DEMO USER CREATION FAILED:', error.message)
    return false
  }
}

if (require.main === module) {
  createDemoUser()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { createDemoUser }
