// app/api/courses/[courseId]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }  // ← CHANGED: params is a Promise
) {
  try {
    const { courseId } = await params;  // ← CHANGED: Await the params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
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

    // First, get all lesson IDs for this course
    const { data: courseLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)

    const lessonIds = courseLessons?.map(l => l.id) || []

    // Fetch all data in parallel for better performance
    const [
      courseResponse,
      lessonsResponse,
      lessonProgressResponse,
      userStatsResponse,
      profileResponse,
      leaderboardResponse
    ] = await Promise.all([
      // 1. Get the specific course
      supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single(),

      // 2. Get all lessons for this course
      supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true }),

      // 3. Get user's lesson progress for this course
      lessonIds.length > 0
        ? supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds)
        : Promise.resolve({ data: [], error: null }), // Return empty if no lessons

      // 4. Get user stats
      supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),

      // 5. Get user profile for age info
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),

      // 6. Get leaderboard for this course (top 10)
      supabase
        .from('xp_events')
        .select(`
          user_id,
          amount,
          profiles!inner (
            id,
            email,
            username,
            day_streak,
            date_of_birth,
            age_group
          )
        `)
        .eq('course_id', courseId)
        .order('amount', { ascending: false })
        .limit(10)
    ])

    // Check if course exists
    if (courseResponse.error || !courseResponse.data) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const course = courseResponse.data
    const lessons = lessonsResponse.data || []
    const lessonProgress = lessonProgressResponse.data || []
    const userStats = userStatsResponse.data || { level: 1, xp: 0, updated_at: new Date().toISOString() }
    const profile = profileResponse.data
    const leaderboardData = leaderboardResponse.data || []

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

    // Calculate age group
    const getAgeGroup = (age: number | null): 'young' | 'tween' | 'teen' | 'all' => {
      if (!age) return 'all'
      if (age < 10) return 'young'
      if (age >= 10 && age <= 13) return 'tween'
      return 'teen'
    }

    const ageGroup = profile?.age_group || getAgeGroup(userAge)

    // Calculate course-specific progress
    const totalLessons = lessons.length
    const completedLessons = lessonProgress.filter(lp => lp.status === 'completed').length
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0

    // Calculate if course is unlocked (check previous course completion)
    const isUnlocked = async () => {
      if (course.order_index === 0) return true // First course is always unlocked
      
      // Find previous course
      const { data: previousCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('order_index', course.order_index - 1)
        .single()

      if (!previousCourse) return true

      // Get lessons for previous course
      const { data: previousLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', previousCourse.id)

      if (!previousLessons?.length) return true

      const previousLessonIds = previousLessons.map(l => l.id)
      
      // Check if at least one lesson is completed in previous course
      const { data: previousProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', previousLessonIds)
        .eq('status', 'completed')
        .limit(1)

      return !!previousProgress?.length
    }

    // Calculate if course is age appropriate
    const isAgeAppropriate = () => {
      if (!userAge) return true
      if (course.target_age_group === 'all') return true
      if (course.min_age && course.max_age) {
        return userAge >= course.min_age && userAge <= course.max_age
      }
      return course.target_age_group === ageGroup
    }

    // Process leaderboard data
    const leaderboard = await Promise.all(
      leaderboardData.map(async (item: any) => {
        const profile = item.profiles
        let age: number | null = null
        
        if (profile?.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth)
          const today = new Date()
          let calculatedAge = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--
          }
          age = calculatedAge
        }

        // Get user's XP from users_progress table
        const { data: userProgress } = await supabase
          .from('users_progress')
          .select('*')
          .eq('user_id', item.user_id)
          .single()

        return {
          id: item.user_id,
          email: profile?.email || '',
          username: profile?.username,
          users_progress: {
            level: userProgress?.level || 1,
            xp: userProgress?.xp || 0,
            updated_at: userProgress?.updated_at || new Date().toISOString()
          },
          day_streak: profile?.day_streak || 0,
          age_group: profile?.age_group,
          age
        }
      })
    )

    // Get total XP earned from this course
    const { data: courseXPEvents } = await supabase
      .from('xp_events')
      .select('amount')
      .eq('user_id', userId)
      .eq('course_id', courseId)

    const earnedXPCourse = courseXPEvents?.reduce((sum, event) => sum + (event.amount || 0), 0) || 0

    // Get total XP from lessons in this course
    const totalCourseXP = lessons.reduce((sum, lesson) => sum + lesson.xp_reward, 0)

    // Prepare enriched course data
    const enrichedCourse = {
      course_id: course.id,
      title: course.title,
      description: course.description || '',
      order_index: course.order_index,
      min_age: course.min_age,
      max_age: course.max_age,
      target_age_group: course.target_age_group,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress_percentage: progressPercentage,
      is_unlocked: await isUnlocked(),
      is_age_appropriate: isAgeAppropriate(),
      ageGroup: course.target_age_group || 'all',
      minAge: course.min_age,
      maxAge: course.max_age,
      total_xp: totalCourseXP,
      earned_xp: earnedXPCourse
    }

    // Prepare lessons data
    const enrichedLessons = lessons.map(lesson => ({
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content || '',
      order_index: lesson.order_index,
      xp_reward: lesson.xp_reward,
      created_at: lesson.created_at
    }))

    // Prepare lesson progress data
    const enrichedLessonProgress = lessonProgress.map(progress => ({
      lesson_id: progress.lesson_id,
      user_id: progress.user_id,
      status: progress.status as 'completed' | 'in_progress' | 'not_started',
      completed_at: progress.completed_at || undefined
    }))

    // Prepare user stats
    const enrichedUserStats = {
      level: userStats.level || 1,
      xp: userStats.xp || 0,
      updated_at: userStats.updated_at
    }

    // Get badges earned for this course
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    const badgesEarned = userBadges?.length || 0

    // Get weekly progress
    const weekStartDate = new Date()
    weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + (weekStartDate.getDay() === 0 ? -6 : 1))
    weekStartDate.setHours(0, 0, 0, 0)

    const { data: weeklyEvents } = await supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStartDate.toISOString())

    const weeklyTotalXP = weeklyEvents?.reduce((sum, event) => sum + (event.amount || 0), 0) || 0

    const response = {
      success: true,
      data: {
        course: enrichedCourse,
        lessons: enrichedLessons,
        lessonProgress: enrichedLessonProgress,
        userStats: enrichedUserStats,
        badgesEarned,
        leaderboard,
        weeklyProgress: {
          totalXP: weeklyTotalXP,
          events: weeklyEvents?.map(event => ({
            id: event.id,
            user_id: event.user_id,
            amount: event.amount,
            reason: event.reason,
            lesson_id: event.lesson_id,
            course_id: event.course_id,
            created_at: event.created_at,
            metadata: event.metadata
          })) || []
        },
        userInfo: {
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
    console.error('Error fetching course data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch course data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}