"use client"

import { useState } from "react"
import { Plus, Pin, PinOff, Trash2, X } from "lucide-react"
import type { Ctx } from "../app-client"
import { addMemory, deleteMemory, togglePinMemory } from "@/app/actions"
import { SectionShell } from "./shared"

const COLORS: { key: string; bg: string; label: string }[] = [
  { key: "coral", bg: "bg-primary/12", label: "coral" },
  { key: "lavender", bg: "bg-accent/12", label: "lavender" },
  { key: "peach", bg: "bg-secondary", label: "peach" },
]
const EMOJIS = ["📸", "🌈", "🍦", "🎡", "🌊", "🎂", "🎬", "🌻", "✈️", "🎶", "🐾", "💫"]

function colorBg(key: string) {
  return COLORS.find((c) => c.key === key)?.bg ?? "bg-primary/12"
}

export default function MemoriesSection({ ctx }: { ctx: Ctx }) {
  const { state, sync } = ctx
  const { memories, me } = state
  const [open, setOpen] = useState(false)
  const [emoji, setEmoji] = useState("📸")
  const [caption, setCaption] = useState("")
  const [color, setColor] = useState("coral")
  const [busy, setBusy] = useState(false)

  const sorted = [...memories].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) ||
      +new Date(b.created_at) - +new Date(a.created_at),
  )

  async function save() {
    if (!caption.trim() || busy) return
    setBusy(true)
    try {
      await addMemory({ emoji, caption, color })
      await sync()
      setCaption("")
      setEmoji("📸")
      setColor("coral")
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell
      title="Memories"
      subtitle="Little moments, kept together"
      right={
        <button
          onClick={() => setOpen(true)}
          aria-label="Add memory"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-90"
        >
          <Plus className="h-6 w-6" />
        </button>
      }
    >
      {sorted.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-3xl">
            📷
          </div>
          <p className="font-display text-lg font-bold text-foreground">No memories yet</p>
          <p className="text-sm text-muted-foreground">
            Tap + to keep your first moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((m) => (
            <div
              key={m.id}
              className={`animate-pop flex flex-col justify-between rounded-[1.5rem] p-4 ${colorBg(
                m.color,
              )}`}
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="text-3xl" aria-hidden>
                  {m.emoji}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      await togglePinMemory(m.id, !m.pinned)
                      await sync()
                    }}
                    aria-label={m.pinned ? "Unpin" : "Pin"}
                    className="rounded-lg p-1 text-foreground/60 hover:text-foreground"
                  >
                    {m.pinned ? (
                      <Pin className="h-4 w-4 fill-primary text-primary" />
                    ) : (
                      <PinOff className="h-4 w-4" />
                    )}
                  </button>
                  {m.member_id === me.id && (
                    <button
                      onClick={async () => {
                        await deleteMemory(m.id)
                        await sync()
                      }}
                      aria-label="Delete memory"
                      className="rounded-lg p-1 text-foreground/60 hover:text-primary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold leading-snug text-foreground text-pretty">
                {m.caption}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-foreground/50">
                {new Date(m.created_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm">
          <div className="animate-float-in w-full max-w-md rounded-[2rem] bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">
                New memory
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-6 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`flex aspect-square items-center justify-center rounded-xl text-xl transition-all ${
                    e === emoji ? "scale-105 bg-primary/15 ring-2 ring-primary" : "bg-muted"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="that time we…"
              className="mb-4 w-full resize-none rounded-2xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
            />

            <div className="mb-5 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  aria-label={c.label}
                  className={`h-10 flex-1 rounded-xl ${c.bg} ${
                    color === c.key ? "ring-2 ring-foreground/40" : ""
                  }`}
                />
              ))}
            </div>

            <button
              onClick={save}
              disabled={!caption.trim() || busy}
              className="w-full rounded-2xl bg-primary px-6 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-95 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Keep this memory"}
            </button>
          </div>
        </div>
      )}
    </SectionShell>
  )
}
