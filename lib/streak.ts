import { createClient } from "@/lib/client"

export async function updateUserStreak(userId: string) {
  const supabase = createClient()
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Record login
    const { error: loginError } = await supabase
      .from('daily_logins')
      .upsert({
        user_id: userId,
        login_date: today
      }, {
        onConflict: 'user_id,login_date'
      })

    if (loginError) throw loginError

    // Update streak
    const { data: streakResult, error: streakError } = await supabase.rpc('update_streak', {
      p_user_id: userId
    })

    if (streakError) throw streakError

    return streakResult
  } catch (error) {
    console.error('Error updating streak:', error)
    throw error
  }
}

export async function getUserStreakData(userId: string) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_streak_date')
    .eq('id', userId)
    .single()

  const { data: loginDays } = await supabase
    .from('daily_logins')
    .select('login_date')
    .eq('user_id', userId)
    .order('login_date', { ascending: false })
    .limit(35)

  return {
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    loginDays: loginDays || []
  }
}