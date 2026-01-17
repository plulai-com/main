import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/* ========================================================================== */
/*                                   API                                      */
/* ========================================================================== */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const courseId = body?.courseId

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const studentName =
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Student'

    const certificateCode = `KID-${Date.now()
      .toString(36)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const pdfBytes = await createUltraKidPDF(
      studentName,
      course.title,
      certificateCode
    )

    return NextResponse.json({
      success: true,
      certificateCode,
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
    })
  } catch (error: any) {
    console.error('CERT ERROR:', error)
    return NextResponse.json(
      { error: 'Certificate generation failed', details: error.message },
      { status: 500 }
    )
  }
}

/* ========================================================================== */
/*                         ULTRA KID FRIENDLY PDF                              */
/* ========================================================================== */

async function createUltraKidPDF(
  studentName: string,
  courseTitle: string,
  certificateCode: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  /* 🌈 FUN BACKGROUND */
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595,
    height: 842,
    color: rgb(0.88, 0.95, 1),
  })

  /* 🎨 CONFETTI DOTS */
  for (let i = 0; i < 25; i++) {
    page.drawCircle({
      x: Math.random() * 595,
      y: Math.random() * 842,
      size: 4 + Math.random() * 4,
      color: rgb(Math.random(), Math.random(), Math.random()),
    })
  }

  /* 🧩 MAIN CARD */
  page.drawRectangle({
    x: 25,
    y: 25,
    width: 545,
    height: 792,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.2, 0.7, 1),
    borderWidth: 5,
  })

  /* 🎉 BIG TITLE */
  page.drawText('YOU DID IT!', {
    x: 190,
    y: 720,
    size: 36,
    font: boldFont,
    color: rgb(0.95, 0.45, 0.15),
  })

  page.drawText('SUPER STAR CERTIFICATE', {
    x: 120,
    y: 680,
    size: 24,
    font: boldFont,
    color: rgb(0.25, 0.4, 0.8),
  })

  /* ⭐ NAME BLOCK */
  page.drawRectangle({
    x: 70,
    y: 525,
    width: 455,
    height: 70,
    color: rgb(1, 0.95, 0.8),
  })

  page.drawText(studentName.toUpperCase(), {
    x: 90,
    y: 550,
    size: 34,
    font: boldFont,
    color: rgb(0.6, 0.4, 0.1),
    maxWidth: 420,
  })

  /* 📘 MESSAGE */
  page.drawText('has completed the mission:', {
    x: 185,
    y: 485,
    size: 16,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  page.drawRectangle({
    x: 80,
    y: 420,
    width: 435,
    height: 55,
    color: rgb(0.9, 0.98, 0.92),
  })

  page.drawText(courseTitle, {
    x: 100,
    y: 440,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.55, 0.35),
    maxWidth: 395,
  })

  page.drawText(
    'Amazing work! Keep learning, building, and having fun!',
    {
      x: 120,
      y: 380,
      size: 15,
      font,
      color: rgb(0.45, 0.45, 0.45),
      maxWidth: 360,
    }
  )

  /* 🏅 BIG BADGE */
  page.drawCircle({
    x: 300,
    y: 300,
    size: 48,
    color: rgb(1, 0.85, 0.2),
  })

  page.drawText('LEVEL UP', {
    x: 260,
    y: 295,
    size: 14,
    font: boldFont,
    color: rgb(0.6, 0.35, 0),
  })

  /* 📅 DATE */
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  page.drawText(`Unlocked on ${date}`, {
    x: 215,
    y: 225,
    size: 13,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  /* 🔐 CODE */
  page.drawText(`ID: ${certificateCode}`, {
    x: 210,
    y: 200,
    size: 11,
    font,
    color: rgb(0.6, 0.6, 0.6),
  })

  /* 💙 BRAND */
  page.drawText('Plulai Kids Academy', {
    x: 190,
    y: 155,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.6, 1),
  })

  page.drawText('Learn • Play • Create', {
    x: 230,
    y: 135,
    size: 12,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}
