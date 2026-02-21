// lib/queries.ts - UPDATED WITH SLUG SUPPORT
import { createClient, createClientWithoutCookies } from "@/lib/server"
import { unstable_cache } from "next/cache"

// Types for leaderboard
export interface LeaderboardUser {
  id: string
  email: string
  username?: string
  avatar_custom_url?: string
  avatar_id?: string
  day_streak: number
  users_progress: {
    level: number
    xp: number
    updated_at: string
  }[]
  age?: number | null
  age_group?: string
  date_of_birth?: string | null
}

// Helper to get current user
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Basic user data functions
export async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return data
}

export async function getUserProgress() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("users_progress")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return data
}

// Dashboard data with caching - UPDATED to accept userId
export async function getDashboardData(userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()
  if (!user) return null
  
  return getCachedDashboardData(user.id)
}

const getCachedDashboardData = unstable_cache(
  async (userId: string) => {
    // Use client WITHOUT cookies for cached functions
    const supabase = createClientWithoutCookies()

    const [
      profileResult,
      progressResult,
      coursesResult,
      lessonProgressResult,
      badgesResult,
      certificatesResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("users_progress").select("*").eq("user_id", userId).single(),
      supabase
        .from("courses")
        .select(`*, lessons:lessons(*)`)
        .order("order_index"),
      supabase.from("lesson_progress").select("*").eq("user_id", userId),
      supabase
        .from("user_badges")
        .select(`*, badges:badges(*)`)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),
      supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false }),
    ])

    // Calculate age and age group if date_of_birth exists
    let age: number | null = null;
    let ageGroup = 'all';
    
    if (profileResult.data?.date_of_birth) {
      const birthDate = new Date(profileResult.data.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 10) ageGroup = 'young';
      else if (age >= 10 && age <= 13) ageGroup = 'tween';
      else if (age >= 14) ageGroup = 'teen';
    }

    return {
      profile: {
        ...profileResult.data,
        age,
        age_group: ageGroup
      },
      progress: progressResult.data,
      courses: coursesResult.data || [],
      lessonProgress: lessonProgressResult.data || [],
      badges: (badgesResult.data || []).map((ub: any) => ({
        id: ub.badge_id,
        ...ub.badges,
        earned_at: ub.earned_at,
      })),
      certificates: certificatesResult.data || [],
    }
  },
  ["dashboard-data"],
  { revalidate: 60, tags: ["dashboard"] }
)

// ============ NEW SLUG-BASED FUNCTIONS ============

