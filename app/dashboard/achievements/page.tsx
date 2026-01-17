// app/dashboard/achievements/page.tsx
import { createClient } from "@/lib/server"
import { AchievementsPage } from "@/components/achievements-page"
import { redirect } from "next/navigation"

export default async function AchievementsPageWrapper() {
  const supabase = await createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  try {
    // Fetch all data needed for achievements page
    const [
      profileResult,
      progressResult,
      badgesResult,
      allBadgesResult,
      lessonProgressResult,
      certificatesResult,
      xpEventsResult,
      userBadgesResult,
      streakLogsResult
    ] = await Promise.all([
      // User profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      
      // User progress
      supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // User's earned badges with details
      supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false }),
      
      // All available badges
      supabase
        .from('badges')
        .select('*')
        .order('rarity', { ascending: true }),
      
      // Lesson progress for completion stats
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId),
      
      // Certificates for course completion
      supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId),
      
      // XP events for progress tracking
      supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // All user badges for filtering
      supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId),
      
      // Streak logs for consistency tracking
      supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', userId)
        .order('login_date', { ascending: false })
        .limit(30)
    ])

    // Helper function to transform badge data with proper defaults
    const transformBadge = (badge: any) => ({
      id: badge?.id || '',
      name: badge?.name || 'Unnamed Badge',
      description: badge?.description || 'No description available',
      icon_url: badge?.icon_url || null,
      category: badge?.category || 'general',
      rarity: badge?.rarity || 'common',
      xp_required: badge?.xp_required || 0
    })

    // Handle profile with defaults
    const profile = profileResult.data || {
      id: userId,
      email: session.user.email,
      username: session.user.email?.split('@')[0] || 'User',
      day_streak: 0,
      longest_streak: 0,
      total_logins: 0
    }

    // Handle progress with defaults
    const progress = progressResult.data || {
      user_id: userId,
      level: 1,
      xp: 0,
      updated_at: new Date().toISOString()
    }

    // Transform earned badges with safe defaults
    const earnedBadges = (badgesResult.data || []).map((ub: any) => ({
      ...transformBadge(ub.badges || {}),
      earned_at: ub.earned_at,
      user_badge_id: ub.id,
      isEarned: true
    }))

    // Get all badges and mark which ones are earned
    const allBadges = (allBadgesResult.data || []).map((badge: any) => ({
      ...transformBadge(badge),
      isEarned: earnedBadges.some((eb: any) => eb.id === badge?.id),
      earned_at: earnedBadges.find((eb: any) => eb.id === badge?.id)?.earned_at
    }))

    // Calculate completion stats
    const completedLessons = (lessonProgressResult.data || []).filter((lp: any) => lp.status === 'completed').length
    const completedCourses = certificatesResult.data?.length || 0
    const totalXPEarned = (xpEventsResult.data || []).reduce((sum: number, event: any) => sum + (event.amount || 0), 0)
    
    // Calculate streak data
    const streakLogs = streakLogsResult.data || []
    const currentStreak = profile.day_streak || 0
    const longestStreak = profile.longest_streak || 0
    
    // Group XP events by date for chart
    const xpByDate = (xpEventsResult.data || []).reduce((acc: any, event: any) => {
      const date = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!acc[date]) {
        acc[date] = { xp: 0, events: 0 }
      }
      acc[date].xp += (event.amount || 0)
      acc[date].events += 1
      return acc
    }, {})

    // Calculate XP milestones
    const xpMilestones = [
      { xp: 500, badge: 'Novice Learner', earned: progress.xp >= 500 },
      { xp: 1000, badge: 'Skilled Student', earned: progress.xp >= 1000 },
      { xp: 2000, badge: 'Master Explorer', earned: progress.xp >= 2000 },
      { xp: 5000, badge: 'Dedicated Scholar', earned: progress.xp >= 5000 },
      { xp: 10000, badge: 'Legendary Master', earned: progress.xp >= 10000 }
    ]

    // Group badges by category
    const badgesByCategory = allBadges.reduce((acc: any, badge: any) => {
      const category = badge.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(badge)
      return acc
    }, {})

    // Calculate next milestones
    const nextXPMilestone = xpMilestones.find(m => !m.earned) || { xp: 10000, badge: 'Legendary Master' }
    const progressToNext = nextXPMilestone ? ((progress.xp / nextXPMilestone.xp) * 100) : 100

    // Calculate rarity counts
    const rarityCounts = {
      common: allBadges.filter((b: any) => b.rarity === 'common' && b.isEarned).length,
      uncommon: allBadges.filter((b: any) => b.rarity === 'uncommon' && b.isEarned).length,
      rare: allBadges.filter((b: any) => b.rarity === 'rare' && b.isEarned).length,
      epic: allBadges.filter((b: any) => b.rarity === 'epic' && b.isEarned).length,
      legendary: allBadges.filter((b: any) => b.rarity === 'legendary' && b.isEarned).length
    }

    // Calculate achievement progress
    const totalBadges = allBadges.length
    const earnedBadgesCount = earnedBadges.length
    const completionPercentage = totalBadges > 0 ? Math.round((earnedBadgesCount / totalBadges) * 100) : 0

    // Prepare streak logs for calendar
    const formattedStreakLogs = streakLogs.map((log: any) => ({
      date: log.login_date,
      hasLogin: true
    }))

    // Prepare XP history for chart
    const xpHistory = Object.entries(xpByDate).map(([date, data]: [string, any]) => ({
      date,
      xp: data.xp,
      events: data.events
    })).slice(0, 7).reverse()

    // Get all categories for filters
    const categories = ['all', ...new Set(allBadges.map((b: any) => b.category || 'general').filter(Boolean))]

    // Prepare initial data
    const initialData = {
      profile,
      progress,
      allBadges,
      earnedBadges,
      badgesByCategory,
      categories,
      stats: {
        totalXPEarned,
        currentLevel: progress.level,
        currentXP: progress.xp,
        nextXPMilestone,
        progressToNext,
        completedLessons,
        completedCourses,
        currentStreak,
        longestStreak,
        totalLogins: profile.total_logins || 0,
        earnedBadgesCount,
        totalBadges,
        completionPercentage,
        rarityCounts
      },
      xpHistory,
      xpMilestones,
      streakLogs: formattedStreakLogs
    }

    return (
      <AchievementsPage 
        initialData={initialData}
        userId={userId}
      />
    )
    
  } catch (error) {
    console.error('Error loading achievements page:', error)
    
    // Fallback data with safe defaults
    const initialData = {
      profile: { 
        id: userId, 
        username: session.user.email?.split('@')[0] || 'User',
        day_streak: 0,
        total_logins: 0
      },
      progress: { 
        level: 1, 
        xp: 0,
        user_id: userId
      },
      allBadges: [],
      earnedBadges: [],
      badgesByCategory: {},
      categories: ['all', 'general'],
      stats: {
        totalXPEarned: 0,
        currentLevel: 1,
        currentXP: 0,
        nextXPMilestone: { xp: 500, badge: 'Novice Learner' },
        progressToNext: 0,
        completedLessons: 0,
        completedCourses: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalLogins: 0,
        earnedBadgesCount: 0,
        totalBadges: 0,
        completionPercentage: 0,
        rarityCounts: {
          common: 0,
          uncommon: 0,
          rare: 0,
          epic: 0,
          legendary: 0
        }
      },
      xpHistory: [],
      xpMilestones: [],
      streakLogs: []
    }

    return (
      <AchievementsPage
        initialData={initialData}
        userId={userId}
      />
    )
  }
}