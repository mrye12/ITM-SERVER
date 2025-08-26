import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/supabase/auth'

// Get current exchange rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const baseCurrency = searchParams.get('base') || 'USD'
    const targetCurrency = searchParams.get('target')
    
    const admin = supabaseAdmin()
    
    let query = admin
      .from('exchange_rates')
      .select(`
        *,
        from_currency:currencies!exchange_rates_from_currency_id_fkey(code, name, symbol),
        to_currency:currencies!exchange_rates_to_currency_id_fkey(code, name, symbol)
      `)
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString())
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)

    if (targetCurrency) {
      query = query
        .eq('from_currency.code', baseCurrency)
        .eq('to_currency.code', targetCurrency)
    } else {
      query = query.eq('from_currency.code', baseCurrency)
    }

    const { data: rates, error } = await query.order('valid_from', { ascending: false })

    if (error) {
      console.error('Exchange rates fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
    }

    // Get latest rates for each currency pair
    const latestRates = rates?.reduce((acc, rate) => {
      const key = `${rate.from_currency.code}_${rate.to_currency.code}`
      if (!acc[key] || new Date(rate.valid_from) > new Date(acc[key].valid_from)) {
        acc[key] = rate
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      base_currency: baseCurrency,
      rates: Object.values(latestRates || {}),
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Exchange rates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update exchange rates (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update exchange rates
    const admin = supabaseAdmin()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'finance_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { rates, source = 'manual' } = await request.json()

    if (!rates || !Array.isArray(rates)) {
      return NextResponse.json({ error: 'Invalid rates data' }, { status: 400 })
    }

    // Validate and insert new rates
    const insertData = []
    for (const rate of rates) {
      const { from_currency, to_currency, rate: exchangeRate, valid_from, valid_until } = rate

      // Get currency IDs
      const { data: fromCurrencyData } = await admin
        .from('currencies')
        .select('id')
        .eq('code', from_currency)
        .single()

      const { data: toCurrencyData } = await admin
        .from('currencies')
        .select('id')
        .eq('code', to_currency)
        .single()

      if (!fromCurrencyData || !toCurrencyData) {
        return NextResponse.json(
          { error: `Invalid currency codes: ${from_currency} or ${to_currency}` },
          { status: 400 }
        )
      }

      insertData.push({
        from_currency_id: fromCurrencyData.id,
        to_currency_id: toCurrencyData.id,
        rate: exchangeRate,
        source,
        valid_from: valid_from || new Date().toISOString(),
        valid_until: valid_until || null
      })
    }

    // Insert new rates
    const { data: newRates, error: insertError } = await admin
      .from('exchange_rates')
      .insert(insertData)
      .select()

    if (insertError) {
      console.error('Exchange rates insert error:', insertError)
      return NextResponse.json({ error: 'Failed to update exchange rates' }, { status: 500 })
    }

    // Log compliance audit
    await admin.from('compliance_audit').insert({
      user_id: user.id,
      resource_type: 'exchange_rates',
      action_type: 'create',
      action_details: {
        action: 'bulk_update_exchange_rates',
        rates_count: newRates.length,
        source
      },
      compliance_flags: ['financial_regulation'],
      data_classification: 'internal',
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      success: true,
      message: `${newRates.length} exchange rates updated successfully`,
      rates: newRates
    })

  } catch (error) {
    console.error('Exchange rates update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Auto-update exchange rates from external API
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting automatic exchange rate update...')

    // Fetch rates from external API (example: exchangerate-api.com)
    const baseCurrency = 'USD'
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    
    if (!apiKey) {
      console.warn('Exchange rate API key not configured')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`)
    const apiData = await response.json()

    if (!response.ok || apiData.result !== 'success') {
      throw new Error(`Exchange rate API error: ${apiData.error_type || 'Unknown error'}`)
    }

    const admin = supabaseAdmin()

    // Get all active currencies
    const { data: currencies } = await admin
      .from('currencies')
      .select('id, code')
      .eq('is_active', true)

    if (!currencies) {
      throw new Error('No currencies found')
    }

    const baseCurrencyRecord = currencies.find(c => c.code === baseCurrency)
    if (!baseCurrencyRecord) {
      throw new Error(`Base currency ${baseCurrency} not found`)
    }

    // Prepare exchange rate data
    const rateUpdates = []
    for (const currency of currencies) {
      if (currency.code === baseCurrency) continue

      const rate = apiData.conversion_rates[currency.code]
      if (rate) {
        rateUpdates.push({
          from_currency_id: baseCurrencyRecord.id,
          to_currency_id: currency.id,
          rate: rate,
          source: 'exchangerate-api.com',
          valid_from: new Date().toISOString()
        })

        // Also add reverse rate
        rateUpdates.push({
          from_currency_id: currency.id,
          to_currency_id: baseCurrencyRecord.id,
          rate: 1 / rate,
          source: 'exchangerate-api.com',
          valid_from: new Date().toISOString()
        })
      }
    }

    // Insert new rates
    const { data: newRates, error: insertError } = await admin
      .from('exchange_rates')
      .insert(rateUpdates)
      .select()

    if (insertError) {
      console.error('Auto exchange rate insert error:', insertError)
      return NextResponse.json({ error: 'Failed to insert rates' }, { status: 500 })
    }

    console.log(`Successfully updated ${newRates.length} exchange rates`)

    return NextResponse.json({
      success: true,
      message: `${newRates.length} exchange rates updated automatically`,
      source: 'exchangerate-api.com',
      base_currency: baseCurrency,
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Auto exchange rate update error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Auto update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
