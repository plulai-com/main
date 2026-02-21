// app/dashboard/learn/[courseSlug]/[lessonSlug]/page.tsx
import { createClient } from '@/lib/server'
import LessonClient from './lesson-client'

interface PageProps {
  params: Promise<{
    courseSlug: string
    lessonSlug: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  // Await the params (Next.js 15)
  const { courseSlug, lessonSlug } = await params
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access this lesson</p>
        </div>
      </div>
    )
  }

  try {
    // Fetch course by slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('slug', courseSlug)
      .single()

    if (courseError || !course) {
      console.error('Course fetch error:', courseError)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-muted-foreground">
              Course with slug &quot;{courseSlug}&quot; does not exist.
            </p>
          </div>
        </div>
      )
    }

    // Fetch lesson by slug
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('slug', lessonSlug)
      .eq('course_id', course.id)
      .single()

    if (lessonError || !lesson) {
      console.error('Lesson fetch error:', lessonError)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
            <p className="text-muted-foreground">
              The lesson &quot;{lessonSlug}&quot; does not exist in this course.
            </p>
          </div>
        </div>
      )
    }

    // Fetch all activities (lesson_steps) for this lesson
    const { data: activities, error: activitiesError } = await supabase
      .from('lesson_steps')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('order_index', { ascending: true })

    if (activitiesError) {
      console.error('Activities fetch error:', activitiesError)
    }

    // Fetch user's progress for this lesson
    const { data: lessonProgress, error: lessonProgressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle()

    if (lessonProgressError) {
      console.error('Lesson progress fetch error:', lessonProgressError)
    }

    // Fetch progress for each activity
    const activityIds = activities?.map((a: any) => a.id) || []
    let activityProgress: any[] = []
    
    if (activityIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from('step_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('step_id', activityIds)
        .order('updated_at', { ascending: false })

      if (!progressError) {
        activityProgress = progressData || []
      } else {
        console.error('Activity progress fetch error:', progressError)
      }
    }

    // Fetch previous and next lessons
    const { data: allLessons, error: allLessonsError } = await supabase
      .from('lessons')
      .select('id, title, slug, order_index')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true })

    let previousLesson = null
    let nextLesson = null
    
    if (!allLessonsError && allLessons) {
      const currentLessonIndex = allLessons.findIndex((l: any) => l.id === lesson.id)
      
      if (currentLessonIndex > 0) {
        previousLesson = allLessons[currentLessonIndex - 1]
      }
      
      if (currentLessonIndex < allLessons.length - 1) {
        nextLesson = allLessons[currentLessonIndex + 1]
      }
    }

    // Fetch user's XP for display
    const { data: userProgress } = await supabase
      .from('users_progress')
      .select('xp, level')
      .eq('user_id', user.id)
      .single()

    return (
      <LessonClient
        user={{
          id: user.id,
          email: user.email || '',
          xp: userProgress?.xp || 0,
          level: userProgress?.level || 1
        }}
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug || courseSlug
        }}
        lesson={{
          ...lesson,
          xp_reward: lesson.xp_reward || 50
        }}
        activities={activities || []}
        initialLessonProgress={lessonProgress}
        initialActivityProgress={activityProgress}
        navigation={{
          previous: previousLesson ? {
            title: previousLesson.title,
            slug: previousLesson.slug
          } : null,
          next: nextLesson ? {
            title: nextLesson.title,
            slug: nextLesson.slug
          } : null
        }}
      />
    )

  } catch (error) {
    console.error('Unexpected error in lesson page:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground">
            There was an error loading the lesson. Please try again.
          </p>
        </div>
      </div>
    )
  }
}