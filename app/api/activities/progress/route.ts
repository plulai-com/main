// app/api/activities/progress/route.ts
import { createClient } from '@/lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, activityId, status, lessonId } = body

    if (!userId || !activityId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from('step_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('step_id', activityId)
      .maybeSingle()

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('step_progress')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : existingProgress.completed_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('step_progress')
        .insert({
          user_id: userId,
          step_id: activityId,
          status,
          started_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // If activity is marked as completed, check if lesson should be completed
    if (status === 'completed' && lessonId) {
      // Count total activities in lesson
      const { data: activities } = await supabase
        .from('lesson_steps')
        .select('id')
        .eq('lesson_id', lessonId)

      // Count completed activities
      const { data: completedActivities } = await supabase
        .from('step_progress')
        .select('step_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('step_id', activities?.map(a => a.id) || [])

      // If all activities are completed, mark lesson as completed
      if (activities && completedActivities && activities.length === completedActivities.length) {
        await supabase
          .from('lesson_progress')
          .upsert({
            user_id: userId,
            lesson_id: lessonId,
            status: 'completed',
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,lesson_id'
          })
      }
    }

    return NextResponse.json({
      success: true,
      progressId: result.id,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('Error updating activity progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}