import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { XPFloat } from "@/components/xp-float"
import { LevelUpModal } from "@/components/level-up-modal"
import { ConfettiLayer } from "@/components/confetti-layer"

// Import Nunito font with specific weights if needed
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito", // This creates a CSS variable
})

export const metadata: Metadata = {
  title: "Plulai",
  description: "Plulai",
  generator: "Plulai.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito antialiased">
        {children}
        <XPFloat />
        <LevelUpModal />
        <ConfettiLayer />
        <Analytics />
      </body>
    </html>
  )
}