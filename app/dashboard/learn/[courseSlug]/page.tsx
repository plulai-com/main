// app/dashboard/learn/[courseSlug]/page.tsx - FULLY FIXED
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { getSession } from "@/lib/auth"
import CourseContent from "./course-content"

export const metadata: Metadata = {
  title: "Course | CodeNest",
  description: "Continue your learning journey",
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

export default async function CoursePage({ 
  params 
}: { 
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  const session = await getSession()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const supabase = await createClient()

  try {
    console.log('Fetching course data for slug:', courseSlug)
    
    // First, try to find the course by slug
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        lessons (*)
      `)
      .eq('slug', courseSlug)
      .single()

    // If course not found by slug, try to find it by ID (fallback)
    if (courseError || !courseData) {
      console.log('Course not found by slug, trying ID fallback...')
      
      // Check if the slug might be an ID
      const { data: courseById, error: idError } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (*)
        `)
        .eq('id', courseSlug)
        .single()

      if (idError || !courseById) {
        console.log('Course not found by ID either')
        notFound()
      }

      // Use the course found by ID
      return await processCourseData(courseById, userId, supabase, courseSlug)
    }

    // Process course found by slug
    return await processCourseData(courseData, userId, supabase, courseSlug)

  } catch (error) {
    console.error('Error loading course page:', error)
    notFound()
  }
}

async function processCourseData(courseData: any, userId: string, supabase: any, courseSlug: string) {
  // Ensure course has slug
  if (!courseData.slug) {
    courseData.slug = generateSlug(courseData.title)
  }

  // Get user profile for age
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Get user's lesson progress for this course
  const { data: lessonProgressData } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', courseData.lessons?.map((l: any) => l.id) || [])

  // Get user stats
  const { data: userStatsData } = await supabase
    .from('users_progress')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get user badges count
  const { data: badgesData } = await supabase
    .from('user_badges')
    .select('badge_id', { count: 'exact' })
    .eq('user_id', userId)

  // Calculate user age if date_of_birth exists
  let userAge: number | null = null
  if (profileData?.date_of_birth) {
    const birthDate = new Date(profileData.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    userAge = age
  }

  // Get age group
  const getAgeGroup = (age: number | null): string => {
    if (!age) return 'all'
    if (age < 10) return 'young'
    if (age >= 10 && age <= 13) return 'tween'
    return 'teen'
  }
  const ageGroup = profileData?.age_group || getAgeGroup(userAge)

  // Calculate course progress
  const totalLessons = courseData.lessons?.length || 0
  const completedLessons = lessonProgressData?.filter((lp: any) => 
    lp.status === 'completed'
  ).length || 0
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Check if course is unlocked (simplified logic)
  const isUnlocked = (() => {
    // First course is always unlocked
    if (courseData.order_index === 0) return true
    // For now, assume all courses are unlocked - you can add proper logic here
    return true
  })()

  // Check age appropriateness
  const isAgeAppropriate = (() => {
    if (!userAge) return true
    if (courseData.target_age_group === 'all') return true
    if (courseData.min_age && courseData.max_age) {
      return userAge >= courseData.min_age && userAge <= courseData.max_age
    }
    return courseData.target_age_group === ageGroup
  })()

  // Prepare course object
  const course = {
    id: courseData.id,
    title: courseData.title,
    description: courseData.description || '',
    order_index: courseData.order_index,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    progress_percentage: progress,
    is_unlocked: isUnlocked,
    is_age_appropriate: isAgeAppropriate,
    ageGroup: courseData.target_age_group || 'all',
    minAge: courseData.min_age,
    maxAge: courseData.max_age,
    slug: courseData.slug
  }

  // Prepare lessons with slugs
  const lessons = (courseData.lessons || []).map((lesson: any) => ({
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    content: lesson.content,
    order_index: lesson.order_index,
    xp_reward: lesson.xp_reward || 50,
    created_at: lesson.created_at,
    slug: lesson.slug || generateSlug(lesson.title)
  })).sort((a: any, b: any) => a.order_index - b.order_index)

  // Prepare lesson progress
  const lessonProgress = (lessonProgressData || []).map((progress: any) => ({
    lesson_id: progress.lesson_id,
    status: progress.status,
    completed_at: progress.completed_at || undefined
  }))

  // Prepare user stats
  const userStats = {
    level: userStatsData?.level || 1,
    xp: userStatsData?.xp || 0,
    total_xp_earned: 0, // You might want to calculate this from xp_events
    badges_earned: badgesData?.count || 0
  }

  return (
    <CourseContent 
      courseId={course.id}
      courseSlug={courseSlug}  // Pass the slug from URL params
      initialCourse={course}
      initialLessons={lessons}
      initialLessonProgress={lessonProgress}
      userId={userId}
      initialUserStats={userStats}
    />
  )
}