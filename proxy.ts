import { updateSession } from "@/lib/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export async function proxy(request: NextRequest) {
  // Get IP from headers instead of request.ip (which doesn't exist in NextRequest)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             "127.0.0.1"
  
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const limit = 100 // requests per minute

  const record = rateLimitMap.get(ip) ?? { count: 0, lastReset: now }

  if (now - record.lastReset > windowMs) {
    record.count = 1
    record.lastReset = now
  } else {
    record.count++
  }

  rateLimitMap.set(ip, record)

  if (record.count > limit) {
    return new NextResponse("Too Many Requests", { status: 429 })
  }

  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}