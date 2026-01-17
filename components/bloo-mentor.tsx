"use client"

import { useState, useEffect } from "react"
import { BlooAvatar } from "./bloo-avatar"
import { X } from "lucide-react"
import { Button } from "./ui/button"

interface BlooMentorProps {
  isVisible: boolean
  message?: string
  context?: "xp_earned" | "level_up" | "lesson_start" | "lesson_complete" | "general"
  xpAmount?: number
  levelReached?: number
  onClose?: () => void
}

export function BlooMentor({
  isVisible,
  message,
  context = "general",
  xpAmount,
  levelReached,
  onClose,
}: BlooMentorProps) {
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const mood =
    context === "level_up" || context === "lesson_complete"
      ? "celebrating"
      : context === "xp_earned"
        ? "excited"
        : context === "lesson_start"
          ? "supportive"
          : "happy"

  useEffect(() => {
    if (isVisible && message) {
      fetchBlooResponse()
    }
  }, [isVisible, message, context])

  const fetchBlooResponse = async () => {
    setIsLoading(true)
    setError(false)
    setResponse("")

    try {
      const res = await fetch("/api/bloo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message || "Hi Bloo!",
          context,
          xpAmount,
          levelReached,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          accumulatedText += chunk
          setResponse(accumulatedText)
        }
      }
    } catch (err) {
      console.error("[v0] Failed to get Bloo response:", err)
      setError(true)
      const fallbackMessages = {
        level_up: `Level ${levelReached}! You're unstoppable! 🚀`,
        lesson_complete: "Mission complete! You're amazing! 🌟",
        xp_earned: `+${xpAmount} XP! Keep crushing it! ⚡`,
        lesson_start: "Ready for adventure? Let's go! 💪",
        general: "Keep going! You're doing amazing! 🌟",
      }
      setResponse(fallbackMessages[context] || fallbackMessages.general)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div className="fixed right-6 bottom-6 z-50 flex items-end gap-3 animate-in slide-in-from-bottom-4 duration-300">
      {/* Speech bubble */}
      <div className="relative max-w-sm px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl">
        {isLoading ? (
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        ) : (
          <p className="leading-relaxed">{response}</p>
        )}

        {/* Arrow pointing to avatar */}
        <div className="absolute right-0 w-0 h-0 border-l-8 border-t-8 border-transparent top-1/2 -translate-y-1/2 translate-x-full border-l-purple-600" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 w-5 h-5 text-white hover:bg-white/20 -translate-y-1/2 translate-x-1/2"
          onClick={handleClose}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Bloo avatar */}
      <BlooAvatar mood={mood} size="lg" animate={true} />
    </div>
  )
}
