// types/dashboard.ts
export interface UserDashboardData {
  user_id: string;
  email: string;
  username: string;
  date_of_birth: string | null;
  age: number | null;
  age_group: 'young' | 'tween' | 'teen' | 'all' | null;
  language_preference: string;
  day_streak: number;
  avatar_id: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  last_active: string;
  completed_lessons: number;
  total_xp_earned: number;
  badges_earned: number;
  active_courses: number;
  weekly_xp: number;
  available_courses: number;
}

// lib/queries.ts - Update your queries
export async function getDashboardData(userId: string): Promise<UserDashboardData | null> {
  try {
    const result = await sql`
      SELECT * FROM get_user_dashboard_with_age(${userId}::uuid)
    `;
    
    if (result.rows.length === 0) return null;
    
    return result.rows[0] as UserDashboardData;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

export async function getAgeAppropriateCourses(userId: string) {
  try {
    const result = await sql`
      SELECT * FROM get_age_appropriate_courses(${userId}::uuid)
      ORDER BY order_index;
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching age-appropriate courses:', error);
    return [];
  }
}