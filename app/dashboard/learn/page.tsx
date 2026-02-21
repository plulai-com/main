// app/dashboard/learn/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { getSession } from '@/lib/auth'
import LearnContent from './learn-content'

// Import types from learn-content or define matching ones
interface DatabaseCourse {
  id: string
  title: string
  description: string
  order_index: number
  min_age: number | null
  max_age: number | null
  target_age_group: string
  created_at: string
  slug: string | null  // ADDED: Include slug field
}

interface DatabaseLesson {
  id: string
  course_id: string
  title: string
  content: string
  order_index: number
  xp_reward: number
  created_at: string
}

// Use the same types as learn-content.tsx (WITH slug)
interface Course {
  course_id: string
  title: string
  description: string
  order_index: number
  min_age: number | null
  max_age: number | null
  target_age_group: string
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
  is_unlocked: boolean
  is_age_appropriate: boolean
  slug: string  // ADDED: This matches learn-content.tsx
}

// Use optional properties to match learn-content.tsx
interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  order_index: number
  xp_reward: number
  created_at: string
}

interface LessonProgress {
  lesson_id: string
  user_id: string
  status: 'completed' | 'in_progress' | 'not_started'
  completed_at?: string  // Changed to optional to match learn-content.tsx
}

interface XP_Event {
  id: string
  user_id: string
  amount: number
  reason: string
  lesson_id?: string  // Keep optional to match learn-content.tsx
  course_id?: string  // Keep optional to match learn-content.tsx
  created_at: string
  metadata?: any
}

interface DatabaseProfile {
  id: string
  email: string
  username: string | null
  date_of_birth: string | null
  age_group: string | null
}

interface DatabaseUserProgress {
  level: number
  xp: number
  updated_at: string
}

interface DatabaseXP_Event {
  id: string
  user_id: string
  amount: number
  reason: string
  lesson_id: string | null
  course_id: string | null
  created_at: string
  metadata: any | null
}

export const metadata: Metadata = {
  title: 'Learn | CodeNest',
  description: 'Continue your coding journey with personalized learning paths'
}

// Helper function to get week start date (Monday)
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

