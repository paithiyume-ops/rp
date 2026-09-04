"use client"

import type { ReactNode } from "react"

export function SectionShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="animate-float-in px-5 pt-8">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{subtitle}</p>
          )}
        </div>
        {right}
      </header>
      {children}
    </div>
  )
}

export function OnlineDot({ online }: { online: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {online && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          online ? "bg-accent" : "bg-muted-foreground/40"
        }`}
      />
    </span>
  )
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
