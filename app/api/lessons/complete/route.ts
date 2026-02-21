// app/api/lessons/complete/route.ts
import { createClient } from '@/lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { userId, lessonId, courseId, xpReward } = body

    if (!userId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Start a transaction
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (lessonError) throw lessonError

    // 1. Mark lesson as completed
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single()

    if (progressError) throw progressError

    // 2. Add XP event
    const xpAmount = xpReward || lesson.xp_reward || 50
    const { error: xpError } = await supabase
      .from('xp_events')
      .insert({
        user_id: userId,
        amount: xpAmount,
        reason: `Completed lesson: ${lesson.title}`,
        created_at: new Date().toISOString()
      })

    if (xpError) throw xpError

    // 3. Update user's total XP and level
    const { data: userProgress, error: userProgressError } = await supabase
      .from('users_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (userProgressError) throw userProgressError

    const currentXP = userProgress?.xp || 0
    const currentLevel = userProgress?.level || 1
    const newXP = currentXP + xpAmount
    
    // Simple level calculation: 1000 XP per level
    const newLevel = Math.floor(newXP / 1000) + 1

    const { error: updateError } = await supabase
      .from('users_progress')
      .upsert({
        user_id: userId,
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (updateError) throw updateError

    // 4. Check for badge achievements
    if (courseId) {
      // Check if user has completed all lessons in the course
      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)

      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('lesson_id', courseLessons?.map(l => l.id) || [])

      // If all lessons completed, award course completion badge
      if (courseLessons && completedLessons && courseLessons.length === completedLessons.length) {
        // Find course completion badge
        const { data: courseBadge } = await supabase
          .from('badges')
          .select('id')
          .eq('name', 'Course Completion')
          .single()

        if (courseBadge) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: courseBadge.id,
              earned_at: new Date().toISOString()
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      xpEarned: xpAmount,
      newTotalXP: newXP,
      newLevel: newLevel,
      message: 'Lesson completed successfully'
    })

  } catch (error) {
    console.error('Error completing lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}