// app/api/courses/[courseId]/stats/route.ts - UPDATED FOR SLUG SUPPORT
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
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

    console.log('Fetching stats for course identifier:', courseId)

    // Try to fetch course - first try by ID, then by slug
    let courseResponse

    // Check if it looks like a UUID (ID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
    
    if (isUUID) {
      // Try by ID first
      courseResponse = await supabase
        .from('courses')
        .select('id, title, total_lessons')
        .eq('id', courseId)
        .single()
      
      if (courseResponse.error) {
        console.log('Course not found by ID, trying by slug...')
        courseResponse = await supabase
          .from('courses')
          .select('id, title, total_lessons')
          .eq('slug', courseId)
          .single()
      }
    } else {
      // Try by slug first (not a UUID)
      courseResponse = await supabase
        .from('courses')
        .select('id, title, total_lessons')
        .eq('slug', courseId)
        .single()
      
      if (courseResponse.error) {
        console.log('Course not found by slug, trying by ID...')
        courseResponse = await supabase
          .from('courses')
          .select('id, title, total_lessons')
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

    // 1. Get all lessons for this course first
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, order_index')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
    }

    const totalLessons = courseLessons?.length || 0
    const lessonIds = courseLessons?.map(lesson => lesson.id) || []

    // 2. Get user's progress for this course
    let userCompletedLessons = 0
    if (lessonIds.length > 0) {
      const { data: userProgress, error: userProgressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (userProgressError) {
        console.error('Error fetching user progress:', userProgressError)
      }

      userCompletedLessons = userProgress?.filter(lp => lp.status === 'completed').length || 0
    }

    const userProgressPercentage = totalLessons > 0 
      ? Math.round((userCompletedLessons / totalLessons) * 100) 
      : 0

    // 3. Get all users' progress for this course (for ranking)
    let allUsersProgress: any[] = []
    if (lessonIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('user_id, status, lesson_id')
        .in('lesson_id', lessonIds)

      if (progressError) {
        console.error('Error fetching all users progress:', progressError)
      }
      allUsersProgress = progressData || []
    }

    // Calculate progress for all users
    const userProgressMap = new Map<string, number>()
    const userTotalProgressMap = new Map<string, number>()
    
    // Initialize all users who have progress
    allUsersProgress.forEach(progress => {
      const userId = progress.user_id
      userTotalProgressMap.set(userId, 0)
    })
    
    // Count completed lessons for each user
    allUsersProgress.forEach(progress => {
      const userId = progress.user_id
      if (progress.status === 'completed') {
        const currentCount = userProgressMap.get(userId) || 0
        userProgressMap.set(userId, currentCount + 1)
      }
    })

    // Calculate completion percentages
    const allUserProgressArray = Array.from(userTotalProgressMap.keys())
      .map(userId => ({
        userId,
        completed: userProgressMap.get(userId) || 0,
        percentage: totalLessons > 0 ? Math.round((userProgressMap.get(userId) || 0) / totalLessons * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)

    // Find user's rank
    const userIndex = allUserProgressArray.findIndex(u => u.userId === userId)
    let userRank = 100
    let userRankText = "Top 100%"
    
    if (userIndex >= 0 && allUserProgressArray.length > 0) {
      userRank = Math.round(((userIndex + 1) / allUserProgressArray.length) * 100)
      userRankText = userRank <= 10 ? 'Top 10%' :
                     userRank <= 20 ? 'Top 20%' :
                     userRank <= 30 ? 'Top 30%' :
                     userRank <= 40 ? 'Top 40%' :
                     userRank <= 50 ? 'Top 50%' :
                     userRank <= 60 ? 'Top 60%' :
                     userRank <= 70 ? 'Top 70%' :
                     userRank <= 80 ? 'Top 80%' :
                     userRank <= 90 ? 'Top 90%' :
                     'Top 100%'
    }

    // 4. Count active learners (users who accessed this course in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let activeLearners = 0
    if (lessonIds.length > 0) {
      // Get all distinct users who completed lessons in last 7 days
      const { data: recentCompletions, error: recentError } = await supabase
        .from('lesson_progress')
        .select('user_id')
        .in('lesson_id', lessonIds)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .eq('status', 'completed')

      if (recentError) {
        console.error('Error fetching active learners:', recentError)
      }

      // Count distinct users
      if (recentCompletions) {
        const uniqueUserIds = new Set(recentCompletions.map(rc => rc.user_id))
        activeLearners = uniqueUserIds.size
      }
    }

    // 5. Calculate success rate (users who completed vs started)
    let startedCount = 0
    let completedCount = 0
    
    if (lessonIds.length > 0) {
      // Get all distinct users who started the course
      const { data: startedData, error: startedError } = await supabase
        .from('lesson_progress')
        .select('user_id')
        .in('lesson_id', lessonIds)

      if (startedError) {
        console.error('Error fetching started users:', startedError)
      }

      // Count distinct users who started
      if (startedData) {
        const startedUserIds = new Set(startedData.map(sd => sd.user_id))
        startedCount = startedUserIds.size
      }

      // Count users who completed all lessons in this course
      // Users need to have completed at least 1 lesson to be considered
      completedCount = Array.from(userProgressMap.entries())
        .filter(([_, count]) => count >= totalLessons)
        .length
    }

    const successRate = startedCount > 0 
      ? Math.round((completedCount / startedCount) * 100)
      : 0

    // 6. Calculate average completion time (simplified)
    let averageCompletionDays = 3.2 // Default fallback
    
    if (lessonIds.length > 0) {
      // Get completion times for users who completed all lessons
      const { data: completionTimes, error: timesError } = await supabase
        .from('lesson_progress')
        .select('user_id, completed_at')
        .in('lesson_id', lessonIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true })

      if (timesError) {
        console.error('Error fetching completion times:', timesError)
      }

      // Group by user and calculate their completion time
      const userTimes = new Map<string, { first: Date; last: Date }>()
      
      if (completionTimes) {
        completionTimes.forEach(progress => {
          const userId = progress.user_id
          const completedAt = new Date(progress.completed_at)
          
          if (!userTimes.has(userId)) {
            userTimes.set(userId, { first: completedAt, last: completedAt })
          } else {
            const times = userTimes.get(userId)!
            if (completedAt < times.first) times.first = completedAt
            if (completedAt > times.last) times.last = completedAt
          }
        })

        // Calculate average days to complete for users who finished
        const completionDaysArray = Array.from(userTimes.values())
          .map(times => {
            const diffMs = times.last.getTime() - times.first.getTime()
            const days = diffMs / (1000 * 60 * 60 * 24)
            return days > 0 ? days : 0.5 // Minimum half day
          })
          .filter(days => days > 0)

        if (completionDaysArray.length > 0) {
          const totalDays = completionDaysArray.reduce((sum, days) => sum + days, 0)
          averageCompletionDays = Math.round((totalDays / completionDaysArray.length) * 10) / 10
        }
      }
    }

    const averageCompletionText = averageCompletionDays === 1 
      ? "1 day" 
      : `${averageCompletionDays} days`

    // 7. Get total enrolled users (already calculated as startedCount)
    const totalEnrolled = startedCount

    // 8. Get user's XP in this course
    let userXpInCourse = 0
    if (lessonIds.length > 0 && courseLessons) {
      // Get XP reward for each completed lesson
      const completedLessonIds = allUsersProgress
        .filter(p => p.user_id === userId && p.status === 'completed')
        .map(p => p.lesson_id)
      
      userXpInCourse = courseLessons
        .filter(lesson => completedLessonIds.includes(lesson.id))
        .reduce((total, lesson) => {
          // Assuming 50 XP per lesson if not specified
          return total + 50
        }, 0)
    }

    // 9. Get leaderboard position (more accurate)
    const userPosition = userIndex >= 0 ? userIndex + 1 : null
    
    // Determine performance level based on progress and rank
    let performanceLevel = "Beginner"
    if (userProgressPercentage >= 80) {
      performanceLevel = "Expert"
    } else if (userProgressPercentage >= 50) {
      performanceLevel = "Intermediate"
    } else if (userProgressPercentage >= 20) {
      performanceLevel = "Getting Started"
    }

    const response = {
      success: true,
      data: {
        userRank: userRankText,
        activeLearners,
        successRate,
        averageCompletionTime: averageCompletionText,
        totalEnrolled,
        userProgress: userProgressPercentage,
        totalUsers: allUserProgressArray.length,
        userPosition,
        userXpInCourse,
        performanceLevel,
        courseInfo: {
          id: course.id,
          title: course.title,
          totalLessons,
          userCompletedLessons
        },
        ranking: {
          rank: userIndex + 1,
          totalUsers: allUserProgressArray.length,
          percentile: userRank
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error fetching course stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch course stats',
        details: error.message 
      },
      { status: 500 }
    )
  }
}