// app/dashboard/learn/learn-content.tsx - FULLY UPDATED VERSION
"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  BookOpen, Award, Clock, CheckCircle, Play, 
  Lock, Star, Zap, Trophy, Target, BarChart3,
  Sparkles, Map, Puzzle, Compass, TrendingUp,
  Rocket, Users, ArrowRight, Brain, Gamepad2,
  Palette, Music, Camera, Shield, Code, 
  BrainCircuit, Cpu, Database, Home, Bot,
  Globe, Smartphone, Gem, Coins, Heart,
  MessageSquare, Download, Share2, ChevronDown,
  FileText, Video, HelpCircle, Flame,
  Target as Bullseye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Define interfaces
interface Course {
  course_id: string
  title: string
  description: string
  order_index: number
  min_age: number | null
  max_age: number | null
  target_age_group: string
  // Note: These fields come from the database query
  total_lessons?: number
  completed_lessons?: number
  progress_percentage?: number
  is_unlocked?: boolean
  is_age_appropriate?: boolean
  slug: string  // ADDED: Slug for URL navigation
}

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
  completed_at?: string
}

interface EnrichedCourse {
  id: string
  title: string
  description: string
  order_index: number
  progress: number
  completedLessons: number
  totalLessons: number
  isLocked: boolean
  totalDuration: number
  totalXPReward: number
  difficulty: "beginner" | "explorer" | "master"
  icon: any
  color: string
  gradient: string
  tags: string[]
  ageGroup: string
  minAge: number | null
  maxAge: number | null
  isAgeAppropriate: boolean
  slug: string  // ADDED: Slug for URL navigation
}

interface LeaderboardUser {
  id: string
  email: string
  users_progress: {
    level: number
    xp: number
    updated_at: string
  }
  day_streak: number
  age_group?: string | null
  age?: number | null
}

interface XP_Event {
  id: string
  user_id: string
  amount: number
  reason: string
  lesson_id?: string
  course_id?: string
  created_at: string
  metadata?: any
}

interface LearnContentProps {
  dashboardData: any
  courses: Course[]
  lessons: Lesson[]  // NEW: All lessons from database
  lessonProgress: LessonProgress[] // NEW: User's lesson progress
  leaderboard: LeaderboardUser[]
  weeklyProgress: { 
    totalXP: number
    events: XP_Event[]  // Updated to use XP_Event interface
  }
  completedLessonsCount: number
  userStats: {
    level: number
    xp: number
    total_xp_earned: number
    badges_earned: number
  }
  userAge?: number | null
  ageGroup?: string | null
  userId: string  // NEW: Needed for calculations
}

// Age group calculation function
function getAgeGroup(age: number): 'young' | 'tween' | 'teen' | 'all' {
  if (age < 10) return 'young'
  if (age >= 10 && age <= 13) return 'tween'
  return 'teen'
}

// Get age group display name
const getAgeGroupDisplay = (ageGroup: string | null | undefined) => {
  if (!ageGroup) return "All Ages"
  switch (ageGroup) {
    case 'young': return "Ages < 10"
    case 'tween': return "Ages 10-13"
    case 'teen': return "Ages 14+"
    case 'all': return "All Ages"
    default: return ageGroup
  }
}

// Check if track is appropriate for age
function isTrackAppropriateForAge(track: Course, userAge: number | null): boolean {
  if (!userAge) return true
  
  if (track.target_age_group === 'all') return true
  
  if (track.min_age && track.max_age) {
    return userAge >= track.min_age && userAge <= track.max_age
  }
  
  const userAgeGroup = getAgeGroup(userAge)
  return track.target_age_group === userAgeGroup
}

// Character mapping with gradient colors
const getCourseIcon = (courseTitle: string) => {
  const title = courseTitle.toLowerCase()
  if (title.includes('ai') || title.includes('machine') || title.includes('neural')) return Brain
  if (title.includes('web') || title.includes('html') || title.includes('css')) return Globe
  if (title.includes('game') || title.includes('animation') || title.includes('fun')) return Gamepad2
  if (title.includes('art') || title.includes('design') || title.includes('creative')) return Palette
  if (title.includes('robot') || title.includes('automation')) return Bot
  if (title.includes('music') || title.includes('sound')) return Music
  if (title.includes('video') || title.includes('photo')) return Camera
  if (title.includes('security') || title.includes('protect')) return Shield
  if (title.includes('python') || title.includes('code') || title.includes('scratch')) return Code
  if (title.includes('math') || title.includes('logic')) return BrainCircuit
  return Rocket
}

