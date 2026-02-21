// app/dashboard/learn/[courseSlug]/course-content.tsx - FULLY FIXED
"use client"

import { useState, useEffect } from "react"
import { 
  ArrowLeft, BookOpen, CheckCircle, Lock, 
  Play, Clock, Award, Zap, BarChart3,
  Users, MessageSquare, Download, Share2,
  ChevronRight, ChevronDown, Star, Target,
  Flag, Trophy, Sparkles, Brain, Code,
  FileText, Video, HelpCircle, Puzzle,
  Home, Bot, Globe, Gamepad2, Palette,
  Music, Camera, Shield, BrainCircuit,
  Cpu, Database, Smartphone, Gem, Coins,
  Heart, Flame, Rocket, TrendingUp,
  Compass, Map, Target as TargetIcon,
  Percent
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

interface Lesson {
  id: string
  course_id: string
  title: string
  content: string
  order_index: number
  xp_reward: number
  created_at: string
  slug: string  // Make sure slug is required
}

interface LessonProgress {
  lesson_id: string
  status: 'completed' | 'in_progress' | 'not_started'
  completed_at?: string
}

interface Course {
  id: string
  title: string
  description: string
  order_index: number
  total_lessons: number
  completed_lessons: number
  progress_percentage: number
  is_unlocked: boolean
  is_age_appropriate: boolean
  ageGroup: string
  minAge: number | null
  maxAge: number | null
  total_xp?: number
  earned_xp?: number
  slug: string  // Make sure slug is required
}

interface UserBadge {
  id: string
  name: string
  description: string
  icon_url: string
  rarity: string
  earned_at?: string
}

interface BadgeProgress {
  badge: UserBadge
  progress: number
  nextThreshold?: number
  currentValue: number
  isEarned: boolean
}

interface CourseStats {
  userRank: string
  activeLearners: number
  successRate: number
  averageCompletionTime: string
  totalEnrolled: number
  userProgress: number
  totalUsers: number
  userPosition: number | null
}

interface CourseContentProps {
  courseId: string
  courseSlug: string  // Add courseSlug prop
  initialCourse: Course | null
  initialLessons: Lesson[]
  initialLessonProgress: LessonProgress[]
  userId: string
  initialUserStats?: {
    level: number
    xp: number
    total_xp_earned: number
    badges_earned: number
  }
}

// Get course icon based on title
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

// Get course gradient
const getCourseGradient = (courseTitle: string) => {
  const title = courseTitle.toLowerCase()
  
  if (title.includes('ai')) return "from-purple-600 to-pink-600"
  if (title.includes('game')) return "from-orange-500 to-red-500"
  if (title.includes('art')) return "from-pink-500 to-rose-600"
  if (title.includes('web')) return "from-blue-500 to-cyan-500"
  if (title.includes('python') || title.includes('code')) return "from-green-500 to-emerald-600"
  if (title.includes('robot')) return "from-cyan-500 to-blue-600"
  if (title.includes('math')) return "from-indigo-500 to-purple-600"
  
  return "from-blue-500 to-cyan-500"
}

// Get difficulty based on order
const getDifficulty = (orderIndex: number): "beginner" | "explorer" | "master" => {
  if (orderIndex <= 3) return "beginner"
  if (orderIndex <= 6) return "explorer"
  return "master"
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner": return "bg-green-100 text-green-800 border-green-200"
    case "explorer": return "bg-blue-100 text-blue-800 border-blue-200"
    case "master": return "bg-purple-100 text-purple-800 border-purple-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getLessonIcon = (lesson: Lesson) => {
  const title = lesson.title.toLowerCase()
  if (title.includes('video') || title.includes('watch') || title.includes('tutorial')) return Video
  if (title.includes('code') || title.includes('programming') || title.includes('script')) return Code
  if (title.includes('quiz') || title.includes('test') || title.includes('challenge')) return Puzzle
  if (title.includes('project') || title.includes('build') || title.includes('create')) return TargetIcon
  if (title.includes('theory') || title.includes('concept') || title.includes('learn')) return BookOpen
  if (title.includes('practice') || title.includes('exercise') || title.includes('drill')) return Brain
  if (title.includes('review') || title.includes('summary')) return FileText
  if (title.includes('game') || title.includes('play')) return Gamepad2
  return BookOpen
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

export default function CourseContent({
  courseId,
  courseSlug,  // Add courseSlug to props
  initialCourse,
  initialLessons,
  initialLessonProgress,
  userId,
  initialUserStats = { level: 1, xp: 0, total_xp_earned: 0, badges_earned: 0 }
}: CourseContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("lessons")
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [isCompletingLesson, setIsCompletingLesson] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [course, setCourse] = useState<Course | null>(initialCourse)
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>(initialLessonProgress)
  const [userStats, setUserStats] = useState(initialUserStats)
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats>({
    userRank: "Calculating...",
    activeLearners: 0,
    successRate: 0,
    averageCompletionTime: "Calculating...",
    totalEnrolled: 0,
    userProgress: 0,
    totalUsers: 0,
    userPosition: null
  })
  const [isLoadingBadges, setIsLoadingBadges] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false)
  
  // Fix: Ensure course has a slug
  useEffect(() => {
    if (course && !course.slug) {
      setCourse(prev => prev ? {
        ...prev,
        slug: generateSlug(prev.title)
      } : null)
    }
  }, [course])

  // Fix: Ensure lessons have slugs
  useEffect(() => {
    if (lessons.some(lesson => !lesson.slug)) {
      setLessons(prev => prev.map(lesson => ({
        ...lesson,
        slug: lesson.slug || generateSlug(lesson.title)
      })))
    }
  }, [lessons])

  // Fetch all data on client side
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Use slug-based API endpoint
        const response = await fetch(`/api/courses/by-slug/${courseSlug}/full?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.data.course) {
            const courseData = data.data.course
            // Ensure course has slug
            if (!courseData.slug) {
              courseData.slug = generateSlug(courseData.title)
            }
            setCourse(courseData)
          }
          if (data.data.lessons) {
            // Ensure lessons have slugs
            const lessonsWithSlugs = data.data.lessons.map((lesson: any) => ({
              ...lesson,
              slug: lesson.slug || generateSlug(lesson.title)
            }))
            setLessons(lessonsWithSlugs)
          }
          if (data.data.lessonProgress) setLessonProgress(data.data.lessonProgress)
          if (data.data.userStats) setUserStats(data.data.userStats)
          if (data.data.courseStats) setCourseStats(data.data.courseStats)
        } else if (response.status === 404) {
          // Try fallback to ID-based endpoint
          const fallbackResponse = await fetch(`/api/courses/${courseId}/full?userId=${userId}`)
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            if (data.data.course) {
              const courseData = data.data.course
              if (!courseData.slug) {
                courseData.slug = generateSlug(courseData.title)
              }
              setCourse(courseData)
            }
            if (data.data.lessons) {
              const lessonsWithSlugs = data.data.lessons.map((lesson: any) => ({
                ...lesson,
                slug: lesson.slug || generateSlug(lesson.title)
              }))
              setLessons(lessonsWithSlugs)
            }
            if (data.data.lessonProgress) setLessonProgress(data.data.lessonProgress)
            if (data.data.userStats) setUserStats(data.data.userStats)
            if (data.data.courseStats) setCourseStats(data.data.courseStats)
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [courseId, courseSlug, userId])

  // Fetch badge progress
  useEffect(() => {
    const fetchBadgeProgress = async () => {
      setIsLoadingBadges(true)
      try {
        const response = await fetch(`/api/courses/by-slug/${courseSlug}/badges?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setBadgeProgress(data.data.badgeProgress || [])
        } else if (response.status === 404) {
          // Fallback to ID-based endpoint
          const fallbackResponse = await fetch(`/api/courses/${courseId}/badges?userId=${userId}`)
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            setBadgeProgress(data.data.badgeProgress || [])
          }
        }
      } catch (error) {
        console.error('Error fetching badge progress:', error)
      } finally {
        setIsLoadingBadges(false)
      }
    }

    fetchBadgeProgress()
  }, [courseId, courseSlug, userId])

  // Fetch course stats (separate call for real-time updates)
  useEffect(() => {
    const fetchCourseStats = async () => {
      setIsLoadingStats(true)
      try {
        const response = await fetch(`/api/courses/by-slug/${courseSlug}/stats?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setCourseStats(prev => ({
              ...prev,
              ...data.data
            }))
          }
        } else if (response.status === 404) {
          // Fallback to ID-based endpoint
          const fallbackResponse = await fetch(`/api/courses/${courseId}/stats?userId=${userId}`)
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            if (data.data) {
              setCourseStats(prev => ({
                ...prev,
                ...data.data
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchCourseStats()
  }, [courseId, courseSlug, userId, lessonProgress]) // Re-fetch when lesson progress changes

  // Sort lessons by order_index
  const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index)

  // Calculate course progress
  const totalLessons = course?.total_lessons || lessons.length
  const completedLessons = lessonProgress.filter(lp => lp.status === 'completed').length
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Calculate XP
  const totalCourseXP = lessons.reduce((sum, lesson) => sum + lesson.xp_reward, 0)
  const earnedXP = lessons.reduce((sum, lesson) => {
    const progressItem = lessonProgress.find(lp => lp.lesson_id === lesson.id)
    return progressItem?.status === 'completed' ? sum + lesson.xp_reward : sum
  }, 0)

  // Find next lesson
  const nextLesson = sortedLessons.find(lesson => {
    const progressItem = lessonProgress.find(lp => lp.lesson_id === lesson.id)
    return !progressItem || progressItem.status !== 'completed'
  })

  // Get course icon and gradient
  const CourseIcon = course ? getCourseIcon(course.title) : BookOpen
  const courseGradient = course ? getCourseGradient(course.title) : "from-blue-500 to-cyan-500"
  const courseDifficulty = course ? getDifficulty(course.order_index) : "beginner"

  const handleBackClick = () => {
    router.push("/dashboard/learn")
  }

  // FIXED: Handle lesson click with slug
  const handleLessonClick = (lesson: Lesson) => {
    // Ensure lesson has slug
    const lessonSlug = lesson.slug || generateSlug(lesson.title)
    
    // Use slug-based URL: /learn/:courseSlug/:lessonSlug
    router.push(`/dashboard/learn/${courseSlug}/${lessonSlug}`)
  }

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      setIsCompletingLesson(lessonId)
      
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        setLessonProgress(prev => {
          const existing = prev.find(lp => lp.lesson_id === lessonId)
          if (existing) {
            return prev.map(lp => 
              lp.lesson_id === lessonId 
                ? { ...lp, status: 'completed', completed_at: new Date().toISOString() }
                : lp
            )
          }
          return [...prev, {
            lesson_id: lessonId,
            status: 'completed',
            completed_at: new Date().toISOString()
          }]
        })
        
        // Update course progress
        if (course) {
          const newCompletedLessons = completedLessons + 1
          const newProgress = totalLessons > 0 
            ? Math.round((newCompletedLessons / totalLessons) * 100) 
            : 0
            
          setCourse(prev => prev ? {
            ...prev,
            completed_lessons: newCompletedLessons,
            progress_percentage: newProgress
          } : null)
        }

        // Update user stats
        const lesson = lessons.find(l => l.id === lessonId)
        if (lesson) {
          setUserStats(prev => ({
            ...prev,
            xp: prev.xp + lesson.xp_reward,
            total_xp_earned: prev.total_xp_earned + lesson.xp_reward
          }))
        }

        // Refresh badge progress
        const badgeResponse = await fetch(`/api/courses/${courseId}/badges?userId=${userId}`)
        if (badgeResponse.ok) {
          const badgeData = await badgeResponse.json()
          setBadgeProgress(badgeData.data.badgeProgress || [])
        }

        // Refresh course stats
        const statsResponse = await fetch(`/api/courses/${courseId}/stats?userId=${userId}`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.data) {
            setCourseStats(prev => ({
              ...prev,
              ...statsData.data
            }))
          }
        }
      }
    } catch (error) {
      console.error("Error completing lesson:", error)
    } finally {
      setIsCompletingLesson(null)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Estimated time per lesson
  const estimatedTimePerLesson = 20 // minutes
  const totalEstimatedTime = totalLessons * estimatedTimePerLesson

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl animate-pulse mx-auto"></div>
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Course Not Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The course you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={handleBackClick}>
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  // Age group display
  const getAgeGroupDisplay = (ageGroup: string) => {
    switch (ageGroup) {
      case 'young': return "Ages < 10"
      case 'tween': return "Ages 10-13"
      case 'teen': return "Ages 14+"
      case 'all': return "All Ages"
      default: return ageGroup
    }
  }

  const courseAgeRange = course.minAge && course.maxAge 
    ? `Ages ${course.minAge}-${course.maxAge}`
    : getAgeGroupDisplay(course.ageGroup)

  // Get badge icon
  const getBadgeIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return '🟢'
      case 'uncommon': return '🔵'
      case 'rare': return '🟣'
      case 'epic': return '🟠'
      case 'legendary': return '🟡'
      default: return '🏆'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Paths
          </Button>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${courseGradient} flex items-center justify-center shadow-glow`}>
                  <CourseIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={getDifficultyColor(courseDifficulty)}>
                      {courseDifficulty.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="bg-white/50 border-border/50">
                      {courseAgeRange}
                    </Badge>
                    <Badge variant="outline" className="bg-white/50 border-border/50">
                      Course {course.order_index}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-black text-foreground mb-3">{course.title}</h1>
                  <p className="text-lg text-muted-foreground mb-6 max-w-3xl">
                    {course.description || "Master new skills and earn XP as you progress through this course"}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Lessons</div>
                      <div className="text-xl font-black text-foreground">{totalLessons}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Time</div>
                      <div className="text-xl font-black text-foreground">{formatDuration(totalEstimatedTime)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total XP</div>
                      <div className="text-xl font-black text-foreground">{totalCourseXP}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Progress</div>
                      <div className="text-xl font-black text-primary">{progress}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-foreground">Course Progress</span>
                  <span className="font-bold text-primary">{completedLessons}/{totalLessons} lessons</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${courseGradient} transition-all duration-1000`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{earnedXP}/{totalCourseXP} XP earned</span>
                  <span>Level {userStats.level} • {userStats.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:w-80 space-y-4">
              {/* FIXED: Pass the lesson object instead of just slug */}
              <Button
                onClick={() => nextLesson && handleLessonClick(nextLesson)}
                disabled={!nextLesson}
                className={`w-full h-14 bg-gradient-to-r ${courseGradient} text-white font-bold text-lg rounded-xl shadow-card hover:shadow-glow hover:scale-[1.02] transition-all duration-300`}
              >
                {nextLesson ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {completedLessons === 0 ? "Start Course" : "Continue Learning"}
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    Course Completed!
                  </>
                )}
              </Button>

          

              {/* Quick Stats Card - Now with real data */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm">Your Rank</span>
                        </div>
                        <span className="font-bold text-primary">{courseStats.userRank}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Active Learners</span>
                        </div>
                        <span className="font-bold">{courseStats.activeLearners.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">Success Rate</span>
                        </div>
                        <span className="font-bold text-green-600">{courseStats.successRate}%</span>
                      </div>
                      {courseStats.userPosition && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm">Position</span>
                            </div>
                            <span className="font-bold">
                              #{courseStats.userPosition} of {courseStats.totalUsers}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-card border border-border p-1 rounded-xl">
                <TabsTrigger 
                  value="lessons" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Lessons
                </TabsTrigger>
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>

              </TabsList>

              {/* Lessons Tab */}
              <TabsContent value="lessons" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Course Curriculum
                    </CardTitle>
                    <CardDescription>
                      Complete lessons in order to unlock new content and earn XP
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {sortedLessons.map((lesson, index) => {
                        const lessonProgressItem = lessonProgress.find(lp => lp.lesson_id === lesson.id)
                        const isCompleted = lessonProgressItem?.status === 'completed'
                        const isCurrent = !isCompleted && (
                          index === 0 || sortedLessons[index - 1] && 
                          lessonProgress.find(lp => lp.lesson_id === sortedLessons[index - 1].id)?.status === 'completed'
                        )
                        const isLocked = !isCompleted && !isCurrent
                        const LessonIcon = getLessonIcon(lesson)
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`p-6 hover:bg-accent/50 transition-colors ${isLocked ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-card ${
                                  isCompleted 
                                    ? "bg-gradient-to-br from-green-500 to-emerald-500" 
                                    : isCurrent
                                    ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                                    : "bg-gradient-to-br from-gray-400 to-slate-600"
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-6 h-6 text-white" />
                                  ) : isLocked ? (
                                    <Lock className="w-6 h-6 text-white" />
                                  ) : (
                                    <LessonIcon className="w-6 h-6 text-white" />
                                  )}
                                </div>
                                {isCurrent && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse shadow-glow">
                                    <Play className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-foreground">
                                      Lesson {index + 1}: {lesson.title}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      #{lesson.order_index + 1}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                                      <Zap className="w-3 h-3" />
                                      {lesson.xp_reward} XP
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {estimatedTimePerLesson}m
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-muted-foreground mb-4">
                                  {lesson.content || "Learn important concepts and practice your skills in this lesson."}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                  {isCompleted ? (
                                    <>
                                      <Badge className="bg-green-100 text-green-800 border-green-200">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Completed
                                      </Badge>
                                      {lessonProgressItem?.completed_at && (
                                        <span className="text-sm text-muted-foreground">
                                          {new Date(lessonProgressItem.completed_at).toLocaleDateString()}
                                        </span>
                                      )}
                                      {/* FIXED: Pass lesson object */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLessonClick(lesson)}
                                      >
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Review
                                      </Button>
                                    </>
                                  ) : isLocked ? (
                                    <Badge variant="outline" className="text-muted-foreground">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Complete previous lessons to unlock
                                    </Badge>
                                  ) : (
                                    <>
                                      {/* FIXED: Pass lesson object */}
                                      <Button
                                        onClick={() => handleLessonClick(lesson)}
                                        className={`bg-gradient-to-r ${courseGradient} text-white`}
                                        size="sm"
                                      >
                                        <Play className="w-4 h-4 mr-2" />
                                        Start Lesson
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCompleteLesson(lesson.id)}
                                        disabled={isCompletingLesson === lesson.id}
                                      >
                                        {isCompletingLesson === lesson.id ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Completing...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Mark Complete
                                          </>
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Course Overview</CardTitle>
                    <CardDescription>
                      What you'll learn and how this course fits into your learning path
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <TargetIcon className="w-5 h-5 text-primary" />
                        Learning Objectives
                      </h3>
                      <ul className="space-y-3">
                        {course.description ? (
                          // If course has description, use it for objectives
                          course.description.split('. ').filter(Boolean).map((objective, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-card border border-border/50 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-foreground">{objective.trim()}</span>
                            </li>
                          ))
                        ) : (
                          // Fallback objectives
                          [
                            "Master fundamental concepts and principles",
                            "Build practical projects and applications",
                            "Solve real-world coding challenges",
                            "Understand industry best practices",
                            "Prepare for more advanced topics"
                          ].map((objective, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-card border border-border/50 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-foreground">{objective}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Map className="w-5 h-5 text-blue-500" />
                        Learning Path
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-3">
                            <Compass className="w-6 h-6 text-blue-600" />
                            <div>
                              <p className="font-bold text-blue-800">Current Position</p>
                              <p className="text-blue-700">Course {course.order_index}: {course.title}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between px-4">
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-2">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-medium">Course {course.order_index - 1}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          
                          <div className="flex-1 h-0.5 bg-green-500 mx-4"></div>
                          
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-2 shadow-glow">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-bold">Course {course.order_index}</p>
                            <p className="text-xs text-primary">In Progress</p>
                          </div>
                          
                          <div className="flex-1 h-0.5 bg-border mx-4"></div>
                          
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">Course {course.order_index + 1}</p>
                            <p className="text-xs text-muted-foreground">Locked</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* AI Tutor Card */}
            <Card className="border-border/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  AI Tutor Bloo
                </CardTitle>
                <CardDescription>
                  Your personal coding assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16 border-4 border-white shadow-card">
                    <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=bloo&backgroundColor=65c9ff" />
                    <AvatarFallback>Bloo</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-foreground">Bloo AI Assistant</h4>
                    <p className="text-sm text-muted-foreground">Available 24/7</p>
                  </div>
                </div>
                <p className="text-sm text-foreground mb-4">
                  Need help with this course? Bloo is here to answer your questions and provide personalized guidance.
                </p>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask Bloo
                </Button>
              </CardContent>
            </Card>

            {/* Certificate Card */}
            {/* Certificate Generation Card - FIXED */}
<Card className="border-border/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/50">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Award className="w-5 h-5 text-amber-600" />
      Course Certificate
    </CardTitle>
    <CardDescription>
      Earn your official certificate upon course completion
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {progress >= 100 ? (
      <div className="space-y-4">
        <div className="text-center p-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <h4 className="text-lg font-semibold text-slate-700 mb-2">
            Congratulations! 🎉
          </h4>
          <p className="text-slate-600 text-sm mb-6">
            You've completed all lessons! Generate your official certificate now.
          </p>
          
          <Button
            onClick={async (e) => {
              e.preventDefault() // Prevent form submission
              e.stopPropagation() // Stop event bubbling
              
              try {
                setIsGeneratingCertificate(true)
                
                console.log('Generating certificate for:', {
                  courseId,
                  userId,
                  courseTitle: course.title
                })
                
                const response = await fetch('/api/certificates/generate', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ 
                    courseId, 
                    userId 
                  })
                })
                
                console.log('Response status:', response.status)
                
                const data = await response.json()
                console.log('Response data:', data)
                
                if (!response.ok) {
                  if (data.error && data.error.includes('not completed')) {
                    alert(`⚠️ Course not fully completed! You've completed ${data.completed || completedLessons} out of ${data.total || totalLessons} lessons.`)
                  } else {
                    alert(`❌ Error: ${data.error || 'Failed to generate certificate'}`)
                  }
                  return
                }
                
                if (!data.pdfBase64) {
                  alert('❌ No PDF data received from server')
                  return
                }
                
                // Decode base64 and create PDF
                try {
                  const byteCharacters = atob(data.pdfBase64)
                  const byteNumbers = new Array(byteCharacters.length)
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                  }
                  const byteArray = new Uint8Array(byteNumbers)
                  const blob = new Blob([byteArray], { type: 'application/pdf' })
                  const url = window.URL.createObjectURL(blob)
                  
                  // Create and trigger download
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `Certificate-${course.title.replace(/\s+/g, '-')}-${data.certificateCode || 'CERT'}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  
                  // Clean up URL object
                  setTimeout(() => {
                    window.URL.revokeObjectURL(url)
                  }, 100)
                  
                  console.log('✅ Certificate downloaded successfully!')
                  alert(`✅ Certificate "${data.certificateCode}" downloaded successfully!`)
                  
                } catch (downloadError) {
                  console.error('Download error:', downloadError)
                  alert('❌ Error downloading certificate. Please try again.')
                }
                
              } catch (error: any) {
                console.error('Certificate generation error:', error)
                alert(`❌ Error: ${error.message || 'Failed to generate certificate'}`)
              } finally {
                setIsGeneratingCertificate(false)
              }
            }}
            disabled={isGeneratingCertificate}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg w-full py-6"
          >
            {isGeneratingCertificate ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Certificate...
              </>
            ) : (
              <>
                <Award className="w-5 h-5 mr-2" />
                Generate & Download Certificate
              </>
            )}
          </Button>
          
          <p className="text-xs text-slate-500 mt-3">
            PDF certificate will be automatically downloaded
          </p>
          
          {/* Debug info - you can remove this after testing */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg hidden"> {/* Add "hidden" class to hide */}
            <p className="text-xs text-blue-700 font-mono">
              Debug: Course ID: {courseId}<br/>
              User ID: {userId}<br/>
              Progress: {progress}% ({completedLessons}/{totalLessons})
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center p-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h4 className="font-semibold text-slate-700 mb-2">
          Certificate Locked
        </h4>
        <p className="text-slate-600 text-sm mb-4">
          Complete all {totalLessons} lessons to unlock your official certificate
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-semibold">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-slate-500">
            {totalLessons - completedLessons} more to go!
          </div>
        </div>
      </div>
    )}
  </CardContent>
  {progress >= 100 && (
    <CardFooter className="pt-0">
      <div className="w-full text-center">
        <p className="text-xs text-slate-500">
          Your certificate will include a unique verification code that can be 
          verified at any time
        </p>
      </div>
    </CardFooter>
  )}
</Card>
            {/* Badge Progress Section */}
            {/* <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Badge Progress
                </CardTitle>
                <CardDescription>
                  Track your progress towards earning badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBadges ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : badgeProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Award className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No badges available for this course yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {badgeProgress.map((badgeItem, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          badgeItem.isEarned 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'bg-card border-border/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                            badgeItem.isEarned ? 'bg-amber-100' : 'bg-muted'
                          }`}>
                            {getBadgeIcon(badgeItem.badge.rarity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm truncate">{badgeItem.badge.name}</h4>
                              {badgeItem.isEarned ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Earned
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 truncate">
                              {badgeItem.badge.description}
                            </p>
                            
                            {!badgeItem.isEarned && badgeItem.nextThreshold && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">
                                    {badgeItem.currentValue}/{badgeItem.nextThreshold} 
                                    <span className="text-muted-foreground ml-1">
                                      ({Math.round(badgeItem.progress)}%)
                                    </span>
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div 
                                    className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                    style={{ width: `${badgeItem.progress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {badgeItem.nextThreshold - badgeItem.currentValue} more to unlock
                                </div>
                              </div>
                            )}
                            
                            {badgeItem.isEarned && badgeItem.badge.earned_at && (
                              <div className="text-xs text-green-600 mt-1">
                                Earned on {new Date(badgeItem.badge.earned_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  )
}