// app/api/lessons/[lessonId]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const lessonId = params.lessonId
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the requesting user matches the userId
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    // 1. Get the lesson details to calculate XP
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*, courses(*)')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const course = lesson.courses
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found for this lesson' },
        { status: 404 }
      )
    }

    // 2. Check if lesson is already completed
    const { data: existingProgress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (existingProgress?.status === 'completed') {
      return NextResponse.json(
        { error: 'Lesson already completed' },
        { status: 400 }
      )
    }

    // Start a transaction to ensure data consistency
    const now = new Date().toISOString()

    // 3. Update or insert lesson progress
    const { error: progressError } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'completed',
        completed_at: now
      }, {
        onConflict: 'user_id,lesson_id'
      })

    if (progressError) {
      console.error('Error updating lesson progress:', progressError)
      return NextResponse.json(
        { error: 'Failed to update lesson progress' },
        { status: 500 }
      )
    }

    // 4. Update user's XP
    const xpReward = lesson.xp_reward || 50

    // First, get current user progress
    const { data: userProgress } = await supabase
      .from('users_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    const currentXP = userProgress?.xp || 0
    const currentLevel = userProgress?.level || 1
    const newXP = currentXP + xpReward
    const newLevel = Math.floor(newXP / 100) + 1 // 100 XP per level

    // Update user progress
    const { error: xpUpdateError } = await supabase
      .from('users_progress')
      .upsert({
        user_id: userId,
        xp: newXP,
        level: newLevel,
        updated_at: now
      }, {
        onConflict: 'user_id'
      })

    if (xpUpdateError) {
      console.error('Error updating user XP:', xpUpdateError)
      return NextResponse.json(
        { error: 'Failed to update user XP' },
        { status: 500 }
      )
    }

    // 5. Create XP event for history
    const { error: xpEventError } = await supabase
      .from('xp_events')
      .insert({
        user_id: userId,
        amount: xpReward,
        reason: 'lesson_completed',
        lesson_id: lessonId,
        course_id: course.id,
        created_at: now,
        metadata: {
          lesson_title: lesson.title,
          course_title: course.title,
          level_up: newLevel > currentLevel
        }
      })

    if (xpEventError) {
      console.error('Error creating XP event:', xpEventError)
      // Continue even if this fails, as lesson completion is already recorded
    }

    // 6. Check for level up and create achievement if needed
    if (newLevel > currentLevel) {
      // Create level up achievement
      const { error: achievementError } = await supabase
        .from('xp_events')
        .insert({
          user_id: userId,
          amount: 0,
          reason: 'level_up',
          created_at: now,
          metadata: {
            old_level: currentLevel,
            new_level: newLevel
          }
        })

      if (achievementError) {
        console.error('Error creating level up achievement:', achievementError)
      }

      // Check for milestone badges
      if (newLevel % 5 === 0) {
        // Every 5 levels, check for milestone badge
        const { data: milestoneBadge } = await supabase
          .from('badges')
          .select('id')
          .eq('name', `Level ${newLevel} Milestone`)
          .single()

        if (milestoneBadge) {
          const { error: badgeError } = await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: milestoneBadge.id,
              earned_at: now
            })

          if (badgeError) {
            console.error('Error awarding milestone badge:', badgeError)
          }
        }
      }
    }

    // 7. Check if this completes the course
    const { data: courseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', course.id)

    const { data: completedLessons } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('lesson_id', courseLessons?.map(l => l.id) || [])

    const totalLessons = courseLessons?.length || 0
    const completedCount = completedLessons?.length || 0

    // If all lessons are completed, award course completion badge and certificate
    if (totalLessons > 0 && completedCount >= totalLessons) {
      // Award course completion badge
      const { data: completionBadge } = await supabase
        .from('badges')
        .select('id')
        .eq('name', `${course.title} Completion`)
        .single()

      if (completionBadge) {
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: completionBadge.id,
            earned_at: now
          })
      }

      // Create certificate
      const certificateCode = `CERT-${course.id.slice(0, 8)}-${userId.slice(0, 8)}-${Date.now().toString(36)}`
      
      await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          course_id: course.id,
          certificate_code: certificateCode,
          issued_at: now
        })
    }

    // 8. Update day streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('day_streak, last_activity_date')
      .eq('id', userId)
      .single()

    let newDayStreak = profile?.day_streak || 0
    const lastActivityDate = profile?.last_activity_date ? new Date(profile.last_activity_date) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!lastActivityDate || lastActivityDate.getTime() < today.getTime()) {
      // Increment streak if last activity was yesterday or earlier
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (!lastActivityDate || lastActivityDate.getTime() === yesterday.getTime()) {
        newDayStreak += 1
      } else {
        newDayStreak = 1 // Reset streak
      }

      await supabase
        .from('profiles')
        .update({
          day_streak: newDayStreak,
          last_activity_date: now
        })
        .eq('id', userId)
    }

    const response = {
      success: true,
      data: {
        lessonCompleted: true,
        xpEarned: xpReward,
        newXP: newXP,
        newLevel: newLevel,
        levelUp: newLevel > currentLevel,
        courseProgress: {
          completed: completedCount,
          total: totalLessons,
          percentage: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
        },
        dayStreak: newDayStreak,
        timestamp: now
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error completing lesson:', error)
    return NextResponse.json(
      { 
        error: 'Failed to complete lesson',
        details: error.message 
      },
      { status: 500 }
    )
  }
}