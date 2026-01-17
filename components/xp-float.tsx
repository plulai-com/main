"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface XPFloatItem {
  id: string
  amount: number
  x: number
  y: number
}

export function XPFloat() {
  const [floats, setFloats] = useState<XPFloatItem[]>([])

  // Listen for custom event to trigger XP float
  useEffect(() => {
    const handleXPEvent = (e: any) => {
      const { amount, x, y } = e.detail
      const id = Math.random().toString(36).substring(7)
      setFloats((prev) => [...prev, { id, amount, x: x || 50, y: y || 50 }])

      // Auto-remove after animation
      setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== id))
      }, 1200)
    }

    window.addEventListener("trigger-xp-float", handleXPEvent)
    return () => window.removeEventListener("trigger-xp-float", handleXPEvent)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {floats.map((float) => (
          <motion.div
            key={float.id}
            initial={{ opacity: 0, y: `${float.y}%`, x: `${float.x}%`, scale: 0.5 }}
            animate={{ opacity: 1, y: `${float.y - 10}%`, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute flex items-center gap-1 font-black text-3xl italic drop-shadow-lg ${
              float.amount > 5 ? "text-[#1CB0F6]" : "text-amber-500"
            }`}
          >
            +{float.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
