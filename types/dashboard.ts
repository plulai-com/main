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