// utils/certificate-helpers.ts

// Define types for better type safety
interface Lesson {
  id: string
}

interface LessonProgress {
  lesson_id: string
  status: string
}

interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_code: string
  issued_at: string
  courses?: {
    title: string
    description: string
  }
}

/**
 * Check if user has completed a course
 */
export async function checkCourseCompletion(
  supabase: any,
  userId: string,
  courseId: string
): Promise<{ completed: boolean; completedLessons: number; totalLessons: number }> {
  try {
    // Get all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (lessonsError || !lessons) {
      return { completed: false, completedLessons: 0, totalLessons: 0 }
    }

    // Get user's progress for these lessons
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id, status')
      .eq('user_id', userId)
      .in('lesson_id', lessons.map((l: Lesson) => l.id))

    if (progressError) {
      return { completed: false, completedLessons: 0, totalLessons: lessons.length }
    }

    const completedLessons = progress?.filter((p: LessonProgress) => p.status === 'completed').length || 0
    const completed = completedLessons === lessons.length

    return {
      completed,
      completedLessons,
      totalLessons: lessons.length
    }

  } catch (error) {
    console.error('Error checking course completion:', error)
    return { completed: false, completedLessons: 0, totalLessons: 0 }
  }
}

/**
 * Generate a unique certificate code
 */
export function generateCertificateCode(): string {
  const prefix = 'CERT'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Format certificate date
 */
export function formatCertificateDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Get certificate status
 */
export async function getCertificateStatus(
  supabase: any,
  userId: string,
  courseId: string
): Promise<{ exists: boolean; certificate: Certificate | null }> {
  try {
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses:course_id (
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (error || !certificate) {
      return { exists: false, certificate: null }
    }

    return { exists: true, certificate }
  } catch (error) {
    console.error('Error getting certificate status:', error)
    return { exists: false, certificate: null }
  }
}