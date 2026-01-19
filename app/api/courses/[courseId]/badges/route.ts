// app/api/courses/[courseId]/badges/route.ts - FIXED ASYNC MAP ISSUE
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }  // ← CHANGED: params is a Promise
) {
  try {
    const { courseId } = await params;  // ← CHANGED: Await the params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    console.log('Fetching badge progress for course identifier:', courseId)

    // Try to fetch course - first try by ID, then by slug
    let courseResponse

    // Check if it looks like a UUID (ID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)
    
    if (isUUID) {
      // Try by ID first
      courseResponse = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
      
      if (courseResponse.error) {
        console.log('Course not found by ID, trying by slug...')
        courseResponse = await supabase
          .from('courses')
          .select('*')
          .eq('slug', courseId)
          .single()
      }
    } else {
      // Try by slug first (not a UUID)
      courseResponse = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseId)
        .single()
      
      if (courseResponse.error) {
        console.log('Course not found by slug, trying by ID...')
        courseResponse = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
      }
    }

    if (courseResponse.error || !courseResponse.data) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          details: `No course found with ${isUUID ? 'ID' : 'slug'}: ${courseId}`
        },
        { status: 404 }
      )
    }

    const course = courseResponse.data

    // Get lessons for this course
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true })

    const lessons = lessonsData || []

    // Get user's lesson progress for this course
    const lessonIds = lessons.map(l => l.id)
    let lessonProgress = []
    
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
      lessonProgress = progressData || []
    }

    // Calculate course progress
    const totalLessons = lessons.length
    const completedLessons = lessonProgress.filter(lp => lp.status === 'completed').length
    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0

    // Get user's earned badges
    const { data: userBadgesData } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId)

    const userBadges = userBadgesData || []
    const earnedBadgeIds = userBadges.map(ub => ub.badge_id)

    // Define course-specific badge criteria
    const courseBadgeCriteria = [
      {
        badgeName: "First Lesson Complete",
        description: "Complete your first lesson in this course",
        condition: completedLessons >= 1,
        progress: completedLessons >= 1 ? 100 : completedLessons > 0 ? 50 : 0,
        currentValue: completedLessons,
        nextThreshold: 1,
        rarity: "common",
        sortOrder: 1,
        icon: "🏁"
      },
      {
        badgeName: "Halfway Hero",
        description: "Complete 50% of the course lessons",
        condition: progressPercentage >= 50,
        progress: Math.min(100, (progressPercentage / 50) * 100),
        currentValue: progressPercentage,
        nextThreshold: 50,
        rarity: "uncommon",
        sortOrder: 2,
        icon: "🏅"
      },
      {
        badgeName: "Course Master",
        description: "Complete all lessons in this course",
        condition: progressPercentage >= 100,
        progress: Math.min(100, progressPercentage),
        currentValue: progressPercentage,
        nextThreshold: 100,
        rarity: "rare",
        sortOrder: 3,
        icon: "🏆"
      },
      {
        badgeName: "Perfect Score",
        description: "Complete all lessons within 24 hours of starting",
        condition: false, // This would require tracking start time
        progress: 0,
        currentValue: 0,
        nextThreshold: 100,
        rarity: "epic",
        sortOrder: 4,
        icon: "🎯"
      },
      {
        badgeName: `${course.title} Expert`,
        description: "Master all concepts in this course",
        condition: progressPercentage >= 100 && completedLessons >= totalLessons,
        progress: progressPercentage >= 100 ? 100 : 0,
        currentValue: completedLessons,
        nextThreshold: totalLessons,
        rarity: "legendary",
        sortOrder: 5,
        icon: "🌟"
      },
      {
        badgeName: "Quick Learner",
        description: "Complete 3 lessons in one day",
        condition: false,
        progress: 0,
        currentValue: 0,
        nextThreshold: 3,
        rarity: "uncommon",
        sortOrder: 6,
        icon: "⚡"
      },
      {
        badgeName: "Persistent Student",
        description: "Complete lessons for 7 consecutive days",
        condition: false,
        progress: 0,
        currentValue: 0,
        nextThreshold: 7,
        rarity: "rare",
        sortOrder: 7,
        icon: "📅"
      }
    ]

    // Process badge progress - Use Promise.all for async operations
    const badgePromises = courseBadgeCriteria.map(async (criteria) => {
      // Check if there's an existing badge with this name in the database
      const { data: existingBadge } = await supabase
        .from('badges')
        .select('*')
        .eq('name', criteria.badgeName)
        .maybeSingle()
      
      // Check if user has earned this badge
      const hasEarned = existingBadge 
        ? earnedBadgeIds.includes(existingBadge.id)
        : criteria.condition

      const badgeData = existingBadge || {
        id: `generated-${criteria.badgeName.toLowerCase().replace(/\s+/g, '-')}`,
        name: criteria.badgeName,
        description: criteria.description,
        icon_url: "",
        rarity: criteria.rarity
      }

      // Get earned date if exists
      const earnedBadge = existingBadge ? userBadges.find(ub => ub.badge_id === existingBadge.id) : null

      return {
        badge: {
          ...badgeData,
          earned_at: earnedBadge?.earned_at || undefined,
          icon: criteria.icon
        },
        progress: Math.round(criteria.progress),
        nextThreshold: criteria.nextThreshold,
        currentValue: criteria.currentValue,
        isEarned: hasEarned,
        sortOrder: criteria.sortOrder
      }
    })

    // Wait for all badge promises to resolve
    const badgeProgress = await Promise.all(badgePromises)

    // Also include any earned badges that are course-specific from database
    const { data: courseSpecificBadges } = await supabase
      .from('badges')
      .select('*')
      .or(`name.ilike.%${course.title}%,description.ilike.%${course.title}%`)
      .limit(5)

    const earnedCourseBadges = (courseSpecificBadges || [])
      .filter(badge => earnedBadgeIds.includes(badge.id))
      .map(badge => {
        const earnedBadge = userBadges.find(ub => ub.badge_id === badge.id)
        return {
          badge: {
            ...badge,
            earned_at: earnedBadge?.earned_at,
            icon: getBadgeIcon(badge.rarity)
          },
          progress: 100,
          nextThreshold: null,
          currentValue: 100,
          isEarned: true,
          sortOrder: 0 // Earned badges first
        }
      })

    // Combine both arrays, avoiding duplicates by badge name
    let allBadgeProgress = [...badgeProgress, ...earnedCourseBadges]
      .filter((badge, index, self) => 
        index === self.findIndex(b => 
          b.badge.name.toLowerCase() === badge.badge.name.toLowerCase()
        )
      )
      // Sort: earned badges first, then by progress (descending), then by sort order
      .sort((a, b) => {
        if (a.isEarned && !b.isEarned) return -1
        if (!a.isEarned && b.isEarned) return 1
        
        // Sort by progress (descending) - higher progress first
        if (a.progress !== b.progress) return b.progress - a.progress
        
        // Then by sort order
        return (a.sortOrder || 999) - (b.sortOrder || 999)
      })

    // Filter to get only the next 3 upcoming badges (not earned, with highest progress first)
    const upcomingBadges = allBadgeProgress
      .filter(badge => !badge.isEarned)
      .sort((a, b) => b.progress - a.progress) // Sort by progress descending
      .slice(0, 3) // Take only top 3

    // If less than 3 upcoming badges, add some earned badges to fill
    let finalBadgeProgress = [...upcomingBadges]
    
    if (finalBadgeProgress.length < 3) {
      const earnedBadges = allBadgeProgress
        .filter(badge => badge.isEarned)
        .sort((a, b) => {
          // Sort earned badges by rarity and recency
          const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
          const aRarity = a.badge.rarity || 'common'
          const bRarity = b.badge.rarity || 'common'
          return (rarityOrder[aRarity as keyof typeof rarityOrder] || 4) - 
                 (rarityOrder[bRarity as keyof typeof rarityOrder] || 4)
        })
        .slice(0, 3 - finalBadgeProgress.length)
      
      finalBadgeProgress = [...earnedBadges, ...finalBadgeProgress]
    }

    // Get XP earned in this course
    const earnedXPInCourse = lessons.reduce((total, lesson) => {
      const progressItem = lessonProgress.find(lp => lp.lesson_id === lesson.id)
      return progressItem?.status === 'completed' 
        ? total + (lesson.xp_reward || 50) 
        : total
    }, 0)

    const response = {
      success: true,
      data: {
        badgeProgress: finalBadgeProgress,
        courseProgress: {
          totalLessons,
          completedLessons,
          percentage: progressPercentage,
          earnedXP: earnedXPInCourse,
          totalXP: lessons.reduce((total, lesson) => total + (lesson.xp_reward || 50), 0)
        },
        metadata: {
          course_id: course.id,
          course_title: course.title,
          total_upcoming_badges: upcomingBadges.length,
          total_earned_badges: allBadgeProgress.filter(b => b.isEarned).length,
          showing_next_3: true
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error fetching badge progress:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch badge progress',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper function to get badge icon based on rarity
function getBadgeIcon(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '🌟'
    case 'epic': return '🎯'
    case 'rare': return '🏆'
    case 'uncommon': return '🏅'
    case 'common': return '🏁'
    default: return '🎖️'
  }
}