export default async function LearnPage() {
  // Get user session
  const session = await getSession()
  
  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const supabase = await createClient()

  try {
    // Fetch all data directly from Supabase
    console.log('Fetching data for user:', userId)
    
    const [
      coursesResponse,
      lessonsResponse,
      lessonProgressResponse,
      profileResponse,
      weeklyProgressResponse,
      userStatsResponse,
      badgesResponse,
      xpEventsResponse,
      leaderboardResponse
    ] = await Promise.all([
      // 1. Get all courses (INCLUDING SLUG)
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
        .eq('reason', 'lesson_completed'),

      // 9. Get leaderboard data (top 10 users by XP)
      supabase
        .from('users_progress')
        .select(`
          user_id,
          level,
          xp,
          updated_at,
          profiles!inner (
            id,
            email,
            username,
            day_streak,
            date_of_birth,
            age_group
          )
        `)
        .order('xp', { ascending: false })
        .limit(10)
    ])

    // Check for errors
    const errors = [
      coursesResponse.error,
      lessonsResponse.error,
      lessonProgressResponse.error,
      profileResponse.error,
      weeklyProgressResponse.error,
      userStatsResponse.error,
      badgesResponse.error,
      xpEventsResponse.error,
      leaderboardResponse.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.warn('Some database queries had errors:', errors.map(e => e?.message))
      // Continue with partial data
    }

    // Process data with defaults
    const coursesData: DatabaseCourse[] = coursesResponse.data || []
    const lessonsData: DatabaseLesson[] = lessonsResponse.data || []
    const lessonProgressData = lessonProgressResponse.data || []
    const profileData: DatabaseProfile = profileResponse.data || { 
      id: userId, 
      email: '', 
      username: null, 
      date_of_birth: null, 
      age_group: null 
    }
    const weeklyEventsData: DatabaseXP_Event[] = weeklyProgressResponse.data || []
    const userStatsData: DatabaseUserProgress = userStatsResponse.data || { 
      level: 1, 
      xp: 0, 
      updated_at: new Date().toISOString() 
    }
    const badgesEarned = badgesResponse.count || 0
    const allXPEvents: DatabaseXP_Event[] = xpEventsResponse.data || []
    const leaderboardData = leaderboardResponse.data || []

    // Calculate user age if date_of_birth exists
    let userAge: number | null = null
    if (profileData?.date_of_birth) {
      const birthDate = new Date(profileData.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      userAge = age
    }

    // Get age group (from profile or calculate)
    const ageGroup = profileData?.age_group || calculateAgeGroup(userAge)

    // Calculate total weekly XP
    const weeklyTotalXP = weeklyEventsData.reduce((sum: number, event: DatabaseXP_Event) => 
      sum + (event.amount || 0), 0
    )

    // Calculate completed lessons count
    const completedLessonsCount = lessonProgressData.filter((lp: any) => 
      lp.status === 'completed'
    ).length

    // Calculate total XP earned
    const totalXPEarned = allXPEvents.reduce((sum: number, event: DatabaseXP_Event) => 
      sum + (event.amount || 0), 0
    )

    // Calculate course-specific stats
    const enrichedCourses: Course[] = coursesData.map((course: DatabaseCourse) => {
      // Get lessons for this course
      const courseLessons = lessonsData.filter((lesson: DatabaseLesson) => 
        lesson.course_id === course.id
      )
      const totalLessons = courseLessons.length
      
      // Calculate completed lessons for this course
      const completedLessons = lessonProgressData.filter((progress: any) => {
        const lesson = lessonsData.find((l: DatabaseLesson) => l.id === progress.lesson_id)
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
        const previousCourse = coursesData.find((c: DatabaseCourse) => 
          c.order_index === course.order_index - 1
        )
        if (!previousCourse) return true
        
        // Get completed lessons in previous course
        const previousCompleted = lessonProgressData.filter((progress: any) => {
          const lesson = lessonsData.find((l: DatabaseLesson) => l.id === progress.lesson_id)
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

      // Get or generate slug
      const slug = course.slug || generateSlug(course.title)

      return {
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
        is_unlocked: isUnlocked,
        is_age_appropriate: isAgeAppropriate,
        slug: slug  // ADDED: Include the slug
      }
    })

    // Process leaderboard data
    const leaderboard = leaderboardData.map((item: any) => {
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

      return {
        id: item.user_id,
        email: profile?.email || '',
        username: profile?.username,
        users_progress: {
          level: item.level || 1,
          xp: item.xp || 0,
          updated_at: item.updated_at || new Date().toISOString()
        },
        day_streak: profile?.day_streak || 0,
        age_group: profile?.age_group,
        age
      }
    })

    // Prepare dashboard data
    const dashboardData = {
      profile: {
        id: profileData.id,
        email: profileData.email,
        username: profileData.username,
        age: userAge,
        age_group: ageGroup,
        highest_week: Math.floor(userStatsData.xp / 1000) + 1,
        current_week: Math.floor(weeklyTotalXP / 100) + 1
      },
      stats: {
        total_courses: coursesData.length,
        completed_courses: enrichedCourses.filter((c: Course) => c.progress_percentage === 100).length,
        active_courses: enrichedCourses.filter((c: Course) => 
          c.progress_percentage > 0 && c.progress_percentage < 100
        ).length,
        total_lessons: lessonsData.length,
        completed_lessons: completedLessonsCount,
        total_xp_earned: totalXPEarned
      }
    }

    // Prepare lessons data
    const lessons: Lesson[] = lessonsData.map((lesson: DatabaseLesson) => ({
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content,
      order_index: lesson.order_index,
      xp_reward: lesson.xp_reward,
      created_at: lesson.created_at
    }))

    // Prepare lesson progress data - Convert null to undefined
    const lessonProgress: LessonProgress[] = lessonProgressData.map((progress: any) => ({
      lesson_id: progress.lesson_id,
      user_id: progress.user_id,
      status: progress.status,
      completed_at: progress.completed_at || undefined // Convert null to undefined
    }))

    // Prepare weekly progress data - Convert null to undefined
    const weeklyProgress = {
      totalXP: weeklyTotalXP,
      events: weeklyEventsData.map((event: DatabaseXP_Event) => ({
        id: event.id,
        user_id: event.user_id,
        amount: event.amount,
        reason: event.reason,
        lesson_id: event.lesson_id || undefined, // Convert null to undefined
        course_id: event.course_id || undefined, // Convert null to undefined
        created_at: event.created_at,
        metadata: event.metadata
      }))
    }

    // Prepare user stats
    const userStats = {
      level: userStatsData.level || 1,
      xp: userStatsData.xp || 0,
      total_xp_earned: totalXPEarned,
      badges_earned: badgesEarned,
      updated_at: userStatsData.updated_at || new Date().toISOString()
    }

    return (
      <div className="min-h-screen bg-background">
        <LearnContent
          dashboardData={dashboardData}
          courses={enrichedCourses}
          lessons={lessons}
          lessonProgress={lessonProgress}
          leaderboard={leaderboard}
          weeklyProgress={weeklyProgress}
          completedLessonsCount={completedLessonsCount}
          userStats={userStats}
          userAge={userAge}
          ageGroup={ageGroup}
          userId={userId}
        />
      </div>
    )

  } catch (error) {
    console.error('Error loading learn page:', error)
    
    // Show error state but still render the component with fallback data
    const fallbackData = await fetchFallbackData(userId, supabase)
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Unable to load complete data
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing limited information. Some features may not be available.
            </p>
          </div>
          
          <LearnContent
            dashboardData={fallbackData.dashboardData}
            courses={fallbackData.courses}
            lessons={fallbackData.lessons}
            lessonProgress={fallbackData.lessonProgress}
            leaderboard={fallbackData.leaderboard}
            weeklyProgress={fallbackData.weeklyProgress}
            completedLessonsCount={fallbackData.lessonProgress?.filter((lp: LessonProgress) => 
              lp.status === 'completed'
            ).length || 0}
            userStats={fallbackData.userStats}
            userAge={fallbackData.userAge}
            ageGroup={fallbackData.ageGroup}
            userId={userId}
          />
        </div>
      </div>
    )
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Fallback data fetching function
async function fetchFallbackData(userId: string, supabase: any) {
  try {
    // Fetch basic data directly from database as fallback
    const [
      coursesResponse,
      lessonsResponse,
      lessonProgressResponse,
      profileResponse,
      userStatsResponse
    ] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true }),
      
      supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true }),
      
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      
      supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single()
    ])

    // Calculate user age
    let userAge: number | null = null
    if (profileResponse.data?.date_of_birth) {
      const birthDate = new Date(profileResponse.data.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      userAge = age
    }

    // Calculate age group
    const calculateAgeGroup = (age: number | null): string => {
      if (!age) return 'all'
      if (age < 10) return 'young'
      if (age >= 10 && age <= 13) return 'tween'
      return 'teen'
    }

    const ageGroup = profileResponse.data?.age_group || calculateAgeGroup(userAge)

    // Process courses with basic stats (INCLUDING SLUG)
    const courses: Course[] = coursesResponse.data?.map((course: any) => {
      const slug = course.slug || generateSlug(course.title)
      
      return {
        course_id: course.id,
        title: course.title,
        description: course.description || '',
        order_index: course.order_index,
        min_age: course.min_age,
        max_age: course.max_age,
        target_age_group: course.target_age_group,
        total_lessons: 0, // Will be calculated on frontend
        completed_lessons: 0, // Will be calculated on frontend
        progress_percentage: 0,
        is_unlocked: course.order_index === 0, // Only first course unlocked
        is_age_appropriate: true, // Default to true in fallback
        slug: slug  // ADDED: Include slug in fallback too
      }
    }) || []

    // Calculate completed lessons count
    const completedLessonsCount = lessonProgressResponse.data?.filter((lp: any) => 
      lp.status === 'completed'
    ).length || 0

    // Basic dashboard data
    const dashboardData = {
      profile: {
        id: userId,
        email: profileResponse.data?.email,
        username: profileResponse.data?.username,
        age: userAge,
        age_group: ageGroup,
        highest_week: 1,
        current_week: 1
      },
      stats: {
        total_courses: courses.length,
        completed_courses: 0,
        active_courses: 0,
        total_lessons: lessonsResponse.data?.length || 0,
        completed_lessons: completedLessonsCount,
        total_xp_earned: 0
      }
    }

    // Map lessons data
    const lessons: Lesson[] = lessonsResponse.data?.map((lesson: any) => ({
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content,
      order_index: lesson.order_index,
      xp_reward: lesson.xp_reward,
      created_at: lesson.created_at
    })) || []

    // Map lesson progress data - Convert null to undefined
    const lessonProgress: LessonProgress[] = lessonProgressResponse.data?.map((progress: any) => ({
      lesson_id: progress.lesson_id,
      user_id: progress.user_id,
      status: progress.status,
      completed_at: progress.completed_at || undefined // Convert null to undefined
    })) || []

    return {
      dashboardData,
      courses,
      lessons,
      lessonProgress,
      leaderboard: [],
      weeklyProgress: {
        totalXP: 0,
        events: []
      },
      userStats: {
        level: userStatsResponse.data?.level || 1,
        xp: userStatsResponse.data?.xp || 0,
        total_xp_earned: 0,
        badges_earned: 0,
        updated_at: userStatsResponse.data?.updated_at || new Date().toISOString()
      },
      userAge,
      ageGroup
    }
  } catch (error) {
    console.error('Fallback data fetch error:', error)
    
    // Return empty data structure as last resort
    return {
      dashboardData: {
        profile: {
          id: userId,
          highest_week: 1,
          current_week: 1
        },
        stats: {
          total_courses: 0,
          completed_courses: 0,
          active_courses: 0,
          total_lessons: 0,
          completed_lessons: 0,
          total_xp_earned: 0
        }
      },
      courses: [],
      lessons: [],
      lessonProgress: [],
      leaderboard: [],
      weeklyProgress: {
        totalXP: 0,
        events: []
      },
      userStats: {
        level: 1,
        xp: 0,
        total_xp_earned: 0,
        badges_earned: 0,
        updated_at: new Date().toISOString()
      },
      userAge: null,
      ageGroup: 'all'
    }
  }
}