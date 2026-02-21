"use client"

import { useState, useCallback } from "react"

interface UseBloo {
  showBloo: (params: {
    message?: string
    context?: "xp_earned" | "level_up" | "lesson_start" | "lesson_complete" | "general"
    xpAmount?: number
    levelReached?: number
  }) => void
  hideBloo: () => void
  blooState: {
    isVisible: boolean
    message?: string
    context?: "xp_earned" | "level_up" | "lesson_start" | "lesson_complete" | "general"
    xpAmount?: number
    levelReached?: number
  }
}

export function useBloo(): UseBloo {
  const [blooState, setBlooState] = useState<UseBloo["blooState"]>({
    isVisible: false,
  })

  const showBloo = useCallback((params: Parameters<UseBloo["showBloo"]>[0]) => {
    setBlooState({
      isVisible: true,
      ...params,
    })

    // Auto-hide after 8 seconds
    setTimeout(() => {
      setBlooState((prev) => ({ ...prev, isVisible: false }))
    }, 8000)
  }, [])

  const hideBloo = useCallback(() => {
    setBlooState((prev) => ({ ...prev, isVisible: false }))
  }, [])

  return { showBloo, hideBloo, blooState }
}
