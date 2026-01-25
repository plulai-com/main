"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Languages, Menu, X, ChevronDown, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

export function HeaderLanding() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isLandingPage = pathname === "/"

  // Check if we're on a sub-page
  const isSubPage = !isLandingPage

  // Smooth scroll function for landing page
  const handleSmoothScroll = (sectionId: string) => {
    if (!isLandingPage) {
      // If not on landing page, navigate to landing page first
      window.location.href = `/#${sectionId}`
      return
    }

    const element = document.getElementById(sectionId)
    if (element) {
      // Close mobile menu if open
      setIsOpen(false)
      
      // Calculate header offset (adjust based on your header height)
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  // Nav items with their corresponding section IDs
  const navItems = [
    { label: "Missions", id: "missions" },
    { label: "FAQ", id: "faq" },
    { label: "AI Mentor", id: "bloo" },
    { label: "Pricing", id: "pricing" }
  ]

  // Listen for scroll to add background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    if (isLandingPage) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // If not on landing page, Link component will handle navigation
  }

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-lg shadow-sm py-0' 
        : 'bg-[#FDF6E3]/80 backdrop-blur-xl py-0'
    }`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo with smooth scroll to top on landing page, or home navigation */}
        <Link 
          href="/" 
          className="flex items-center gap-2 group"
          onClick={handleLogoClick}
        >
          <div className="items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-300">
            <Image 
              src="/plulai1.png" 
              alt="Plulai Logo" 
              width={140} 
              height={140}
              className="object-contain w-full h-full"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {/* Home button for sub-pages */}
          {isSubPage && (
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-600 hover:text-[#1CB0F6] transition-all duration-300 relative group"
            >
              <Home className="w-4 h-4" />
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1CB0F6] group-hover:w-full transition-all duration-300"></span>
            </Link>
          )}

          {/* Landing page navigation items */}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSmoothScroll(item.id)}
              className={`text-sm font-black uppercase tracking-widest transition-all duration-300 relative group ${
                isSubPage 
                  ? 'text-slate-400 cursor-not-allowed' 
                  : 'text-slate-600 hover:text-[#1CB0F6]'
              }`}
              disabled={isSubPage}
            >
              {item.label}
              {/* Animated underline - only on landing page */}
              {!isSubPage && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1CB0F6] group-hover:w-full transition-all duration-300"></span>
              )}
            </button>
          ))}
          
          {/* Dropdown with more options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-sm font-black uppercase tracking-widest text-slate-600 hover:text-[#1CB0F6] transition-colors flex items-center gap-1">
                More <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="mt-2">
              <DropdownMenuItem asChild>
                <Link href="/safety" className="cursor-pointer w-full">Safety</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/support" className="cursor-pointer w-full">Support</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="cursor-pointer w-full">Contact</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors">
                <Languages className="w-5 h-5 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm">🇺🇸</span>
                English
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm">🇸🇦</span>
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm">🇫🇷</span>
                Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/login"
            className="hidden sm:block text-sm font-black uppercase tracking-widest text-slate-600 hover:text-[#1CB0F6] transition-all duration-300 hover:scale-105"
          >
            Login
          </Link>
          <Button
            asChild
            className="bg-gradient-to-r from-[#1CB0F6] to-[#14D4F4] hover:from-[#14D4F4] hover:to-[#1CB0F6] text-white font-black uppercase tracking-widest px-8 italic rounded-2xl shadow-lg shadow-indigo-100/50 h-12 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 hover:scale-105"
          >
            <Link href="/signup">Sign Up</Link>
          </Button>

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:bg-slate-100 transition-colors" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-6 h-6 transition-transform duration-300 rotate-180" />
            ) : (
              <Menu className="w-6 h-6 transition-transform duration-300" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-lg border-b border-slate-200 animate-in slide-in-from-top-4 duration-300">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {/* Home button for mobile */}
            <Link 
              href="/"
              className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-slate-900 hover:text-[#1CB0F6] p-3 hover:bg-slate-50 rounded-lg transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            {/* Landing page navigation items - only show on landing page */}
            {isLandingPage && navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSmoothScroll(item.id)}
                className="w-full text-left text-lg font-black uppercase tracking-widest text-slate-900 hover:text-[#1CB0F6] p-3 hover:bg-slate-50 rounded-lg transition-all duration-300 flex items-center justify-between group"
              >
                {item.label}
                <ChevronDown className="w-4 h-4 transform -rotate-90 text-slate-400 group-hover:text-[#1CB0F6] transition-colors" />
              </button>
            ))}
            
            {/* Additional pages */}
            <div className="border-t border-slate-200 pt-4 mt-2 space-y-2">
              <Link 
                href="/safety" 
                className="block text-lg font-black uppercase tracking-widest text-slate-900 hover:text-[#1CB0F6] p-3 hover:bg-slate-50 rounded-lg transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Safety
              </Link>
              <Link 
                href="/support" 
                className="block text-lg font-black uppercase tracking-widest text-slate-900 hover:text-[#1CB0F6] p-3 hover:bg-slate-50 rounded-lg transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Support
              </Link>
              <Link 
                href="/contact" 
                className="block text-lg font-black uppercase tracking-widest text-slate-900 hover:text-[#1CB0F6] p-3 hover:bg-slate-50 rounded-lg transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <Link 
                href="/login" 
                className="block text-lg font-black uppercase tracking-widest text-slate-900 hover:text-[#1CB0F6] p-3 hover:bg-slate-50 rounded-lg transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}