import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET - Fetch all materials (custom only for now)
export async function GET() {
  try {
    const supabase = supabaseAdmin()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the function to get all materials
    const { data: materials, error } = await supabase.rpc('get_all_materials')
    
    if (error) {
      console.error('Error fetching materials:', error)
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }

    // Transform data for dropdown format
    const formattedMaterials = materials?.map((material: any) => ({
      value: material.code,
      label: `${material.name} (${material.code})`,
      category: material.category,
      isCustom: material.is_custom,
      details: {
        id: material.id,
        code: material.code,
        name: material.name,
        category: material.category,
        description: material.description,
        unit_of_measure: material.unit_of_measure,
        specifications: material.specifications,
        created_by: material.created_by,
        created_at: material.created_at
      }
    })) || []

    return NextResponse.json({ 
      materials: formattedMaterials,
      count: formattedMaterials.length 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new custom material
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, category, description, unit_of_measure, specifications } = body

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('user_materials')
      .select('code')
      .eq('code', code.toUpperCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Material code already exists' }, { status: 409 })
    }

    // Insert new custom material
    const { data: newMaterial, error: insertError } = await supabase
      .from('user_materials')
      .insert({
        code: code.toUpperCase(),
        name,
        category: category || 'Custom',
        description,
        unit_of_measure: unit_of_measure || 'Unit',
        specifications: specifications || {},
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting custom material:', insertError)
      return NextResponse.json({ error: 'Failed to create custom material' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      material: newMaterial,
      message: 'Custom material created successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
