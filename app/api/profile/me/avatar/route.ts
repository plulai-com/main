import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('PUT /api/profile/me/avatar: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id
    })
    
    if (!session) {
      console.log('PUT /api/profile/me/avatar: No session found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('PUT /api/profile/me/avatar: Request body:', body)
    
    if (!body.avatar_id) {
      console.log('PUT /api/profile/me/avatar: Missing avatar_id')
      return NextResponse.json({ 
        error: 'avatar_id is required' 
      }, { status: 400 })
    }

    // First, fetch the avatar to get its URL
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('url')
      .eq('id', body.avatar_id)
      .single()

    if (avatarError) {
      console.error('PUT /api/profile/me/avatar: Avatar fetch error:', avatarError)
      return NextResponse.json({ 
        error: 'Avatar not found',
        details: avatarError.message 
      }, { status: 404 })
    }

    console.log('PUT /api/profile/me/avatar: Found avatar URL:', avatar.url)

    // Update profile with avatar_id and avatar_custom_url
    const updateData = {
      avatar_id: body.avatar_id,
      avatar_custom_url: avatar.url,
      updated_at: new Date().toISOString()
    }

    console.log('PUT /api/profile/me/avatar: Update data:', updateData)

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/profile/me/avatar: Supabase update error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      return NextResponse.json({ 
        error: 'Failed to update avatar',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('PUT /api/profile/me/avatar: Update successful:', {
      id: profile.id,
      avatar_id: profile.avatar_id,
      avatar_custom_url: profile.avatar_custom_url
    })

    return NextResponse.json(profile)
    
  } catch (error) {
    console.error('PUT /api/profile/me/avatar: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to update avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}