"use client"

import { CalendarHeart, Flame, Music2, ChevronRight, MessageCircleHeart } from "lucide-react"
import type { Ctx } from "../app-client"
import { OnlineDot, timeAgo } from "./shared"

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return "Still up?"
  if (h < 12) return "Good morning"
  if (h < 18) return "Hey there"
  return "Good evening"
}

function daysUntil(day: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const [y, m, d] = day.split("-").map(Number)
  let next = new Date(y, m - 1, d)
  next.setHours(0, 0, 0, 0)
  // roll anniversaries to this/next year
  const thisYear = new Date(now.getFullYear(), m - 1, d)
  thisYear.setHours(0, 0, 0, 0)
  next = thisYear < now ? new Date(now.getFullYear() + 1, m - 1, d) : thisYear
  return Math.round((next.getTime() - now.getTime()) / 86400000)
}

export default function HomeSection({ ctx }: { ctx: Ctx }) {
  const { state, online, partnerTyping, go } = ctx
  const { me, partner, statuses, specialDays, space } = state

  const partnerStatus = partner
    ? statuses.find((s) => s.member_id === partner.id)
    : undefined

  const upcoming = [...specialDays]
    .map((d) => ({ ...d, in: daysUntil(d.day) }))
    .sort((a, b) => a.in - b.in)[0]

  return (
    <div className="animate-float-in px-5 pt-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{greeting()},</p>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            {me.nickname} {me.emoji}
          </h1>
        </div>
        <button
          onClick={() => go("profile")}
          aria-label="Open your profile"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-2xl shadow-sm ring-1 ring-border"
        >
          {me.emoji}
        </button>
      </div>

      {/* Partner card */}
      <button
        onClick={() => go("chat")}
        className="block w-full rounded-[1.75rem] bg-card p-5 text-left shadow-lg shadow-primary/10 ring-1 ring-border transition-transform active:scale-[0.99]"
      >
        {partner ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-3xl">
                {partner.emoji}
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-1">
                <OnlineDot online={online} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-bold text-foreground">
                {partner.nickname}
              </p>
              <p className="truncate text-sm font-semibold text-muted-foreground">
                {partnerTyping
                  ? "typing…"
                  : online
                    ? "online right now"
                    : partner.mood
                      ? partner.mood
                      : "away for now"}
              </p>
            </div>
            <MessageCircleHeart className="h-6 w-6 shrink-0 text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-3xl">
              💌
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-bold text-foreground">
                Waiting for your bestie
              </p>
              <p className="text-sm text-muted-foreground">
                Share code{" "}
                <span className="font-display font-bold tracking-widest text-primary">
                  {space.code}
                </span>
              </p>
            </div>
          </div>
        )}
      </button>

      {/* Streak + song */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-[1.5rem] bg-primary/10 p-4">
          <Flame className="h-6 w-6 text-primary" />
          <p className="mt-2 font-display text-3xl font-extrabold text-foreground">
            {space.streak}
          </p>
          <p className="text-xs font-bold text-muted-foreground">day talk streak</p>
        </div>
        <button
          onClick={() => go("vibes")}
          className="rounded-[1.5rem] bg-accent/10 p-4 text-left transition-transform active:scale-[0.98]"
        >
          <Music2 className="h-6 w-6 text-accent" />
          {partnerStatus?.song_title ? (
            <>
              <p className="mt-2 truncate font-display text-base font-bold text-foreground">
                {partnerStatus.song_title}
              </p>
              <p className="truncate text-xs font-semibold text-muted-foreground">
                {partner?.nickname} · {timeAgo(partnerStatus.created_at)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-base font-bold text-foreground">
                No song yet
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                share what you&apos;re playing
              </p>
            </>
          )}
        </button>
      </div>

      {/* Upcoming day */}
      <button
        onClick={() => go("days")}
        className="mt-4 flex w-full items-center gap-4 rounded-[1.5rem] bg-card p-4 text-left shadow-sm ring-1 ring-border transition-transform active:scale-[0.99]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <CalendarHeart className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          {upcoming ? (
            <>
              <p className="font-display text-base font-bold text-foreground">
                {upcoming.label}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {upcoming.in === 0
                  ? "today! 🎉"
                  : upcoming.in === 1
                    ? "tomorrow"
                    : `in ${upcoming.in} days`}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-base font-bold text-foreground">
                Special days
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                add birthdays & anniversaries
              </p>
            </>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  )
}
