// app/api/certificates/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get certificates for user
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses:course_id (
          title,
          description,
          order_index
        )
      `)
      .eq('user_id', params.userId)
      .order('issued_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      certificates: certificates || []
    })

  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}   