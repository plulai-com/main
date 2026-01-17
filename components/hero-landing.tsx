"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, Star, Rocket, TrendingUp, Lightbulb, DollarSign, Code, Users, Sparkles, Zap, Target, Brain } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function HeroLanding() {
  const [showDemo, setShowDemo] = useState(false)
  const [activeTab, setActiveTab] = useState<"coding" | "business">("coding")
  const [revenue, setRevenue] = useState(2500)
  const [users, setUsers] = useState(1240)

  const codingFeatures = [
    { icon: <Rocket className="w-5 h-5" />, text: "Build real apps & games", color: "from-blue-500 to-cyan-400" },
    { icon: <Brain className="w-5 h-5" />, text: "AI-powered code assistant", color: "from-purple-500 to-pink-400" },
    { icon: <Target className="w-5 h-5" />, text: "Game-based learning", color: "from-green-500 to-emerald-400" }
  ]

  const businessFeatures = [
    { icon: <Lightbulb className="w-5 h-5" />, text: "Turn ideas into products", color: "from-orange-500 to-red-400" },
    { icon: <TrendingUp className="w-5 h-5" />, text: "Learn startup fundamentals", color: "from-yellow-500 to-amber-400" },
    { icon: <Users className="w-5 h-5" />, text: "Pitch & present ideas", color: "from-indigo-500 to-purple-400" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "business") {
        setRevenue(prev => prev + Math.floor(Math.random() * 50))
        setUsers(prev => prev + Math.floor(Math.random() * 5))
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [activeTab])

  const launchStartup = () => {
    setRevenue(prev => prev + 250)
    setUsers(prev => prev + 25)
  }

  return (
    <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full blur-3xl -z-10" />
      
      {/* Floating Icons */}
      <div className="absolute top-1/3 right-1/4 animate-bounce text-blue-500/20">
        <Code className="w-8 h-8" />
      </div>
      <div className="absolute bottom-1/3 left-1/4 animate-bounce delay-300 text-orange-500/20">
        <Lightbulb className="w-8 h-8" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
          <div className="flex-1 space-y-6">
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 px-5 py-1.5 text-xs font-black uppercase tracking-[0.15em] rounded-full">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Future CEO + Developer
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900">
              Build Your <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Empire
              </span> <br />
              With Code
            </h1>
            <p className="max-w-[480px] text-slate-600 text-base md:text-lg font-medium leading-relaxed mx-auto lg:mx-0">
              Learn to code while building real businesses. Create apps, launch startups, and develop skills that matter for the future. Perfect for young creators who want to make an impact.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <Button
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black uppercase tracking-widest text-lg rounded-[1.75rem] shadow-lg shadow-blue-200 group"
              >
                <Rocket className="mr-2 w-5 h-5" />
                Start Building <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowDemo(true)}
                className="h-14 px-8 border-2 border-slate-200 hover:bg-slate-50 text-slate-900 font-black uppercase tracking-widest text-lg rounded-[1.75rem] bg-white"
              >
                <Play className="mr-2 w-5 h-5 fill-current" /> Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-r from-blue-400 to-cyan-400 shadow-sm" />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex text-[#FFD66B]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-xs">Trusted by 500+ Young Creators</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-lg">
            {/* Dual Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("coding")}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    activeTab === "coding" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Code className="w-4 h-4" />
                  Code
                </button>
                <button
                  onClick={() => setActiveTab("business")}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    activeTab === "business" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Business
                </button>
              </div>
            </div>

            {/* Interactive Dashboard */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
              {/* Dashboard Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === "coding" ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gradient-to-r from-orange-500 to-red-400"}`}>
                      {activeTab === "coding" ? <Code className="w-4 h-4 text-white" /> : <TrendingUp className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-black text-white text-base">
                        {activeTab === "coding" ? "Code Studio" : "Startup Dashboard"}
                      </h3>
                      <p className="text-slate-300 text-xs">
                        {activeTab === "coding" ? "Build your project" : "Track your progress"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-bold">
                    LIVE
                  </Badge>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {activeTab === "coding" ? (
                  <div className="space-y-4">
                    {/* Code Editor Preview */}
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm">
                      <div className="text-slate-400 text-xs mb-3">// Building your app</div>
                      <div className="space-y-1.5">
                        <div className="text-blue-400">&lt;<span className="text-pink-400">App</span> <span className="text-green-400">name</span>=<span className="text-yellow-400">"My Startup"</span>&gt;</div>
                        <div className="text-blue-400 pl-4">&lt;<span className="text-pink-400">Feature</span>&gt;<span className="text-white">Cool Feature</span>&lt;/<span className="text-pink-400">Feature</span>&gt;</div>
                        <div className="text-blue-400 pl-4">&lt;<span className="text-pink-400">Users</span>&gt;<span className="text-white">{users.toLocaleString()}</span>&lt;/<span className="text-pink-400">Users</span>&gt;</div>
                        <div className="text-blue-400">&lt;/<span className="text-pink-400">App</span>&gt;</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {codingFeatures.map((feature, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-slate-100">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-2`}>
                            {feature.icon}
                          </div>
                          <div className="font-bold text-slate-900 text-xs leading-tight">{feature.text}</div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-bold text-sm"
                      onClick={() => setActiveTab("business")}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Launch Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Live Business Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-green-600 font-bold text-xs">REVENUE</div>
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">${revenue.toLocaleString()}</div>
                        <div className="text-xs text-green-600 font-bold mt-1 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Growing
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-blue-600 font-bold text-xs">USERS</div>
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{users.toLocaleString()}</div>
                        <div className="text-xs text-blue-600 font-bold mt-1 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Active
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {businessFeatures.map((feature, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-slate-100">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-2`}>
                            {feature.icon}
                          </div>
                          <div className="font-bold text-slate-900 text-xs leading-tight">{feature.text}</div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-bold text-sm"
                      onClick={launchStartup}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Earn Revenue
                    </Button>
                  </div>
                )}
              </div>

              {/* Live Activity */}
              <div className="border-t border-slate-200 p-3 bg-slate-50">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  {activeTab === "coding" 
                    ? "Students coding now" 
                    : "Startups launching today"}
                </div>
              </div>
            </div>

            {/* Success Story */}
            <div className="absolute -bottom-3 -right-3 bg-white p-3 rounded-lg shadow-md border border-amber-100 max-w-[160px] rotate-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Sara, 14</div>
                  <div className="text-xs text-slate-600 leading-tight">Built her first app</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-3xl p-0 bg-black rounded-2xl overflow-hidden border-0">
          <div className="aspect-video w-full flex items-center justify-center text-white font-black text-xl uppercase">
            [ Project Demo ]
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}