// Get course by slug
export async function getCourseBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      lessons:lessons(*, 
        lesson_progress!left(*)
      )
    `)
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching course by slug:", error)
    return null
  }

  return course
}

// Get lesson by slug within a course
export async function getLessonBySlug(courseSlug: string, lessonSlug: string, userId?: string) {
  try {
    const supabase = await createClient()
    
    // First, get the course to get its ID
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single()
    
    if (courseError || !course) {
      console.error("Course not found:", courseError)
      return null
    }
    
    // Get lesson by slug within this course
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        *,
        courses (
          id,
          title,
          description,
          slug
        )
      `)
      .eq("slug", lessonSlug)
      .eq("course_id", course.id)
      .single()
    
    if (lessonError || !lesson) {
      console.error("Lesson not found:", lessonError)
      return null
    }
    
    // Get user progress if userId is provided
    let progress = null
    if (userId) {
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('lesson_id', lesson.id)
        .eq('user_id', userId)
        .single()
      
      if (!progressError) {
        progress = progressData
      }
    }
    
    // Get next lesson
    const { data: nextLesson, error: nextError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .gt('order_index', lesson.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle()
    
    // Get course statistics
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', course.id)
    
    let totalLessons = 0
    let completedLessons = 0
    
    if (!lessonsError && courseLessons) {
      totalLessons = courseLessons.length
      
      if (userId && totalLessons > 0) {
        const lessonIds = courseLessons.map((l: any) => l.id)
        const { data: completedLessonsData, error: completedError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .in('lesson_id', lessonIds)
        
        if (!completedError && completedLessonsData) {
          completedLessons = completedLessonsData.length
        }
      }
    }
    
    // Get user stats
    let userStats = null
    if (userId) {
      const { data: statsData, error: statsError } = await supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (!statsError) {
        userStats = statsData
      }
    }
    
    return {
      lesson,
      progress,
      nextLesson,
      totalLessons,
      completedLessons,
      userStats
    }
    
  } catch (error) {
    console.error('Error fetching lesson by slug:', error)
    return null
  }
}

// Get lesson data by ID (for backward compatibility)
export async function getLessonData(lessonId: string, userId: string, courseId?: string) {
  try {
    const supabase = await createClient()
    
    // Get lesson data with course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          slug
        )
      `)
      .eq('id', lessonId)
      .single()
    
    if (lessonError) throw lessonError
    
    // Get user progress for this lesson
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('user_id', userId)
      .single()
    
    // Get user stats
    const { data: userStats, error: statsError } = await supabase
      .from('users_progress')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Get next lesson in course
    let nextLesson = null
    const effectiveCourseId = courseId || lesson.course_id
    if (effectiveCourseId) {
      const { data: next, error: nextError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', effectiveCourseId)
        .gt('order_index', lesson.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle()
      
      if (!nextError) {
        nextLesson = next
      }
    }
    
    // Get total lessons and completed lessons count for this course
    let totalLessons = 0
    let completedLessons = 0
    
    const effectiveCourseIdForStats = courseId || lesson.course_id
    if (effectiveCourseIdForStats) {
      const { data: courseLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', effectiveCourseIdForStats)
      
      if (!lessonsError && courseLessons) {
        totalLessons = courseLessons.length
        
        if (totalLessons > 0) {
          const lessonIds = courseLessons.map((l: any) => l.id)
          const { data: completedLessonsData, error: completedError } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .in('lesson_id', lessonIds)
          
          if (!completedError && completedLessonsData) {
            completedLessons = completedLessonsData.length
          }
        }
      }
    }
    
    return {
      lesson,
      progress,
      userStats,
      nextLesson,
      totalLessons,
      completedLessons
    }
    
  } catch (error) {
    console.error('Error fetching lesson data:', error)
    return null
  }
}

// Get all courses with slugs for static generation
export async function getAllCoursesWithSlugs() {
  const supabase = createClientWithoutCookies()
  
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      slug,
      lessons:lessons(slug)
    `)
    .order("order_index")

  if (error) {
    console.error("Error fetching courses for static generation:", error)
    return []
  }

  return courses || []
}

// Get course by ID (for backward compatibility)
export async function getCourseById(courseId: string) {
  const supabase = await createClient()
  
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      lessons:lessons(*, 
        lesson_progress!left(*)
      )
    `)
    .eq("id", courseId)
    .single()

  if (error) {
    console.error("Error fetching course:", error)
    return null
  }

  return course
}

// ============ END OF SLUG FUNCTIONS ============

// NEW FUNCTION: Get age-appropriate courses
export async function getAgeAppropriateCourses(userId: string) {
  return getCachedAgeAppropriateCourses(userId);
}

const getCachedAgeAppropriateCourses = unstable_cache(
  async (userId: string) => {
    const supabase = createClientWithoutCookies();
    
    try {
      // First get user's age
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("date_of_birth")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile for age:", profileError);
        // Fall back to all courses if can't get age
        return getCachedPublicCourses();
      }

      let userAge = null;
      if (profile?.date_of_birth) {
        const birthDate = new Date(profile.date_of_birth);
        const today = new Date();
        userAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          userAge--;
        }
      }

      // Get all courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          lessons:lessons(*)
        `)
        .order("order_index");

      if (coursesError) {
        console.error("Error fetching courses:", coursesError);
        return [];
      }

      if (!userAge) {
        // If no age, return all courses as age-appropriate
        return courses || [];
      }

      // Get user's lesson progress
      const { data: lessonProgress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId);

      if (progressError) {
        console.error("Error fetching lesson progress:", progressError);
      }

      const completedLessonIds = new Set((lessonProgress || []).map((p: any) => p.lesson_id));

      // Process each course to calculate progress and age appropriateness
      const processedCourses = await Promise.all((courses || []).map(async (course: any) => {
        // Calculate progress
        const courseLessons = course.lessons || [];
        const totalLessons = courseLessons.length;
        const completedLessons = courseLessons.filter((lesson: any) => 
          completedLessonIds.has(lesson.id)
        ).length;
        const progressPercentage = totalLessons > 0 ? 
          Math.round((completedLessons / totalLessons) * 100) : 0;

        // Check if age-appropriate
        const minAge = course.min_age || 0;
        const maxAge = course.max_age || 100;
        const isAgeAppropriate = userAge >= minAge && userAge <= maxAge;

        // Check if unlocked (first course always unlocked, others require previous completion)
        let isUnlocked = false;
        if (course.order_index === 1) {
          isUnlocked = true;
        } else {
          // Check if previous course is completed
          const { data: previousCourse } = await supabase
            .from("courses")
            .select(`
              *,
              lessons:lessons(*)
            `)
            .eq("order_index", course.order_index - 1)
            .single();

          if (previousCourse) {
            const prevLessons = previousCourse.lessons || [];
            const prevCompleted = prevLessons.filter((lesson: any) => 
              completedLessonIds.has(lesson.id)
            ).length;
            isUnlocked = prevCompleted === prevLessons.length;
          }
        }

        return {
          course_id: course.id,
          title: course.title,
          description: course.description,
          order_index: course.order_index,
          min_age: course.min_age,
          max_age: course.max_age,
          target_age_group: course.target_age_group || 'all',
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_percentage: progressPercentage,
          is_unlocked: isUnlocked,
          is_age_appropriate: isAgeAppropriate,
          slug: course.slug
        };
      }));

      // Filter age-appropriate courses
      return processedCourses.filter((course: any) => course.is_age_appropriate);

    } catch (error) {
      console.error("Error in getAgeAppropriateCourses:", error);
      return [];
    }
  },
  ["age-appropriate-courses"],
  { revalidate: 60, tags: ["courses"] }
);

