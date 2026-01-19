// app/api/courses/[courseId]/full/route.ts - FIXED DISTINCT COUNT ISSUES
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

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

    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    console.log('Fetching course data for identifier:', courseId)

    // Try to fetch course - first try by ID, then by slug
    let courseResponse
    let isSlugRequest = false

    // Check if it looks like a UUID (ID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
    
    if (isUUID) {
      // Try by ID first
      courseResponse = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      
      if (courseResponse.error) {
        console.log('Course not found by ID, trying by slug...')
        isSlugRequest = true
        courseResponse = await supabase
          .from('courses')
          .select('*')
          .eq('slug', courseId)
          .single()
      }
    } else {
      // Try by slug first (not a UUID)
      isSlugRequest = true
      courseResponse = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseId)
        .single()
      
      if (courseResponse.error) {
        console.log('Course not found by slug, trying by ID...')
        courseResponse = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
      }
    }

    if (courseResponse.error || !courseResponse.data) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          details: `No course found with ${isUUID ? 'ID' : 'slug'}: ${courseId}`
        },
        { status: 404 }
      )
    }

    const course = courseResponse.data

    // Fetch all other data in parallel
    const [
      lessonsResponse,
      lessonProgressResponse,
      userStatsResponse,
      profileResponse,
      badgesResponse,
      xpEventsResponse,
      leaderboardResponse
    ] = await Promise.all([
      // Lessons
      supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true }),
      
      // Lesson progress
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId),
      
      // User stats
      supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // User profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      
      // User badges
      supabase
        .from('user_badges')
        .select('badge_id', { count: 'exact' })
        .eq('user_id', userId),
      
      // All XP events for this user
      supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId),
      
      // Leaderboard data (top 5 users)
      supabase
        .from('users_progress')
        .select(`
          user_id,
          level,
          xp,
          updated_at,
          profiles!inner (
            email,
            username,
            day_streak
          )
        `)
        .order('xp', { ascending: false })
        .limit(5)
    ])

    const lessons = lessonsResponse.data || []
    const lessonProgress = lessonProgressResponse.data || []
    const userStats = userStatsResponse.data || { level: 1, xp: 0, updated_at: new Date().toISOString() }
    const profile = profileResponse.data
    const badgesEarned = badgesResponse.count || 0
    const xpEvents = xpEventsResponse.data || []
    const leaderboardData = leaderboardResponse.data || []

    // Calculate course progress
    const totalLessons = lessons.length
    const completedLessons = lessonProgress.filter(lp => 
      lessons.some(l => l.id === lp.lesson_id) && lp.status === 'completed'
    ).length
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0

    // Calculate total XP earned from all events
    const totalXPEarned = xpEvents.reduce((sum: number, event: any) => sum + (event.amount || 0), 0)

    // Calculate total XP for this course
    const totalCourseXP = lessons.reduce((sum, lesson) => sum + (lesson.xp_reward || 50), 0)
    
    // Calculate XP earned from this course
    const earnedCourseXP = lessons.reduce((sum, lesson) => {
      const progressItem = lessonProgress.find(lp => lp.lesson_id === lesson.id)
      return progressItem?.status === 'completed' ? sum + (lesson.xp_reward || 50) : sum
    }, 0)

    // Calculate age group
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

    const getAgeGroup = (age: number | null): string => {
      if (!age) return 'all'
      if (age < 10) return 'young'
      if (age >= 10 && age <= 13) return 'tween'
      return 'teen'
    }

    const ageGroup = profile?.age_group || getAgeGroup(userAge)

    // Check if course is age appropriate
    const isAgeAppropriate = () => {
      if (!userAge) return true
      if (course.target_age_group === 'all') return true
      if (course.min_age && course.max_age) {
        return userAge >= course.min_age && userAge <= course.max_age
      }
      return course.target_age_group === ageGroup
    }

    // Check if course is unlocked (simplified logic)
    const isUnlocked = (() => {
      if (course.order_index === 0) return true
      // For now, return true - implement proper unlocking logic later
      return true
    })()

    // Ensure course has a slug
    const courseSlug = course.slug || generateSlug(course.title)

    // Prepare enriched course data
    const enrichedCourse = {
      id: course.id,
      title: course.title,
      description: course.description || '',
      order_index: course.order_index,
      min_age: course.min_age,
      max_age: course.max_age,
      target_age_group: course.target_age_group,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress_percentage: progressPercentage,
      is_unlocked: isUnlocked,
      is_age_appropriate: isAgeAppropriate(),
      ageGroup: course.target_age_group || 'all',
      minAge: course.min_age,
      maxAge: course.max_age,
      total_xp: totalCourseXP,
      earned_xp: earnedCourseXP,
      slug: courseSlug
    }

    // Prepare lessons data with slugs
    const enrichedLessons = lessons.map(lesson => ({
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content || '',
      order_index: lesson.order_index,
      xp_reward: lesson.xp_reward || 50,
      created_at: lesson.created_at,
      slug: lesson.slug || generateSlug(lesson.title)
    }))

    // Prepare lesson progress data
    const enrichedLessonProgress = lessonProgress
      .filter(lp => lessons.some(l => l.id === lp.lesson_id))
      .map(progress => ({
        lesson_id: progress.lesson_id,
        user_id: progress.user_id,
        status: progress.status as 'completed' | 'in_progress' | 'not_started',
        completed_at: progress.completed_at || undefined
      }))

    // Prepare user stats
    const enrichedUserStats = {
      level: userStats.level || 1,
      xp: userStats.xp || 0,
      total_xp_earned: totalXPEarned,
      badges_earned: badgesEarned,
      updated_at: userStats.updated_at || new Date().toISOString()
    }

    // Prepare leaderboard data
    const enrichedLeaderboard = leaderboardData.map((item: any) => ({
      id: item.user_id,
      email: item.profiles?.email || '',
      username: item.profiles?.username || '',
      users_progress: {
        level: item.level || 1,
        xp: item.xp || 0,
        updated_at: item.updated_at || new Date().toISOString()
      },
      day_streak: item.profiles?.day_streak || 0
    }))

    // Calculate course stats - FIXED: Using alternative approach for distinct counts
    let totalEnrolled = 0
    let activeLearners = 0
    let completedCourseUsers = 0

    // Get total enrolled users (distinct count)
    try {
      // First get all user progress for this course's lessons
      const { data: allProgress } = await supabase
        .from('lesson_progress')
        .select('user_id')
        .in('lesson_id', lessons.map(l => l.id))

      if (allProgress) {
        // Get distinct user IDs
        const distinctUserIds = [...new Set(allProgress.map(p => p.user_id))]
        totalEnrolled = distinctUserIds.length
      }
    } catch (error) {
      console.error('Error calculating total enrolled:', error)
    }

    // Get active learners (completed lessons in last 7 days)
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentProgress } = await supabase
        .from('lesson_progress')
        .select('user_id')
        .in('lesson_id', lessons.map(l => l.id))
        .gte('completed_at', weekAgo)
        .eq('status', 'completed')

      if (recentProgress) {
        const distinctActiveUserIds = [...new Set(recentProgress.map(p => p.user_id))]
        activeLearners = distinctActiveUserIds.length
      }
    } catch (error) {
      console.error('Error calculating active learners:', error)
    }

    // Get completed course users
    try {
      // Count users who have completed ALL lessons in this course
      // Simplified: Count users who have completed at least one lesson
      const { data: completedProgress } = await supabase
        .from('lesson_progress')
        .select('user_id')
        .in('lesson_id', lessons.map(l => l.id))
        .eq('status', 'completed')

      if (completedProgress) {
        const distinctCompletedUserIds = [...new Set(completedProgress.map(p => p.user_id))]
        completedCourseUsers = distinctCompletedUserIds.length
      }
    } catch (error) {
      console.error('Error calculating completed users:', error)
    }

    // Get user's position in course
    let userPosition = null
    if (enrichedLeaderboard.length > 0) {
      const userIndex = enrichedLeaderboard.findIndex(item => item.id === userId)
      userPosition = userIndex >= 0 ? userIndex + 1 : null
    }

    // Calculate success rate
    const successRate = totalEnrolled > 0 
      ? Math.round((completedCourseUsers || 0) / totalEnrolled * 100)
      : 0

    const courseStats = {
      userRank: progressPercentage >= 80 ? "Expert" : progressPercentage >= 50 ? "Intermediate" : "Beginner",
      activeLearners: activeLearners,
      successRate: successRate,
      averageCompletionTime: "3.2 days",
      totalEnrolled: totalEnrolled,
      userProgress: progressPercentage,
      totalUsers: enrichedLeaderboard.length || 0,
      userPosition: userPosition
    }

    // Prepare user info
    const userInfo = {
      id: userId,
      age: userAge,
      age_group: ageGroup,
      email: profile?.email,
      username: profile?.username,
      avatar: profile?.avatar_custom_url || null
    }

    const response = {
      success: true,
      data: {
        course: enrichedCourse,
        lessons: enrichedLessons,
        lessonProgress: enrichedLessonProgress,
        userStats: enrichedUserStats,
        courseStats,
        leaderboard: enrichedLeaderboard,
        userInfo,
        metadata: {
          is_slug_request: isSlugRequest,
          course_identifier: courseId,
          actual_course_id: course.id
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error fetching full course data:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch course data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}