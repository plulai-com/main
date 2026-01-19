// app/dashboard/learn/[courseSlug]/[lessonSlug]/lesson-client.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, BookOpen, Play, CheckCircle, Clock, Zap, 
  ChevronLeft, ChevronRight, Video, FileText, HelpCircle,
  Puzzle, Upload, ExternalLink, Image as ImageIcon,
  AlertCircle, Trophy, Sparkles, Eye, Target, Award,
  Users, BarChart3, Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ActivityRenderer from './components/ActivityRenderer'
import Navigation from './components/Navigation'
import ProgressTracker from './components/ProgressTracker'

interface User {
  id: string
  email: string
  xp: number
  level: number
}

interface Course {
  id: string
  title: string
  slug: string
}

interface Lesson {
  id: string
  title: string
  content?: string
  xp_reward: number
  slug: string
  created_at?: string
}

interface Activity {
  id: string
  lesson_id: string
  title: string
  content: string
  type: 'video' | 'quiz' | 'submission' | 'text' | 'link' | 'picture' | 'activity' | 'case_study'
  order_index: number
  duration?: number
  required: boolean
  metadata?: any
  created_at?: string
}

interface ActivityProgress {
  id: string
  step_id: string
  status: 'completed' | 'in_progress' | 'not_started'
  started_at?: string
  completed_at?: string
  updated_at?: string
}

interface LessonProgress {
  id?: string
  user_id?: string
  lesson_id: string
  status: 'completed' | 'in_progress' | 'not_started'
  completed_at?: string
}

interface NavigationItem {
  title: string
  slug: string
}

interface LessonClientProps {
  user: User
  course: Course
  lesson: Lesson
  activities: Activity[]
  initialLessonProgress?: LessonProgress
  initialActivityProgress: ActivityProgress[]
  navigation: {
    previous: NavigationItem | null
    next: NavigationItem | null
  }
}

// API endpoints for database operations
const API_ENDPOINTS = {
  completeActivity: '/api/activities/progress',
  completeLesson: '/api/lessons/complete',
  getUserXP: (userId: string) => `/api/users/${userId}/xp`,
}

