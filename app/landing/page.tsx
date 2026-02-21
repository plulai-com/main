import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BlooAvatar } from "@/components/bloo-avatar"
import { Rocket, Shield, Brain, Zap, Trophy, Star, ArrowRight, Scroll } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic">Plulai</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#missions"
              className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Missions
            </Link>
            <Link
              href="#parents"
              className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              For Parents
            </Link>
            <Link
              href="#bloo"
              className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              AI Mentor
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors"
            >
              Login
            </Link>
            <Button
              asChild
              className="bg-indigo-600 hover:bg-indigo-500 font-black uppercase tracking-widest px-6 italic"
            >
              <Link href="/signup">Join Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          {/* Animated Background Glows */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
              <div className="flex-1 space-y-8">
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] italic">
                  Next Gen AI Learning
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9]">
                  Level Up Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                    Coding Intelligence
                  </span>
                </h1>
                <p className="max-w-[600px] text-slate-400 text-lg md:text-xl font-medium leading-relaxed mx-auto lg:mx-0">
                  The ultimate gamified coding adventure for Gen Alpha. Complete missions, earn XP, and unlock your
                  potential with Bloo, your personal AI mentor.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 font-black uppercase tracking-widest text-lg italic shadow-xl shadow-indigo-600/20"
                  >
                    <Link href="/signup">
                      Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 border-white/10 hover:bg-white/5 font-black uppercase tracking-widest text-lg italic bg-transparent"
                  >
                    Watch Gameplay
                  </Button>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800" />
                    ))}
                  </div>
                  <span>Trusted by 10,000+ Students</span>
                </div>
              </div>

              <div className="flex-1 relative flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative transform hover:scale-105 transition-transform duration-500">
                    <BlooAvatar mood="excited" size="lg" animate={true} />
                    {/* Floating Speech Bubble */}
                    <div className="absolute -top-12 -right-24 bg-white text-slate-950 px-6 py-4 rounded-2xl rounded-bl-none shadow-2xl font-bold animate-bounce [animation-duration:3s]">
                      "Let's build something epic! 🚀"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="missions" className="py-24 bg-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">
                Gamified To The Core
              </h2>
              <p className="text-slate-400 font-medium">
                We've turned complex coding concepts into an addictive adventure map.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Adventure Maps",
                  desc: "Learn through themed missions that build your coding kingdom from the ground up.",
                  icon: Scroll,
                  color: "text-amber-400",
                },
                {
                  title: "XP & Rewards",
                  desc: "Earn XP for every challenge. Level up your hero and unlock epic badges and digital gear.",
                  icon: Zap,
                  color: "text-indigo-400",
                },
                {
                  title: "Real-time Feedback",
                  desc: "No long grades. Just instant XP feedback and supportive guidance from Bloo.",
                  icon: Trophy,
                  color: "text-pink-400",
                },
              ].map((feat, i) => (
                <Card
                  key={i}
                  className="bg-slate-900/50 border-white/5 hover:border-indigo-500/30 transition-all group overflow-hidden"
                >
                  <CardContent className="p-8 space-y-6">
                    <div
                      className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${feat.color} group-hover:scale-110 transition-transform`}
                    >
                      <feat.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic">{feat.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{feat.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Mentor Section */}
        <section id="bloo" className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-[2.5rem] border border-white/5 p-8 md:p-16 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />

              <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] italic">
                  Meet Your Mentor
                </Badge>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                  AI Guidance That <br />
                  <span className="text-indigo-400">Speaks Your Language</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <p className="font-bold text-slate-300">Available in Arabic, English, and French</p>
                  </div>
                  <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <p className="font-bold text-slate-300">Motivational & Non-judgmental Personality</p>
                  </div>
                  <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <p className="font-bold text-slate-300">24/7 Coding Support & Motivation</p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 font-black uppercase tracking-widest italic h-14 px-8"
                >
                  Get Started With Bloo
                </Button>
              </div>

              <div className="flex-1 flex justify-center lg:justify-end relative">
                <div className="w-full max-w-sm aspect-square rounded-[2rem] bg-slate-900 border border-white/10 p-6 shadow-2xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <BlooAvatar mood="happy" size="sm" />
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-sm italic">Bloo AI</h4>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[8px] py-0 px-1">
                        ONLINE
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4 overflow-hidden">
                    <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-bl-none text-sm font-bold max-w-[80%]">
                      Wow! You just completed your first loop! You're basically a wizard now! 🧙‍♂️✨
                    </div>
                    <div className="bg-slate-800 text-slate-300 px-4 py-3 rounded-2xl rounded-br-none text-sm font-bold max-w-[80%] ml-auto">
                      Thanks Bloo! What's next?
                    </div>
                    <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-bl-none text-sm font-bold max-w-[80%]">
                      Ready for the Logic Dungeon? It's where the real magic happens! 🏰💎
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Parents Section */}
        <section id="parents" className="py-24 bg-slate-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-12">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                    Built For Safety, <br />
                    Designed For <span className="text-emerald-400">Success</span>
                  </h2>
                  <p className="text-slate-400 font-medium">
                    We bridge the gap between "screen time" and "skill time".
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="font-black uppercase tracking-tight italic">Safe AI Guardrails</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      Bloo is engineered specifically for education with strict safety filters and age-appropriate
                      behavior.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Brain className="w-5 h-5" />
                    </div>
                    <h4 className="font-black uppercase tracking-tight italic">Future-Proof Skills</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      Moving beyond simple drag-and-drop to real computational thinking and AI literacy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-8">
                  <div className="aspect-square bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col justify-end">
                    <Star className="text-amber-400 w-8 h-8 mb-4" />
                    <h5 className="font-black uppercase tracking-tight italic">Critical Thinking</h5>
                  </div>
                  <div className="aspect-[4/5] bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl border border-emerald-500/10 p-6 flex flex-col justify-end">
                    <Shield className="text-emerald-400 w-8 h-8 mb-4" />
                    <h5 className="font-black uppercase tracking-tight italic">Cyber Safety</h5>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-[4/5] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl border border-indigo-500/10 p-6 flex flex-col justify-end">
                    <Rocket className="text-indigo-400 w-8 h-8 mb-4" />
                    <h5 className="font-black uppercase tracking-tight italic">Logic Mastery</h5>
                  </div>
                  <div className="aspect-square bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col justify-end">
                    <Zap className="text-pink-400 w-8 h-8 mb-4" />
                    <h5 className="font-black uppercase tracking-tight italic">AI Literacy</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600 z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)] z-10" />

          <div className="container mx-auto px-4 relative z-20 text-center space-y-8">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none max-w-4xl mx-auto">
              Ready To Start Your Adventure?
            </h2>
            <p className="text-indigo-100/80 font-bold text-xl max-w-xl mx-auto">
              Join thousands of future creators building the next big thing with Bloo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="h-16 px-12 bg-white text-indigo-600 hover:bg-white/90 font-black uppercase tracking-widest text-xl italic shadow-2xl"
              >
                <Link href="/signup">Start Learning Free</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-16 px-12 text-white hover:bg-white/10 font-black uppercase tracking-widest text-xl italic"
              >
                Pricing & Plans
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-500" />
            <span className="font-black italic uppercase tracking-tight">Plulai</span>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Safety
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            © 2025 Plulai AI. BUILT FOR THE FUTURE.
          </p>
        </div>
      </footer>
    </div>
  )
}