// Learn page specific functions
export async function getCourses() {
  const supabase = await createClient()
  
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      *,
      lessons:lessons(*, 
        lesson_progress!left(*)
      )
    `)
    .order("order_index")

  if (error) {
    console.error("Error fetching courses:", error)
    return []
  }

  return courses || []
}

// Public courses - can be cached
export async function getPublicCourses() {
  return getCachedPublicCourses()
}

const getCachedPublicCourses = unstable_cache(
  async () => {
    const supabase = createClientWithoutCookies()
    
    const { data: courses, error } = await supabase
      .from("courses")
      .select(`*, lessons:lessons(*)`)
      .order("order_index")

    if (error) {
      console.error("Error fetching public courses:", error)
      return []
    }

    return courses || []
  },
  ["public-courses"],
  { revalidate: 3600 } // Cache for 1 hour
)

export async function getUserCourseProgress(userId: string) {
  const supabase = await createClient()
  
  const { data: lessonsProgress, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, completed_at")
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user progress:", error)
    return {}
  }

  const progressMap: Record<string, { status: string; completed_at?: string }> = {}
  lessonsProgress?.forEach((progress: any) => {
    progressMap[progress.lesson_id] = {
      status: progress.status,
      completed_at: progress.completed_at
    }
  })

  return progressMap
}

// LEADERBOARD FUNCTIONS - UPDATED WITH COMPLETE USER DATA
export async function getLeaderboard(): Promise<LeaderboardUser[]> {
  return getCachedLeaderboard()
}

const getCachedLeaderboard = unstable_cache(
  async () => {
    const supabase = createClientWithoutCookies()
    
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        username,
        avatar_custom_url,
        avatar_id,
        avatars (
          url,
          style,
          seed
        ),
        date_of_birth,
        day_streak,
        users_progress (
          level,
          xp,
          updated_at
        )
      `)
      .order("xp", { foreignTable: "users_progress", ascending: false })

    if (error) {
      console.error("Error fetching leaderboard:", error)
      return []
    }

    // Process leaderboard data
    const processedLeaderboard = (profiles || []).map((user: any) => {
      // Calculate age and age group
      let age: number | null = null;
      let ageGroup = 'all';
      
      if (user.date_of_birth) {
        const birthDate = new Date(user.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 10) ageGroup = 'young';
        else if (age >= 10 && age <= 13) ageGroup = 'tween';
        else if (age >= 14) ageGroup = 'teen';
      }

      // Handle avatar URL
      const avatarUrl = user.avatar_custom_url || 
                       (Array.isArray(user.avatars) && user.avatars[0]?.url) || 
                       `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}&backgroundColor=1CB0F6,14D4F4,FAA918`

      // Handle users_progress
      let userProgress = [];
      if (Array.isArray(user.users_progress)) {
        userProgress = user.users_progress.length > 0 
          ? [user.users_progress[0]] 
          : [{ level: 1, xp: 0, updated_at: new Date().toISOString() }];
      } else if (user.users_progress) {
        userProgress = [user.users_progress];
      } else {
        userProgress = [{ level: 1, xp: 0, updated_at: new Date().toISOString() }];
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_custom_url: avatarUrl,
        avatar_id: user.avatar_id,
        date_of_birth: user.date_of_birth,
        day_streak: user.day_streak || 0,
        users_progress: userProgress,
        age,
        age_group: ageGroup
      };
    });

    return processedLeaderboard || [];
  },
  ["leaderboard"],
  { revalidate: 300 } // Cache for 5 minutes
)

