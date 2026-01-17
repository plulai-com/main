// app/support/page.tsx
"use client"

import { HeaderLanding } from "@/components/header-landing"
import { FooterLanding } from "@/components/footer-landing"
import { MessageSquare, BookOpen, Video, Mail, HelpCircle, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeaderLanding />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center mb-16">
          <Badge className="bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/20 px-6 py-2 text-sm font-black uppercase tracking-[0.2em] rounded-full mb-6">
            We're Here to Help
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900 mb-6">
            Get Support <br />
            <span className="text-[#1CB0F6]">When You Need It</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
            From technical issues to learning guidance, our support team is ready to assist you and your child.
          </p>
        </section>

        {/* Support Options */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {[
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Live Chat",
                description: "Chat directly with our support team for quick answers to your questions.",
                // action: "Start Chat",
                color: "from-blue-500 to-cyan-400",
                featured: true
              },
              {
                icon: <Video className="w-8 h-8" />,
                title: "Video Tutorials",
                description: "Watch step-by-step videos to master Plulai's features.",
                // action: "Watch Videos",
                color: "from-green-500 to-emerald-400"
              },
              {
                icon: <Mail className="w-8 h-8" />,
                title: "Email Support",
                description: "Send us an email for detailed assistance with any issues.",
                // action: "Send Email",
                color: "from-orange-500 to-red-400"
              },

            ].map((option, index) => (
              <div key={index} className={`bg-white p-8 rounded-2xl border-2 ${option.featured ? 'border-[#1CB0F6]' : 'border-slate-200'} shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${option.color} flex items-center justify-center text-white mb-6`}>
                  {option.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{option.title}</h3>
                <p className="text-slate-600 mb-6">{option.description}</p>
                {/* <Button 
                  variant={option.featured ? "default" : "outline"}
                  className={`w-full ${option.featured ? 'bg-[#1CB0F6] hover:bg-[#14D4F4]' : 'border-[#1CB0F6] text-[#1CB0F6] hover:bg-[#1CB0F6]/10'}`}
                >
                  {option.action}
                </Button> */}
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 text-center mb-8">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <Mail className="w-8 h-8 text-[#1CB0F6] mx-auto mb-4" />
                <h4 className="font-bold text-slate-900 mb-2">Email</h4>
                <p className="text-slate-600">support@plulai.com</p>
                <p className="text-sm text-slate-500 mt-2">Response within 24 hours</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <MessageSquare className="w-8 h-8 text-[#1CB0F6] mx-auto mb-4" />
                <h4 className="font-bold text-slate-900 mb-2">Live Chat</h4>
                <p className="text-slate-600">Available 9AM-6PM EST</p>
                <p className="text-sm text-slate-500 mt-2">Weekdays only</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <HelpCircle className="w-8 h-8 text-[#1CB0F6] mx-auto mb-4" />
                <h4 className="font-bold text-slate-900 mb-2">Community</h4>
                <p className="text-slate-600">Join our parent community</p>
                <p className="text-sm text-slate-500 mt-2">Share tips & experiences</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterLanding />
    </div>
  )
}