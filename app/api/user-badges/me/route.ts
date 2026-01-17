import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user badges with join
    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Badges fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
    }

    // Transform data
    const badges = userBadges.map((ub: any) => ({
      id: ub.badges.id,
      name: ub.badges.name,
      description: ub.badges.description,
      icon_url: ub.badges.icon_url,
      rarity: ub.badges.rarity,
      earned_at: ub.earned_at
    }))

    return NextResponse.json(badges)
  } catch (error) {
    console.error('Badges fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}