// Get complete user profile with all relations
export async function getUserCompleteProfile(userId: string): Promise<LeaderboardUser | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      username,
      avatar_custom_url,
      avatar_id,
      avatars (
        url,
        style,
        seed
      ),
      date_of_birth,
      day_streak,
      users_progress (
        level,
        xp,
        updated_at
      )
    `)
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching complete profile:", error)
    return null
  }

  // Calculate age
  let age: number | null = null;
  let ageGroup = 'all';
  
  if (profile.date_of_birth) {
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 10) ageGroup = 'young';
    else if (age >= 10 && age <= 13) ageGroup = 'tween';
    else if (age >= 14) ageGroup = 'teen';
  }

  // Handle avatar URL
  const avatarUrl = profile.avatar_custom_url || 
                   (Array.isArray(profile.avatars) && profile.avatars[0]?.url) || 
                   `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}&backgroundColor=1CB0F6,14D4F4,FAA918`

  // Handle users_progress
  let userProgress = [];
  if (Array.isArray(profile.users_progress)) {
    userProgress = profile.users_progress.length > 0 
      ? [profile.users_progress[0]] 
      : [{ level: 1, xp: 0, updated_at: new Date().toISOString() }];
  } else if (profile.users_progress) {
    userProgress = [profile.users_progress];
  } else {
    userProgress = [{ level: 1, xp: 0, updated_at: new Date().toISOString() }];
  }

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    avatar_custom_url: avatarUrl,
    avatar_id: profile.avatar_id,
    date_of_birth: profile.date_of_birth,
    day_streak: profile.day_streak || 0,
    users_progress: userProgress,
    age,
    age_group: ageGroup
  };
}

// Get user rank in leaderboard
export async function getUserRank(userId: string): Promise<number> {
  const leaderboard = await getLeaderboard();
  
  // Sort by XP to get rank
  const sortedByXP = [...leaderboard].sort((a, b) => 
    (b.users_progress[0]?.xp || 0) - (a.users_progress[0]?.xp || 0)
  );
  
  const userIndex = sortedByXP.findIndex(user => user.id === userId);
  return userIndex >= 0 ? userIndex + 1 : 0;
}

// Get leaderboard with XP events for more accurate ranking
export async function getLeaderboardWithRealXP(): Promise<LeaderboardUser[]> {
  return getCachedLeaderboardWithRealXP();
}

const getCachedLeaderboardWithRealXP = unstable_cache(
  async () => {
    const supabase = createClientWithoutCookies();
    
    try {
      // Get all users with their total XP from xp_events
      const { data: xpEvents, error: xpError } = await supabase
        .from("xp_events")
        .select("user_id, amount");

      if (xpError) throw xpError;

      // Calculate total XP per user
      const userXP = new Map<string, number>();
      xpEvents?.forEach((event: any) => {
        const currentXP = userXP.get(event.user_id) || 0;
        userXP.set(event.user_id, currentXP + event.amount);
      });

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          username,
          avatar_custom_url,
          avatar_id,
          avatars (
            url,
            style,
            seed
          ),
          date_of_birth,
          day_streak
        `);

      if (profilesError) throw profilesError;

      // Combine data
      const leaderboardData = (profiles || []).map((profile: any) => {
        const totalXP = userXP.get(profile.id) || 0;
        const level = Math.floor(totalXP / 1000) + 1;
        
        // Calculate age
        let age: number | null = null;
        let ageGroup = 'all';
        
        if (profile.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (age < 10) ageGroup = 'young';
          else if (age >= 10 && age <= 13) ageGroup = 'tween';
          else if (age >= 14) ageGroup = 'teen';
        }

        // Handle avatar URL
        const avatarUrl = profile.avatar_custom_url || 
                         (Array.isArray(profile.avatars) && profile.avatars[0]?.url) || 
                         `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}&backgroundColor=1CB0F6,14D4F4,FAA918`

        return {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          avatar_custom_url: avatarUrl,
          avatar_id: profile.avatar_id,
          date_of_birth: profile.date_of_birth,
          day_streak: profile.day_streak || 0,
          users_progress: [{
            level,
            xp: totalXP,
            updated_at: new Date().toISOString()
          }],
          age,
          age_group: ageGroup
        };
      });

      // Sort by XP
      return leaderboardData.sort((a, b) => 
        (b.users_progress[0]?.xp || 0) - (a.users_progress[0]?.xp || 0)
      );

    } catch (error) {
      console.error('Error fetching real XP leaderboard:', error);
      return [];
    }
  },
  ["leaderboard-real-xp"],
  { revalidate: 300 } // Cache for 5 minutes
);

