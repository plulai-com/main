"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"
import { useWindowSize } from "react-use"

export function ConfettiLayer() {
  const { width, height } = useWindowSize()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handleLevelUp = () => {
      setIsActive(true)
      setTimeout(() => setIsActive(false), 5000)
    }

    window.addEventListener("trigger-level-up", handleLevelUp)
    return () => window.removeEventListener("trigger-level-up", handleLevelUp)
  }, [])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[110]">
      <ReactConfetti
        width={width}
        height={height}
        numberOfPieces={200}
        recycle={false}
        colors={["#1CB0F6", "#FFD66B", "#14D4F4", "#FF4B4B"]}
      />
    </div>
  )
}