// Gradient colors
const getCourseGradient = (orderIndex: number, courseTitle: string) => {
  const title = courseTitle.toLowerCase()
  
  if (title.includes('ai')) return "from-purple-600 to-pink-600"
  if (title.includes('game')) return "from-orange-500 to-red-500"
  if (title.includes('art')) return "from-pink-500 to-rose-600"
  if (title.includes('web')) return "from-blue-500 to-cyan-500"
  if (title.includes('python') || title.includes('code')) return "from-green-500 to-emerald-600"
  if (title.includes('robot')) return "from-cyan-500 to-blue-600"
  if (title.includes('math')) return "from-indigo-500 to-purple-600"
  
  // Default gradients based on order
  if (orderIndex === 0) return "from-blue-500 to-cyan-500"
  if (orderIndex === 1) return "from-green-500 to-emerald-600"
  if (orderIndex === 2) return "from-purple-500 to-pink-600"
  if (orderIndex === 3) return "from-orange-500 to-red-500"
  return "from-gray-500 to-slate-600"
}

const getCourseDifficulty = (orderIndex: number): "beginner" | "explorer" | "master" => {
  if (orderIndex <= 3) return "beginner"
  if (orderIndex <= 6) return "explorer"
  return "master"
}

const getCourseTags = (courseTitle: string): string[] => {
  const title = courseTitle.toLowerCase()
  const tags: string[] = []
  
  if (title.includes('ai')) tags.push("AI", "Smart Tech")
  if (title.includes('game')) tags.push("Games", "Fun")
  if (title.includes('python')) tags.push("Python", "Coding")
  if (title.includes('web')) tags.push("Web", "Internet")
  if (title.includes('fun')) tags.push("Fun", "Creative")
  if (title.includes('art')) tags.push("Art", "Design")
  if (title.includes('code')) tags.push("Code", "Logic")
  if (title.includes('math')) tags.push("Math", "Logic")
  
  if (tags.length === 0) tags.push("Adventure", "Learning")
  return tags.slice(0, 2)
}

// Get level color based on progress
const getLevelColor = (level: number) => {
  if (level >= 10) return 'from-purple-600 to-pink-600'
  if (level >= 7) return 'from-blue-600 to-indigo-600'
  if (level >= 4) return 'from-green-500 to-emerald-600'
  return 'from-yellow-500 to-orange-500'
}

