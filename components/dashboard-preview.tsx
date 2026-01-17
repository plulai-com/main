import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Zap, Map } from "lucide-react"

export function DashboardPreview() {
  return (
    <section className="py-20 relative bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto rounded-[3rem] border-8 border-slate-900 bg-slate-100 shadow-2xl overflow-hidden transform lg:-rotate-2">
          {/* Mock Dashboard Header */}
          <div className="bg-slate-900 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1CB0F6] border-2 border-white" />
              <div>
                <h4 className="font-black text-white italic uppercase tracking-tight text-lg">Alex Explorer</h4>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#FFD66B] text-slate-900 border-0 font-bold">LEVEL 12</Badge>
                  <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-[#FFD66B]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-white font-black">
                <Zap className="w-5 h-5 text-[#FFD66B]" /> 1,240 XP
              </div>
              <div className="flex items-center gap-2 text-white font-black">
                <Trophy className="w-5 h-5 text-[#FFD66B]" /> 8 BADGES
              </div>
            </div>
          </div>

          {/* Mock Content */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-8 bg-white border-0 shadow-lg rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#1CB0F6]/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-6 flex items-center gap-3">
                  <Map className="w-8 h-8 text-[#1CB0F6]" /> Active Mission
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-slate-600">MISSION: LOGIC DUNGEON</span>
                    <span className="font-black text-[#1CB0F6]">65% COMPLETE</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[65%] h-full bg-gradient-to-r from-[#1CB0F6] to-[#14D4F4]" />
                  </div>
                </div>
              </Card>
            </div>
            <Card className="p-6 bg-[#1CB0F6] border-0 shadow-lg rounded-[2rem] text-white">
              <h4 className="font-black italic uppercase tracking-tight mb-4">Daily Quest</h4>
              <p className="font-bold text-lg mb-6 leading-tight">
                Solve 3 logic puzzles to earn a double XP booster! ⚡
              </p>
              <button className="w-full h-12 bg-white text-[#1CB0F6] font-black uppercase italic rounded-xl shadow-lg">
                Start Quest
              </button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
