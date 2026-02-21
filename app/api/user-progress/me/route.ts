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

    // Fetch user progress
    const { data: progress, error } = await supabase
      .from('users_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      // If no progress exists, create default
      if (error.code === 'PGRST116') {
        const { data: newProgress, error: createError } = await supabase
          .from('users_progress')
          .insert({
            user_id: session.user.id,
            level: 1,
            xp: 0
          })
          .select()
          .single()

        if (createError) {
          console.error('Create progress error:', createError)
          return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 })
        }
        return NextResponse.json(newProgress)
      }
      
      console.error('Progress fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}