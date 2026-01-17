// app/dashboard/learn/[courseSlug]/[lessonSlug]/lesson-content.tsx
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Play, CheckCircle, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LessonContentProps {
  courseSlug: string
  lessonSlug: string
}

export default function LessonContent({ courseSlug, lessonSlug }: LessonContentProps) {
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/lessons/by-slug/${lessonSlug}?courseSlug=${courseSlug}`)
        if (response.ok) {
          const data = await response.json()
          setLesson(data.data.lesson)
        }
      } catch (error) {
        console.error('Error fetching lesson:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [courseSlug, lessonSlug])

  const handleBack = () => {
    router.push(`/dashboard/learn/${courseSlug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                <p className="text-muted-foreground">Lesson {lesson.order_index + 1} • {lesson.xp_reward} XP</p>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Play className="w-4 h-4 mr-2" />
                Start Lesson
              </Button>
              <Button variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
                <CardDescription>
                  Complete this lesson to earn {lesson.xp_reward} XP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {lesson.content || 'Lesson content will appear here.'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}