// app/dashboard/leaderboards/page.tsx
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import LeaderboardContent from "./leaderboard-content"

interface UserProgress {
  level: number
  xp: number
  updated_at: string
}

interface LeaderboardUser {
  id: string
  email: string
  username?: string
  avatar_custom_url?: string
  avatar_id?: string
  day_streak: number
  users_progress: UserProgress[]
  age?: number | null
  age_group?: string
  date_of_birth?: string | null
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  console.log("=== START LEADERBOARD FETCH ===")
  console.log("Current User ID:", userId)
  console.log("Current User Email:", session.user.email)

  try {
    // SIMPLE TEST: Fetch ALL data with a basic query
    console.log("\n🔍 TEST 1: Simple users_progress fetch...")
    const { data: simpleData, error: simpleError } = await supabase
      .from('users_progress')
      .select('*')
      .order('xp', { ascending: false })

    if (simpleError) {
      console.error("Simple fetch error:", simpleError)
    } else {
      console.log(`Simple fetch: ${simpleData?.length || 0} rows`)
      if (simpleData) {
        simpleData.forEach((row, i) => {
          console.log(`Row ${i + 1}: User ${row.user_id}, XP: ${row.xp}, Level: ${row.level}`)
        })
      }
    }

    // MAIN QUERY: Fetch leaderboard with profiles
    console.log("\n🏆 MAIN QUERY: Fetching leaderboard with profiles...")
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('users_progress')
      .select(`
        user_id,
        level,
        xp,
        updated_at,
        profiles!inner (
          id,
          email,
          username,
          avatar_custom_url,
          avatar_id,
          date_of_birth,
          day_streak,
          age_group
        )
      `)
      .order('xp', { ascending: false })
      .limit(10)

    if (leaderboardError) {
      console.error("Leaderboard fetch error:", leaderboardError)
      throw leaderboardError
    }

    console.log(`✅ Leaderboard fetched: ${leaderboardData?.length || 0} users`)

    // Transform the data
    const leaderboard: LeaderboardUser[] = (leaderboardData || []).map((item: any) => {
      // Handle both array and object formats for profiles
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      
      return {
        id: item.user_id,
        email: profile?.email || '',
        username: profile?.username || '',
        avatar_custom_url: profile?.avatar_custom_url || '',
        avatar_id: profile?.avatar_id || '',
        date_of_birth: profile?.date_of_birth || null,
        day_streak: profile?.day_streak || 0,
        age_group: profile?.age_group || '',
        users_progress: [{
          level: item.level || 1,
          xp: item.xp || 0,
          updated_at: item.updated_at || new Date().toISOString()
        }]
      }
    })

    console.log("\n📊 TRANSFORMED LEADERBOARD:")
    leaderboard.forEach((user, i) => {
      console.log(`#${i + 1}: ${user.email} - Level ${user.users_progress[0].level}, XP: ${user.users_progress[0].xp}`)
    })

    // Get current user's profile
    let currentUserProfile: LeaderboardUser | null = null
    
    // First, check if current user is in the leaderboard
    const currentUserInLeaderboard = leaderboard.find(user => user.id === userId)
    if (currentUserInLeaderboard) {
      currentUserProfile = currentUserInLeaderboard
    } else {
      // Fetch separately if not in leaderboard
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          username,
          avatar_custom_url,
          avatar_id,
          date_of_birth,
          day_streak,
          age_group,
          users_progress (
            level,
            xp,
            updated_at
          )
        `)
        .eq('id', userId)
        .single()

      if (userProfile) {
        currentUserProfile = {
          id: userProfile.id,
          email: userProfile.email || '',
          username: userProfile.username || '',
          avatar_custom_url: userProfile.avatar_custom_url || '',
          avatar_id: userProfile.avatar_id || '',
          date_of_birth: userProfile.date_of_birth || null,
          day_streak: userProfile.day_streak || 0,
          age_group: userProfile.age_group || '',
          users_progress: userProfile.users_progress?.length > 0 
            ? [{
                level: userProfile.users_progress[0].level || 1,
                xp: userProfile.users_progress[0].xp || 0,
                updated_at: userProfile.users_progress[0].updated_at || new Date().toISOString()
              }]
            : [{ level: 1, xp: 0, updated_at: new Date().toISOString() }]
        }
      }
    }

    // Create basic profile if still not found
    if (!currentUserProfile) {
      currentUserProfile = {
        id: userId,
        email: session.user.email || '',
        username: session.user.email?.split('@')[0] || 'User',
        day_streak: 0,
        users_progress: [{ level: 1, xp: 0, updated_at: new Date().toISOString() }],
        avatar_custom_url: '',
        avatar_id: '',
        date_of_birth: null,
        age_group: ''
      }
    }

    // Calculate ages
    const leaderboardWithAge = leaderboard.map((user: LeaderboardUser) => {
      let age: number | null = null
      
      if (user.date_of_birth) {
        try {
          const birthDate = new Date(user.date_of_birth)
          const today = new Date()
          age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
        } catch (e) {
          // Ignore age calculation errors
        }
      }
      
      return {
        ...user,
        age
      }
    })

    console.log("\n✅ FINAL SUMMARY:")
    console.log(`Total users: ${leaderboardWithAge.length}`)
    console.log(`Current user rank: ${leaderboardWithAge.findIndex(u => u.id === userId) + 1}/${leaderboardWithAge.length}`)
    console.log("=== END LEADERBOARD FETCH ===")

    return (
      <LeaderboardContent 
        leaderboard={leaderboardWithAge} 
        currentUserId={userId}
        userProfile={currentUserProfile}
      />
    )
    
  } catch (error) {
    console.error('\n❌ ERROR:', error)
    
    // Hardcoded fallback with both users (for testing)
    const fallbackLeaderboard: LeaderboardUser[] = [
      {
        id: "c6f8d89d-ff3f-43e4-b20b-853ca3d1c74b",
        email: "zvmmed@gmail.com",
        username: "zvmmed1",
        day_streak: 0,
        users_progress: [{ level: 1, xp: 60, updated_at: new Date().toISOString() }],
        avatar_custom_url: '',
        avatar_id: '',
        date_of_birth: null,
        age_group: '',
        age: null
      },
      {
        id: "f3e10f27-b534-4ce0-9eb6-16e204a23aa5",
        email: "medzvm1@gmail.com",
        username: "medzvm1",
        day_streak: 0,
        users_progress: [{ level: 1, xp: 50, updated_at: new Date().toISOString() }],
        avatar_custom_url: '',
        avatar_id: '',
        date_of_birth: null,
        age_group: '',
        age: null
      }
    ].sort((a, b) => b.users_progress[0].xp - a.users_progress[0].xp)

    const fallbackUserProfile: LeaderboardUser = fallbackLeaderboard.find(u => u.id === userId) || {
      id: userId,
      email: session.user.email || '',
      username: session.user.email?.split('@')[0] || 'User',
      users_progress: [{ level: 1, xp: 0, updated_at: new Date().toISOString() }],
      day_streak: 0,
      avatar_custom_url: '',
      avatar_id: '',
      date_of_birth: null,
      age_group: ''
    }

    console.log("Using fallback data with 2 hardcoded users")
    
    return (
      <LeaderboardContent 
        leaderboard={fallbackLeaderboard} 
        currentUserId={userId}
        userProfile={fallbackUserProfile}
      />
    )
  }
}