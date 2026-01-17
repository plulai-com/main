"use client"

import { useState, useEffect } from "react"
import { Sparkles, Star, Zap } from "lucide-react"

interface BlooAvatarProps {
  mood?: "happy" | "excited" | "supportive" | "celebrating"
  size?: "sm" | "md" | "lg"
  animate?: boolean
}

const MOOD_COLORS = {
  happy: "from-blue-400 to-cyan-400",
  excited: "from-purple-400 to-pink-400",
  supportive: "from-green-400 to-emerald-400",
  celebrating: "from-yellow-400 to-orange-400",
}

const MOOD_ICONS = {
  happy: Sparkles,
  excited: Zap,
  supportive: Star,
  celebrating: Star,
}

export function BlooAvatar({ mood = "happy", size = "md", animate = true }: BlooAvatarProps) {
  const [bounce, setBounce] = useState(false)
  const Icon = MOOD_ICONS[mood]

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  useEffect(() => {
    if (animate) {
      setBounce(true)
      const timer = setTimeout(() => setBounce(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [animate, mood])

  return (
    <div className="relative inline-block">
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${MOOD_COLORS[mood]} opacity-20 blur-xl ${
          animate ? "animate-pulse" : ""
        }`}
      />

      {/* Main avatar */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${
          MOOD_COLORS[mood]
        } p-1 shadow-lg ${bounce ? "animate-bounce" : ""} transition-transform`}
      >
        <div className="flex items-center justify-center w-full h-full bg-slate-900 rounded-full">
          <Icon className="w-1/2 h-1/2 text-white" />
        </div>
      </div>

      {/* Sparkle particles */}
      {animate && mood === "celebrating" && (
        <>
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-ping" />
          <Star className="absolute -bottom-1 -left-1 w-3 h-3 text-pink-400 animate-pulse" />
        </>
      )}
    </div>
  )
}