export async function getUserWeeklyProgress(userId: string) {
  const supabase = await createClient()
  
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: xpEvents, error } = await supabase
    .from("xp_events")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", weekAgo.toISOString())

  if (error) {
    console.error("Error fetching weekly progress:", error)
    return { totalXP: 0, events: [] }
  }

  const totalXP = xpEvents?.reduce((sum: number, event: any) => sum + event.amount, 0) || 0

  return { totalXP, events: xpEvents || [] }
}

export async function getCompletedLessonsCount(userId: string) {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")

  if (error) {
    console.error("Error fetching completed lessons:", error)
    return 0
  }

  return count || 0
}

export async function getUserLearningStats(userId: string) {
  const supabase = await createClient()
  
  const { data: progress, error } = await supabase
    .from("users_progress")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching user stats:", error)
    return null
  }

  return progress
}

// UPDATED: Get user stats with age context
export async function getUserStatsWithAge(userId: string) {
  const supabase = await createClient();
  
  const [profileResult, progressResult, badgesResult, lessonsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("users_progress").select("*").eq("user_id", userId).single(),
    supabase.from("user_badges").select("*", { count: "exact" }).eq("user_id", userId),
    supabase.from("lesson_progress").select("*", { count: "exact" }).eq("user_id", userId)
  ]);

  let age: number | null = null;
  let ageGroup = 'all';
  
  if (profileResult.data?.date_of_birth) {
    const birthDate = new Date(profileResult.data.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 10) ageGroup = 'young';
    else if (age >= 10 && age <= 13) ageGroup = 'tween';
    else if (age >= 14) ageGroup = 'teen';
  }

  return {
    level: progressResult.data?.level || 1,
    xp: progressResult.data?.xp || 0,
    total_xp_earned: progressResult.data?.xp || 0,
    badges_earned: badgesResult.count || 0,
    completed_lessons: lessonsResult.count || 0,
    age,
    age_group: ageGroup,
    day_streak: profileResult.data?.day_streak || 0,
    last_active: progressResult.data?.updated_at || new Date().toISOString()
  };
}

export async function getUserStreak(userId: string) {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("day_streak")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching user streak:", error)
    return 0
  }

  return profile?.day_streak || 0
}

// ================== COURSE AND PROGRESS FUNCTIONS ==================

