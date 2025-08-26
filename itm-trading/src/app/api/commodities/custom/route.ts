import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET - Fetch all commodities (built-in + custom)
export async function GET() {
  try {
    const supabase = supabaseAdmin()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the function to get all commodities
    const { data: commodities, error } = await supabase.rpc('get_all_commodities')
    
    if (error) {
      console.error('Error fetching commodities:', error)
      return NextResponse.json({ error: 'Failed to fetch commodities' }, { status: 500 })
    }

    // Transform data for dropdown format
    const formattedCommodities = commodities?.map((commodity: any) => ({
      value: commodity.code,
      label: `${commodity.name} (${commodity.code})`,
      category: commodity.category,
      isCustom: commodity.is_custom,
      details: {
        id: commodity.id,
        code: commodity.code,
        name: commodity.name,
        category: commodity.category,
        description: commodity.description,
        unit_of_measure: commodity.unit_of_measure,
        grade: commodity.grade,
        export_eligible: commodity.export_eligible,
        created_by: commodity.created_by,
        created_at: commodity.created_at
      }
    })) || []

    return NextResponse.json({ 
      commodities: formattedCommodities,
      count: formattedCommodities.length 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new custom commodity
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, category, description, unit_of_measure, grade, export_eligible } = body

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    // Check if code already exists in built-in commodities
    const { data: existingBuiltIn } = await supabase
      .from('commodities')
      .select('code')
      .eq('code', code.toUpperCase())
      .single()

    if (existingBuiltIn) {
      return NextResponse.json({ error: 'Commodity code already exists in built-in commodities' }, { status: 409 })
    }

    // Check if code already exists in custom commodities
    const { data: existingCustom } = await supabase
      .from('user_commodities')
      .select('code')
      .eq('code', code.toUpperCase())
      .single()

    if (existingCustom) {
      return NextResponse.json({ error: 'Custom commodity code already exists' }, { status: 409 })
    }

    // Insert new custom commodity
    const { data: newCommodity, error: insertError } = await supabase
      .from('user_commodities')
      .insert({
        code: code.toUpperCase(),
        name,
        category: category || 'Custom',
        description,
        unit_of_measure: unit_of_measure || 'MT',
        grade,
        export_eligible: export_eligible || false,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting custom commodity:', insertError)
      return NextResponse.json({ error: 'Failed to create custom commodity' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      commodity: newCommodity,
      message: 'Custom commodity created successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update custom commodity
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, code, name, category, description, unit_of_measure, grade, export_eligible } = body

    if (!id) {
      return NextResponse.json({ error: 'Commodity ID is required' }, { status: 400 })
    }

    // Update custom commodity (only if user owns it or is admin)
    const { data: updatedCommodity, error: updateError } = await supabase
      .from('user_commodities')
      .update({
        code: code?.toUpperCase(),
        name,
        category,
        description,
        unit_of_measure,
        grade,
        export_eligible
      })
      .eq('id', id)
      .eq('created_by', user.id) // Can only update own commodities
      .select()
      .single()

    if (updateError) {
      console.error('Error updating custom commodity:', updateError)
      return NextResponse.json({ error: 'Failed to update custom commodity' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      commodity: updatedCommodity,
      message: 'Custom commodity updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
