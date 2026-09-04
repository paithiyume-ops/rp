"use client"

import { useState } from "react"
import { Music, Sparkles } from "lucide-react"
import type { Ctx } from "../app-client"
import { setStatus } from "@/app/actions"
import { SectionShell, timeAgo } from "./shared"

const MOODS = ["😊", "🥰", "😴", "😌", "🤪", "😭", "🔥", "🫠", "✨", "😎"]

export default function VibesSection({ ctx }: { ctx: Ctx }) {
  const { state, sync } = ctx
  const { me, partner, statuses } = state
  const [mood, setMood] = useState("")
  const [song, setSong] = useState("")
  const [artist, setArtist] = useState("")
  const [busy, setBusy] = useState(false)

  const latest = (memberId?: string) =>
    memberId ? statuses.find((s) => s.member_id === memberId) : undefined
  const mine = latest(me.id)
  const theirs = latest(partner?.id)

  async function share() {
    if ((!mood.trim() && !song.trim()) || busy) return
    setBusy(true)
    try {
      await setStatus({ text: mood, songTitle: song, songArtist: artist })
      await sync()
      setMood("")
      setSong("")
      setArtist("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell title="Vibes" subtitle="What you're feeling & hearing right now">
      {/* Partner vibe */}
      <div className="rounded-[1.75rem] bg-accent/10 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-accent">
          {partner ? `${partner.nickname}'s vibe` : "Their vibe"}
        </p>
        {theirs ? (
          <div className="animate-pop">
            {theirs.text && (
              <p className="font-display text-2xl font-bold text-foreground">
                {theirs.text}
              </p>
            )}
            {theirs.song_title && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
                  <Music className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">{theirs.song_title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {theirs.song_artist || "unknown artist"}
                  </p>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              {timeAgo(theirs.created_at)}
            </p>
          </div>
        ) : (
          <p className="text-sm font-semibold text-muted-foreground">
            Nothing shared yet — send yours first!
          </p>
        )}
      </div>

      {/* My current vibe */}
      {mine && (
        <div className="mt-4 rounded-2xl bg-secondary/60 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Your current vibe
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {mine.text} {mine.song_title && `· ${mine.song_title}`}
          </p>
        </div>
      )}

      {/* Composer */}
      <div className="mt-5 rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border">
        <p className="mb-3 font-display text-lg font-bold text-foreground">
          Share your vibe
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood((v) => (v === m ? "" : m))}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-all ${
                mood === m ? "scale-105 bg-primary/15 ring-2 ring-primary" : "bg-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="or type a mood…"
          className="mb-3 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
        />
        <input
          value={song}
          onChange={(e) => setSong(e.target.value)}
          placeholder="song you're playing"
          className="mb-3 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="artist (optional)"
          className="mb-4 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
        />
        <button
          onClick={share}
          disabled={busy || (!mood.trim() && !song.trim())}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" />
          {busy ? "Sharing…" : "Share vibe"}
        </button>
      </div>
    </SectionShell>
  )
}
