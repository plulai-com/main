"use client"

import { Button } from "@/components/ui/button"
import { triggerXPFloat, triggerLevelUp } from "@/lib/xp"
import { HeaderLanding } from "@/components/header-landing"
import { Card } from "@/components/ui/card"
import { Star, Zap, AlertTriangle } from "lucide-react"

export default function DemoPage() {
  const handleSuccess = () => {
    triggerXPFloat(25, 50, 40)
  }

  const handleFailure = () => {
    // Partial XP on failure path
    triggerXPFloat(3, 50, 40)
  }

  const handleLevelUp = () => {
    triggerLevelUp(15)
  }

  return (
    <div className="min-h-screen bg-[#FDF6E3] pt-32">
      <HeaderLanding />
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter">Feedback Engine</h1>
          <p className="text-slate-600 font-bold">Interactive demo of XP and Level-up feedback systems.</p>
        </div>

        <div className="grid gap-6">
          <Card className="p-8 border-4 border-slate-100 rounded-[2.5rem] bg-white shadow-none hover:border-[#1CB0F6] transition-colors">
            <h3 className="text-xl font-black uppercase italic text-slate-900 mb-6">Success Path</h3>
            <p className="text-slate-500 font-bold mb-8">Earn full XP for correct mission completion.</p>
            <Button
              onClick={handleSuccess}
              className="w-full h-16 bg-[#1CB0F6] hover:bg-[#14D4F4] text-white font-black uppercase italic text-lg rounded-2xl"
            >
              <Zap className="mr-2 w-6 h-6" /> Get +25 XP
            </Button>
          </Card>

          <Card className="p-8 border-4 border-slate-100 rounded-[2.5rem] bg-white shadow-none hover:border-amber-400 transition-colors">
            <h3 className="text-xl font-black uppercase italic text-slate-900 mb-6">Supportive Failure</h3>
            <p className="text-slate-500 font-bold mb-8">Even on wrong answers, get partial XP and Bloo's support.</p>
            <Button
              onClick={handleFailure}
              variant="outline"
              className="w-full h-16 border-4 border-slate-100 hover:bg-slate-50 text-amber-500 font-black uppercase italic text-lg rounded-2xl bg-transparent"
            >
              <AlertTriangle className="mr-2 w-6 h-6" /> Partial +3 XP
            </Button>
          </Card>

          <Card className="p-8 border-4 border-[#FFD66B] rounded-[2.5rem] bg-white shadow-2xl">
            <h3 className="text-xl font-black uppercase italic text-slate-900 mb-6">Milestone Moment</h3>
            <p className="text-slate-500 font-bold mb-8">
              Experience the high-energy celebration of reaching a new level.
            </p>
            <Button
              onClick={handleLevelUp}
              className="w-full h-16 bg-[#FFD66B] hover:bg-amber-400 text-slate-900 font-black uppercase italic text-lg rounded-2xl"
            >
              <Star className="mr-2 w-6 h-6 fill-current" /> Trigger Level Up
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
