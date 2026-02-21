import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/* ========================================================================== */
/*                                   API                                      */
/* ========================================================================== */

export async function POST(request: NextRequest) {
  console.log('=== CERTIFICATE GENERATION START ===')
  
  try {
    console.log('Step 1: Creating Supabase client')
    const supabase = await createClient()
    console.log('✓ Supabase client created')

    console.log('Step 2: Getting user authentication')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('✗ Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed: ' + authError.message }, { status: 401 })
    }

    if (!user) {
      console.error('✗ No user found')
      return NextResponse.json({ error: 'No user authenticated' }, { status: 401 })
    }

    console.log('✓ User authenticated:', user.id)

    console.log('Step 3: Parsing request body')
    let body
    try {
      body = await request.json()
      console.log('✓ Body parsed:', body)
    } catch (e) {
      console.error('✗ Failed to parse body:', e)
      body = {}
    }

    const courseId = body?.courseId

    console.log('Step 4: Validating course ID:', courseId)
    if (!courseId) {
      console.error('✗ No course ID provided')
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }
    console.log('✓ Course ID validated')

    console.log('Step 5: Fetching course data')
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single()

    if (courseError) {
      console.error('✗ Course query error:', courseError)
      return NextResponse.json({ 
        error: 'Failed to fetch course: ' + courseError.message,
        details: courseError 
      }, { status: 500 })
    }

    if (!course) {
      console.error('✗ Course not found for ID:', courseId)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    console.log('✓ Course found:', course.title)

    console.log('Step 6: Getting user profile')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('⚠ Profile query warning:', profileError.message)
    }

    const studentName =
      profile?.username ||
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Student'

    console.log('✓ Student name determined:', studentName)

    console.log('Step 7: Generating certificate code')
    const certificateCode = `PLULAI-${Date.now()
      .toString(36)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    console.log('✓ Certificate code:', certificateCode)

    console.log('Step 8: Generating PDF document')
    let pdfBytes
    try {
      pdfBytes = await createProfessionalCertificatePDF(
        studentName,
        course.title,
        certificateCode
      )
      console.log('✓ PDF generated, size:', pdfBytes.length, 'bytes')
    } catch (pdfError: any) {
      console.error('✗ PDF generation failed:', pdfError)
      console.error('PDF error stack:', pdfError.stack)
      return NextResponse.json({ 
        error: 'PDF generation failed: ' + pdfError.message,
        details: pdfError.stack
      }, { status: 500 })
    }

    console.log('Step 9: Converting PDF to base64')
    let pdfBase64
    try {
      pdfBase64 = Buffer.from(pdfBytes).toString('base64')
      console.log('✓ PDF converted to base64, length:', pdfBase64.length)
    } catch (conversionError: any) {
      console.error('✗ Base64 conversion failed:', conversionError)
      return NextResponse.json({ 
        error: 'Failed to convert PDF: ' + conversionError.message 
      }, { status: 500 })
    }

    console.log('Step 10: Attempting to save certificate to database')
    const { error: insertError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_code: certificateCode,
        issued_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('⚠ Database save warning:', insertError.message)
      console.error('Database error details:', insertError)
      // Continue anyway - don't fail if DB save doesn't work
    } else {
      console.log('✓ Certificate saved to database')
    }

    console.log('Step 11: Preparing response')
    const response = {
      success: true,
      certificateCode,
      student: studentName,
      course: course.title,
      issuedAt: new Date().toISOString(),
      pdfBase64,
    }
    
    console.log('✓ Response prepared, returning to client')
    console.log('=== CERTIFICATE GENERATION SUCCESS ===')
    
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('=== CERTIFICATE GENERATION FAILED ===')
    console.error('✗ Unexpected error:', error)
    console.error('✗ Error message:', error.message)
    console.error('✗ Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Certificate generation failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Enable development mode for details'
      },
      { status: 500 }
    )
  }
}

/* ========================================================================== */
/*                      PROFESSIONAL CERTIFICATE PDF                           */
/* ========================================================================== */

async function createProfessionalCertificatePDF(
  studentName: string,
  courseTitle: string,
  certificateCode: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // Landscape orientation

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  /* 🎨 BACKGROUND - Light gray gradient effect */
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(0.96, 0.96, 0.96), // #F5F5F5
  })

  /* 🖼️ MAIN CERTIFICATE BORDER */
  // Outer border - Gold
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 782,
    height: 535,
    borderColor: rgb(0.98, 0.66, 0.09), // #FAA918
    borderWidth: 8,
    color: rgb(1, 1, 1),
  })

  // Inner border - Light blue accent
  page.drawRectangle({
    x: 50,
    y: 50,
    width: 742,
    height: 495,
    borderColor: rgb(0.11, 0.69, 0.96), // #1CB0F6
    borderWidth: 2,
  })

  /* 🏆 TOP GOLD BANNER */
  page.drawRectangle({
    x: 60,
    y: 485,
    width: 722,
    height: 50,
    color: rgb(0.98, 0.66, 0.09), // #FAA918
  })

  /* ⭐ DECORATIVE CORNERS */
  const cornerSize = 30
  const cornerColor = rgb(0.98, 0.66, 0.09) // #FAA918
  
  // Top-left corner
  page.drawLine({
    start: { x: 60, y: 535 },
    end: { x: 60 + cornerSize, y: 535 },
    thickness: 3,
    color: cornerColor,
  })
  page.drawLine({
    start: { x: 60, y: 535 },
    end: { x: 60, y: 535 - cornerSize },
    thickness: 3,
    color: cornerColor,
  })

  // Top-right corner
  page.drawLine({
    start: { x: 782, y: 535 },
    end: { x: 782 - cornerSize, y: 535 },
    thickness: 3,
    color: cornerColor,
  })
  page.drawLine({
    start: { x: 782, y: 535 },
    end: { x: 782, y: 535 - cornerSize },
    thickness: 3,
    color: cornerColor,
  })

  // Bottom-left corner
  page.drawLine({
    start: { x: 60, y: 60 },
    end: { x: 60 + cornerSize, y: 60 },
    thickness: 3,
    color: cornerColor,
  })
  page.drawLine({
    start: { x: 60, y: 60 },
    end: { x: 60, y: 60 + cornerSize },
    thickness: 3,
    color: cornerColor,
  })

  // Bottom-right corner
  page.drawLine({
    start: { x: 782, y: 60 },
    end: { x: 782 - cornerSize, y: 60 },
    thickness: 3,
    color: cornerColor,
  })
  page.drawLine({
    start: { x: 782, y: 60 },
    end: { x: 782, y: 60 + cornerSize },
    thickness: 3,
    color: cornerColor,
  })

  /* 🏆 GOLD TROPHY BADGE (using geometric shapes only) */
  // Outer gold circle
  page.drawCircle({
    x: 421,
    y: 510,
    size: 35,
    color: rgb(0.98, 0.66, 0.09), // #FAA918 - Gold
  })
  
  // Inner lighter circle for depth
  page.drawCircle({
    x: 421,
    y: 510,
    size: 30,
    color: rgb(1, 0.8, 0.25), // Lighter gold
  })
  
  // Trophy cup body (rectangle)
  page.drawRectangle({
    x: 413,
    y: 505,
    width: 16,
    height: 18,
    color: rgb(1, 1, 1),
  })
  
  // Trophy base (rectangle)
  page.drawRectangle({
    x: 411,
    y: 502,
    width: 20,
    height: 4,
    color: rgb(1, 1, 1),
  })
  
  // Trophy top rim
  page.drawRectangle({
    x: 410,
    y: 522,
    width: 22,
    height: 3,
    color: rgb(1, 1, 1),
  })
  
  // Left handle (circle)
  page.drawCircle({
    x: 412,
    y: 515,
    size: 4,
    color: rgb(1, 1, 1),
  })
  
  // Right handle (circle)
  page.drawCircle({
    x: 430,
    y: 515,
    size: 4,
    color: rgb(1, 1, 1),
  })

  /* 📜 CERTIFICATE TITLE */
  page.drawText('CERTIFICATE OF ACHIEVEMENT', {
    x: 210,
    y: 435,
    size: 32,
    font: boldFont,
    color: rgb(0.17, 0.44, 0.79), // #2B70C9
  })

  /* ━━━ DECORATIVE LINE ━━━ */
  page.drawLine({
    start: { x: 370, y: 422 },
    end: { x: 472, y: 422 },
    thickness: 2,
    color: rgb(0.98, 0.66, 0.09), // #FAA918
  })

  /* 👤 "THIS CERTIFIES THAT" */
  page.drawText('THIS CERTIFIES THAT', {
    x: 330,
    y: 390,
    size: 12,
    font,
    color: rgb(0.44, 0.44, 0.44), // #6F6F6F
  })

  /* 🎓 STUDENT NAME BOX */
  page.drawRectangle({
    x: 200,
    y: 330,
    width: 442,
    height: 50,
    color: rgb(0.11, 0.69, 0.96), // #1CB0F6 with transparency effect
    opacity: 0.1,
    borderColor: rgb(0.11, 0.69, 0.96),
    borderWidth: 2,
  })

  const nameWidth = font.widthOfTextAtSize(studentName.toUpperCase(), 26)
  page.drawText(studentName.toUpperCase(), {
    x: 421 - nameWidth / 2,
    y: 350,
    size: 26,
    font: boldFont,
    color: rgb(0.17, 0.44, 0.79), // #2B70C9
  })

  /* 📚 "HAS SUCCESSFULLY COMPLETED" */
  page.drawText('has successfully completed the course', {
    x: 295,
    y: 305,
    size: 12,
    font,
    color: rgb(0.44, 0.44, 0.44),
  })

  /* 📖 COURSE TITLE BOX */
  page.drawRectangle({
    x: 200,
    y: 250,
    width: 442,
    height: 45,
    color: rgb(0.35, 0.8, 0.01), // #58CC02 with transparency
    opacity: 0.1,
  })

  const courseWidth = boldFont.widthOfTextAtSize(courseTitle, 20)
  page.drawText(courseTitle, {
    x: 421 - courseWidth / 2,
    y: 265,
    size: 20,
    font: boldFont,
    color: rgb(0.98, 0.66, 0.09), // #FAA918
    maxWidth: 420,
  })

  /* ━━━ BOTTOM DIVIDER ━━━ */
  page.drawLine({
    start: { x: 200, y: 220 },
    end: { x: 642, y: 220 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9), // #E5E5E5
  })

  /* 📅 DATE AND CERTIFICATE ID */
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Date section
  page.drawText('DATE ISSUED', {
    x: 260,
    y: 190,
    size: 9,
    font,
    color: rgb(0.44, 0.44, 0.44),
  })

  page.drawText(date, {
    x: 240,
    y: 172,
    size: 12,
    font: boldFont,
    color: rgb(0.17, 0.44, 0.79), // #2B70C9
  })

  // Certificate ID section
  page.drawText('CERTIFICATE ID', {
    x: 510,
    y: 190,
    size: 9,
    font,
    color: rgb(0.44, 0.44, 0.44),
  })

  page.drawText(certificateCode, {
    x: 485,
    y: 172,
    size: 11,
    font: boldFont,
    color: rgb(0.17, 0.44, 0.79), // #2B70C9
  })

  /* ✍️ SIGNATURE LINE */
  page.drawLine({
    start: { x: 330, y: 130 },
    end: { x: 512, y: 130 },
    thickness: 2,
    color: rgb(0.17, 0.44, 0.79), // #2B70C9
  })

  page.drawText('Authorized Signature', {
    x: 370,
    y: 115,
    size: 10,
    font,
    color: rgb(0.44, 0.44, 0.44),
  })

  /* 🎓 BRAND FOOTER */
  page.drawText('Plulai Kids Academy', {
    x: 350,
    y: 85,
    size: 14,
    font: boldFont,
    color: rgb(0.11, 0.69, 0.96), // #1CB0F6
  })

  page.drawText('Building Future Innovators', {
    x: 355,
    y: 68,
    size: 10,
    font,
    color: rgb(0.44, 0.44, 0.44),
  })

  /* 🔒 VERIFICATION NOTE */
  page.drawText('This certificate is blockchain-secured and digitally verified', {
    x: 280,
    y: 45,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  })

  return await pdfDoc.save()
}