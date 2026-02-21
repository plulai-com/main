"use server"

import { createClient } from "@/lib/server"
import { cache } from "react"

export const getDashboardData = cache(async (userId: string) => {
  if (!userId) return null
  
  const supabase = await createClient()
  
  try {
    // Fetch critical data first, then non-critical in parallel
    const [profileResult, progressResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("users_progress").select("*").eq("user_id", userId).single()
    ])

    // Early return if user doesn't exist
    if (!profileResult.data) return null

    // Fetch non-critical data in parallel
    const [
      coursesResult,
      lessonProgressResult,
      badgesResult,
      xpEventsResult
    ] = await Promise.all([
      supabase
        .from("courses")
        .select(`id, title, description, order_index, min_age, max_age, duration, lessons(id)`)
        .order("order_index"),
      supabase
        .from("lesson_progress")
        .select("lesson_id, status, completed_at")
        .eq("user_id", userId),
      supabase
        .from("user_badges")
        .select(`badge_id, earned_at, badges(name, category)`)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(12),
      supabase
        .from("xp_events")
        .select("amount")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Calculate age and age group
    let age: number | null = null
    let ageGroup = 'all'
    
    if (profileResult.data?.date_of_birth) {
      const birthDate = new Date(profileResult.data.date_of_birth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      if (age < 10) ageGroup = 'young'
      else if (age >= 10 && age <= 13) ageGroup = 'tween'
      else if (age >= 14) ageGroup = 'teen'
    }

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dailyActivity = (lessonProgressResult.data || []).filter((lp: any) => 
      lp.completed_at && new Date(lp.completed_at) >= today
    ).length

    const weeklyXP = (xpEventsResult.data || []).reduce((sum: number, event: any) => sum + event.amount, 0)

    // Filter age-appropriate courses
    const ageAppropriateCourses = (coursesResult.data || []).filter((course: any) => {
      if (!age) return true
      const minAge = course.min_age || 0
      const maxAge = course.max_age || 100
      return age >= minAge && age <= maxAge
    })

    // Process badges
    const badges = (badgesResult.data || []).map((ub: any) => ({
      id: ub.badge_id,
      name: ub.badges.name,
      category: ub.badges.category || "Achievement",
      earned_at: ub.earned_at,
    }))

    return {
      profile: profileResult.data,
      progress: progressResult.data,
      courses: ageAppropriateCourses,
      lessonProgress: lessonProgressResult.data || [],
      badges,
      stats: {
        weeklyXP,
        dailyActivity,
        totalCompletedLessons: (lessonProgressResult.data || []).filter((lp: any) => lp.status === "completed").length,
        completedCourses: calculateCompletedCourses(ageAppropriateCourses, lessonProgressResult.data || []),
        badgesCount: badges.length,
        streak: profileResult.data?.day_streak || 0,
        currentLevel: progressResult.data?.level || 1,
        userXP: progressResult.data?.xp || 0,
        ageGroup,
        age
      }
    }
  } catch (error) {
    console.error("Error in getDashboardData:", error)
    return null
  }
})

function calculateCompletedCourses(courses: any[], lessonProgress: any[]) {
  let completedCount = 0
  
  for (const course of courses) {
    const courseLessons = course.lessons || []
    if (courseLessons.length === 0) continue
    
    const completedLessonsInCourse = courseLessons.filter((lesson: any) => 
      lessonProgress.some((lp: any) => lp.lesson_id === lesson.id && lp.status === "completed")
    ).length
    
    if (completedLessonsInCourse === courseLessons.length) {
      completedCount++
    }
  }
  
  return completedCount
}

// Separate lightweight function for leaderboard
export const getLeaderboardData = cache(async () => {
  const supabase = await createClient()
  
  try {
    const { data } = await supabase
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
      .limit(50)

    return data || []
  } catch (error) {
    console.error("Error in getLeaderboardData:", error)
    return []
  }
})