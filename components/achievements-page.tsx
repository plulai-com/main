// components/achievements-page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Star, 
  Award, 
  Zap, 
  Flame, 
  Crown, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Filter,
  Search,
  X,
  Sparkles,
  Clock,
  Gem,
  Shield,
  Sword,
  Heart,
  Brain,
  Code,
  Palette,
  Music,
  Globe,
  Bot,
  Users,
  ArrowLeft,
  Share2,
  BadgeCheck,
  Copy,
  ExternalLink,
  Info,
  AlertCircle,
  BrainCircuit
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/client"

interface AchievementsPageProps {
  initialData: any
  userId: string
}

interface Badge {
  id: string
  name: string
  description: string
  icon_url?: string
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  xp_required?: number
  isEarned: boolean
  earned_at?: string
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  streakLogs: Array<{
    date: string
    hasActivity: boolean
  }>
}

interface Stats {
  earnedBadgesCount: number
  totalBadges: number
  completionPercentage: number
  currentLevel: number
  currentXP: number
  currentStreak: number
  longestStreak: number
  completedLessons: number
  completedCourses: number
  totalLogins: number
  nextXPMilestone: { badge: string; xp: number }
  progressToNext: number
  rarityCounts: {
    common: number
    uncommon: number
    rare: number
    epic: number
    legendary: number
  }
}

