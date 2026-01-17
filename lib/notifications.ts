// lib/notifications.ts
import { createClient } from "@/lib/client"

export async function createBadgeNotification(
  userId: string, 
  badgeName: string, 
  badgeDescription?: string
) {
  const supabase = createClient()
  
  return supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title: "🎉 New Badge Earned!",
      message: `Congratulations! You earned the "${badgeName}" badge! ${badgeDescription || 'Keep up the great work!'}`,
      type: 'badge',
      metadata: { badge_name: badgeName }
    })
}

export async function createStreakNotification(
  userId: string,
  streakDays: number
) {
  const supabase = createClient()
  
  let message = ""
  if (streakDays === 1) {
    message = "🔥 You started a learning streak! Come back tomorrow to keep it going!"
  } else if (streakDays === 7) {
    message = "🎯 Amazing! 7-day streak! You're building great habits!"
  } else if (streakDays === 30) {
    message = "🏆 Legendary! 30-day streak! You're unstoppable!"
  } else {
    message = `🔥 You're on a ${streakDays}-day learning streak! Keep it up!`
  }
  
  return supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title: "Learning Streak!",
      message,
      type: 'streak',
      metadata: { streak_days: streakDays }
    })
}