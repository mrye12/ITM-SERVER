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

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assigned_user:assigned_to(id, email, profiles!inner(full_name)),
        created_user:created_by(id, email, profiles!inner(full_name)),
        task_assignments(
          id,
          assignment_type,
          status,
          assigned_at,
          accepted_at,
          notes,
          assigned_user:assigned_to(id, email, profiles!inner(full_name)),
          assigner:assigned_by(id, email, profiles!inner(full_name))
        ),
        task_comments(
          id,
          comment_type,
          content,
          is_internal,
          created_at,
          updated_at,
          metadata,
          created_user:created_by(id, email, profiles!inner(full_name))
        ),
        task_attachments(
          id,
          file_name,
          file_path,
          file_size,
          file_type,
          uploaded_at,
          uploaded_user:uploaded_by(id, email, profiles!inner(full_name))
        ),
        workflow_execution:workflow_execution_id(
          id,
          entity_type,
          entity_id,
          status,
          priority,
          workflow:workflow_id(
            id,
            name,
            description,
            category
          )
        ),
        workflow_step:workflow_step_id(
          id,
          step_name,
          step_type,
          step_order
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Get task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params
    const body = await request.json()

    const {
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      estimated_hours,
      actual_hours,
      completion_percentage,
      tags,
      metadata
    } = body

    // Check if user has permission to update this task
    const { data: existingTask } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', id)
      .single()

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user can update (assignee, creator, or has assignment)
    const { data: hasAssignment } = await supabaseAdmin
      .from('task_assignments')
      .select('id')
      .eq('task_id', id)
      .eq('assigned_to', user.id)
      .single()

    const canUpdate = 
      existingTask.assigned_to === user.id ||
      existingTask.created_by === user.id ||
      hasAssignment

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to
    if (due_date !== undefined) updateData.due_date = due_date
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours
    if (actual_hours !== undefined) updateData.actual_hours = actual_hours
    if (completion_percentage !== undefined) updateData.completion_percentage = completion_percentage
    if (tags !== undefined) updateData.tags = tags
    if (metadata !== undefined) updateData.metadata = metadata

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status
      
      if (status === 'in_progress' && !existingTask.started_at) {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.completion_percentage = 100
      }
    }

    // Update task
    const { data: task, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_user:assigned_to(id, email, profiles!inner(full_name)),
        created_user:created_by(id, email, profiles!inner(full_name))
      `)
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    // Log status change if status was updated
    if (status !== undefined) {
      await supabaseAdmin
        .from('task_comments')
        .insert({
          task_id: id,
          comment_type: 'status_update',
          content: `Status changed to: ${status}`,
          is_internal: true,
          created_by: user.id
        })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser()
    const { id } = params

    // Check if user has permission to delete this task
    const { data: existingTask } = await supabaseAdmin
      .from('tasks')
      .select('created_by, assigned_to')
      .eq('id', id)
      .single()

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Only creator or assigned user can delete
    if (existingTask.created_by !== user.id && existingTask.assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Soft delete by updating status
    const { error: deleteError } = await supabaseAdmin
      .from('tasks')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    // Log deletion
    await supabaseAdmin
      .from('task_comments')
      .insert({
        task_id: id,
        comment_type: 'status_update',
        content: 'Task cancelled',
        is_internal: true,
        created_by: user.id
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