export default function LearnContent({
  dashboardData,
  courses,
  lessons,
  lessonProgress,
  leaderboard,
  weeklyProgress,
  completedLessonsCount,
  userStats,
  userAge,
  ageGroup,
  userId
}: LearnContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [navigating, setNavigating] = useState<string | null>(null)

  // Calculate enriched courses with all stats
  const enrichedCourses = useMemo(() => {
    return courses.map(course => {
      // Get all lessons for this course
      const courseLessons = lessons.filter(lesson => lesson.course_id === course.course_id)
      const totalLessons = courseLessons.length
      
      // Calculate completed lessons for this course
      const completedLessons = lessonProgress.filter(progress => {
        // Find if this lesson belongs to the current course
        const lesson = lessons.find(l => l.id === progress.lesson_id)
        return lesson?.course_id === course.course_id && progress.status === 'completed'
      }).length
      
      // Calculate progress percentage
      const progress = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0
      
      // Calculate if course is unlocked
      const isUnlocked = (() => {
        // First course is always unlocked
        if (course.order_index === 0) return true
        
        // Find previous course
        const previousCourse = courses.find(c => c.order_index === course.order_index - 1)
        if (!previousCourse) return true
        
        // Get completed lessons in previous course
        const previousCourseLessons = lessons.filter(l => l.course_id === previousCourse.course_id)
        const previousCompleted = lessonProgress.filter(progress => {
          const lesson = lessons.find(l => l.id === progress.lesson_id)
          return lesson?.course_id === previousCourse.course_id && progress.status === 'completed'
        }).length
        
        // Unlock if at least one lesson completed in previous course
        return previousCompleted >= 1
      })()
      
      const isAgeAppropriate = isTrackAppropriateForAge(course, userAge || null)
      const isLocked = !isUnlocked || !isAgeAppropriate
      
      // Calculate total duration (20 minutes per lesson)
      const totalDuration = totalLessons * 20
      
      // Calculate total XP reward from all lessons
      const totalXPReward = courseLessons.reduce((total, lesson) => total + (lesson.xp_reward || 50), 0)
      
      return {
        id: course.course_id,
        title: course.title,
        description: course.description,
        order_index: course.order_index,
        progress,
        completedLessons,
        totalLessons,
        isLocked,
        totalDuration,
        totalXPReward,
        difficulty: getCourseDifficulty(course.order_index),
        icon: getCourseIcon(course.title),
        color: "",
        gradient: getCourseGradient(course.order_index, course.title),
        tags: getCourseTags(course.title),
        ageGroup: course.target_age_group || 'all',
        minAge: course.min_age,
        maxAge: course.max_age,
        isAgeAppropriate,
        slug: course.slug // ADDED: Include the slug
      }
    })
  }, [courses, lessons, lessonProgress, userAge])

  // Filter courses based on active tab
  const filteredEnrichedCourses = useMemo(() => {
    let filtered = enrichedCourses
    
    if (activeTab === "in-progress") {
      filtered = filtered.filter(course => course.progress > 0 && course.progress < 100)
    } else if (activeTab === "completed") {
      filtered = filtered.filter(course => course.progress === 100)
    } else if (activeTab === "locked") {
      filtered = filtered.filter(course => course.isLocked)
    } else if (activeTab === "beginner") {
      filtered = filtered.filter(course => course.difficulty === "beginner")
    } else if (activeTab === "explorer") {
      filtered = filtered.filter(course => course.difficulty === "explorer")
    } else if (activeTab === "master") {
      filtered = filtered.filter(course => course.difficulty === "master")
    } else if (activeTab === "age-appropriate") {
      filtered = filtered.filter(course => course.isAgeAppropriate)
    }
    
    return filtered
  }, [activeTab, enrichedCourses])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 border-green-200"
      case "explorer": return "bg-blue-100 text-blue-800 border-blue-200"
      case "master": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Navigation handler - UPDATED to use slug
  const handleCourseClick = (courseSlug: string) => {
    setNavigating(courseSlug)
    router.push(`/dashboard/learn/${courseSlug}`)
  }

  const handleContinueLearning = () => {
    const inProgressCourse = enrichedCourses.find(c => c.progress > 0 && c.progress < 100)
    if (inProgressCourse) {
      handleCourseClick(inProgressCourse.slug)
    } else {
      const firstUnlockedCourse = enrichedCourses.find(c => !c.isLocked && c.progress === 0)
      if (firstUnlockedCourse) {
        handleCourseClick(firstUnlockedCourse.slug)
      }
    }
  }

  // Calculate stats
  const activeCoursesCount = enrichedCourses.filter(c => c.progress > 0 && c.progress < 100).length
  const totalLearningTime = enrichedCourses.reduce((total, course) => {
    return total + (course.totalDuration * course.progress / 100)
  }, 0)

  // Calculate total lessons completed across all courses
  const totalCompletedLessons = lessonProgress.filter(p => p.status === 'completed').length
  
  // Weekly progress
  const weeklyLessonsCompleted = weeklyProgress?.events?.filter((event: XP_Event) => 
    event.reason?.includes?.('lesson') || event.lesson_id
  ).length || 0
  const weeklyProgressPercentage = Math.min((weeklyLessonsCompleted / 3) * 100, 100)

  // Duolingo-style level calculation
  const userLevel = userStats?.level || 1
  const userXP = userStats?.xp || 0
  const currentLevelXP = userXP % 100
  const xpPerLevel = 100
  
  // Calculate current level progress percentage
  const levelProgress = currentLevelXP
  
  // Get user's current level title
  const getCurrentLevelTitle = (level: number) => {
    if (level >= 10) return "Expert Coder"
    if (level >= 7) return "Advanced Learner"
    if (level >= 4) return "Skillful Explorer"
    return "Getting Started"
  }
  
  const currentLevelTitle = getCurrentLevelTitle(userLevel)

  // Calculate age-appropriate stats
  const ageAppropriateCourses = enrichedCourses.filter(c => c.isAgeAppropriate).length
  const totalCourses = enrichedCourses.length

  // Get actual badges earned from database
  const badgesEarned = userStats?.badges_earned || 0
  
  // Get week number
  const currentWeek = dashboardData?.profile?.highest_week || 
                     dashboardData?.profile?.current_week || 
                     1

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl animate-pulse mx-auto"></div>
          <p className="text-muted-foreground">Loading your learning paths...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-card border-b border-border">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-glow">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground">Learn</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Continue your coding journey</p>
              </div>
            </div>
            
            {/* Age, XP, and Badges Progress */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Age Group Badge */}
              {userAge !== null && (
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-blue-800">Your Age Group</div>
                    <div className="text-sm sm:text-base font-black text-blue-900">
                      {ageGroup ? getAgeGroupDisplay(ageGroup) : 'All Ages'}
                    </div>
                    {userAge && (
                      <div className="text-xs text-blue-600">{userAge} years old</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Badges Earned Card */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-green-800">Badges Earned</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-black text-green-900">{badgesEarned}</span>
                      <span className="text-xs text-green-600">badges</span>
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      Week {currentWeek} • Level {userLevel}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lessons Completed Card - NEW */}
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-orange-800">Lessons Completed</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-black text-orange-900">{totalCompletedLessons}</span>
                      <span className="text-xs text-orange-600">lessons</span>
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      {activeCoursesCount} active • {enrichedCourses.filter(c => c.progress === 100).length} completed
                    </div>
                </div>
                </div>
              </div>
              
              {/* XP Progress Card */}
              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border shadow-card w-full sm:w-48">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getLevelColor(userLevel)} flex items-center justify-center`}>
                      <span className="text-xs font-black text-white">{userLevel}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-foreground">Level {userLevel}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-primary">{userXP} XP</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div 
                    className="h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${currentLevelXP}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{currentLevelXP}/100</span>
                  <span>Lvl {userLevel + 1}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {currentLevelTitle}
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress Banner */}
          <div className="mt-4 sm:mt-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-foreground">Level {userLevel} Progress</div>
                    <div className="text-sm text-muted-foreground">{currentLevelTitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-primary">{levelProgress}%</div>
                    <div className="text-xs text-muted-foreground">to next level</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-primary/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm mb-3 sm:mb-4">
              <Compass className="w-3 h-3 sm:w-4 sm:h-4" />
              {userAge !== null ? `Personalized for ${ageGroup}` : 'Choose Your Path'}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 sm:mb-4">
              Learning Paths
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {userAge !== null 
                ? `Showing courses suitable for ${ageGroup} learners ${userAge && `(age ${userAge})`} and all-ages courses`
                : 'All available learning paths'}
            </p>
            
            {/* Achievement Summary */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                <span>{badgesEarned} Badges</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <Trophy className="w-4 h-4" />
                <span>Week {currentWeek}</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Level {userLevel}</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>{totalCompletedLessons} Lessons</span>
              </div>
            </div>
          </div>

          {/* Age-based Info Banner */}
          {userAge !== null && totalCourses > ageAppropriateCourses && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 mb-1">Age-Appropriate Content</h3>
                  <p className="text-sm text-blue-700">
                    You're seeing {ageAppropriateCourses} out of {totalCourses} learning paths. 
                    Some paths are hidden because they're designed for different age groups.
                    This ensures you get content that's just right for your learning level!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          <div className="grid gap-6 sm:gap-8 max-w-4xl mx-auto">
            {filteredEnrichedCourses.map((course, index) => {
              const IconComponent = course.icon
              const isStarted = course.progress > 0
              const isCompleted = course.progress === 100
              const isNext = index === 0 || (filteredEnrichedCourses[index - 1] && 
                filteredEnrichedCourses[index - 1].progress === 100)
              const isUnlocked = !course.isLocked

              // Get age group badge for course
              const courseAgeGroupLabel = course.ageGroup ? getAgeGroupDisplay(course.ageGroup) : 'All Ages'
              const courseAgeRange = course.minAge && course.maxAge ? `Ages ${course.minAge}-${course.maxAge}` : courseAgeGroupLabel

              return (
                <div key={course.id} className="relative">
                  {index < filteredEnrichedCourses.length - 1 && (
                    <div className="hidden sm:block absolute left-6 sm:left-8 top-16 sm:top-20 w-0.5 h-12 sm:h-16 bg-primary/50 opacity-50"></div>
                  )}

                  <div className={`
                    bg-card border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card hover:shadow-glow 
                    transition-all duration-300 hover:scale-[1.02] relative
                    ${isCompleted ? 'border-green-400/30' : isNext ? 'border-primary/50' : 'border-border/50'}
                    ${!isUnlocked ? 'opacity-60' : ''}
                  `}>
                    {/* Status Indicator */}
                    <div className={`
                      absolute -left-3 sm:-left-4 top-4 sm:top-1/2 transform sm:-translate-y-1/2 
                      w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-background 
                      flex items-center justify-center shadow-glow
                      ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                        isUnlocked ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-muted'}
                    `}>
                      {isCompleted ? (
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-current" />
                      ) : isUnlocked ? (
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      ) : (
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 ml-6 sm:ml-0">
                      {/* Course Icon */}
                      <div className={`
                        flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl 
                        flex items-center justify-center shadow-glow transition-all duration-300
                        ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                          isUnlocked ? `bg-gradient-to-br ${course.gradient}` : 'bg-gradient-to-br from-gray-400 to-slate-600'}
                      `}>
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      
                      {/* Course Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-xl sm:text-2xl font-black text-foreground">
                            {course.title}
                          </h3>
                          <div className="flex gap-2">
                            {/* Age Group Badge */}
                            <div className={`
                              px-2 py-1 rounded-full text-xs font-bold border
                              ${course.ageGroup === 'all' 
                                ? 'bg-gray-100 text-gray-800 border-gray-200'
                                : course.ageGroup === 'young'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : course.ageGroup === 'tween'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-purple-100 text-purple-800 border-purple-200'
                              }
                            `}>
                              {courseAgeRange}
                            </div>
                            
                            {isCompleted && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                <Trophy className="w-3 h-3" />
                                Completed
                              </div>
                            )}
                            {isNext && isUnlocked && !isCompleted && (
                              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                <Rocket className="w-3 h-3" />
                                Next Up
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 leading-relaxed text-sm sm:text-base">
                          {course.description || "Start your coding adventure!"}
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="font-semibold text-foreground">Progress</span>
                            <span className="font-bold text-primary">
                              {course.completedLessons}/{course.totalLessons} lessons
                            </span>
                          </div>
                          
                          <div className="w-full bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
                            <div 
                              className={`h-2 sm:h-3 rounded-full transition-all duration-1000 ${
                                isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                                `bg-gradient-to-r ${course.gradient}`
                              }`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Course Stats */}
                        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{course.totalDuration}m</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Puzzle className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{course.totalLessons} challenges</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="font-bold text-amber-600">+{course.totalXPReward} XP</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {course.tags.map((tag: string, tagIndex: number) => (
                            <Badge 
                              key={tagIndex} 
                              variant="outline"
                              className="text-xs bg-white/50 border-border/50"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Action Button - UPDATED to use course.slug */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 sm:mt-6 pt-4 border-t border-border/50">
                          <div className="text-sm">
                            {isCompleted ? (
                              <span className="text-green-600 font-bold flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Course Mastered!
                              </span>
                            ) : isUnlocked ? (
                              <span className="text-foreground font-semibold">
                                {isStarted ? 'Continue learning' : 'Ready to start'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {!course.isAgeAppropriate 
                                  ? 'Designed for different age group'
                                  : 'Complete previous course to unlock'
                                }
                              </span>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => isUnlocked && handleCourseClick(course.slug)}  // UPDATED: Use course.slug
                            disabled={!isUnlocked || navigating === course.slug}  // UPDATED: Use course.slug
                            className={`
                              flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 
                              rounded-lg sm:rounded-xl font-bold transition-all duration-300 
                              shadow-card min-w-[120px] sm:min-w-[140px] relative
                              ${isCompleted 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 hover:shadow-glow' 
                                : isUnlocked
                                ? `bg-gradient-to-r ${course.gradient} text-white hover:scale-105 hover:shadow-glow`
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                              }
                              ${navigating === course.slug ? 'opacity-50 cursor-wait' : ''}  // UPDATED: Use course.slug
                            `}
                          >
                            {navigating === course.slug ? (  // UPDATED: Use course.slug
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                              </div>
                            ) : (
                              <>
                                {isCompleted ? 'Review' : isUnlocked ? 'Continue' : 'Locked'}
                                <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 ${!isUnlocked ? 'opacity-50' : ''}`} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* No Courses Available */}
          {filteredEnrichedCourses.length === 0 && (
            <div className="text-center py-12 bg-card rounded-3xl border border-border">
              <div className="w-20 h-20 bg-gradient-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Learning Paths Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {userAge !== null 
                  ? `We're working on creating more learning paths for ${ageGroup} learners. Check back soon!`
                  : 'No learning paths are available at the moment. Please check back later.'}
              </p>
              {userAge !== null && (
                <Button 
                  onClick={() => setActiveTab("all")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Show All Courses
                </Button>
              )}
            </div>
          )}

          {/* Practice Section */}
          {filteredEnrichedCourses.length > 0 && (
            <div className="text-center mt-12 sm:mt-16">
              <div className="bg-primary/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/50">
                <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 text-foreground">
                  Ready to practice?
                </h3>
                <p className="text-sm sm:text-lg text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
                  Jump into your current lesson or review completed material
                </p>
                
                <button 
                  onClick={handleContinueLearning}
                  disabled={navigating === 'practice'}
                  className={`
                    bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 
                    rounded-xl font-bold shadow-card hover:shadow-glow hover:scale-105 
                    transition-all duration-300 text-sm sm:text-base
                    ${navigating === 'practice' ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {navigating === 'practice' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    'Practice Now'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}