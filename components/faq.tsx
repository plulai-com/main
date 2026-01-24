"use client"

import React, { useState } from "react"
import { ChevronDown, HelpCircle, MessageSquare, CreditCard, UserCheck, Code, Award } from "lucide-react"
import Link from "next/link" 
interface FAQItem {
  question: string
  answer: string
  category: string
  icon: React.ReactNode // Changed from JSX.Element to React.ReactNode
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [activeCategory, setActiveCategory] = useState("All")

  const faqs: FAQItem[] = [
    {
      question: "How does Bloo AI assistant work?",
      answer: "Bloo is your 24/7 coding companion that uses advanced AI to provide personalized feedback, answer questions in real-time, and adapt to your learning pace. It's like having a senior developer by your side!",
      category: "Learning Experience",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      question: "What happens after I purchase a plan?",
      answer: "Immediate access! After payment, you'll get instant access to all features for your plan. You can start learning immediately, join our community, and begin your coding journey.",
      category: "Payment & Access",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      question: "Do I need prior coding experience?",
      answer: "Not at all! We welcome complete beginners. Our curriculum starts from absolute basics and gradually builds up to advanced concepts. The Explorer plan is perfect for beginners.",
      category: "Requirements",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      question: "What programming languages do you teach?",
      answer: "We focus on full-stack web development: HTML, CSS, JavaScript, React, Node.js, and databases. Plus modern tools like TypeScript, Next.js, and Tailwind CSS that are in high demand.",
      category: "Curriculum",
      icon: <Code className="w-5 h-5" />,
    },
    {
      question: "Is there a refund policy?",
      answer: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied with your progress in the first month, we'll give you a full refund, no questions asked.",
      category: "Payment & Access",
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      question: "Will I get a certificate?",
      answer: "Absolutely! Complete the Master plan and receive a verified certificate you can share on LinkedIn and with employers. Our certificates are recognized by industry partners.",
      category: "Outcomes",
      icon: <Award className="w-5 h-5" />,
    },
    {
      question: "How long does it take to complete?",
      answer: "Most learners complete the Master plan in 8-12 months studying 10-15 hours per week. However, you have lifetime access so you can learn at your own pace.",
      category: "Timeline",
      icon: <HelpCircle className="w-5 h-5" />,
    },
    {
      question: "What if I get stuck on a project?",
      answer: "You'll never be stuck! Get help from Bloo AI, our community Discord, or schedule 1-on-1 sessions with mentors (available in Creator and Master plans).",
      category: "Support",
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ]

  const categories = ["All", "Learning Experience", "Payment & Access", "Curriculum", "Outcomes"]

  const filteredFaqs = activeCategory === "All" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory)

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Everything you need to know before starting your coding journey with us.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                activeCategory === category
                  ? "bg-[#1CB0F6] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border-4 border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-[#1CB0F6]">{faq.icon}</div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#1CB0F6] uppercase tracking-wider">
                      {faq.category}
                    </span>
                    <h3 className="text-xl font-black text-slate-900">{faq.question}</h3>
                  </div>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-8 pb-6">
                  <div className="pl-12">
                    <p className="text-slate-600 text-lg leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions? */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#1CB0F6] to-[#14D4F4] p-8 rounded-3xl text-white">
            <h3 className="text-2xl font-black italic mb-4">Still have questions?</h3>
            <p className="mb-6 text-lg">
              Chat with our team or ask Bloo directly! We're here to help 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
             <Link 
              href="/contact"
              className="bg-white text-[#1CB0F6] px-8 py-3 rounded-full font-black uppercase italic hover:bg-slate-100 transition-colors inline-block text-center"
            >
              Contact Support
            </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}