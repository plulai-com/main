"use client"

import { Button } from "@/components/ui/button"
import { Check, Users } from "lucide-react"
import { useState } from "react"

export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<"3months" | "yearly">("3months")

  const plans = [
    {
      name: "Explorer",
      price: "$300",
      duration: "3 months",
      features: ["Intro to Coding Path", "Basic Bloo Support", "5 Missions per Day", "Email Support"],
      cta: "Start 3-Month Journey",
      popular: false,
    },
    {
      name: "Legend",
      price: "$999",
      duration: "1 year",
      features: ["All Adventure Maps", "24/7 Priority Bloo", "Unlimited Missions", "Special Badges", "Advanced Projects"],
      cta: "Get Full Year Access",
      popular: true,
    },
    {
      name: "Family",
      price: "$280",
      duration: "per account",
      features: ["Everything in Legend", "3 Separate Accounts", "Family Progress Tracking", "Parent Dashboard", "Shared Achievements"],
      cta: "Get Family Plan",
      popular: false,
      family: true,
    },
  ]

  const toggleBillingCycle = () => {
    setBillingCycle(prev => prev === "3months" ? "yearly" : "3months")
  }

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-slate-900">Choose Your Learning Path</h2>
          
          {/* Duration Toggle */}
          <div className="flex justify-center items-center gap-6">
            <div className={`font-bold text-lg ${billingCycle === "3months" ? "text-slate-900" : "text-slate-400"}`}>
              3-Month Access
            </div>
            
            <button
              onClick={toggleBillingCycle}
              className="relative w-16 h-8 rounded-full bg-slate-200 transition-colors"
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${
                billingCycle === "3months" ? "left-1" : "left-9"
              }`} />
              <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${
                billingCycle === "3months" 
                  ? "bg-[#1CB0F6] left-1 opacity-20" 
                  : "bg-[#1CB0F6] left-9 opacity-100"
              }`} />
            </button>
            
            <div className="flex flex-col items-start">
              <div className={`font-bold text-lg ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-400"}`}>
                Yearly Access
              </div>
              <div className="text-sm text-[#1CB0F6] font-bold">Save 17%</div>
            </div>
          </div>
          
          {/* Comparison Note */}
          <p className="text-slate-600 font-medium max-w-2xl mx-auto">
            Choose between short-term learning or commit to a full year of growth. 
            All plans include access to our complete platform and AI mentor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-[2.5rem] border-8 ${
                plan.popular 
                  ? "border-[#1CB0F6] bg-gradient-to-b from-slate-50 to-blue-50" 
                  : plan.family
                  ? "border-purple-200 bg-gradient-to-b from-white to-purple-50"
                  : "border-slate-100 bg-white"
              } flex flex-col`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#1CB0F6] text-white px-5 py-2 rounded-full font-black uppercase text-xs italic">
                  Most Popular
                </div>
              )}

              {/* Family Badge */}
              {plan.family && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full font-black uppercase text-xs italic">
                  Best Value
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-2 flex items-center gap-2">
                  {plan.name}
                  {plan.family && <Users className="w-5 h-5 text-purple-500" />}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 italic">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 font-bold text-sm">
                    {plan.duration}
                  </span>
                </div>
                
                {/* Family Plan Note */}
                {plan.family && (
                  <div className="mt-2 text-sm text-purple-600 font-bold">
                    $840 total for 3 accounts
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, index) => (
                  <li key={index} className="flex items-start gap-3 font-medium text-slate-700">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      plan.popular ? "text-[#1CB0F6]" : 
                      plan.family ? "text-purple-500" : 
                      "text-slate-400"
                    }`} /> 
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Price Comparison */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                  {plan.name === "Explorer" ? "3-MONTH PRICE" : 
                   plan.name === "Legend" ? "YEARLY PRICE" : 
                   "FAMILY PRICE PER ACCOUNT"}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {plan.name === "Family" ? "× 3 = $840" : ""}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className={`h-12 font-black uppercase tracking-wider rounded-2xl ${
                  plan.popular 
                    ? "bg-[#1CB0F6] hover:bg-[#14D4F4] text-white" 
                    : plan.family
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

  
      </div>
    </section>
  )
}