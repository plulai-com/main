// app/api/users/[userId]/xp/route.ts
import { createClient } from '@/lib/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    // Get user's progress
    const { data: progress, error: progressError } = await supabase
      .from('users_progress')
      .select('xp, level')
      .eq('user_id', userId)
      .single()

    if (progressError && progressError.code !== 'PGRST116') {
      throw progressError
    }

    // Get recent XP events
    const { data: recentEvents, error: eventsError } = await supabase
      .from('xp_events')
      .select('amount, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) throw eventsError

    // Calculate XP needed for next level
    const currentXP = progress?.xp || 0
    const currentLevel = progress?.level || 1
    const xpForCurrentLevel = (currentLevel - 1) * 1000
    const xpForNextLevel = currentLevel * 1000
    const xpProgress = currentXP - xpForCurrentLevel
    const xpNeeded = xpForNextLevel - currentXP
    const levelProgress = (xpProgress / 1000) * 100

    return NextResponse.json({
      xp: currentXP,
      level: currentLevel,
      levelProgress: Math.min(100, Math.max(0, levelProgress)),
      xpNeededForNextLevel: xpNeeded,
      recentEvents: recentEvents || [],
      totalEarned: currentXP
    })

  } catch (error) {
    console.error('Error fetching user XP:', error)
    return NextResponse.json(
      { 
        xp: 0,
        level: 1,
        levelProgress: 0,
        xpNeededForNextLevel: 1000,
        recentEvents: [],
        totalEarned: 0
      },
      { status: 200 } // Return default values instead of error
    )
  }
}