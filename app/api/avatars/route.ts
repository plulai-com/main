import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // This endpoint is public, no auth required
    const { data: avatars, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Avatars fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch avatars' }, { status: 500 })
    }

    return NextResponse.json(avatars)
  } catch (error) {
    console.error('Avatars fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch avatars' }, { status: 500 })
  }
}