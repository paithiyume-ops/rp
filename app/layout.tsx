import type { Metadata, Viewport } from "next"
import { Baloo_2, Nunito } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Best Friendyyye — a tiny world for two",
  description:
    "A private little app for two best friends. Chat in realtime, keep memories, share songs and moods, play games, and never miss a special day.",
}

export const viewport: Viewport = {
  themeColor: "#FF6F61",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`bg-background ${nunito.variable} ${baloo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
