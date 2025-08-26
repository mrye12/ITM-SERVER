import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/supabase/auth'
import * as crypto from 'crypto'

// Get all user sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = supabaseAdmin()
    
    // Get all active sessions for user
    const { data: sessions, error } = await admin
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get sessions error:', error)
      return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 })
    }

    // Enhance sessions with location info and device info
    const enhancedSessions = sessions.map(session => ({
      id: session.id,
      device_fingerprint: session.device_fingerprint,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      location: session.location,
      last_activity: session.last_activity,
      created_at: session.created_at,
      is_current: session.session_token === request.headers.get('authorization')?.replace('Bearer ', ''),
      device_type: getDeviceType(session.user_agent),
      browser: getBrowser(session.user_agent)
    }))

    return NextResponse.json({
      sessions: enhancedSessions,
      total: enhancedSessions.length
    })

  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new session
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { device_fingerprint, location } = await request.json()
    
    const admin = supabaseAdmin()
    
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')
    
    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Calculate risk score
    const riskScore = await calculateSessionRisk(user.id, ipAddress, device_fingerprint)
    
    // Create session record
    const { data: session, error: sessionError } = await admin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        device_fingerprint,
        ip_address: ipAddress,
        user_agent: userAgent,
        location: location || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Log security event
    await admin.from('security_events').insert({
      user_id: user.id,
      event_type: 'session_created',
      event_severity: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      ip_address: ipAddress,
      user_agent: userAgent,
      device_fingerprint,
      location,
      event_data: {
        session_id: session.id,
        device_type: getDeviceType(userAgent),
        browser: getBrowser(userAgent)
      },
      risk_score: riskScore
    })

    // Create risk assessment if high risk
    if (riskScore > 70) {
      await admin.from('risk_assessments').insert({
        user_id: user.id,
        assessment_type: 'session',
        risk_factors: {
          new_device: device_fingerprint ? 'unknown' : 'known',
          suspicious_ip: riskScore > 80,
          unusual_location: location ? 'different' : 'unknown'
        },
        risk_score: riskScore,
        risk_level: riskScore > 90 ? 'critical' : 'high',
        mitigation_actions: ['require_mfa', 'email_notification'],
        requires_approval: riskScore > 90
      })
    }

    return NextResponse.json({
      success: true,
      session_token: sessionToken,
      expires_at: session.expires_at,
      risk_score: riskScore,
      requires_mfa: riskScore > 70
    })

  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Terminate session
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const terminateAll = searchParams.get('all') === 'true'

    const admin = supabaseAdmin()

    if (terminateAll) {
      // Terminate all sessions except current
      const currentToken = request.headers.get('authorization')?.replace('Bearer ', '')
      
      const { error } = await admin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('session_token', currentToken || 'none')

      if (error) {
        console.error('Terminate all sessions error:', error)
        return NextResponse.json({ error: 'Failed to terminate sessions' }, { status: 500 })
      }

      // Log security event
      await admin.from('security_events').insert({
        user_id: user.id,
        event_type: 'sessions_terminated_all',
        event_severity: 'medium',
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        event_data: { reason: 'user_requested' }
      })

      return NextResponse.json({ success: true, message: 'All other sessions terminated' })
    }

    if (sessionId) {
      // Terminate specific session
      const { error } = await admin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Terminate session error:', error)
        return NextResponse.json({ error: 'Failed to terminate session' }, { status: 500 })
      }

      // Log security event
      await admin.from('security_events').insert({
        user_id: user.id,
        event_type: 'session_terminated',
        event_severity: 'low',
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        event_data: { session_id: sessionId, reason: 'user_requested' }
      })

      return NextResponse.json({ success: true, message: 'Session terminated' })
    }

    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

  } catch (error) {
    console.error('Terminate session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown'
  
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile'
  if (/Tablet/.test(userAgent)) return 'tablet'
  return 'desktop'
}

function getBrowser(userAgent: string): string {
  if (!userAgent) return 'unknown'
  
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'other'
}

async function calculateSessionRisk(userId: string, ipAddress: string, deviceFingerprint: string): Promise<number> {
  const admin = supabaseAdmin()
  let riskScore = 0

  try {
    // Check for failed login attempts
    const { data: failedAttempts } = await admin
      .from('security_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'login_failed')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    riskScore += (failedAttempts?.length || 0) * 20

    // Check for suspicious IP activity
    const { data: suspiciousIp } = await admin
      .from('security_events')
      .select('id')
      .eq('ip_address', ipAddress)
      .in('event_severity', ['high', 'critical'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    riskScore += (suspiciousIp?.length || 0) * 30

    // Check if device is known
    const { data: knownDevice } = await admin
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .limit(1)

    if (!knownDevice?.length) {
      riskScore += 25 // New device
    }

    return Math.min(riskScore, 100)
  } catch (error) {
    console.error('Risk calculation error:', error)
    return 50 // Default medium risk
  }
}
