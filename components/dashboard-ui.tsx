"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  Trophy,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Zap,
  Users,
  Award,
  Target,
  Gamepad2,
  Sparkles,
  Compass,
  Rocket,
  Clock,
  ArrowRight,
  Crown,
  Flame,
  Brain,
  Palette,
  Music,
  Globe,
  Bot,
  Shield,
  Code,
  BrainCircuit,
  Gem,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Book,
  Grid,
  Bell,
  Settings,
  X,
  TrendingUp,
  BarChart3,
  Home,
  GamepadIcon,
  Brain as BrainIcon,
  Zap as ZapIcon,
  User,
  Users as People,
  Gift,
  ExternalLink,
  Eye,
  EyeOff,
  PieChart,
  Activity,
  Thermometer,
  CloudSun,
  CloudRain,
  Sun,
  Moon,
  TreePine,
  AlertCircle,
  AlertTriangle,
  Info,
  Plus,
  Minus,
  Divide,
  MousePointer,
  MousePointer2,
  Hand,
  ThumbsUp,
  ThumbsDown,
  StarHalf,
  HeartCrack,
  HeartHandshake,
  HeartPulse,
  BarChart,
  LineChart,
  Terminal,
  Server,
  Cloud,
  Database,
  CircuitBoard,
  Cpu as CpuIcon,
  GitBranch,
  Globe as GlobeIcon,
  Target as TargetIcon,
  List,
  Check,
  AlertCircle as AlertCircleIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/client"

interface DashboardUIProps {
  initialData?: any
  userId: string
}

interface DashboardData {
  profile: any
  progress: any
  courses: any[]
  badges: any[]
  lessonProgress: any[]
  stepProgress: any[]
  certificates: any[]
  weeklyXP: number
  dailyActivity: number
  leaderboard: any[]
  userRank: number
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'badge' | 'leaderboard' | 'achievement' | 'streak' | 'reminder' | 'lesson' | 'xp';
  is_read: boolean;
  metadata: any;
  created_at: string;
  expires_at?: string;
}

