import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params

    // Check if user has access to this task
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', id)
      .single()

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has assignment to this task
    const { data: hasAssignment } = await supabaseAdmin
      .from('task_assignments')
      .select('id')
      .eq('task_id', id)
      .eq('assigned_to', user.id)
      .single()

    const hasAccess = 
      task.assigned_to === user.id ||
      task.created_by === user.id ||
      hasAssignment

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Fetch comments
    const { data: comments, error } = await supabaseAdmin
      .from('task_comments')
      .select(`
        id,
        comment_type,
        content,
        is_internal,
        created_at,
        updated_at,
        metadata,
        created_user:created_by(id, email, profiles!inner(full_name))
      `)
      .eq('task_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching task comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get task comments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params
    const body = await request.json()

    const {
      comment_type = 'comment',
      content,
      is_internal = false,
      metadata
    } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Check if user has access to this task
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', id)
      .single()

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has assignment to this task
    const { data: hasAssignment } = await supabaseAdmin
      .from('task_assignments')
      .select('id')
      .eq('task_id', id)
      .eq('assigned_to', user.id)
      .single()

    const hasAccess = 
      task.assigned_to === user.id ||
      task.created_by === user.id ||
      hasAssignment

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Create comment
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('task_comments')
      .insert({
        task_id: id,
        comment_type,
        content,
        is_internal,
        metadata: metadata || {},
        created_by: user.id
      })
      .select(`
        id,
        comment_type,
        content,
        is_internal,
        created_at,
        updated_at,
        metadata,
        created_user:created_by(id, email, profiles!inner(full_name))
      `)
      .single()

    if (commentError) {
      console.error('Error creating task comment:', commentError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Update task's updated_at timestamp
    await supabaseAdmin
      .from('tasks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Create task comment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
