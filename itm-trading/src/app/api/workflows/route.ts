import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active = searchParams.get('active')

    let query = supabaseAdmin
      .from('workflows')
      .select(`
        *,
        workflow_steps!inner(
          id,
          step_order,
          step_name,
          step_type,
          assigned_to_type,
          assigned_to,
          duration_hours,
          is_required
        )
      `)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    const { data: workflows, error } = await query

    if (error) {
      console.error('Error fetching workflows:', error)
      return NextResponse.json(
        { error: 'Failed to fetch workflows' },
        { status: 500 }
      )
    }

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Workflows API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const body = await request.json()

    const {
      name,
      description,
      category,
      trigger_type,
      trigger_conditions,
      steps
    } = body

    // Validate required fields
    if (!name || !category || !trigger_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, trigger_type' },
        { status: 400 }
      )
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .insert({
        name,
        description,
        category,
        trigger_type,
        trigger_conditions: trigger_conditions || {},
        created_by: user.id
      })
      .select()
      .single()

    if (workflowError) {
      console.error('Error creating workflow:', workflowError)
      return NextResponse.json(
        { error: 'Failed to create workflow' },
        { status: 500 }
      )
    }

    // Create workflow steps if provided
    if (steps && Array.isArray(steps)) {
      const stepsData = steps.map((step, index) => ({
        workflow_id: workflow.id,
        step_order: index + 1,
        step_name: step.step_name,
        step_type: step.step_type,
        assigned_to_type: step.assigned_to_type,
        assigned_to: step.assigned_to,
        duration_hours: step.duration_hours || 24,
        is_required: step.is_required !== false,
        conditions: step.conditions || {},
        actions: step.actions || {},
        escalation_hours: step.escalation_hours,
        escalation_to: step.escalation_to
      }))

      const { error: stepsError } = await supabaseAdmin
        .from('workflow_steps')
        .insert(stepsData)

      if (stepsError) {
        console.error('Error creating workflow steps:', stepsError)
        // Clean up workflow if steps failed
        await supabaseAdmin
          .from('workflows')
          .delete()
          .eq('id', workflow.id)

        return NextResponse.json(
          { error: 'Failed to create workflow steps' },
          { status: 500 }
        )
      }
    }

    // Fetch complete workflow with steps
    const { data: completeWorkflow } = await supabaseAdmin
      .from('workflows')
      .select(`
        *,
        workflow_steps(*)
      `)
      .eq('id', workflow.id)
      .single()

    return NextResponse.json({ workflow: completeWorkflow })
  } catch (error) {
    console.error('Create workflow API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