export default function LessonClient({
  user,
  course,
  lesson,
  activities,
  initialLessonProgress,
  initialActivityProgress,
  navigation
}: LessonClientProps) {
  const router = useRouter()
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [activityProgress, setActivityProgress] = useState<ActivityProgress[]>(initialActivityProgress)
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | undefined>(initialLessonProgress)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [userXP, setUserXP] = useState(user.xp || 0)
  const [userLevel, setUserLevel] = useState(user.level || 1)
  const [isLoading, setIsLoading] = useState(false)

  const sortedActivities = [...activities].sort((a, b) => a.order_index - b.order_index)
  const currentActivity = sortedActivities[currentActivityIndex]

  // Calculate overall progress
  const completedActivities = activityProgress.filter(ap => ap.status === 'completed').length
  const totalActivities = sortedActivities.length
  const progressPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0

  // Check if current activity is completed
  const currentActivityProgress = activityProgress.find(ap => ap.step_id === currentActivity?.id)
  const isCurrentActivityCompleted = currentActivityProgress?.status === 'completed'

  // Check if all activities are completed
  const allActivitiesCompleted = completedActivities === totalActivities

  // Fetch user's current XP
  const fetchUserXP = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.getUserXP(user.id))
      if (response.ok) {
        const data = await response.json()
        setUserXP(data.xp || 0)
        setUserLevel(data.level || 1)
      }
    } catch (error) {
      console.error('Error fetching user XP:', error)
    }
  }, [user.id])

  useEffect(() => {
    fetchUserXP()
  }, [fetchUserXP])

  const handleBack = () => {
    router.push(`/dashboard/learn/${course.slug}`)
  }

  const handleHome = () => {
    router.push('/dashboard/learn')
  }

  const handlePrevious = () => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(prev => prev - 1)
    } else if (navigation.previous) {
      router.push(`/dashboard/learn/${course.slug}/${navigation.previous.slug}`)
    }
  }

  const handleNext = () => {
    if (currentActivityIndex < sortedActivities.length - 1) {
      setCurrentActivityIndex(prev => prev + 1)
    } else if (navigation.next) {
      // Mark lesson as completed before moving to next lesson
      handleCompleteLesson()
      router.push(`/dashboard/learn/${course.slug}/${navigation.next.slug}`)
    } else {
      // This is the last activity of the last lesson
      handleCompleteLesson()
    }
  }

  const updateActivityProgress = async (activityId: string, status: ActivityProgress['status']) => {
    try {
      const response = await fetch(API_ENDPOINTS.completeActivity, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          activityId,
          status,
          lessonId: lesson.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        setActivityProgress(prev => {
          const existing = prev.find(ap => ap.step_id === activityId)
          if (existing) {
            return prev.map(ap => 
              ap.step_id === activityId 
                ? { ...ap, status, completed_at: status === 'completed' ? new Date().toISOString() : ap.completed_at }
                : ap
            )
          }
          return [...prev, {
            id: data.progressId,
            step_id: activityId,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined,
            started_at: new Date().toISOString()
          }]
        })

        // If all activities are now completed, mark lesson as completed
        if (status === 'completed') {
          const updatedCompleted = activityProgress
            .filter(ap => ap.step_id !== activityId)
            .filter(ap => ap.status === 'completed').length + 1
            
          if (updatedCompleted === totalActivities) {
            handleCompleteLesson()
          }
        }
      }
    } catch (error) {
      console.error('Error updating activity progress:', error)
    }
  }

  const handleCompleteLesson = async () => {
    if (lessonProgress?.status === 'completed' || isCompleting) return

    setIsCompleting(true)
    try {
      const response = await fetch(API_ENDPOINTS.completeLesson, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          lessonId: lesson.id,
          courseId: course.id,
          xpReward: lesson.xp_reward
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLessonProgress({
          lesson_id: lesson.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        setUserXP(prev => prev + lesson.xp_reward)
        setShowCompletionCelebration(true)
        
        // Refresh user XP
        await fetchUserXP()
        
        // Hide celebration after 3 seconds
        setTimeout(() => setShowCompletionCelebration(false), 3000)
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const markActivityAsComplete = () => {
    if (currentActivity && !isCurrentActivityCompleted) {
      updateActivityProgress(currentActivity.id, 'completed')
    }
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'video': return Video
      case 'quiz': return HelpCircle
      case 'submission': return Upload
      case 'text': return FileText
      case 'link': return ExternalLink
      case 'picture': return ImageIcon
      case 'case_study': return BookOpen
      case 'activity': return Puzzle
      default: return FileText
    }
  }

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Previous: Left Arrow or Ctrl + [
      if (e.key === 'ArrowLeft' || (e.ctrlKey && e.key === '[')) {
        e.preventDefault()
        handlePrevious()
      }
      // Next: Right Arrow or Ctrl + ]
      if (e.key === 'ArrowRight' || (e.ctrlKey && e.key === ']')) {
        e.preventDefault()
        handleNext()
      }
      // Mark complete: Ctrl + Enter
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        markActivityAsComplete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentActivityIndex, sortedActivities.length, navigation])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading lesson content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Celebration Modal */}
      {showCompletionCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 max-w-md mx-4 text-center animate-in zoom-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-bounce">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Lesson Completed! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You earned <span className="font-bold text-amber-500">{lesson.xp_reward} XP</span>
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCompletionCelebration(false)}
              >
                Continue
              </Button>
              {navigation.next ? (
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={() => router.push(`/dashboard/learn/${course.slug}/${navigation.next!.slug}`)}
                >
                  Next Lesson <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  className="flex-1"
                  onClick={handleBack}
                >
                  Back to Course
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </Button>
              <Button
                variant="ghost"
                onClick={handleHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                All Courses
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {userXP} XP
              </Badge>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">
                Level {userLevel}
              </Badge>
              <Badge variant="outline">
                Activity {currentActivityIndex + 1}/{totalActivities}
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {course.title} • {lesson.xp_reward} XP • {sortedActivities.length} activities
              </p>
              {lessonProgress?.status === 'completed' && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="font-bold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedActivities} of {totalActivities} activities</span>
              <span>{lessonProgress?.completed_at ? `Completed on ${new Date(lessonProgress.completed_at).toLocaleDateString()}` : 'In Progress'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Activities List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activities</CardTitle>
                  <CardDescription>
                    Complete all to finish the lesson
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {sortedActivities.map((activity, index) => {
                      const ActivityIcon = getActivityIcon(activity.type)
                      const progress = activityProgress.find(ap => ap.step_id === activity.id)
                      const isCompleted = progress?.status === 'completed'
                      const isCurrent = index === currentActivityIndex
                      
                      return (
                        <button
                          key={activity.id}
                          onClick={() => setCurrentActivityIndex(index)}
                          className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                            isCurrent 
                              ? 'bg-primary/10 border-l-4 border-primary' 
                              : 'hover:bg-accent'
                          } ${isCompleted ? 'opacity-100' : 'opacity-90'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-100 text-green-600' 
                              : isCurrent
                              ? 'bg-primary text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-medium text-sm truncate ${
                                isCurrent ? 'text-primary' : 'text-foreground'
                              }`}>
                                {activity.title}
                              </span>
                              {isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground capitalize">
                                {activity.type.replace('_', ' ')}
                              </span>
                              {activity.duration && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.duration}m
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Stats */}
              <div className="mt-6">
                <ProgressTracker
                  completed={completedActivities}
                  total={totalActivities}
                  estimatedTime={sortedActivities.reduce((sum, a) => sum + (a.duration || 5), 0)}
                  xpReward={lesson.xp_reward}
                />
              </div>
            </div>

            {/* Center Column - Activity Content */}
            <div className="lg:col-span-2">
              {currentActivity ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${
                            isCurrentActivityCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                          } flex items-center justify-center`}>
                            {(() => {
                              const Icon = getActivityIcon(currentActivity.type)
                              return <Icon className="w-5 h-5" />
                            })()}
                          </div>
                          <div>
                            <CardTitle>{currentActivity.title}</CardTitle>
                            <CardDescription className="capitalize">
                              {currentActivity.type.replace('_', ' ')} • Activity {currentActivity.order_index + 1}
                              {currentActivity.required && ' • Required'}
                            </CardDescription>
                          </div>
                        </div>
                        {isCurrentActivityCompleted && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ActivityRenderer
                        activity={currentActivity as any}
                        userId={user.id}
                        onComplete={() => updateActivityProgress(currentActivity.id, 'completed')}
                        isCompleted={isCurrentActivityCompleted}
                      />
                    </CardContent>
                    
                    <CardFooter className="flex flex-col gap-4">
                      <div className="flex items-center justify-between w-full">
                        <Button
                          variant="outline"
                          onClick={markActivityAsComplete}
                          disabled={isCurrentActivityCompleted}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {isCurrentActivityCompleted ? 'Completed' : 'Mark as Complete'}
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentActivityIndex === 0 && !navigation.previous}
                            className="flex items-center gap-2"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          
                          <Button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center gap-2"
                          >
                            {currentActivityIndex === sortedActivities.length - 1
                              ? navigation.next ? 'Next Lesson' : 'Complete Lesson'
                              : 'Next Activity'}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {currentActivityIndex === sortedActivities.length - 1 && allActivitiesCompleted && !lessonProgress?.completed_at && (
                        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                          <Trophy className="w-4 h-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            All activities completed! You can now finish the lesson and earn {lesson.xp_reward} XP.
                          </AlertDescription>
                          <Button
                            onClick={handleCompleteLesson}
                            disabled={isCompleting}
                            className="ml-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          >
                            {isCompleting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Completing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Finish Lesson (+{lesson.xp_reward} XP)
                              </>
                            )}
                          </Button>
                        </Alert>
                      )}
                    </CardFooter>
                  </Card>

                  {/* Keyboard Shortcuts Help */}
                  <div className="text-xs text-muted-foreground p-4 border rounded-lg bg-card">
                    <p className="font-medium mb-2">Keyboard Shortcuts:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd>
                        <span>Previous</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd>
                        <span>Next</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
                        <span>+</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                        <span>Mark Complete</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                        <span>Back to Course</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No activities found for this lesson.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Lesson Info & Navigation */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lesson Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">XP Reward</span>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        <Zap className="w-3 h-3 mr-1" />
                        {lesson.xp_reward} XP
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className={`text-sm font-medium ${
                        lessonProgress?.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {lessonProgress?.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Activities</span>
                      <span className="text-sm font-medium">{completedActivities}/{totalActivities}</span>
                    </div>
                    {lesson.created_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm">{new Date(lesson.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Navigation
                courseSlug={course.slug}
                previous={navigation.previous}
                next={navigation.next}
                onPrevious={handlePrevious}
                onNext={handleNext}
                canComplete={allActivitiesCompleted && !lessonProgress?.completed_at}
                onComplete={handleCompleteLesson}
                isCompleting={isCompleting}
                xpReward={lesson.xp_reward}
              />

              {lessonProgress?.completed_at && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-bold text-green-800 mb-2">Lesson Completed!</h3>
                    <p className="text-sm text-green-700 mb-4">
                      You earned {lesson.xp_reward} XP on {new Date(lessonProgress.completed_at).toLocaleDateString()}
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      onClick={() => router.push(`/dashboard/learn/${course.slug}`)}
                    >
                      Back to Course
                    </Button>
                  </CardContent>
                </Card>
              )}

              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}