export function AchievementsPage({ initialData, userId }: AchievementsPageProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(!initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rarity' | 'name'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'badges' | 'progress' | 'stats'>('badges')
  const [stats, setStats] = useState<Stats>(initialData?.stats || {
    earnedBadgesCount: 0,
    totalBadges: 0,
    completionPercentage: 0,
    currentLevel: 1,
    currentXP: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedLessons: 0,
    completedCourses: 0,
    totalLogins: 0,
    nextXPMilestone: { badge: 'Next Milestone', xp: 500 },
    progressToNext: 0,
    rarityCounts: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    }
  })
  const [allBadges, setAllBadges] = useState<Badge[]>(initialData?.allBadges || [])
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>(initialData?.earnedBadges || [])
  const [xpHistory, setXpHistory] = useState<Array<{date: string, xp: number}>>(initialData?.xpHistory || [])
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: initialData?.currentStreak || 0,
    longestStreak: initialData?.longestStreak || 0,
    streakLogs: initialData?.streakLogs || []
  })

  // Fetch earned badges and streak data on component mount
  useEffect(() => {
    if (!userId) return
    
    const fetchAchievementsData = async () => {
      setIsLoading(true)
      try {
        // 1. Fetch earned badges only
        const { data: userBadgesData, error: userBadgesError } = await supabase
          .from('user_badges')
          .select(`
            *,
            badges (*)
          `)
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })

        if (userBadgesError) throw userBadgesError

        // 2. Fetch all badges for reference
        const { data: allBadgesData, error: allBadgesError } = await supabase
          .from('badges')
          .select('*')

        if (allBadgesError) throw allBadgesError

        // 3. Fetch streak data from daily_logins
        const { data: streakLogs, error: streakError } = await supabase
          .from('daily_logins')
          .select('login_date')
          .eq('user_id', userId)
          .order('login_date', { ascending: false })
          .limit(35)

        if (streakError) throw streakError

        // 4. Fetch profile for streak stats
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('day_streak, longest_streak, last_login_date, total_logins')
          .eq('id', userId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') throw profileError

        // 5. Fetch user progress for XP
        const { data: progressData, error: progressError } = await supabase
          .from('users_progress')
          .select('xp, level')
          .eq('user_id', userId)
          .single()

        // 6. Fetch XP events for history
        const { data: xpEventsData, error: xpEventsError } = await supabase
          .from('xp_events')
          .select('amount, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30)

        // 7. Fetch completed lessons count
        const { data: lessonProgress, error: lessonError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('status', 'completed')

        // Process earned badges
        const earnedBadgesList: Badge[] = (userBadgesData || []).map(ub => ({
          id: ub.badges?.id || '',
          name: ub.badges?.name || 'Unnamed Badge',
          description: ub.badges?.description || 'No description',
          icon_url: ub.badges?.icon_url,
          category: ub.badges?.category || 'general',
          rarity: (ub.badges?.rarity as any) || 'common',
          xp_required: ub.badges?.xp_required,
          isEarned: true,
          earned_at: ub.earned_at
        }))

        // Process all badges (mark which are earned)
        const allBadgesList: Badge[] = (allBadgesData || []).map(badge => {
          const isEarned = earnedBadgesList.some(eb => eb.id === badge.id)
          return {
            id: badge.id,
            name: badge.name || 'Unnamed Badge',
            description: badge.description || 'No description',
            icon_url: badge.icon_url,
            category: badge.category || 'general',
            rarity: (badge.rarity as any) || 'common',
            xp_required: badge.xp_required,
            isEarned,
            earned_at: isEarned 
              ? earnedBadgesList.find(eb => eb.id === badge.id)?.earned_at
              : undefined
          }
        })

        // Calculate streak logs for calendar
        const today = new Date()
        const streakLogsList = Array.from({ length: 35 }).map((_, i) => {
          const date = new Date(today)
          date.setDate(today.getDate() - (34 - i))
          const dateStr = date.toISOString().split('T')[0]
          const hasActivity = (streakLogs || []).some(log => {
            const logDate = new Date(log.login_date)
            return logDate.toISOString().split('T')[0] === dateStr
          })
          return {
            date: dateStr,
            hasActivity
          }
        })

        // Calculate current streak
        let currentStreak = profileData?.day_streak || 0
        const lastLoginDate = profileData?.last_login_date
        
        // If last login was yesterday or today, streak continues
        if (lastLoginDate) {
          const lastDate = new Date(lastLoginDate)
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(today.getDate() - 1)
          
          const isYesterday = lastDate.toDateString() === yesterday.toDateString()
          const isToday = lastDate.toDateString() === today.toDateString()
          
          if (!isToday && !isYesterday) {
            // If last login was more than 1 day ago, streak is broken
            currentStreak = 0
          }
        }

        // Calculate XP history (last 7 days)
        const xpHistoryList = (xpEventsData || []).reduce((acc: Array<{date: string, xp: number}>, event) => {
          const date = new Date(event.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
          const existing = acc.find(item => item.date === date)
          if (existing) {
            existing.xp += event.amount
          } else {
            acc.push({ date, xp: event.amount })
          }
          return acc
        }, [])

        // Calculate rarity counts
        const rarityCounts = {
          common: 0,
          uncommon: 0,
          rare: 0,
          epic: 0,
          legendary: 0
        }
        
        earnedBadgesList.forEach(badge => {
          if (badge.rarity in rarityCounts) {
            rarityCounts[badge.rarity as keyof typeof rarityCounts]++
          }
        })

        // Update states
        setEarnedBadges(earnedBadgesList)
        setAllBadges(allBadgesList)
        setStreakData({
          currentStreak,
          longestStreak: profileData?.longest_streak || 0,
          streakLogs: streakLogsList
        })
        setXpHistory(xpHistoryList.slice(0, 7).reverse())
        
        // Update stats
        const completedLessonsCount = lessonProgress?.length || 0
        
        setStats({
          earnedBadgesCount: earnedBadgesList.length,
          totalBadges: allBadgesList.length,
          completionPercentage: Math.round((earnedBadgesList.length / Math.max(allBadgesList.length, 1)) * 100),
          currentLevel: progressData?.level || 1,
          currentXP: progressData?.xp || 0,
          currentStreak: currentStreak,
          longestStreak: profileData?.longest_streak || 0,
          completedLessons: completedLessonsCount,
          completedCourses: 0, // You can add course completion logic
          totalLogins: profileData?.total_logins || 0,
          nextXPMilestone: { 
            badge: 'Novice Learner', 
            xp: Math.ceil((progressData?.xp || 0) / 500) * 500 + 500 
          },
          progressToNext: progressData?.xp ? (progressData.xp % 500) / 5 : 0,
          rarityCounts
        })

      } catch (error) {
        console.error('Error fetching achievements:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAchievementsData()
  }, [userId, supabase])

  // Real-time subscription for new badges
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('achievements-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // Fetch the new badge details
          const { data: badge } = await supabase
            .from('badges')
            .select('*')
            .eq('id', payload.new.badge_id)
            .single()
          
          if (badge) {
            const newBadge: Badge = {
              id: badge.id,
              name: badge.name || 'Unnamed Badge',
              description: badge.description || 'No description',
              icon_url: badge.icon_url,
              category: badge.category || 'general',
              rarity: badge.rarity || 'common',
              xp_required: badge.xp_required,
              isEarned: true,
              earned_at: payload.new.earned_at
            }
            
            setEarnedBadges(prev => [newBadge, ...prev])
            setAllBadges(prev => 
              prev.map(b => b.id === badge.id ? newBadge : b)
            )
            
            // Update stats - FIXED: Added type annotation to prev parameter
            setStats((prev: Stats) => ({
              ...prev,
              earnedBadgesCount: (prev.earnedBadgesCount || 0) + 1,
              completionPercentage: Math.round(((prev.earnedBadgesCount || 0) + 1) / Math.max(prev.totalBadges || 1, 1) * 100)
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Function to update streak when user logs in or completes a lesson
  const updateUserStreak = async () => {
    if (!userId) return

    try {
      // Record today's login
      const today = new Date().toISOString().split('T')[0]
      
      const { error: loginError } = await supabase
        .from('daily_logins')
        .upsert({
          user_id: userId,
          login_date: today
        }, {
          onConflict: 'user_id,login_date'
        })

      if (loginError) throw loginError

      // Update profile with streak info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('day_streak, longest_streak, last_login_date, total_logins')
        .eq('id', userId)
        .single()
      if (profileData) {
        const lastLoginDate = profileData.last_login_date ? new Date(profileData.last_login_date) : null
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        
        let newStreak = profileData.day_streak || 0
        
        if (!lastLoginDate) {
          // First login
          newStreak = 1
        } else if (lastLoginDate.toDateString() === yesterday.toDateString()) {
          // Consecutive day
          newStreak += 1
        } else if (lastLoginDate.toDateString() === today.toDateString()) {
          // Already logged in today
          newStreak = newStreak
        } else {
          // Streak broken
          newStreak = 1
        }

        // Update profile with new streak
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            day_streak: newStreak,
            longest_streak: Math.max(profileData.longest_streak || 0, newStreak),
            last_login_date: today.toISOString().split('T')[0],
            total_logins: (profileData.total_logins || 0) + 1
          })
          .eq('id', userId)

        if (updateError) throw updateError

        // Refresh streak data
        setStreakData(prev => ({
          ...prev,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak)
        }))

        setStats((prev: Stats) => ({
          ...prev,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          totalLogins: (prev.totalLogins || 0) + 1
        }))

        // Refresh streak logs
        const { data: newStreakLogs } = await supabase
          .from('daily_logins')
          .select('login_date')
          .eq('user_id', userId)
          .order('login_date', { ascending: false })
          .limit(35)

        if (newStreakLogs) {
          const today = new Date()
          const streakLogsList = Array.from({ length: 35 }).map((_, i) => {
            const date = new Date(today)
            date.setDate(today.getDate() - (34 - i))
            const dateStr = date.toISOString().split('T')[0]
            const hasActivity = newStreakLogs.some(log => {
              const logDate = new Date(log.login_date)
              return logDate.toISOString().split('T')[0] === dateStr
            })
            return {
              date: dateStr,
              hasActivity
            }
          })
          
          setStreakData(prev => ({
            ...prev,
            streakLogs: streakLogsList
          }))
        }
      }

    } catch (error) {
      console.error('Error updating streak:', error)
    }
  }

  // Check and update streak when component loads
  useEffect(() => {
    if (!userId) return
    
    const checkAndUpdateStreak = async () => {
      const today = new Date().toISOString().split('T')[0]
      
      // Check if user has logged in today
      const { data: todayLogin } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', userId)
        .eq('login_date', today)
        .single()

      if (!todayLogin) {
        await updateUserStreak()
      }
    }

    checkAndUpdateStreak()
  }, [userId, supabase])

  // Filter and sort badges
  const filteredBadges = allBadges
    .filter(badge => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        (badge.name && badge.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (badge.description && badge.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory
      
      // Rarity filter
      const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity
      
      return matchesSearch && matchesCategory && matchesRarity
    })
    .sort((a, b) => {
      // Sort logic
      switch (sortBy) {
        case 'date':
          if (a.isEarned && b.isEarned && a.earned_at && b.earned_at) {
            return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
          }
          return a.isEarned ? -1 : b.isEarned ? 1 : 0
        case 'rarity':
          const rarityOrder: Record<string, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 }
          return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        default:
          return 0
      }
    })

  // Get all categories
  const categories = ['all', ...new Set(allBadges.map(b => b.category || 'general').filter(Boolean))]

  // Get rarity colors
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-200'
      case 'uncommon': return 'text-green-600 bg-green-100 border-green-200'
      case 'rare': return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'epic': return 'text-purple-600 bg-purple-100 border-purple-200'
      case 'legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />
      case 'uncommon': return <Gem className="w-4 h-4" />
      case 'rare': return <Shield className="w-4 h-4" />
      case 'epic': return <Sword className="w-4 h-4" />
      case 'legendary': return <Crown className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category?: string) => {
    // Handle null/undefined/empty string
    if (!category || typeof category !== 'string') {
      return <Trophy className="w-5 h-5" />
    }
    
    try {
      const categoryLower = category.toLowerCase()
      
      switch (categoryLower) {
        case 'ai': 
        case 'artificial intelligence':
          return <Brain className="w-5 h-5" />
        case 'code': 
        case 'programming':
          return <Code className="w-5 h-5" />
        case 'design': 
        case 'art':
        case 'creative':
          return <Palette className="w-5 h-5" />
        case 'music': 
        case 'audio':
          return <Music className="w-5 h-5" />
        case 'web': 
        case 'internet':
          return <Globe className="w-5 h-5" />
        case 'robot': 
        case 'robotics':
          return <Bot className="w-5 h-5" />
        case 'community': 
        case 'social':
          return <Users className="w-5 h-5" />
        case 'streak': 
        case 'consistency':
          return <Flame className="w-5 h-5" />
        case 'xp': 
        case 'experience':
          return <Zap className="w-5 h-5" />
        case 'speed': 
        case 'fast':
          return <Clock className="w-5 h-5" />
        case 'math':
        case 'logic':
          return <BrainCircuit className="w-5 h-5" />
        default: 
          return <Trophy className="w-5 h-5" />
      }
    } catch (error) {
      // Fallback in case of any error
      return <Trophy className="w-5 h-5" />
    }
  }

  // Calculate next badge progress
  const nextUnearnedBadge = allBadges.find(b => !b.isEarned)
  const nextBadgeProgress = nextUnearnedBadge?.xp_required 
    ? Math.min(((stats.currentXP || 0) / nextUnearnedBadge.xp_required) * 100, 100)
    : 0

  // Share achievements
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Learning Achievements',
        text: `I've earned ${stats.earnedBadgesCount || 0} badges and reached Level ${stats.currentLevel || 1} on the learning platform!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // Show toast notification
      // You can add a toast notification here
    }
  }

  if (isLoading && !initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"
          />
          <div className="text-lg font-bold text-foreground">
            Loading achievements...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Achievements</h1>
                <p className="text-sm text-muted-foreground">
                  Celebrate your learning journey
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto">
            {[
              { id: 'badges' as const, label: 'Badges', icon: Trophy, count: stats.earnedBadgesCount || 0 },
              { id: 'progress' as const, label: 'Progress', icon: TrendingUp },
              { id: 'stats' as const, label: 'Statistics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Summary Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-primary font-medium mb-1">Badges Earned</div>
                    <div className="text-3xl font-bold text-foreground">
                      {stats.earnedBadgesCount || 0}
                      <span className="text-sm text-muted-foreground font-normal ml-2">
                        / {stats.totalBadges || 0}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionPercentage || 0}%` }}
                      transition={{ duration: 1.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Collection</span>
                    <span className="font-bold">{stats.completionPercentage || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium mb-1">Current Level</div>
                    <div className="text-3xl font-bold text-foreground">
                      {stats.currentLevel || 1}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    {stats.currentXP || 0} XP
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/5 to-orange-600/10 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600 font-medium mb-1">Learning Streak</div>
                    <div className="text-3xl font-bold text-foreground">
                      {streakData.currentStreak || 0} days
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    Longest: {streakData.longestStreak || 0} days
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 border-emerald-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-emerald-600 font-medium mb-1">Completed</div>
                    <div className="text-3xl font-bold text-foreground">
                      {stats.completedLessons || 0}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    {stats.completedCourses || 0} courses
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content based on active tab */}
          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Filters */}
              <Card className="sticky top-24 z-30 bg-background/80 backdrop-blur-sm border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search badges..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {(category || 'general').charAt(0).toUpperCase() + (category || 'general').slice(1)}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedRarity}
                        onChange={(e) => setSelectedRarity(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="all">All Rarities</option>
                        <option value="legendary">Legendary</option>
                        <option value="epic">Epic</option>
                        <option value="rare">Rare</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="common">Common</option>
                      </select>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="date">Recently Earned</option>
                        <option value="rarity">Rarity</option>
                        <option value="name">Name</option>
                      </select>

                      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={cn(
                            "p-2 rounded-md transition-colors",
                            viewMode === 'grid' ? "bg-background shadow-sm" : "hover:bg-muted/80"
                          )}
                        >
                          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="w-full h-full bg-current" />
                            ))}
                          </div>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={cn(
                            "p-2 rounded-md transition-colors",
                            viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-muted/80"
                          )}
                        >
                          <div className="w-4 h-4 flex flex-col justify-between">
                            <div className="w-full h-0.5 bg-current" />
                            <div className="w-full h-0.5 bg-current" />
                            <div className="w-full h-0.5 bg-current" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badges Grid/List */}
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                  : "grid-cols-1"
              )}>
                <AnimatePresence>
                  {filteredBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedBadge(badge)}
                      className="cursor-pointer"
                    >
                      {viewMode === 'grid' ? (
                        <Card className={cn(
                          "relative overflow-hidden h-full transition-all duration-300",
                          badge.isEarned 
                            ? "border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-amber-500/5"
                            : "border-border bg-card/50 opacity-70"
                        )}>
                          <CardContent className="p-4">
                            {/* Rarity indicator */}
                            <div className="absolute top-2 right-2">
                              <div className={cn(
                                "p-1 rounded-full",
                                getRarityColor(badge.rarity).split(' ')[1]
                              )}>
                                {getRarityIcon(badge.rarity)}
                              </div>
                            </div>

                            {/* Badge Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 relative">
                              {badge.isEarned ? (
                                <>
                                  <div className="absolute inset-0 rounded-full opacity-20 animate-pulse bg-gradient-to-r from-yellow-500 to-amber-500" />
                                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                                    <Trophy className="w-8 h-8 text-white" />
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                                  <Trophy className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Badge Info */}
                            <div className="text-center">
                              <h3 className={cn(
                                "font-bold text-sm mb-1",
                                badge.isEarned ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {badge.name || 'Unnamed Badge'}
                              </h3>
                              <div className={cn(
                                "text-xs mb-2",
                                badge.isEarned ? "text-muted-foreground" : "text-muted-foreground/60"
                              )}>
                                {badge.category || 'General'}
                              </div>
                              
                              {badge.isEarned && badge.earned_at && (
                                <div className="text-xs text-muted-foreground">
                                  {new Date(badge.earned_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className={cn(
                          "transition-all duration-300",
                          badge.isEarned 
                            ? "border-l-4 border-yellow-500"
                            : "border-border"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Badge Icon */}
                              <div className="relative">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center",
                                  badge.isEarned
                                    ? "bg-gradient-to-br from-yellow-500 to-amber-500"
                                    : "bg-muted"
                                )}>
                                  <Trophy className={cn(
                                    "w-6 h-6",
                                    badge.isEarned ? "text-white" : "text-muted-foreground"
                                  )} />
                                </div>
                                {badge.isEarned && (
                                  <div className="absolute -top-1 -right-1">
                                    <BadgeCheck className="w-5 h-5 text-green-500" />
                                  </div>
                                )}
                              </div>

                              {/* Badge Info */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className={cn(
                                    "font-bold",
                                    badge.isEarned ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {badge.name || 'Unnamed Badge'}
                                  </h3>
                                  <div className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    getRarityColor(badge.rarity)
                                  )}>
                                    {badge.rarity || 'common'}
                                  </div>
                                </div>
                                <p className={cn(
                                  "text-sm mt-1",
                                  badge.isEarned ? "text-muted-foreground" : "text-muted-foreground/60"
                                )}>
                                  {badge.description || 'No description available'}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {getCategoryIcon(badge.category)}
                                    <span>{badge.category || 'General'}</span>
                                  </div>
                                  {badge.isEarned && badge.earned_at && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      <span>Earned {new Date(badge.earned_at).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Empty State */}
              {filteredBadges.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 mx-auto mb-6 opacity-30">
                    <Trophy className="w-full h-full text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    No badges found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Try adjusting your filters or search term to find badges
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* XP Progress */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">XP Progress</h3>
                      <p className="text-muted-foreground">Track your learning journey</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{stats.currentXP || 0} XP</div>
                      <div className="text-sm text-muted-foreground">Total Earned</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Next Milestone</span>
                        <span className="font-bold text-foreground">
                          {stats.nextXPMilestone?.badge || 'Novice Learner'} ({stats.nextXPMilestone?.xp || 500} XP)
                        </span>
                      </div>
                      <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.progressToNext || 0}%` }}
                          transition={{ duration: 1.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {stats.currentXP || 0} / {stats.nextXPMilestone?.xp || 500} XP
                      </div>
                    </div>

                    {/* XP History Chart */}
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h4>
                      {xpHistory.length > 0 ? (
                        <div className="h-32 flex items-end gap-1">
                          {xpHistory.map((day, index: number) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.min((day.xp / 100) * 100, 100)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="w-3/4 bg-gradient-to-t from-primary to-primary-glow rounded-t"
                              />
                              <div className="text-xs text-muted-foreground mt-2">{day.date}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent XP activity
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Streak Calendar */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Learning Streak</h3>
                      <p className="text-muted-foreground">Daily learning consistency</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-6 h-6 text-orange-500" />
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">{streakData.currentStreak || 0} days</div>
                        <div className="text-sm text-muted-foreground">Current streak</div>
                      </div>
                    </div>
                  </div>

                  {/* Streak Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-sm font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    
                    {streakData.streakLogs.map((log, i) => {
                      const date = new Date(log.date)
                      const isToday = date.toDateString() === new Date().toDateString()
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs",
                            log.hasActivity 
                              ? "bg-gradient-to-br from-orange-500 to-red-500 text-white" 
                              : isToday 
                                ? "border-2 border-orange-500/30" 
                                : "bg-muted/30"
                          )}
                        >
                          {date.getDate()}
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Rarity Distribution */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-6">Badge Rarity Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(stats.rarityCounts || {}).map(([rarity, count]: [string, any]) => (
                      <div key={rarity} className="text-center">
                        <div className={cn(
                          "w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center",
                          getRarityColor(rarity).split(' ')[1]
                        )}>
                          {getRarityIcon(rarity)}
                        </div>
                        <div className="text-2xl font-bold text-foreground">{count || 0}</div>
                        <div className="text-sm text-muted-foreground capitalize">{rarity}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">Learning Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Learning Time</span>
                        <span className="font-bold text-foreground">--</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Average Lessons/Day</span>
                        <span className="font-bold text-foreground">
                          {stats.totalLogins > 0 
                            ? ((stats.completedLessons || 0) / Math.max(stats.totalLogins || 1, 1)).toFixed(1)
                            : '0.0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">XP/Day Average</span>
                        <span className="font-bold text-foreground">
                          {stats.totalLogins > 0 
                            ? Math.round((stats.currentXP || 0) / Math.max(stats.totalLogins || 1, 1))
                            : '0'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">Milestones</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">First Badge</span>
                        <span className="font-bold text-foreground">
                          {earnedBadges.length > 0 && earnedBadges[earnedBadges.length - 1]?.earned_at
                            ? new Date(earnedBadges[earnedBadges.length - 1].earned_at!).toLocaleDateString()
                            : '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Latest Badge</span>
                        <span className="font-bold text-foreground">
                          {earnedBadges.length > 0 && earnedBadges[0]?.earned_at
                            ? new Date(earnedBadges[0].earned_at!).toLocaleDateString()
                            : '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Most Common Rarity</span>
                        <span className="font-bold text-foreground capitalize">
                          {Object.entries(stats.rarityCounts || {}).reduce((a: any, b: any) => 
                            b[1] > a[1] ? b : a, ['common', 0])[0]}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBadge(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <CardContent className="p-8">
                {/* Badge Header */}
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto mb-6 relative">
                    <div className="absolute inset-0 rounded-full opacity-20 animate-pulse bg-gradient-to-r from-yellow-500 to-amber-500" />
                    <div className={cn(
                      "relative w-full h-full rounded-full flex items-center justify-center",
                      selectedBadge.isEarned
                        ? "bg-gradient-to-br from-yellow-500 to-amber-500"
                        : "bg-muted"
                    )}>
                      <Trophy className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <div className={cn(
                        "p-2 rounded-full",
                        getRarityColor(selectedBadge.rarity).split(' ')[1]
                      )}>
                        {getRarityIcon(selectedBadge.rarity)}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {selectedBadge.name || 'Unnamed Badge'}
                  </h3>
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium",
                    getRarityColor(selectedBadge.rarity)
                  )}>
                    {(selectedBadge.rarity || 'common').charAt(0).toUpperCase() + (selectedBadge.rarity || 'common').slice(1)}
                  </div>
                </div>

                {/* Badge Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                    <p className="text-foreground">{selectedBadge.description || 'No description available'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Category</h4>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(selectedBadge.category)}
                        <span className="font-medium">{selectedBadge.category || 'General'}</span>
                      </div>
                    </div>

                    {selectedBadge.xp_required && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">XP Required</h4>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">{selectedBadge.xp_required} XP</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedBadge.isEarned && selectedBadge.earned_at && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Earned On</h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(selectedBadge.earned_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {!selectedBadge.isEarned && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-medium text-foreground">How to Earn</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Continue learning and completing lessons to unlock this badge.
                        {selectedBadge.xp_required && ` You need ${selectedBadge.xp_required} XP total.`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedBadge(null)}
                  >
                    Close
                  </Button>
                  {selectedBadge.isEarned && (
                    <Button
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}