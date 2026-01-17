import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('GET /api/profile/me: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('GET /api/profile/me: Fetching profile for user:', session.user.id)

    // Fetch user profile with all fields including new ones
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('GET /api/profile/me: Supabase fetch error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: 'Failed to fetch profile',
        details: error.message 
      }, { status: 500 })
    }

    console.log('GET /api/profile/me: Profile fetched successfully:', {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      hasBio: !!profile.bio
    })

    // Ensure default values if null
    const profileWithDefaults = {
      ...profile,
      username: profile.username || '',
      bio: profile.bio || ''
    }

    return NextResponse.json(profileWithDefaults)
  } catch (error) {
    console.error('GET /api/profile/me: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('PUT /api/profile/me: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })
    
    if (!session) {
      console.log('PUT /api/profile/me: No session found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('PUT /api/profile/me: Request body:', body)
    
    // Validate input
    if (body.username && body.username.length > 50) {
      console.log('PUT /api/profile/me: Username too long')
      return NextResponse.json({ 
        error: 'Username too long (max 50 characters)' 
      }, { status: 400 })
    }
    
    if (body.bio && body.bio.length > 500) {
      console.log('PUT /api/profile/me: Bio too long')
      return NextResponse.json({ 
        error: 'Bio too long (max 500 characters)' 
      }, { status: 400 })
    }
    
    if (body.language_preference && !['ar', 'en', 'fr'].includes(body.language_preference)) {
      console.log('PUT /api/profile/me: Invalid language')
      return NextResponse.json({ 
        error: 'Invalid language. Must be one of: ar, en, fr' 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Only include fields that are provided
    if (body.username !== undefined) {
      updateData.username = body.username || null
    }
    
    if (body.bio !== undefined) {
      updateData.bio = body.bio || null
    }
    
    if (body.language_preference !== undefined) {
      updateData.language_preference = body.language_preference || 'en'
    }

    console.log('PUT /api/profile/me: Update data:', updateData)
    console.log('PUT /api/profile/me: Updating user:', session.user.id)

    // Update profile with new fields
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/profile/me: Supabase update error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        table: 'profiles'
      })
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('PUT /api/profile/me: Update successful:', {
      id: data.id,
      username: data.username,
      bio: data.bio,
      language_preference: data.language_preference
    })

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('PUT /api/profile/me: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}