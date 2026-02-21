// app/api/learn/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/server'

// Helper function to calculate weekly progress
function getWeekStartDate(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday start
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Helper to get age group from age
function calculateAgeGroup(age: number | null): string {
  if (!age) return 'all'
  if (age < 10) return 'young'
  if (age >= 10 && age <= 13) return 'tween'
  return 'teen'
}

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Check authentication by getting the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Auth error:', sessionError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          details: sessionError?.message || 'No session found'
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    
    // Log for debugging
    console.log('API called by user:', userId)

    // Fetch all data in parallel for performance
    const [
      coursesResponse,
      lessonsResponse,
      lessonProgressResponse,
      profileResponse,
      weeklyProgressResponse,
      userStatsResponse,
      badgesResponse,
      xpEventsResponse
    ] = await Promise.all([
      // 1. Get all courses
      supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true }),

      // 2. Get all lessons
      supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true }),

      // 3. Get user's lesson progress
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId),

      // 4. Get user profile with age info
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),

      // 5. Get weekly progress (XP events from this week)
      supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', getWeekStartDate().toISOString())
        .order('created_at', { ascending: false }),

      // 6. Get user stats
      supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),

      // 7. Get user badges count
      supabase
        .from('user_badges')
        .select('badge_id', { count: 'exact' })
        .eq('user_id', userId),

      // 8. Get all XP events for completed lessons count
      supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .eq('reason', 'lesson_completed')
    ])

    // Check for errors in database queries
    const errors = [
      coursesResponse.error,
      lessonsResponse.error,
      lessonProgressResponse.error,
      profileResponse.error,
      weeklyProgressResponse.error,
      userStatsResponse.error,
      badgesResponse.error,
      xpEventsResponse.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Database errors:', errors)
      // Don't throw, just return partial data
    }

    // Process data with defaults
    const courses = coursesResponse.data || []
    const lessons = lessonsResponse.data || []
    const lessonProgress = lessonProgressResponse.data || []
    const profile = profileResponse.data || {}
    const weeklyEvents = weeklyProgressResponse.data || []
    const userStats = userStatsResponse.data || { level: 1, xp: 0 }
    const badgesEarned = badgesResponse.count || 0
    const allXPEvents = xpEventsResponse.data || []

    // Calculate user age if date_of_birth exists
    let userAge: number | null = null
    if (profile?.date_of_birth) {
      const birthDate = new Date(profile.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      userAge = age
    }

    // Get age group (from profile or calculate)
    const ageGroup = profile?.age_group || calculateAgeGroup(userAge)

    // Calculate total weekly XP
    const weeklyTotalXP = weeklyEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0)

    // Calculate completed lessons count
    const completedLessonsCount = lessonProgress.filter((lp: any) => lp.status === 'completed').length

    // Calculate course-specific stats
    const enrichedCourses = courses.map((course: any) => {
      // Get lessons for this course
      const courseLessons = lessons.filter((lesson: any) => lesson.course_id === course.id)
      const totalLessons = courseLessons.length
      
      // Calculate completed lessons for this course
      const completedLessons = lessonProgress.filter((progress: any) => {
        const lesson = lessons.find((l: any) => l.id === progress.lesson_id)
        return lesson?.course_id === course.id && progress.status === 'completed'
      }).length
      
      // Calculate progress percentage
      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0
      
      // Calculate if course is unlocked
      const isUnlocked = (() => {
        // First course is always unlocked
        if (course.order_index === 0) return true
        
        // Find previous course
        const previousCourse = courses.find((c: any) => c.order_index === course.order_index - 1)
        if (!previousCourse) return true
        
        // Get completed lessons in previous course
        const previousCourseLessons = lessons.filter((l: any) => l.course_id === previousCourse.id)
        const previousCompleted = lessonProgress.filter((progress: any) => {
          const lesson = lessons.find((l: any) => l.id === progress.lesson_id)
          return lesson?.course_id === previousCourse.id && progress.status === 'completed'
        }).length
        
        // Unlock if at least one lesson completed in previous course
        return previousCompleted >= 1
      })()
      
      // Check age appropriateness
      const isAgeAppropriate = (() => {
        if (!userAge) return true
        if (course.target_age_group === 'all') return true
        if (course.min_age && course.max_age) {
          return userAge >= course.min_age && userAge <= course.max_age
        }
        return course.target_age_group === ageGroup
      })()

      return {
        course_id: course.id,
        title: course.title,
        description: course.description,
        order_index: course.order_index,
        min_age: course.min_age,
        max_age: course.max_age,
        target_age_group: course.target_age_group,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage: progressPercentage,
        is_unlocked: isUnlocked,
        is_age_appropriate: isAgeAppropriate
      }
    })

    // Calculate dashboard stats
    const dashboardData = {
      profile: {
        ...profile,
        age: userAge,
        age_group: ageGroup,
        highest_week: Math.floor(userStats.xp / 1000) + 1,
        current_week: Math.floor(weeklyTotalXP / 100) + 1
      },
      stats: {
        total_courses: courses.length,
        completed_courses: enrichedCourses.filter((c: any) => c.progress_percentage === 100).length,
        active_courses: enrichedCourses.filter((c: any) => c.progress_percentage > 0 && c.progress_percentage < 100).length,
        total_lessons: lessons.length,
        completed_lessons: completedLessonsCount,
        total_xp_earned: allXPEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0)
      }
    }

    // Prepare final response
    const response = {
      success: true,
      data: {
        dashboard: dashboardData,
        courses: enrichedCourses,
        lessons: lessons.map((lesson: any) => ({
          id: lesson.id,
          course_id: lesson.course_id,
          title: lesson.title,
          content: lesson.content,
          order_index: lesson.order_index,
          xp_reward: lesson.xp_reward,
          created_at: lesson.created_at
        })),
        lesson_progress: lessonProgress.map((progress: any) => ({
          lesson_id: progress.lesson_id,
          user_id: progress.user_id,
          status: progress.status,
          completed_at: progress.completed_at
        })),
        leaderboard: [], // Empty for now, you can implement later
        weekly_progress: {
          totalXP: weeklyTotalXP,
          events: weeklyEvents.map((event: any) => ({
            id: event.id,
            user_id: event.user_id,
            amount: event.amount,
            reason: event.reason,
            lesson_id: event.lesson_id,
            course_id: event.course_id,
            created_at: event.created_at,
            metadata: event.metadata
          }))
        },
        user_stats: {
          level: userStats.level || 1,
          xp: userStats.xp || 0,
          total_xp_earned: allXPEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0),
          badges_earned: badgesEarned,
          updated_at: userStats.updated_at
        },
        user_info: {
          id: userId,
          age: userAge,
          age_group: ageGroup,
          email: profile?.email,
          username: profile?.username
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error in /api/learn:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch learning data',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate age from date of birth
function calculateAgeFromDate(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}