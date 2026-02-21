// middleware.ts (FINAL FIX)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session to ensure cookies are synced
  const { data: { session } } = await supabase.auth.getSession()

  // ONLY protect admin routes (not API routes)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Allow login page
    if (request.nextUrl.pathname === '/admin/login') {
      // If user is already logged in and is admin, redirect to dashboard
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
          }
        } catch (error) {
          // Stay on login page if check fails
          console.error('Profile check error:', error)
        }
      }
      return response
    }

    // Protect all other admin routes
    if (!session?.user) {
      console.log('No user session, redirecting to login')
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        console.log('User is not admin, redirecting to login')
        const redirectUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Admin check error:', error)
      const redirectUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}