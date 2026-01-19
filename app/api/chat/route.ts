import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, conversationId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 })
    }

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Bloo AI Tutor",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: `You are Bloo, a friendly AI coding tutor for kids learning to code. You make programming fun, explain concepts in simple terms, and encourage creativity. Use analogies kids can understand, be patient, and celebrate their progress. Keep responses concise and engaging.`,
          },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("plulai OpenRouter API error:", error)
      return NextResponse.json({ error: "Failed to get AI response" }, { status: response.status })
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    // Store conversation in Supabase
    if (conversationId) {
      await supabase.from("conversations").upsert({
        id: conversationId,
        user_id: user.id,
        messages: messages.concat({ role: "assistant", content: assistantMessage }),
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      message: assistantMessage,
      conversationId,
    })
  } catch (error) {
    console.error("plulai Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
