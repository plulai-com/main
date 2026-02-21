"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useState } from "react"

// COMPONENT 1: BillingToggle - Reusable toggle for monthly/yearly billing
interface BillingToggleProps {
  billingCycle: "monthly" | "yearly"
  onToggle: () => void
  monthlyPrice: number
  yearlyPrice: number
}

function BillingToggle({ billingCycle, onToggle, monthlyPrice, yearlyPrice }: BillingToggleProps) {
  const yearlySavings = Math.round(((monthlyPrice * 12) - yearlyPrice) / (monthlyPrice * 12) * 100)

  return (
    <div className="flex justify-center items-center gap-6">
      <div className={`font-bold text-lg ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-400"}`}>
        ${monthlyPrice}/month
      </div>
      
      <button
        onClick={onToggle}
        className="relative w-16 h-8 rounded-full bg-slate-200 transition-colors"
      >
        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${
          billingCycle === "monthly" ? "left-1" : "left-9"
        }`} />
        <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${
          billingCycle === "monthly" 
            ? "bg-[#1CB0F6] left-1 opacity-20" 
            : "bg-[#1CB0F6] left-9 opacity-100"
        }`} />
      </button>
      
      <div className="flex flex-col items-start">
        <div className={`font-bold text-lg ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-400"}`}>
          ${yearlyPrice}/year
        </div>
        <div className="text-sm text-[#1CB0F6] font-bold">Save {yearlySavings}%</div>
      </div>
    </div>
  )
}

// COMPONENT 2: FeatureList - Reusable list of features with icons
interface FeatureListProps {
  features: string[]
  variant?: "default" | "primary" | "secondary"
}

function FeatureList({ features, variant = "default" }: FeatureListProps) {
  const iconColors = {
    default: "text-slate-400",
    primary: "text-[#1CB0F6]",
    secondary: "text-purple-500"
  }

  return (
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3 font-medium text-slate-700">
          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[variant]}`} /> 
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

// COMPONENT 3: PricingCard - Reusable card component for displaying a plan
interface PricingCardProps {
  name: string
  price: number
  billingCycle: "monthly" | "yearly"
  features: string[]
  ctaText: string
  variant?: "default" | "primary" | "secondary"
  badge?: {
    text: string
    variant: "primary" | "secondary"
  }
  priceNote?: string
}

function PricingCard({ 
  name, 
  price, 
  billingCycle, 
  features, 
  ctaText, 
  variant = "default",
  badge,
  priceNote
}: PricingCardProps) {
  const borderColors = {
    default: "border-slate-100 bg-white",
    primary: "border-[#1CB0F6] bg-gradient-to-b from-slate-50 to-blue-50",
    secondary: "border-purple-200 bg-gradient-to-b from-white to-purple-50"
  }

  const buttonColors = {
    default: "bg-slate-900 hover:bg-slate-800 text-white",
    primary: "bg-[#1CB0F6] hover:bg-[#14D4F4] text-white",
    secondary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
  }

  const badgeColors = {
    primary: "bg-[#1CB0F6]",
    secondary: "bg-gradient-to-r from-purple-500 to-pink-500"
  }

  return (
    <div className={`relative p-8 rounded-[2.5rem] border-8 ${borderColors[variant]} flex flex-col max-w-md mx-auto w-full`}>
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-5 left-1/2 -translate-x-1/2 ${badgeColors[badge.variant]} text-white px-5 py-2 rounded-full font-black uppercase text-xs italic`}>
          {badge.text}
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-2">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900 italic">
            ${price}
          </span>
          <span className="text-slate-500 font-bold text-sm">
            /{billingCycle === "monthly" ? "month" : "year"}
          </span>
        </div>
        
        {/* Price Note */}
        {priceNote && (
          <div className="mt-2 text-sm text-purple-600 font-bold">
            {priceNote}
          </div>
        )}
      </div>

      {/* Features */}
      <FeatureList features={features} variant={variant} />

      {/* Price Comparison */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
          {billingCycle === "monthly" ? "MONTHLY INVESTMENT" : "YEARLY INVESTMENT"}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900">
            ${price}
          </span>
          <span className="text-slate-500 text-sm">
            /{billingCycle === "monthly" ? "month" : "year"}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        size="lg"
        className={`h-12 font-black uppercase tracking-wider rounded-2xl ${buttonColors[variant]}`}
      >
        {ctaText}
      </Button>
    </div>
  )
}

// Main Pricing Component
export function PricingCards() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  
  const monthlyPrice = 79
  const yearlyPrice = 800

  const features = [
    "Full Platform Access",
    "AI Mentor Support",
    "Unlimited Missions",
    "Progress Tracking",
    "Community Access",
    "Email Support"
  ]

  const toggleBillingCycle = () => {
    setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")
  }

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-slate-900">
            Simple, Transparent Pricing
          </h2>
          
          {/* Using Component 1: BillingToggle */}
          <BillingToggle 
            billingCycle={billingCycle}
            onToggle={toggleBillingCycle}
            monthlyPrice={monthlyPrice}
            yearlyPrice={yearlyPrice}
          />
          
          {/* Comparison Note */}
          <p className="text-slate-600 font-medium max-w-2xl mx-auto">
            Choose the plan that works best for you. Cancel anytime.
            All plans include full access to our platform and AI mentor.
          </p>
        </div>

        <div className="flex justify-center">
          {/* Using Component 3: PricingCard */}
          <PricingCard
            name="Premium Access"
            price={billingCycle === "monthly" ? monthlyPrice : yearlyPrice}
            billingCycle={billingCycle}
            features={features}
            ctaText={billingCycle === "monthly" ? "Start Monthly Plan" : "Get Yearly Access"}
            variant="primary"
            badge={{
              text: billingCycle === "yearly" ? "BEST VALUE" : "MOST POPULAR",
              variant: "primary"
            }}
            priceNote={billingCycle === "yearly" ? `Save $${(monthlyPrice * 12) - yearlyPrice} per year` : undefined}
          />
        </div>
      </div>
    </section>
  )
}