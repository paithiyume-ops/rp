"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Copy, Check, CalendarHeart, LogOut, Save } from "lucide-react"
import type { Ctx } from "../app-client"
import { leaveSpace, updateProfile } from "@/app/actions"
import EmojiPicker from "../emoji-picker"
import { SectionShell } from "./shared"

export default function ProfileSection({ ctx }: { ctx: Ctx }) {
  const router = useRouter()
  const { state, go, sync } = ctx
  const { me, partner, space } = state
  const [nickname, setNickname] = useState(me.nickname)
  const [emoji, setEmoji] = useState(me.emoji)
  const [mood, setMood] = useState(me.mood)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty = nickname !== me.nickname || emoji !== me.emoji || mood !== me.mood

  async function save() {
    if (busy || !dirty) return
    setBusy(true)
    try {
      await updateProfile({ nickname, emoji, mood })
      await sync()
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(space.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  async function leave() {
    await leaveSpace()
    router.replace("/")
  }

  return (
    <SectionShell title="Profile" subtitle="How your bestie sees you">
      <div className="flex flex-col items-center rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-secondary text-5xl">
          {emoji}
        </div>
        <p className="mt-3 font-display text-2xl font-extrabold text-foreground">
          {nickname || me.name}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">{me.name}</p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-bold text-foreground">Nickname</p>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-bold text-foreground">Mood note</p>
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="what's up with you"
            className="w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-bold text-foreground">Avatar</p>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        <button
          onClick={save}
          disabled={!dirty || busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-95 disabled:opacity-40"
        >
          {saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          {saved ? "Saved!" : busy ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Invite code */}
      <div className="mt-6 rounded-[1.5rem] bg-secondary/50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {partner ? "Your space" : "Invite your bestie"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-2xl font-extrabold tracking-[0.3em] text-primary">
            {space.code}
          </span>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-sm font-bold text-foreground ring-1 ring-border"
          >
            {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {!partner && (
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Share this code so your one best friend can join.
          </p>
        )}
      </div>

      <button
        onClick={() => go("days")}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-card px-5 py-4 text-left ring-1 ring-border transition-transform active:scale-[0.99]"
      >
        <CalendarHeart className="h-5 w-5 text-primary" />
        <span className="flex-1 font-bold text-foreground">Special days</span>
      </button>

      <button
        onClick={leave}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-bold text-primary transition-colors hover:bg-primary/10"
      >
        <LogOut className="h-5 w-5" />
        Sign out
      </button>
    </SectionShell>
  )
}
