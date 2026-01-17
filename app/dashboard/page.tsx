// app/dashboard/page.tsx
import { createClient } from "@/lib/server"
import { DashboardUI } from "@/components/dashboard-ui"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  try {
    // Fetch all data in parallel for optimal performance
    const [
      profileResult,
      progressResult,
      coursesResult,
      badgesResult,
      lessonProgressResult,
      certificatesResult,
      friendsResult,
      weeklyXPResult,
      dailyActivityResult,
      leaderboardResult,
      xpEventsAllResult
    ] = await Promise.all([
      // User profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      
      // User progress (level, XP)
      supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // Courses with lessons
      supabase
        .from('courses')
        .select(`
          *,
          lessons (
            *,
            lesson_steps (*)
          )
        `)
        .order('order_index', { ascending: true }),
      
      // User badges with badge details
      supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId),
      
      // Lesson progress
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      
      // Certificates
      supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId),
      
      // Friends count
      supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted'),
      
      // Weekly XP (last 7 days)
      supabase
        .from('xp_events')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Daily activity (lessons completed today)
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0]),
      
      // Leaderboard (top 20)
      supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_custom_url,
          avatar_id,
          date_of_birth,
          day_streak,
          users_progress!inner (
            level,
            xp
          )
        `)
        .order('xp', { foreignTable: 'users_progress', ascending: false })
        .limit(20),
      
      // All XP events for XP history chart
      supabase
        .from('xp_events')
        .select('amount, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(30)
    ])

    // Calculate age from date of birth
    const calculateAge = (birthDate: Date) => {
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }

    // Handle profile data
    const profile = profileResult.data || {
      id: userId,
      email: session.user.email,
      username: session.user.email?.split('@')[0] || 'User',
      day_streak: 0,
      date_of_birth: null,
      age_group: 'all'
    }

    // Handle progress data - create if doesn't exist
    let progress = progressResult.data
    if (!progress && !progressResult.error) {
      const { data: newProgress } = await supabase
        .from('users_progress')
        .insert({
          user_id: userId,
          level: 1,
          xp: 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      progress = newProgress
    }

    // Calculate age and age group
    let age: number | null = null
    let ageGroup = profile.age_group || 'all'
    
    if (profile.date_of_birth) {
      age = calculateAge(new Date(profile.date_of_birth))
      
      // Determine age group if not already set
      if (!profile.age_group) {
        if (age < 10) ageGroup = 'young'
        else if (age >= 10 && age <= 13) ageGroup = 'tween'
        else if (age >= 14) ageGroup = 'teen'
      }
    }

    // Calculate weekly XP
    const weeklyXP = (weeklyXPResult.data || []).reduce((sum: number, event: any) => sum + event.amount, 0)
    
    // Calculate daily activity
    const dailyActivity = dailyActivityResult.data?.length || 0
    
    // Calculate total completed lessons
    const totalCompletedLessons = lessonProgressResult.data?.length || 0
    
    // Calculate completed courses
    const completedCourses = certificatesResult.data?.length || 0
    
    // Transform badges
    const badges = (badgesResult.data || []).map((ub: any) => ub.badges)
    const badgesCount = badges.length
    
    // Calculate friends count
    const friendsCount = friendsResult.data?.length || 0
    
    // Calculate certificates count
    const certificatesCount = certificatesResult.data?.length || 0
    
    // Get user streak
    const streak = profile.day_streak || 0
    
    // Get user progress
    const currentLevel = progress?.level || 1
    const userXP = progress?.xp || 0
    
    // Calculate leaderboard rank
    const leaderboard = leaderboardResult.data || []
    const userRank = leaderboard.findIndex((user: any) => user.id === userId) + 1

    // Calculate XP progress for chart
    const xpHistory = xpEventsAllResult.data || []
    
    // Prepare dashboard data structure
    const dashboardData = {
      profile,
      progress: progress || { 
        user_id: userId, 
        level: 1, 
        xp: 0, 
        updated_at: new Date().toISOString() 
      },
      courses: coursesResult.data || [],
      badges,
      lessonProgress: lessonProgressResult.data || [],
      stepProgress: [], // Note: You might want to fetch step_progress separately if needed
      certificates: certificatesResult.data || [],
      weeklyXP,
      dailyActivity,
      leaderboard,
      userRank,
      xpHistory
    }

    // Prepare stats object
    const stats = {
      weeklyXP,
      dailyActivity,
      totalCompletedLessons,
      completedCourses,
      badgesCount,
      streak,
      currentLevel,
      userXP,
      friendsCount,
      certificatesCount,
      ageGroup,
      age
    }

    // Combine everything into initialData
    const initialData = {
      ...dashboardData,
      stats
    }

    return (
      <DashboardUI 
        initialData={initialData}
        userId={userId}
      />
    )
    
  } catch (error) {
    console.error('Error loading dashboard:', error)
    
    // Fallback minimal data on error
    const initialData = {
      profile: { 
        id: userId, 
        email: session.user.email,
        username: session.user.email?.split('@')[0] || 'User',
        day_streak: 0
      },
      progress: { 
        user_id: userId, 
        level: 1, 
        xp: 0, 
        updated_at: new Date().toISOString() 
      },
      courses: [],
      badges: [],
      lessonProgress: [],
      stepProgress: [],
      certificates: [],
      weeklyXP: 0,
      dailyActivity: 0,
      leaderboard: [],
      userRank: 0,
      xpHistory: [],
      stats: {
        weeklyXP: 0,
        dailyActivity: 0,
        totalCompletedLessons: 0,
        completedCourses: 0,
        badgesCount: 0,
        streak: 0,
        currentLevel: 1,
        userXP: 0,
        friendsCount: 0,
        certificatesCount: 0,
        ageGroup: 'all',
        age: null
      }
    }

    return (
      <DashboardUI
        initialData={initialData}
        userId={userId}
      />
    )
  }
}