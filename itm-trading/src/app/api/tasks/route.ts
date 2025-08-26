import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigned_to = searchParams.get('assigned_to')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assigned_user:assigned_to(id, email, profiles!inner(full_name)),
        created_user:created_by(id, email, profiles!inner(full_name)),
        task_assignments!inner(
          id,
          assignment_type,
          status,
          assigned_to,
          assigned_user:assigned_to(id, email, profiles!inner(full_name))
        ),
        task_comments(
          id,
          comment_type,
          content,
          created_at,
          created_by,
          created_user:created_by(id, email, profiles!inner(full_name))
        ),
        workflow_execution:workflow_execution_id(
          id,
          entity_type,
          entity_id,
          status,
          priority
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Filter by assigned user
    if (assigned_to) {
      if (assigned_to === 'me') {
        query = query.eq('assigned_to', user.id)
      } else {
        query = query.eq('assigned_to', assigned_to)
      }
    }

    // Filter by priority
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Get task statistics
    const { data: statsData } = await supabaseAdmin
      .from('tasks')
      .select('status, priority')
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(t => t.status === 'pending').length || 0,
      in_progress: statsData?.filter(t => t.status === 'in_progress').length || 0,
      completed: statsData?.filter(t => t.status === 'completed').length || 0,
      overdue: statsData?.filter(t => t.status === 'overdue').length || 0,
      high_priority: statsData?.filter(t => t.priority === 'high').length || 0,
      urgent: statsData?.filter(t => t.priority === 'urgent').length || 0
    }

    return NextResponse.json({ tasks, stats })
  } catch (error) {
    console.error('Tasks API error:', error)
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
      title,
      description,
      task_type,
      priority = 'normal',
      assigned_to,
      due_date,
      entity_type,
      entity_id,
      estimated_hours,
      tags,
      metadata
    } = body

    // Validate required fields
    if (!title || !task_type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, task_type' },
        { status: 400 }
      )
    }

    // Create task
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert({
        title,
        description,
        task_type,
        priority,
        assigned_to,
        assigned_by: user.id,
        due_date,
        entity_type,
        entity_id,
        estimated_hours,
        tags,
        metadata: metadata || {},
        created_by: user.id
      })
      .select(`
        *,
        assigned_user:assigned_to(id, email, profiles!inner(full_name)),
        created_user:created_by(id, email, profiles!inner(full_name))
      `)
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    // Create task assignment if assigned to someone
    if (assigned_to) {
      const { error: assignmentError } = await supabaseAdmin
        .from('task_assignments')
        .insert({
          task_id: task.id,
          assigned_to,
          assigned_by: user.id,
          assignment_type: 'assignee'
        })

      if (assignmentError) {
        console.error('Error creating task assignment:', assignmentError)
      }
    }

    // Log task creation
    await supabaseAdmin
      .from('task_comments')
      .insert({
        task_id: task.id,
        comment_type: 'status_update',
        content: 'Task created',
        is_internal: true,
        created_by: user.id
      })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Create task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