// Get course with lessons and progress for course content page
export async function getCourseWithProgress(courseId: string, userId: string) {
  try {
    const supabase = await createClient()
    
    // Get course data with lessons
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        lessons:lessons(*)
      `)
      .eq('id', courseId)
      .single()
    
    if (courseError) throw courseError
    
    // Get user's progress for all lessons in this course
    const lessonIds = course.lessons?.map((lesson: any) => lesson.id) || []
    
    let lessonProgress = []
    if (lessonIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
      
      if (progressError) {
        console.error('Error fetching lesson progress:', progressError)
      } else {
        lessonProgress = progressData || []
      }
    }
    
    return {
      course,
      lessonProgress
    }
    
  } catch (error) {
    console.error('Error fetching course with progress:', error)
    return null
  }
}

// Get user course stats (for quick stats in course content)
export async function getCourseStats(courseId: string, userId: string) {
  try {
    const supabase = createClientWithoutCookies()
    
    // First get all lesson IDs for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
    
    if (lessonsError) throw lessonsError
    
    const lessonIds = lessons?.map((l: any) => l.id) || []
    
    if (lessonIds.length === 0) {
      return {
        userRank: "New Learner",
        activeLearners: 0,
        successRate: 0,
        averageCompletionTime: "Calculating...",
        totalEnrolled: 0,
        userProgress: 0,
        totalUsers: 0,
        userPosition: null
      }
    }
    
    // Get total enrolled users in this course (users with any lesson progress)
    const { count: totalEnrolled, error: enrolledError } = await supabase
      .from('lesson_progress')
      .select('user_id', { count: 'exact', head: true })
      .in('lesson_id', lessonIds)
    
    // Get active learners (users with progress in last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { count: activeLearners, error: activeError } = await supabase
      .from('lesson_progress')
      .select('user_id', { count: 'exact', head: true })
      .in('lesson_id', lessonIds)
      .gte('updated_at', weekAgo.toISOString())
    
    // Calculate average completion rate for this course
    const { data: allProgress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('status')
      .in('lesson_id', lessonIds)
    
    let successRate = 0
    if (!progressError && allProgress) {
      const totalProgress = allProgress.length
      const completedProgress = allProgress.filter(p => p.status === 'completed').length
      successRate = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0
    }
    
    // Get all user progress for ranking
    const { data: userRankData, error: rankError } = await supabase
      .from('lesson_progress')
      .select('user_id, lesson_id, status')
      .in('lesson_id', lessonIds)
    
    let userPosition = null
    let totalUsers = 0
    let userRank = "New Learner"
    
    if (!rankError && userRankData) {
      // Group progress by user
      const userProgressMap = new Map()
      userRankData.forEach(progress => {
        if (!userProgressMap.has(progress.user_id)) {
          userProgressMap.set(progress.user_id, {
            totalLessons: 0,
            completedLessons: 0
          })
        }
        const userData = userProgressMap.get(progress.user_id)
        userData.totalLessons++
        if (progress.status === 'completed') {
          userData.completedLessons++
        }
      })
      
      // Calculate progress percentages
      const userProgressArray = Array.from(userProgressMap.entries()).map(([userId, data]) => ({
        userId,
        progressPercentage: data.totalLessons > 0 ? (data.completedLessons / data.totalLessons) * 100 : 0
      }))
      
      // Sort by progress percentage
      userProgressArray.sort((a, b) => b.progressPercentage - a.progressPercentage)
      
      totalUsers = userProgressArray.length
      const userIndex = userProgressArray.findIndex(item => item.userId === userId)
      
      if (userIndex >= 0) {
        userPosition = userIndex + 1
        const userProgress = userProgressArray[userIndex].progressPercentage
        
        // Determine rank based on position
        if (userProgress === 0) {
          userRank = "New Learner"
        } else if (userProgress === 100) {
          userRank = "Course Master"
        } else if (userIndex < Math.floor(totalUsers * 0.1)) {
          userRank = "Top 10%"
        } else if (userIndex < Math.floor(totalUsers * 0.25)) {
          userRank = "Top 25%"
        } else if (userIndex < Math.floor(totalUsers * 0.5)) {
          userRank = "Top 50%"
        } else {
          userRank = "Learner"
        }
      }
    }
    
    // Calculate average completion time (mock data - you'd want to track this properly)
    const averageCompletionTime = "3.2 days"
    
    return {
      userRank,
      activeLearners: activeLearners || 0,
      successRate,
      averageCompletionTime,
      totalEnrolled: totalEnrolled || 0,
      userProgress: 0, // Will be calculated separately
      totalUsers,
      userPosition
    }
    
  } catch (error) {
    console.error('Error fetching course stats:', error)
    return {
      userRank: "Calculating...",
      activeLearners: 0,
      successRate: 0,
      averageCompletionTime: "Calculating...",
      totalEnrolled: 0,
      userProgress: 0,
      totalUsers: 0,
      userPosition: null
    }
  }
}

// Get badge progress for a specific course
export async function getCourseBadgeProgress(courseId: string, userId: string) {
  try {
    const supabase = createClientWithoutCookies()
    
    // Get badges associated with this course
    const { data: courseBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('course_id', courseId)
    
    if (badgesError) throw badgesError
    
    if (!courseBadges || courseBadges.length === 0) {
      return []
    }
    
    // Get user's earned badges
    const badgeIds = courseBadges.map(b => b.id)
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId)
      .in('badge_id', badgeIds)
    
    if (userBadgesError) {
      console.error('Error fetching user badges:', userBadgesError)
      return []
    }
    
    // Get lessons in this course for progress calculation
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
    
    let lessonIds: string[] = []
    if (!lessonsError && courseLessons) {
      lessonIds = courseLessons.map((l: any) => l.id)
    }
    
    // Calculate progress for each badge
    const badgeProgress = await Promise.all(courseBadges.map(async (badge) => {
      const userBadge = (userBadges || []).find(ub => ub.badge_id === badge.id)
      const isEarned = !!userBadge
      
      // Get progress criteria based on badge type
      let progress = 0
      let currentValue = 0
      let nextThreshold = null
      
      if (badge.requirement_type === 'lessons_completed') {
        if (lessonIds.length > 0) {
          const { count: completedLessons, error: lessonsError } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .in('lesson_id', lessonIds)
          
          if (!lessonsError && completedLessons !== null) {
            currentValue = completedLessons
            nextThreshold = badge.requirement_threshold || 1
            progress = nextThreshold ? Math.min(100, (currentValue / nextThreshold) * 100) : 0
          }
        }
      }
      // Add more badge types as needed
      
      return {
        badge,
        progress,
        nextThreshold,
        currentValue,
        isEarned
      }
    }))
    
    return badgeProgress
    
  } catch (error) {
    console.error('Error fetching badge progress:', error)
    return []
  }
}

// Comprehensive course data for course content page
export async function getCourseFullData(courseId: string, userId: string) {
  try {
    const [
      courseWithProgress,
      stats,
      badgeProgress,
      userStats
    ] = await Promise.all([
      getCourseWithProgress(courseId, userId),
      getCourseStats(courseId, userId),
      getCourseBadgeProgress(courseId, userId),
      getUserStatsWithAge(userId)
    ])
    
    if (!courseWithProgress) {
      return null
    }
    
    // Calculate user's progress in this course
    const totalLessons = courseWithProgress.course.lessons?.length || 0
    const completedLessons = courseWithProgress.lessonProgress.filter(
      (lp: any) => lp.status === 'completed'
    ).length
    const userProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
    
    return {
      course: {
        ...courseWithProgress.course,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage: Math.round(userProgress)
      },
      lessons: courseWithProgress.course.lessons || [],
      lessonProgress: courseWithProgress.lessonProgress,
      courseStats: {
        ...stats,
        userProgress: Math.round(userProgress)
      },
      badgeProgress,
      userStats
    }
    
  } catch (error) {
    console.error('Error fetching course full data:', error)
    return null
  }
}

// ================== END OF COURSE FUNCTIONS ==================

// Badge and certificate functions
export async function getUserBadges(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("user_badges")
    .select(`*, badges:badges(*)`)
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })

  return (data || []).map((ub: any) => ({
    id: ub.badge_id,
    ...ub.badges,
    earned_at: ub.earned_at,
  }))
}

export async function getUserCertificates(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false })

  return data || []
}

// Avatar functions
export async function getUserAvatar(userId: string) {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      avatar_custom_url,
      avatars (
        url,
        style,
        seed
      )
    `)
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching user avatar:", error)
    return null
  }

  // Return custom URL if available, otherwise fallback to dicebear
  if (profile?.avatar_custom_url) {
    return profile.avatar_custom_url
  }

  if (profile?.avatars?.[0]?.url) {
    return profile.avatars[0].url
  }

  // Fallback to dicebear with email seed
  const { data: userData } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single()

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.email || userId}`
}

// Course enrollment check
export async function isUserEnrolledInCourse(userId: string, courseId: string) {
  const supabase = await createClient()
  
  // First get all lesson IDs for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)

  if (lessonsError || !lessons || lessons.length === 0) {
    console.error("Error fetching course lessons:", lessonsError)
    return false
  }

  const lessonIds = lessons.map((lesson: any) => lesson.id)

  // Check if user has started any lessons in this course
  const { data: progress, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)
    .limit(1)

  if (error) {
    console.error("Error checking course enrollment:", error)
    return false
  }

  return progress && progress.length > 0
}

// Get user's next recommended lesson
export async function getNextRecommendedLesson(userId: string) {
  const supabase = await createClient()
  
  // Get all courses with lessons
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      lessons (
        id,
        title,
        order_index,
        slug
      )
    `)
    .order("order_index")

  if (error) {
    console.error("Error fetching courses for recommendation:", error)
    return null
  }

  // Get user's lesson progress
  const { data: userProgress, error: progressError } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("user_id", userId)
    .eq("status", "completed")

  if (progressError) {
    console.error("Error fetching user progress for recommendation:", progressError)
    return null
  }

  const completedLessonIds = new Set(userProgress?.map((p: any) => p.lesson_id) || [])

  // Find the first incomplete lesson in the first course with incomplete lessons
  for (const course of courses || []) {
    if (!course.lessons || course.lessons.length === 0) continue
    
    // Sort lessons by order_index
    const sortedLessons = [...course.lessons].sort((a: any, b: any) => a.order_index - b.order_index)
    
    for (const lesson of sortedLessons) {
      if (!completedLessonIds.has(lesson.id)) {
        return {
          courseId: course.id,
          courseSlug: course.slug,
          courseTitle: course.title,
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          orderIndex: lesson.order_index
        }
      }
    }
  }

  return null
}

