"use client"

import {
  Home, BookOpen, Trophy, Sword, Bot, User,
  Sparkles, Zap, Flame, ChevronRight, Gamepad2, Target,
  Castle, Scroll, Shield, Crown, Map, Star, Sword as SwordIcon,
  Heart, Gem, Coins, Award, Zap as Lightning
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { AchievementsPage } from "./achievements-page"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface DashboardSidebarProps {
  profile: any
  progress: any
  activeNav: string
  onNavChange?: (navId: string) => void
  sidebarOpen: boolean
  onToggleSidebar?: () => void
  onAskBloo?: () => void
}

export function DashboardSidebar({
  profile: initialProfile,
  progress: initialProgress,
  activeNav,
  onNavChange,
  sidebarOpen,
  onAskBloo,
}: DashboardSidebarProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [progress, setProgress] = useState(initialProgress)
  const [streak, setStreak] = useState(0)
  const [dailyXP, setDailyXP] = useState({ current: 0, goal: 200 })
  const [unlockedLessons, setUnlockedLessons] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profile?.id) return
      try {
        setLoading(true)

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const { data: xpEvents } = await supabase
          .from("xp_events")
          .select("*")
          .eq("user_id", profile.id)
          .gte("created_at", yesterday.toISOString())

        if (xpEvents?.length) {
          setStreak(Math.min(xpEvents.length, 7))
          setDailyXP({
            current: xpEvents.reduce((s, e) => s + e.amount, 0),
            goal: 200,
          })
        }

        const { count } = await supabase
          .from("lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("status", "completed")

        setUnlockedLessons(count || 0)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [profile?.id])

  const navigationItems = [
    { 
      id: "dashboard", 
      label: "Kingdom Hall", 
      icon: Castle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      desc: "Your adventure hub"
    },
    { 
      id: "learn", 
      label: "Learn & Master", 
      icon: BookOpen, 
      // badge: unlockedLessons,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      desc: `Innovate your skills`
    },
    { 
      id: "achievements", 
      label: "Achievements ", 
      icon: SwordIcon, 
      // badge: 5,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      desc: "achieve your goals"
    },
    { 
      id: "leaderboards", 
      label: "Hero Ranking", 
      icon: Crown,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      desc: "Climb the ranks"
    },
    { 
      id: "ai-tutor", 
      label: "Wizard Bloo", 
      icon: Bot,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      desc: "Magical assistant"
    },
    { 
      id: "profile", 
      label: "Hero Profile", 
      icon: Shield,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      desc: "Your journey"
    },
  ]

  const dailyXPPercentage = Math.min((dailyXP.current / dailyXP.goal) * 100, 100)
  const levelProgress = progress?.xp ? Math.min((progress.xp % 1000) / 10, 100) : 0

  // Safe navigation handler with router integration
  const handleNavChange = (navId: string) => {
    if (onNavChange && typeof onNavChange === 'function') {
      onNavChange(navId)
    } else {
      console.warn('onNavChange is not provided or not a function')
      // Fallback navigation using window.location
      const routes: Record<string, string> = {
        dashboard: "/dashboard",
        learn: "/dashboard/learn",
        achievements: "/dashboard/achievements",
        leaderboards: "/dashboard/leaderboards",
        "ai-tutor": "/dashboard/ai-tutor",
        profile: "/dashboard/profile",
      }
      
      if (routes[navId] && typeof window !== 'undefined') {
        window.location.href = routes[navId]
      }
    }
  }

  // Handle Ask Bloo button click
  const handleAskBloo = () => {
    if (onAskBloo && typeof onAskBloo === 'function') {
      onAskBloo()
    } else {
      // Fallback navigation
      if (typeof window !== 'undefined') {
        window.location.href = "/dashboard/ai-tutor"
      }
    }
  }

  return (
    <>
      {/* ===================== ENHANCED DESKTOP SIDEBAR ===================== */}
      <aside
        className={cn(
          "hidden md:flex w-80 flex-col bg-gradient-to-b from-white via-blue-50/30 to-white",
          "border-r border-slate-200 shadow-xl",
          "fixed md:relative z-40 h-screen transition-all duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "overflow-hidden"
        )}
      >
        {/* Top Accent Border */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400"></div>

        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] bg-[length:40px_40px]"></div>
        </div>

        {/* Brand Header */}
      
        {/* Brand Header */}
<div className="relative p-6 border-b border-slate-100">
  <div className="flex items-center gap-4">
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-30"></div>
      <div className="relative w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
        {/* Your logo image */}
        <img 
          src="/plulai.jpg" // This path is relative to the public folder
          alt="Plulai Logo"
          className="w-full h-full object-cover" // Changed to cover to fill the container
        />
        {/* Floating particles - optional */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
    <div className="flex-1">
      <div className="flex items-baseline gap-2">
        <h2 className="font-black text-2xl">
          <span className="text-[#1CB0F6]">P</span>
          <span className="text-[#FAA918]">l</span>
          <span className="text-[#1CB0F6]">u</span>
          <span className="text-[#1CB0F6]">l</span>
          <span className="text-[#1CB0F6]">a</span>
          <span className="text-[#1CB0F6]">i</span>
        </h2>
      </div>
      <p className="text-slate-500 text-sm font-medium tracking-wide">Coding Adventure</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center gap-1">
          <Map className="w-3 h-3 text-amber-500" />
          <span className="text-xs text-slate-400">Quest in progress</span>
        </div>
      </div>
    </div>
  </div>
</div>
        {/* Stats Section - Removed profile card */}
        <div className="relative p-6 space-y-6">
         

          {/* Currency Display (Commented - Keep as reference) */}
          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-b from-emerald-50 to-white">
                <Gem className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-xs text-slate-500">Gems</span>
                <span className="font-bold text-emerald-600">125</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-b from-amber-50 to-white">
                <Coins className="w-4 h-4 text-amber-500 mb-1" />
                <span className="text-xs text-slate-500">Coins</span>
                <span className="font-bold text-amber-600">1,240</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-b from-purple-50 to-white">
                <Star className="w-4 h-4 text-purple-500 mb-1" />
                <span className="text-xs text-slate-500">Stars</span>
                <span className="font-bold text-purple-600">45</span>
              </div>
            </div>
          </div> */}
        </div>

        {/* Navigation - Adventure Menu */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavChange(item.id)}
                  className={cn(
                    "group relative w-full flex items-center gap-4 p-4 rounded-xl",
                    "transition-all duration-300 transform hover:translate-x-1 hover:shadow-md",
                    isActive 
                      ? `bg-gradient-to-r ${item.bgColor} border-l-4 ${item.color.replace('text', 'border')} shadow-sm`
                      : "hover:bg-slate-50/80 border-l-4 border-transparent"
                  )}
                >
                  {/* Animated Background Glow */}
                  {isActive && (
                    <div className={`absolute inset-0 ${item.color.replace('text', 'bg')} opacity-10 rounded-xl blur-sm`}></div>
                  )}
                  
                  <div className={cn(
                    "relative p-2.5 rounded-lg transition-all duration-300",
                    isActive 
                      ? `${item.bgColor} shadow-sm` 
                      : "bg-white group-hover:bg-slate-100"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive ? item.color : "text-slate-500 group-hover:text-slate-700"
                    )} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "font-bold transition-colors duration-300",
                        isActive ? item.color : "text-slate-800 group-hover:text-slate-900"
                      )}>
                        {item.label}
                      </span>
                      {/* REMOVED: Badge check since navigationItems don't have badge property */}
                      {/* {item.badge && (
                        <Badge className={cn(
                          "ml-2 transition-all duration-300",
                          isActive 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" 
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        )}>
                          {item.badge}
                        </Badge>
                      )} */}
                    </div>
                    <p className="text-xs text-slate-500 group-hover:text-slate-600 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isActive ? item.color : "text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100"
                  )} />
                </button>
              )
            })}
          </div>
        </div>

       
      </aside>

      {/* ===================== MOBILE BOTTOM NAV ===================== */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 shadow-2xl">
        <nav className="flex justify-around py-3 px-2">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 text-xs font-bold transition-all duration-200",
                  isActive ? item.color : "text-slate-500"
                )}
              >
                {isActive && (
                  <div className={`absolute -top-2 w-12 h-1 ${item.color.replace('text', 'bg')} rounded-full`}></div>
                )}
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? `${item.bgColor} shadow-sm` 
                    : "bg-slate-100"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}