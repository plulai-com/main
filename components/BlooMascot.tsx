"use client"

import { motion } from "framer-motion"

export function BlooMascot({ mood }: { mood: string }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-6xl"
    >
      {mood}
    </motion.div>
  )
}
