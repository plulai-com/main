import { Card, CardContent } from "@/components/ui/card"
import { Scroll, Zap, Trophy } from "lucide-react"

export function FeatureCards() {
  const features = [
    {
      title: "Adventure Maps",
      desc: "Learn through themed missions that build your coding kingdom from the ground up.",
      icon: Scroll,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      title: "XP & Rewards",
      desc: "Earn XP for every challenge. Level up your hero and unlock epic badges and digital gear.",
      icon: Zap,
      color: "text-[#1CB0F6]",
      bg: "bg-blue-50",
    },
    {
      title: "AI Mentor",
      desc: "No long grades. Just instant XP feedback and supportive guidance from Bloo.",
      icon: Trophy,
      color: "text-pink-500",
      bg: "bg-pink-50",
    },
  ]

  return (
    <section id="missions" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
            Gamified To The Core
          </h2>
          <p className="text-slate-600 font-bold text-lg">
            We've turned complex coding concepts into an addictive adventure.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <Card
              key={i}
              className="border-4 border-slate-100 rounded-[2.5rem] shadow-none hover:border-[#1CB0F6] transition-colors overflow-hidden group"
            >
              <CardContent className="p-10 space-y-6">
                <div
                  className={`w-16 h-16 rounded-2xl ${feat.bg} flex items-center justify-center ${feat.color} group-hover:scale-110 transition-transform`}
                >
                  <feat.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">{feat.title}</h3>
                <p className="text-slate-600 font-bold leading-relaxed">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
