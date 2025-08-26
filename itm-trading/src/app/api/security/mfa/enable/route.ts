import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/supabase/auth'
import * as crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recovery_email, security_questions } = await request.json()

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    // Encrypt backup codes
    const encryptedCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code + process.env.ENCRYPTION_SALT).digest('hex')
    )

    // Enable 2FA in Supabase
    const admin = supabaseAdmin()
    
    // Update user security settings
    const { data: securitySettings, error: securityError } = await admin
      .from('user_security_settings')
      .upsert({
        user_id: user.id,
        two_factor_enabled: true,
        backup_codes: encryptedCodes,
        recovery_email,
        security_questions: security_questions ? JSON.stringify(security_questions) : null,
        last_security_update: new Date().toISOString()
      })
      .select()
      .single()

    if (securityError) {
      console.error('Security settings error:', securityError)
      return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 })
    }

    // Log security event
    await admin.from('security_events').insert({
      user_id: user.id,
      event_type: 'mfa_enabled',
      event_severity: 'medium',
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
      event_data: {
        recovery_email: recovery_email ? 'provided' : 'not_provided',
        security_questions: security_questions ? 'configured' : 'not_configured'
      }
    })

    // Log compliance audit
    await admin.from('compliance_audit').insert({
      user_id: user.id,
      resource_type: 'security_settings',
      resource_id: securitySettings.id,
      action_type: 'update',
      action_details: {
        action: 'enable_2fa',
        changes: ['two_factor_enabled: true']
      },
      compliance_flags: ['iso27001', 'sox'],
      data_classification: 'confidential',
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
      backup_codes: backupCodes, // Send once for user to save
      recovery_email: recovery_email
    })

  } catch (error) {
    console.error('MFA enable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = supabaseAdmin()
    
    // Get current security settings
    const { data: settings, error } = await admin
      .from('user_security_settings')
      .select('two_factor_enabled, recovery_email, last_security_update')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Get security settings error:', error)
      return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
    }

    return NextResponse.json({
      mfa_enabled: settings?.two_factor_enabled || false,
      recovery_email: settings?.recovery_email || null,
      last_update: settings?.last_security_update || null
    })

  } catch (error) {
    console.error('Get MFA status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
