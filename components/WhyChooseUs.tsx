import { CheckCircle, Users, Trophy, Zap, Shield, Heart } from "lucide-react"

export function WhyChooseUs() {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Learn with Bloo",
      description: "Our AI companion guides you 24/7 with personalized feedback and encouragement.",
      color: "bg-[#1CB0F6]/10 text-[#1CB0F6]",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Gamified Learning",
      description: "Earn XP, complete missions, and level up as you master coding concepts.",
      color: "bg-[#FFD66B]/10 text-amber-600",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Build Real Projects",
      description: "Create portfolio-worthy apps from day one with our project-based curriculum.",
      color: "bg-[#14D4F4]/10 text-cyan-600",
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Job-Ready Skills",
      description: "Learn exactly what tech companies need with industry-validated content.",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Lifetime Access",
      description: "Once you enroll, you get lifetime updates and access to all materials.",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Personalized Experience",
      description: "Each kid will learn with a personalized approach tailored to their unique needs.",
      color: "bg-pink-100 text-pink-600",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase text-slate-900">
            Why Choose Plulai?
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We're not just another coding platform. We're your coding companion, career coach, and
            community—all in one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-3xl border-4 border-slate-100 hover:border-[#1CB0F6] transition-all duration-300 hover:shadow-xl"
            >
              <div className={`inline-flex p-4 rounded-2xl mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-600 text-lg leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-3xl border-4 border-slate-100 p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-black text-[#1CB0F6]">500+</div>
              <div className="text-slate-600 font-bold">Active Learners</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-[#FFD66B]">95%</div>
              <div className="text-slate-600 font-bold">Completion Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-[#14D4F4]">500+</div>
              <div className="text-slate-600 font-bold">Projects Built</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-green-500">4.9</div>
              <div className="text-slate-600 font-bold">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}