export function DashboardUI({ initialData, userId }: DashboardUIProps) {
  const [isLoading, setIsLoading] = useState(!initialData)
  const [navigating, setNavigating] = useState<string | null>(null)
  const [showAllCourses, setShowAllCourses] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showNotifications, setShowNotifications] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [parallaxOffset, setParallaxOffset] = useState(0)
  
  // State for all data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData || null)
  const [stats, setStats] = useState({
    weeklyXP: initialData?.weeklyXP || 0,
    dailyActivity: initialData?.dailyActivity || 0,
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
  })
  const [courses, setCourses] = useState<any[]>(initialData?.courses || [])
  const [badges, setBadges] = useState<any[]>(initialData?.badges || [])
  const [leaderboard, setLeaderboard] = useState<any[]>(initialData?.leaderboard || [])
  const [userRank, setUserRank] = useState(initialData?.userRank || 0)
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastLeaderboardNotification, setLastLeaderboardNotification] = useState<string | null>(null)
  const [isCheckingLeaderboard, setIsCheckingLeaderboard] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      // Fetch all data in parallel
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
        notificationsResult
      ] = await Promise.all([
        // User profile
        supabase.from("profiles").select("*").eq("id", userId).single(),
        
        // User progress (level, XP)
        supabase.from("users_progress").select("*").eq("user_id", userId).single(),
        
        // Courses with lessons and steps
        supabase
          .from("courses")
          .select(`
            *,
            lessons (
              *,
              lesson_steps (*)
            )
          `)
          .order("order_index", { ascending: true }),
        
        // User badges
        supabase
          .from("user_badges")
          .select(`
            *,
            badges (*)
          `)
          .eq("user_id", userId),
        
        // Lesson progress
        supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "completed"),
        
        // Certificates
        supabase
          .from("certificates")
          .select("*")
          .eq("user_id", userId),
        
        // Friends count
        supabase
          .from("friends")
          .select("*")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq("status", "accepted"),
        
        // Weekly XP
        supabase
          .from("xp_events")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Daily activity (lessons completed today)
        supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", new Date().toISOString().split('T')[0]),
        
        // Leaderboard (simplified - you might want to optimize this)
        supabase
          .from("profiles")
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
          .order("xp", { foreignTable: "users_progress", ascending: false })
          .limit(20),

        // Notifications
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20)
      ])

      // Calculate stats
            // Calculate stats
      const weeklyXP = (weeklyXPResult.data || []).reduce((sum, event) => sum + event.amount, 0)
      const dailyActivity = dailyActivityResult.data?.length || 0
      const totalCompletedLessons = lessonProgressResult.data?.length || 0
      const completedCourses = certificatesResult.data?.length || 0
      const badgesCount = badgesResult.data?.length || 0
      const streak = profileResult.data?.day_streak || 0
      const currentLevel = progressResult.data?.level || 1
      const userXP = progressResult.data?.xp || 0
      const friendsCount = friendsResult.data?.length || 0
      const certificatesCount = certificatesResult.data?.length || 0
      const ageGroup = profileResult.data?.age_group || 'all'
      const age = profileResult.data?.date_of_birth 
        ? calculateAge(new Date(profileResult.data.date_of_birth))
        : null

      // Calculate user rank from leaderboard
      const leaderboardData = leaderboardResult.data || []
      const userRank = leaderboardData.findIndex((user: any) => user.id === userId) + 1

      // Process notifications
      const notificationsData = notificationsResult.data || []
      const unreadNotifications = notificationsData.filter(n => !n.is_read).length

      // Find last leaderboard notification
      const lastLeaderboardNotif = notificationsData.find(n => n.type === 'leaderboard')

      // Update states
      setDashboardData({
        profile: profileResult.data,
        progress: progressResult.data,
        courses: coursesResult.data || [],
        badges: badgesResult.data?.map((ub: any) => ub.badges) || [],
        lessonProgress: lessonProgressResult.data || [],
        stepProgress: [], // You might need to fetch this separately
        certificates: certificatesResult.data || [],
        weeklyXP,
        dailyActivity,
        leaderboard: leaderboardData,
        userRank
      })

      setStats({
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
        age: age ?? 0  // ← FIXED: Convert null to 0
      })

      setCourses(coursesResult.data || [])
      setBadges(badgesResult.data?.map((ub: any) => ub.badges) || [])
      setLeaderboard(leaderboardData)
      setUserRank(userRank)
      // Set notification states
      setNotifications(notificationsData)
      setUnreadCount(unreadNotifications)
      if (lastLeaderboardNotif) {
        setLastLeaderboardNotification(lastLeaderboardNotif.created_at)
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to calculate age from date of birth
  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Initial data fetch
  useEffect(() => {
    if (!initialData) {
      fetchDashboardData()
    } else {
      // If we have initialData, calculate derived stats
      const totalCompletedLessons = initialData.lessonProgress?.length || 0
      const completedCourses = initialData.certificates?.length || 0
      const badgesCount = initialData.badges?.length || 0
      
      setStats(prev => ({
        ...prev,
        totalCompletedLessons,
        completedCourses,
        badgesCount,
        streak: initialData.profile?.day_streak || prev.streak,
        currentLevel: initialData.progress?.level || prev.currentLevel,
        userXP: initialData.progress?.xp || prev.userXP
      }))

      // Fetch notifications on initial load
      fetchNotifications()
    }
  }, [userId, initialData])

  // Fetch notifications function
  const fetchNotifications = async () => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      if (data) {
        setNotifications(data)
        const unread = data.filter(n => !n.is_read).length
        setUnreadCount(unread)
        
        // Check for last leaderboard notification
        const lastLeaderboard = data.find(n => n.type === 'leaderboard')
        if (lastLeaderboard) {
          setLastLeaderboardNotification(lastLeaderboard.created_at)
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
      
      if (error) throw error
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
      
      if (error) throw error
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Create notification
  const createNotification = async (title: string, message: string, type: Notification['type'], metadata?: any) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          metadata: metadata || {},
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expires in 30 days
        })
        .select()
      
      if (error) throw error
      
      // Update local state
      if (data && data[0]) {
        setNotifications(prev => [data[0], ...prev])
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  // Check and send daily leaderboard notification
  const checkAndSendLeaderboardNotification = async () => {
    if (!userId || isCheckingLeaderboard) return
    
    setIsCheckingLeaderboard(true)
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      
      // Check if we already sent a leaderboard notification today
      if (lastLeaderboardNotification) {
        const lastDate = new Date(lastLeaderboardNotification).toISOString().split('T')[0]
        if (lastDate === today) {
          return // Already sent today
        }
      }
      
      // Get current leaderboard rank
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("profiles")
        .select(`
          id,
          users_progress!inner (level, xp)
        `)
        .order("xp", { foreignTable: "users_progress", ascending: false })
      
      if (leaderboardError) throw leaderboardError
      
      const leaderboardArray = leaderboardData || []
      const userRank = leaderboardArray.findIndex((user: any) => user.id === userId) + 1
      const totalUsers = leaderboardArray.length
      
      if (userRank > 0) {
        // Create leaderboard notification
        let message = ""
        
        if (userRank <= 3) {
          message = `🏆 You're #${userRank} on the leaderboard! Top ${userRank === 1 ? '1st' : userRank === 2 ? '2nd' : '3rd'} place!`
        } else if (userRank <= 10) {
          message = `🔥 You're #${userRank} on the leaderboard! Top 10!`
        } else {
          const percentile = Math.round((userRank / totalUsers) * 100)
          message = `📊 You're #${userRank} on the leaderboard - top ${percentile}% of learners!`
        }
        
        // Store the current date as last notification date
        setLastLeaderboardNotification(now.toISOString())
        
        // Create the notification
        await createNotification(
          "Leaderboard Update",
          message,
          'leaderboard',
          { rank: userRank, total_users: totalUsers, date: today }
        )
      }
    } catch (error) {
      console.error("Error checking leaderboard notification:", error)
    } finally {
      setIsCheckingLeaderboard(false)
    }
  }

  // Initialize notification system
  useEffect(() => {
    if (!userId) return
    
    // Fetch existing notifications
    fetchNotifications()
    
    // Check for daily leaderboard notification after a short delay
    const leaderboardTimer = setTimeout(() => {
      checkAndSendLeaderboardNotification()
    }, 2000) // Wait 2 seconds after load
    
    // Set up interval for daily checks (every 4 hours)
    const interval = setInterval(() => {
      checkAndSendLeaderboardNotification()
    }, 4 * 60 * 60 * 1000) // Check every 4 hours
    
    return () => {
      clearTimeout(leaderboardTimer)
      clearInterval(interval)
    }
  }, [userId])

  // Real-time subscription for badge awards
  useEffect(() => {
    if (!userId) return

    const badgeChannel = supabase
      .channel('user-badges-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          try {
            // Fetch badge details
            const { data: badge, error: badgeError } = await supabase
              .from('badges')
              .select('*')
              .eq('id', payload.new.badge_id)
              .single()
            
            if (badgeError) throw badgeError
            
            if (badge) {
              // Create congratulatory notification
              await createNotification(
                "🎉 New Badge Earned!",
                `Congratulations! You earned the "${badge.name}" badge! ${badge.description || 'Keep up the great work!'}`,
                'badge',
                { 
                  badge_id: badge.id,
                  badge_name: badge.name,
                  badge_rarity: badge.rarity,
                  earned_at: payload.new.earned_at
                }
              )
              
              // Update badges list
              setBadges(prev => [...prev, badge])
              setStats(prev => ({
                ...prev,
                badgesCount: prev.badgesCount + 1
              }))
            }
          } catch (error) {
            console.error("Error handling badge notification:", error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(badgeChannel)
    }
  }, [userId])

  // Real-time subscription for XP events (for streak notifications)
  useEffect(() => {
    if (!userId) return

    const xpChannel = supabase
      .channel('xp-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_events',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          try {
            // Check if this is a streak-related XP event
            if (payload.new.event_type === 'streak_bonus') {
              // Get current streak
              const { data: profile } = await supabase
                .from('profiles')
                .select('day_streak')
                .eq('id', userId)
                .single()
              
              if (profile && profile.day_streak > 0) {
                // Create streak notification for special milestones
                if (profile.day_streak === 7) {
                  await createNotification(
                    "🔥 7-Day Streak!",
                    "Amazing! You've maintained a 7-day learning streak! You're building great habits!",
                    'streak',
                    { streak_days: 7 }
                  )
                } else if (profile.day_streak === 30) {
                  await createNotification(
                    "🏆 30-Day Streak!",
                    "Legendary! You've maintained a 30-day learning streak! You're unstoppable!",
                    'streak',
                    { streak_days: 30 }
                  )
                }
              }
            }
          } catch (error) {
            console.error("Error handling XP event notification:", error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(xpChannel)
    }
  }, [userId])

  // Real-time subscription for notifications
  useEffect(() => {
    if (!userId) return

    const notificationChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            setNotifications(prev => [payload.new as Notification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
            )
            // Update unread count
            const unread = notifications.filter(n => !n.is_read).length
            setUnreadCount(unread)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationChannel)
    }
  }, [userId, notifications])

  // Real-time subscriptions for live updates (existing code)
  useEffect(() => {
    if (!userId) return

    const channels = [
      // XP events
      supabase
        .channel('xp-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'xp_events',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            setStats(prev => ({
              ...prev,
              weeklyXP: prev.weeklyXP + (payload.new.amount || 0),
              userXP: prev.userXP + (payload.new.amount || 0)
            }))
          }
        )
        .subscribe(),

      // User progress updates
      supabase
        .channel('user-progress')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users_progress',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.new) {
              setStats(prev => ({
                ...prev,
                currentLevel: payload.new.level || prev.currentLevel,
                userXP: payload.new.xp || prev.userXP
              }))
            }
          }
        )
        .subscribe(),

      // Lesson progress updates
      supabase
        .channel('lesson-progress')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lesson_progress',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            if (payload.new.status === 'completed') {
              setStats(prev => ({
                ...prev,
                totalCompletedLessons: prev.totalCompletedLessons + 1,
                dailyActivity: prev.dailyActivity + 1
              }))

              // Send lesson completion notification for milestone lessons
              try {
                const { data: lesson } = await supabase
                  .from('lessons')
                  .select('title, xp_reward')
                  .eq('id', payload.new.lesson_id)
                  .single()
                
                if (lesson) {
                  // Check if this is a milestone (every 5 lessons)
                  const newTotal = stats.totalCompletedLessons + 1
                  if (newTotal % 5 === 0) {
                    await createNotification(
                      "🎯 Lesson Milestone!",
                      `You've completed ${newTotal} lessons! ${lesson.title} earned you ${lesson.xp_reward} XP!`,
                      'lesson',
                      { lesson_count: newTotal, lesson_title: lesson.title, xp_earned: lesson.xp_reward }
                    )
                  }
                }
              } catch (error) {
                console.error("Error creating lesson notification:", error)
              }
            }
          }
        )
        .subscribe(),

      // Badge awards (now handled separately with more detailed notifications)
      supabase
        .channel('user-badges')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_badges',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            // Fetch the badge details
            const { data: badge } = await supabase
              .from('badges')
              .select('*')
              .eq('id', payload.new.badge_id)
              .single()
            
            if (badge) {
              setBadges(prev => [...prev, badge])
              setStats(prev => ({
                ...prev,
                badgesCount: prev.badgesCount + 1
              }))
            }
          }
        )
        .subscribe(),

      // Profile updates (streak)
      supabase
        .channel('profiles')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          async (payload) => {
            if (payload.new.day_streak !== undefined) {
              const oldStreak = stats.streak
              const newStreak = payload.new.day_streak
              
              setStats(prev => ({
                ...prev,
                streak: payload.new.day_streak
              }))

              // Send streak notification for daily login
              if (newStreak > oldStreak && newStreak === 1) {
                await createNotification(
                  "🔥 Streak Started!",
                  "You started a learning streak! Come back tomorrow to keep it going!",
                  'streak',
                  { streak_days: 1 }
                )
              }
            }
          }
        )
        .subscribe()
    ]

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [userId, stats.totalCompletedLessons, stats.streak])

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = window.scrollY
        const offset = scrollTop * 0.5
        setParallaxOffset(offset)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // XP progress calculations
  const levelProgress = stats.userXP % 1000 // Since each level is 1000 XP
  const completedLessons = stats.totalCompletedLessons
  const totalLessons = courses.reduce((acc, course) => acc + (course.lessons?.length || 0), 0)

  // Helper functions
  const getLevelColor = (level: number) => {
    if (level >= 10) return 'from-purple-600 via-pink-600 to-purple-700'
    if (level >= 7) return 'from-blue-600 via-indigo-600 to-blue-700'
    if (level >= 4) return 'from-green-500 via-emerald-600 to-green-600'
    return 'from-yellow-500 via-orange-500 to-yellow-600'
  }

  const getCourseGradient = (index: number, title: string = "") => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('ai') || titleLower.includes('brain')) return "from-purple-600 via-pink-500 to-purple-700"
    if (titleLower.includes('game')) return "from-orange-500 via-red-500 to-orange-600"
    if (titleLower.includes('art')) return "from-pink-500 via-rose-500 to-pink-600"
    if (titleLower.includes('web')) return "from-blue-500 via-cyan-500 to-blue-600"
    if (titleLower.includes('code')) return "from-green-500 via-emerald-500 to-green-600"
    if (titleLower.includes('robot')) return "from-cyan-500 via-blue-500 to-cyan-600"
    if (titleLower.includes('math')) return "from-indigo-500 via-purple-500 to-indigo-600"
    
    const gradients = [
      "from-blue-500 via-cyan-500 to-blue-600",
      "from-green-500 via-emerald-500 to-green-600",
      "from-purple-500 via-pink-500 to-purple-600",
      "from-orange-500 via-red-500 to-orange-600",
      "from-indigo-500 via-purple-500 to-indigo-600",
    ]
    return gradients[index % gradients.length]
  }

  const getCourseIcon = (title: string) => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('ai') || titleLower.includes('brain')) return Brain
    if (titleLower.includes('game')) return Gamepad2
    if (titleLower.includes('art') || titleLower.includes('design')) return Palette
    if (titleLower.includes('web') || titleLower.includes('internet')) return Globe
    if (titleLower.includes('code') || titleLower.includes('programming')) return Code
    if (titleLower.includes('robot') || titleLower.includes('tech')) return Bot
    if (titleLower.includes('math') || titleLower.includes('logic')) return BrainCircuit
    if (titleLower.includes('security') || titleLower.includes('protect')) return Shield
    if (titleLower.includes('music') || titleLower.includes('sound')) return Music
    return Rocket
  }

  const getLessonStatus = (lessonId: string) => {
    if (!dashboardData?.lessonProgress) return "not_started"
    const progressItem = dashboardData.lessonProgress.find((lp: any) => lp.lesson_id === lessonId)
    return progressItem?.status || "not_started"
  }

  const handleLessonClick = (lessonId: string) => {
    setNavigating(lessonId)
    router.push(`/dashboard/lessons/${lessonId}`)
  }

  const handleCourseClick = (courseId: string) => {
    setNavigating(courseId)
    router.push(`/dashboard/courses/${courseId}`)
  }

  const handleContinueLearning = () => {
    const inProgressCourse = courses.find(course => 
      course.lessons?.some((lesson: any) => getLessonStatus(lesson.id) === "not_started")
    )
    if (inProgressCourse) {
      const nextLesson = inProgressCourse.lessons.find((lesson: any) => 
        getLessonStatus(lesson.id) === "not_started"
      )
      if (nextLesson) {
        handleLessonClick(nextLesson.id)
        return
      }
    }
    const firstLesson = courses[0]?.lessons?.[0]
    if (firstLesson) {
      handleLessonClick(firstLesson.id)
    }
  }

  // Calculate course progress
  const getCourseProgress = (course: any) => {
    const courseLessons = course.lessons || []
    const completedLessonsInCourse = courseLessons.filter((l: any) => 
      getLessonStatus(l.id) === "completed"
    ).length
    const totalLessonsInCourse = courseLessons.length
    const progressPercentage = totalLessonsInCourse > 0 ? 
      Math.round((completedLessonsInCourse / totalLessonsInCourse) * 100) : 0
    
    return {
      completed: completedLessonsInCourse,
      total: totalLessonsInCourse,
      percentage: progressPercentage,
      isStarted: completedLessonsInCourse > 0,
      isCompleted: progressPercentage === 100
    }
  }

  // Featured courses
  const featuredCourses = courses.slice(0, 3)
  const displayedCourses = showAllCourses ? courses : featuredCourses

  // Notification icon with badge
  const BellWithBadge = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
      onClick={() => setShowNotifications(!showNotifications)}
    >
      <Bell className="w-5 h-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.div>
      )}
    </motion.button>
  )

  // Notifications Panel Component
  const NotificationsPanel = () => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-y-0 right-0 z-50 w-96 bg-card border-l border-border shadow-xl overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete lessons and earn badges to get notifications!
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                  notification.is_read 
                    ? "bg-muted/20 border-border/50 hover:border-border" 
                    : "bg-primary/5 border-primary/20 hover:border-primary/30"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    notification.type === 'badge' ? "bg-yellow-100 text-yellow-600" :
                    notification.type === 'leaderboard' ? "bg-purple-100 text-purple-600" :
                    notification.type === 'streak' ? "bg-orange-100 text-orange-600" :
                    notification.type === 'lesson' ? "bg-green-100 text-green-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {notification.type === 'badge' ? <Trophy className="w-5 h-5" /> :
                     notification.type === 'leaderboard' ? <TrendingUp className="w-5 h-5" /> :
                     notification.type === 'streak' ? <Flame className="w-5 h-5" /> :
                     notification.type === 'lesson' ? <BookOpen className="w-5 h-5" /> :
                     <Gift className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-foreground truncate">
                        {notification.title}
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )

  // Dashboard Stats Component
  const DashboardStats = () => {
    const statsCards = [
      {
        title: "Learning Streak",
        value: stats.streak,
        subtitle: "days in a row",
        icon: Flame,
        color: "from-orange-400 to-rose-500",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        trend: stats.streak > 0 ? "+" : "",
        description: "Keep it up! 🔥",
        progress: Math.min((stats.streak / 30) * 100, 100)
      },
      {
        title: "Badges Earned",
        value: stats.badgesCount,
        subtitle: "achievements",
        icon: Trophy,
        color: "from-amber-400 to-yellow-500",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        trend: "",
        description: "Great work! 🏆",
        progress: Math.min((stats.badgesCount / 20) * 100, 100)
      },
      {
        title: "Lessons Completed",
        value: stats.totalCompletedLessons,
        subtitle: "total lessons",
        icon: BookOpen,
        color: "from-emerald-400 to-green-500",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        trend: `${stats.dailyActivity} today`,
        description: "Learning fast! 📚",
        progress: Math.min((stats.totalCompletedLessons / Math.max(totalLessons, 1)) * 100, 100)
      },
      {
        title: "Courses Finished",
        value: stats.completedCourses,
        subtitle: "courses completed",
        icon: Award,
        color: "from-sky-400 to-blue-500",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
        trend: `${Math.round((stats.completedCourses / Math.max(courses.length, 1)) * 100)}%`,
        description: "Awesome progress! 🎯",
        progress: Math.min((stats.completedCourses / Math.max(courses.length, 1)) * 100, 100)
      },
      {
        title: "Weekly XP",
        value: stats.weeklyXP,
        subtitle: "points this week",
        icon: Zap,
        color: "from-violet-400 to-purple-500",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        trend: "Weekly total",
        description: "Stay consistent! ⚡",
        progress: Math.min((stats.weeklyXP / 1000) * 100, 100)
      },
      {
        title: "Leaderboard Rank",
        value: `#${userRank || "N/A"}`,
        subtitle: "global position",
        icon: Crown,
        color: "from-indigo-400 to-violet-500",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        trend: leaderboard.length > 0 && userRank ? `Top ${Math.round((userRank / leaderboard.length) * 100)}%` : "Not ranked",
        description: "Rising star! 👑",
        progress: userRank && leaderboard.length > 0 
          ? Math.min(((leaderboard.length - userRank + 1) / leaderboard.length) * 100, 100)
          : 0
      }
    ]

    return (
      <div className="mb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Learning Dashboard</h2>
            <p className="text-muted-foreground mt-1.5">Your personalized learning insights at a glance</p>
          </div>
          
          {/* View Toggle */}
          <div className="inline-flex p-1 bg-muted/50 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                viewMode === 'grid' 
                  ? "bg-white dark:bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                viewMode === 'list' 
                  ? "bg-white dark:bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ 
                y: -4,
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <Card className="relative overflow-hidden border border-border/50 hover:border-border/80 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-lg h-full">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${stat.color}`} />
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${stat.color} blur-lg opacity-20`} />
                </div>
                
                <CardContent className="p-6 relative">
                  {/* Top Row: Icon and Trend */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                        stat.iconBg
                      )}>
                        <div className={`relative ${stat.iconColor}`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {stat.subtitle}
                        </div>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {stat.title}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10">
                      {stat.trend}
                    </div>
                  </div>
                  
                  {/* Main Value */}
                  <div className="mb-5">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.description}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{Math.round(stat.progress)}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.progress}%` }}
                        transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">Overall Progress</div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round((completedLessons / Math.max(totalLessons, 1)) * 100)}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Current Level</div>
                <div className="text-2xl font-bold text-foreground">Level {stats.currentLevel}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Total XP</div>
                <div className="text-2xl font-bold text-foreground">{stats.userXP}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Today's Activity</div>
                <div className="text-2xl font-bold text-foreground">{stats.dailyActivity}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
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
            Loading your dashboard...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-125 h-125 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl"
        />
        
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
                             linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: `translateY(${parallaxOffset * 0.1}px)`
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Navigation Bar */}
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
        >
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Navigation tabs can be added here if needed */}
              </div>

              <div className="flex items-center gap-3">
                <BellWithBadge />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  onClick={() => router.push('/dashboard/profile')}
                >
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </motion.button>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <Avatar className="h-9 w-9 border-2 border-primary/30 cursor-pointer">
                    <AvatarImage src={dashboardData?.profile?.avatar_custom_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                      {dashboardData?.profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Stats Section */}
            <DashboardStats />
            
            {/* Badges & Achievements */}
            {badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Badges & Achievements</h2>
                    <p className="text-muted-foreground">Show off your accomplishments and skills</p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/achievements')}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {badges.slice(0, 12).map((badge: any, index: number) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      onClick={() => setSelectedBadge(badge.id)}
                      className="relative cursor-pointer"
                    >
                      <div className="aspect-square relative group">
                        <div className="absolute inset-0 rounded-2xl transition-all duration-300 bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-yellow-500/20 group-hover:from-yellow-500/30 group-hover:via-amber-500/30 group-hover:to-yellow-500/30" />
                        
                        <div className="relative w-full h-full rounded-xl p-3 flex flex-col items-center justify-center bg-card border border-yellow-500/30 group-hover:border-yellow-500/50 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                          <div className="w-12 h-12 mb-2 relative">
                            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-yellow-500 to-amber-500 blur-md" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                              <Trophy className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-xs font-bold text-foreground mb-1 truncate">
                              {badge.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {badge.rarity || "Achievement"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Manual Check Leaderboard Button (for testing) */}
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={checkAndSendLeaderboardNotification}
                disabled={isCheckingLeaderboard}
                className="flex items-center gap-2"
              >
                {isCheckingLeaderboard ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                    Checking...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Check Leaderboard Update
                  </>
                )}
              </Button>
            </div>
          
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && <NotificationsPanel />}
      </AnimatePresence>
    </div>
  )
}