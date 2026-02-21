"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Share2, Star } from "lucide-react"

export function LevelUpModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    const handleLevelUp = (e: any) => {
      setLevel(e.detail.level)
      setIsOpen(true)
    }

    window.addEventListener("trigger-level-up", handleLevelUp)
    return () => window.removeEventListener("trigger-level-up", handleLevelUp)
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none sm:rounded-[3rem]">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-12 rounded-[3rem] border-8 border-[#FFD66B] shadow-2xl text-center space-y-8 overflow-hidden relative"
            >
              {/* Animated Background Rays */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 -z-10 opacity-10"
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#FFD66B_0deg,transparent_20deg,#FFD66B_40deg)]" />
              </motion.div>

              <div className="relative inline-block">
                <div className="w-24 h-24 bg-[#FFD66B] rounded-3xl flex items-center justify-center rotate-12 mx-auto">
                  <Trophy className="w-12 h-12 text-white -rotate-12" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full border-4 border-[#FFD66B] flex items-center justify-center"
                >
                  <Star className="w-6 h-6 text-[#FFD66B] fill-current" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter">LEVEL UP!</h2>
                <p className="text-2xl font-black text-[#1CB0F6] italic uppercase">YOU REACHED LEVEL {level}</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-slate-100">
                <p className="font-bold text-slate-600 mb-2 uppercase text-xs tracking-widest">UNLOCKED REWARD</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg" />
                  <span className="font-black italic uppercase text-slate-900">Explorer Badge</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button className="h-14 bg-[#1CB0F6] hover:bg-[#14D4F4] text-white font-black uppercase italic tracking-widest rounded-2xl text-lg shadow-lg">
                  Continue Adventure
                </Button>
                <Button variant="ghost" className="font-black uppercase italic tracking-widest text-slate-400 group">
                  <Share2 className="mr-2 w-5 h-5 group-hover:text-[#1CB0F6] transition-colors" /> Share With Friends
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