// Get user's learning analytics
export async function getUserLearningAnalytics(userId: string) {
  const supabase = await createClient()
  
  const [weeklyProgress, completedLessons, streak, currentLevel] = await Promise.all([
    getUserWeeklyProgress(userId),
    getCompletedLessonsCount(userId),
    getUserStreak(userId),
    getUserLearningStats(userId)
  ])

  return {
    weeklyProgress: weeklyProgress.totalXP,
    completedLessons,
    streak,
    currentLevel: currentLevel?.level || 1,
    xp: currentLevel?.xp || 0,
    nextLevelXp: (currentLevel?.level || 1) * 1000,
    averageDailyXp: weeklyProgress.totalXP / 7
  }
}

// Get comprehensive dashboard data for learn page
export async function getLearnDashboardData(userId: string) {
  const [
    dashboardData,
    ageAppropriateCourses,
    leaderboard,
    weeklyProgress,
    userStats,
    completedLessonsCount
  ] = await Promise.all([
    getDashboardData(userId),
    getAgeAppropriateCourses(userId),
    getLeaderboard(),
    getUserWeeklyProgress(userId),
    getUserStatsWithAge(userId),
    getCompletedLessonsCount(userId)
  ]);

  return {
    dashboardData,
    courses: ageAppropriateCourses,
    leaderboard,
    weeklyProgress,
    userStats,
    completedLessonsCount,
    userAge: userStats.age,
    ageGroup: userStats.age_group
  };
}

