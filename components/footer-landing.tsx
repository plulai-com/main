import Image from "next/image"
import Link from "next/link"

export function FooterLanding() {
  return (
    <footer className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left">
            <Link href="/" className="flex items-center gap-3 justify-center md:justify-start group">
              <div className="rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <Image 
                  src="/plulai.jpg" 
                  alt="Plulai Logo" 
                  width={148} 
                  height={148}
                  className="object-contain"
                />
              </div>
            
            </Link>
            <p className="text-slate-500 font-bold max-w-xs">Building the next generation of digital creators.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h5 className="font-black uppercase italic text-slate-900 text-sm">Adventure</h5>
              <nav className="flex flex-col gap-2">
                <Link href="#missions" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Missions
                </Link>
                <Link href="#parents" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Parents
                </Link>
                <Link href="#bloo" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  AI Mentor
                </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h5 className="font-black uppercase italic text-slate-900 text-sm">Platform</h5>
              <nav className="flex flex-col gap-2">
                <Link href="#pricing" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Pricing
                </Link>
                <Link href="#" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Features
                </Link>
                <Link href="#" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Courses
                </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h5 className="font-black uppercase italic text-slate-900 text-sm">Company</h5>
              <nav className="flex flex-col gap-2">
                <Link href="/safety" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Safety
                </Link>
                <Link href="/support" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Support
                </Link>
                <Link href="/contact" className="text-slate-500 font-bold hover:text-[#1CB0F6] transition-colors">
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest italic">
            © 2025 Plulai. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-black uppercase text-slate-400">
            {/* <Link href="#" className="hover:text-[#1CB0F6] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#1CB0F6] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#1CB0F6] transition-colors">Cookies</Link> */}
          </div>
        </div>
      </div>
    </footer>
  )
}