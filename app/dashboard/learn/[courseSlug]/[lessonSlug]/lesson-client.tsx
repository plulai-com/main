// app/dashboard/learn/[courseSlug]/[lessonSlug]/lesson-client.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, BookOpen, CheckCircle, 
  ChevronLeft, ChevronRight, Video, FileText, HelpCircle,
  Puzzle, Upload, ExternalLink, Image as ImageIcon,
  Trophy, Sparkles, Home, Star, MessageCircle, Send, Bot,
  Smile, Heart, PartyPopper, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import ActivityRenderer from './components/ActivityRenderer'
import { useAIChat } from '@/hooks/useAIChat'

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
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const sortedActivities = [...activities].sort((a, b) => a.order_index - b.order_index)
  const currentActivity = sortedActivities[currentActivityIndex]

  // Use the AI Chat hook with rich context
  const { messages: chatMessages, isTyping: isBotTyping, sendMessage } = useAIChat({
    userId: user.id,
    lessonId: lesson.id,
    courseId: course.id,
    language: 'en', // You can make this dynamic based on user preference
    personality: 'bloo', // You can make this selectable
    // Student context
    userLevel,
    userXP,
    // Lesson context
    lessonTitle: lesson.title,
    lessonContent: lesson.content,
    // Course context
    courseTitle: course.title,
    // Current activity context
    currentActivity: currentActivity ? {
      title: currentActivity.title,
      type: currentActivity.type,
      content: currentActivity.content
    } : undefined
  })

  // Calculate overall progress
  const completedActivities = activityProgress.filter(ap => ap.status === 'completed').length
  const totalActivities = sortedActivities.length
  const progressPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0

  // Check if current activity is completed
  const currentActivityProgress = activityProgress.find(ap => ap.step_id === currentActivity?.id)
  const isCurrentActivityCompleted = currentActivityProgress?.status === 'completed'

  // Check if all activities are completed
  const allActivitiesCompleted = completedActivities === totalActivities

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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
      handleCompleteLesson()
      router.push(`/dashboard/learn/${course.slug}/${navigation.next.slug}`)
    } else {
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
        setLessonProgress({
          lesson_id: lesson.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        setUserXP(prev => prev + lesson.xp_reward)
        setShowCompletionCelebration(true)
        
        await fetchUserXP()
        
        setTimeout(() => setShowCompletionCelebration(false), 4000)
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

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'video': return 'bg-[#2B70C9]' // Blue
      case 'quiz': return 'bg-[#1CB0F6]' // Light Blue
      case 'submission': return 'bg-[#58CC02]' // Green (success color)
      case 'text': return 'bg-[#FAA918]' // Orange
      case 'link': return 'bg-[#14D4F4]' // Cyan
      case 'picture': return 'bg-[#2B70C9]' // Blue
      case 'case_study': return 'bg-[#1CB0F6]' // Light Blue
      case 'activity': return 'bg-[#FAA918]' // Orange
      default: return 'bg-[#6F6F6F]' // Gray
    }
  }

  // Chatbot functionality
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const message = chatInput
    setChatInput('')
    
    // Send message through the AI hook
    await sendMessage(message)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Celebration Modal */}
      {showCompletionCelebration && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-in zoom-in shadow-2xl">
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#FAA918] flex items-center justify-center animate-bounce shadow-lg">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-[#2B70C9]">
              Lesson Complete!
            </h2>
            <div className="bg-[#14D4F4]/10 rounded-xl p-4 mb-6">
              <p className="text-2xl font-bold text-[#FAA918]">+{lesson.xp_reward} XP</p>
            </div>
            <div className="flex gap-3">
              {navigation.next ? (
                <Button 
                  className="flex-1 bg-[#1CB0F6] hover:bg-[#14D4F4] text-white text-lg py-6 rounded-xl font-bold shadow-lg transition-all"
                  onClick={() => router.push(`/dashboard/learn/${course.slug}/${navigation.next!.slug}`)}
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-[#1CB0F6] hover:bg-[#14D4F4] text-white text-lg py-6 rounded-xl font-bold shadow-lg"
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
      <div className="bg-white border-b-2 border-[#E5E5E5] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-[#6F6F6F] hover:text-[#2B70C9] hover:bg-[#1CB0F6]/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Course
            </Button>

            <div className="flex items-center gap-3">
              <div className="bg-[#FAA918] text-white rounded-2xl px-4 py-2 flex items-center gap-2 font-bold">
                <Zap className="w-4 h-4" />
                {userXP} XP
              </div>
              <div className="bg-[#2B70C9] text-white rounded-2xl px-4 py-2 font-bold">
                Level {userLevel}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl font-bold text-[#2B70C9]">
                {lesson.title}
              </h1>
              <span className="text-lg font-bold text-[#1CB0F6]">{completedActivities}/{totalActivities}</span>
            </div>
            <div className="relative h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-[#1CB0F6] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          
          {/* Main Activity Area */}
          <div>
            {currentActivity ? (
              <Card className="border-2 border-[#E5E5E5] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b-2 border-[#E5E5E5] py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getActivityColor(currentActivity.type)}`}>
                        {(() => {
                          const Icon = getActivityIcon(currentActivity.type)
                          return <Icon className="w-6 h-6 text-white" />
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-[#2B70C9]">{currentActivity.title}</CardTitle>
                        <p className="text-sm text-[#6F6F6F]">
                          Activity {currentActivityIndex + 1} of {totalActivities}
                        </p>
                      </div>
                    </div>
                    {isCurrentActivityCompleted && (
                      <div className="bg-[#58CC02] rounded-xl p-2">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 bg-white min-h-[400px]">
                  <ActivityRenderer
                    activity={currentActivity}
                    userId={user.id}
                    onComplete={() => updateActivityProgress(currentActivity.id, 'completed')}
                    isCompleted={isCurrentActivityCompleted}
                  />
                </CardContent>
                
                <div className="p-4 bg-white border-t-2 border-[#E5E5E5]">
                  <div className="flex gap-3">
                    <Button
                      onClick={handlePrevious}
                      disabled={currentActivityIndex === 0 && !navigation.previous}
                      variant="outline"
                      className="flex-1 border-2 border-[#E5E5E5] text-[#6F6F6F] hover:bg-[#F5F5F5] rounded-xl py-6 font-bold disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Previous
                    </Button>
                    
                    {!isCurrentActivityCompleted && (
                      <Button
                        onClick={markActivityAsComplete}
                        className="flex-1 bg-[#58CC02] hover:bg-[#58CC02]/90 text-white rounded-xl py-6 font-bold"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-[#1CB0F6] hover:bg-[#14D4F4] text-white rounded-xl py-6 font-bold"
                    >
                      {currentActivityIndex === sortedActivities.length - 1
                        ? navigation.next ? 'Next Lesson' : 'Finish'
                        : 'Next'}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>

                  {allActivitiesCompleted && !lessonProgress?.completed_at && (
                    <div className="mt-4 p-4 bg-[#FAA918]/10 border-2 border-[#FAA918] rounded-xl">
                      <p className="text-center font-bold text-[#FAA918] mb-3">
                        🎉 Ready to complete! Earn {lesson.xp_reward} XP
                      </p>
                      <Button
                        onClick={handleCompleteLesson}
                        disabled={isCompleting}
                        className="w-full bg-[#FAA918] hover:bg-[#FAA918]/90 text-white rounded-xl py-4 font-bold"
                      >
                        {isCompleting ? 'Completing...' : 'Finish Lesson'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-[#6F6F6F]">No activities found</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            
            {/* Activities Progress */}
            <Card className="border-2 border-[#E5E5E5] rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#2B70C9] text-white py-3">
                <CardTitle className="text-base font-bold">Activities</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto">
                  {sortedActivities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type)
                    const progress = activityProgress.find(ap => ap.step_id === activity.id)
                    const isCompleted = progress?.status === 'completed'
                    const isCurrent = index === currentActivityIndex
                    
                    return (
                      <button
                        key={activity.id}
                        onClick={() => setCurrentActivityIndex(index)}
                        className={`w-full text-left p-3 flex items-center gap-3 border-b border-[#E5E5E5] transition-colors ${
                          isCurrent ? 'bg-[#1CB0F6]/10' : 'hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-[#58CC02]' 
                            : isCurrent
                            ? getActivityColor(activity.type)
                            : 'bg-[#E5E5E5]'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <ActivityIcon className={`w-5 h-5 ${isCompleted || isCurrent ? 'text-white' : 'text-[#6F6F6F]'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isCurrent ? 'text-[#1CB0F6]' : 'text-[#2B70C9]'}`}>
                            {activity.title}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Chatbot */}
            <Card className="border-2 border-[#E5E5E5] rounded-2xl overflow-hidden">
              <CardHeader 
                className="bg-[#1CB0F6] text-white py-3 cursor-pointer hover:bg-[#14D4F4] transition-colors"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Learning Helper
                  </CardTitle>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isChatOpen ? 'rotate-90' : ''}`} />
                </div>
              </CardHeader>
              
              {isChatOpen && (
                <>
                  <CardContent className="p-3 h-64 overflow-y-auto bg-[#F5F5F5]">
                    <div className="space-y-2">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                            message.sender === 'user'
                              ? 'bg-[#1CB0F6] text-white'
                              : 'bg-white text-[#2B70C9] border border-[#E5E5E5]'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                          </div>
                        </div>
                      ))}
                      {isBotTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-xl px-3 py-2 border border-[#E5E5E5]">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-[#1CB0F6] rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-[#1CB0F6] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-[#1CB0F6] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </CardContent>
                  
                  <div className="p-3 bg-white border-t-2 border-[#E5E5E5]">
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a question..."
                        className="flex-1 rounded-xl border-2 border-[#E5E5E5] focus:border-[#1CB0F6]"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-[#1CB0F6] hover:bg-[#14D4F4] text-white rounded-xl px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={() => setChatInput("Can you explain this?")}
                        className="text-xs bg-[#E5E5E5] text-[#6F6F6F] px-3 py-1 rounded-full hover:bg-[#1CB0F6] hover:text-white transition-colors"
                      >
                        Explain
                      </button>
                      <button 
                        onClick={() => setChatInput("I need help")}
                        className="text-xs bg-[#E5E5E5] text-[#6F6F6F] px-3 py-1 rounded-full hover:bg-[#1CB0F6] hover:text-white transition-colors"
                      >
                        Help
                      </button>
                      <button 
                        onClick={() => setChatInput("Give me a hint")}
                        className="text-xs bg-[#E5E5E5] text-[#6F6F6F] px-3 py-1 rounded-full hover:bg-[#1CB0F6] hover:text-white transition-colors"
                      >
                        Hint
                      </button>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* Completion Status */}
            {lessonProgress?.completed_at && (
              <Card className="border-2 border-[#58CC02] rounded-2xl bg-[#58CC02]/5 overflow-hidden">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto bg-[#58CC02] rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#58CC02] mb-2">Completed!</h3>
                  <p className="text-sm text-[#6F6F6F]">
                    +{lesson.xp_reward} XP earned
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}