// Get comprehensive leaderboard data for the leaderboard page
export async function getLeaderboardPageData(userId: string) {
  const [
    leaderboard,
    userProfile,
    userRank
  ] = await Promise.all([
    getLeaderboard(),
    getUserCompleteProfile(userId),
    getUserRank(userId)
  ]);

  return {
    leaderboard,
    userProfile,
    userRank
  };
}

// Function to mark lesson as complete (FIXED VERSION)
export async function markLessonAsComplete(userId: string, lessonId: string, courseId?: string) {
  const supabase = await createClient()
  
  try {
    // Get lesson data
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("xp_reward, course_id, title")
      .eq("id", lessonId)
      .single()

    if (lessonError || !lesson) {
      console.error("Lesson not found:", lessonError)
      throw new Error("Lesson not found")
    }

    // Use provided courseId or fallback to lesson's course_id
    const effectiveCourseId = courseId || lesson.course_id

    // Check if lesson is already completed
    const { data: existingProgress } = await supabase
      .from("lesson_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .eq("status", "completed")
      .single()

    if (existingProgress) {
      return {
        success: true,
        xpEarned: 0,
        message: "Lesson already completed"
      }
    }

    // Get current user stats
    const { data: currentStats } = await supabase
      .from("users_progress")
      .select("xp, total_xp_earned, level")
      .eq("user_id", userId)
      .single()

    const currentXP = currentStats?.xp || 0
    const currentTotalXP = currentStats?.total_xp_earned || 0
    const newXp = currentXP + lesson.xp_reward
    const newTotalXp = currentTotalXP + lesson.xp_reward
    const newLevel = Math.floor(newTotalXp / 1000) + 1

    // Execute operations in parallel
    const results = await Promise.allSettled([
      // Update lesson progress
      supabase
        .from("lesson_progress")
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          status: "completed",
          completed_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
        }),
      
      // Add XP event
      supabase
        .from("xp_events")
        .insert({
          user_id: userId,
          amount: lesson.xp_reward,
          reason: `Completed lesson: ${lesson.title}`,
          lesson_id: lessonId,
          course_id: effectiveCourseId,
        }),
      
      // Update user progress
      supabase
        .from("users_progress")
        .upsert({
          user_id: userId,
          xp: newXp,
          total_xp_earned: newTotalXp,
          level: newLevel,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
    ])

    // Check for errors
    const errors = results.filter((result: any) => result.status === 'rejected')
    if (errors.length > 0) {
      console.error("Errors completing lesson:", errors)
      throw new Error(`Failed to complete lesson: ${errors.length} operations failed`)
    }

    return {
      success: true,
      xpEarned: lesson.xp_reward,
      newXp,
      newLevel,
      newTotalXp,
      message: `Lesson completed! You earned ${lesson.xp_reward} XP.`
    }

  } catch (error: any) {
    console.error("Error in markLessonAsComplete:", error)
    throw new Error(error.message || "Failed to complete lesson")
  }
}