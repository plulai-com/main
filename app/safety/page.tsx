// app/safety/page.tsx
"use client"

import { HeaderLanding } from "@/components/header-landing"
import { FooterLanding } from "@/components/footer-landing"
import { Shield, Lock, Eye, Users, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeaderLanding />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center mb-16">
          <Badge className="bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/20 px-6 py-2 text-sm font-black uppercase tracking-[0.2em] rounded-full mb-6">
            Safety First
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900 mb-6">
            Your Child's Safety <br />
            <span className="text-[#1CB0F6]">Is Our Priority</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
            We've built Plulai with multiple layers of protection to ensure a safe, educational environment for young creators.
          </p>
        </section>

        {/* Safety Features */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Content Moderation",
                description: "All content is reviewed by our AI and human moderators to ensure it's age-appropriate and educational.",
                color: "from-blue-500 to-cyan-400"
              },
              {
                icon: <Lock className="w-8 h-8" />,
                title: "Privacy Protection",
                description: "We never share personal information. All data is encrypted and stored securely.",
                color: "from-purple-500 to-pink-400"
              },
              {
                icon: <Eye className="w-8 h-8" />,
                title: "Parental Controls",
                description: "Parents can monitor progress, set time limits, and control learning content.",
                color: "from-green-500 to-emerald-400"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Safe Community",
                description: "No direct messaging between students. All interactions are learning-focused and supervised.",
                color: "from-orange-500 to-red-400"
              },
              {
                icon: <AlertCircle className="w-8 h-8" />,
                title: "Real-time Alerts",
                description: "Parents receive notifications about progress and any concerning activity.",
                color: "from-yellow-500 to-amber-400"
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: "COPPA Compliant",
                description: "We strictly adhere to COPPA regulations for children's online privacy protection.",
                color: "from-indigo-500 to-purple-400"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Commitment */}
        <section className="bg-gradient-to-r from-slate-50 to-blue-50 py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-black uppercase text-slate-900 mb-6">Our Safety Commitment</h2>
            <p className="text-lg text-slate-600 mb-8">
              We believe that innovation should never come at the cost of safety. That's why we've invested in:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                { value: "100%", label: "Moderated Content" },
                { value: "24/7", label: "AI Monitoring" },
                { value: "0", label: "Personal Data Shared" },
                { value: "1000+", label: "Parents Trust Us" }
              ].map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-slate-200">
                  <div className="text-3xl font-black text-[#1CB0F6]">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-700">{stat.label}</div>
                </div>
              ))}
            </div>
           
          </div>
        </section>
      </main>

      <FooterLanding />
    </div>
  )
}