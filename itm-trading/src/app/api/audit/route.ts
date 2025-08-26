import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/supabase/auth'

export async function POST(req: Request) {
  try {
    const admin = supabaseAdmin()
    const user = await getSessionUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, target_table, target_id, payload } = await req.json() as {
      action: 'login' | 'logout' | 'custom'
      target_table?: string
      target_id?: string  
      payload?: any
    }

    // Get client IP and user agent for enhanced auditing
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip')
    const userAgent = req.headers.get('user-agent')

    const { error } = await admin.from('activity_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action,
      target_table: target_table || 'auth',
      target_id: target_id || user.id,
      payload: payload || null,
      ip_address: ip,
      user_agent: userAgent
    })

    if (error) {
      console.error('Audit log error:', error)
      return NextResponse.json({ error: 'Audit failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}



