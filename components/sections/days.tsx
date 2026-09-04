"use client"

import { useState } from "react"
import { Plus, Trash2, X, Cake, Gift, Heart, Star, Plane } from "lucide-react"
import type { Ctx } from "../app-client"
import { addSpecialDay, deleteSpecialDay } from "@/app/actions"
import { SectionShell } from "./shared"

const ICONS: Record<string, typeof Gift> = {
  gift: Gift,
  cake: Cake,
  heart: Heart,
  star: Star,
  plane: Plane,
}
const ICON_KEYS = Object.keys(ICONS)

function daysUntil(day: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const [, m, d] = day.split("-").map(Number)
  const thisYear = new Date(now.getFullYear(), m - 1, d)
  thisYear.setHours(0, 0, 0, 0)
  const next = thisYear < now ? new Date(now.getFullYear() + 1, m - 1, d) : thisYear
  return Math.round((next.getTime() - now.getTime()) / 86400000)
}

export default function DaysSection({ ctx }: { ctx: Ctx }) {
  const { state, sync } = ctx
  const { specialDays } = state
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [day, setDay] = useState("")
  const [icon, setIcon] = useState("gift")
  const [busy, setBusy] = useState(false)

  const sorted = [...specialDays]
    .map((d) => ({ ...d, in: daysUntil(d.day) }))
    .sort((a, b) => a.in - b.in)

  async function save() {
    if (!label.trim() || !day || busy) return
    setBusy(true)
    try {
      await addSpecialDay({ label, day, icon })
      await sync()
      setLabel("")
      setDay("")
      setIcon("gift")
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell
      title="Special Days"
      subtitle="Never miss what matters"
      right={
        <button
          onClick={() => setOpen(true)}
          aria-label="Add special day"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-90"
        >
          <Plus className="h-6 w-6" />
        </button>
      }
    >
      {sorted.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-3xl">
            🎂
          </div>
          <p className="font-display text-lg font-bold text-foreground">No days yet</p>
          <p className="text-sm text-muted-foreground">
            Add birthdays, anniversaries & more.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((d) => {
            const Icon = ICONS[d.icon] ?? Gift
            const soon = d.in <= 7
            return (
              <div
                key={d.id}
                className={`group flex items-center gap-4 rounded-[1.5rem] p-4 ${
                  soon ? "bg-primary/10" : "bg-card ring-1 ring-border"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    soon ? "bg-primary/15" : "bg-secondary"
                  }`}
                >
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-base font-bold text-foreground">
                    {d.label}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {new Date(d.day).toLocaleDateString([], {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-extrabold text-primary">
                    {d.in === 0 ? "🎉" : d.in}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    {d.in === 0 ? "today" : d.in === 1 ? "day" : "days"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await deleteSpecialDay(d.id)
                    await sync()
                  }}
                  aria-label={`Delete ${d.label}`}
                  className="rounded-lg p-1 text-muted-foreground/50 transition-colors hover:text-primary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm">
          <div className="animate-float-in w-full max-w-md rounded-[2rem] bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">
                Add a special day
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Maya's birthday"
              className="mb-3 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
            />
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="mb-4 w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 focus:ring-2"
            />

            <div className="mb-5 flex gap-2">
              {ICON_KEYS.map((k) => {
                const Icon = ICONS[k]
                return (
                  <button
                    key={k}
                    onClick={() => setIcon(k)}
                    aria-label={k}
                    className={`flex h-12 flex-1 items-center justify-center rounded-xl transition-all ${
                      icon === k ? "bg-primary/15 ring-2 ring-primary" : "bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </button>
                )
              })}
            </div>

            <button
              onClick={save}
              disabled={!label.trim() || !day || busy}
              className="w-full rounded-2xl bg-primary px-6 py-3.5 font-display text-lg font-bold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-95 disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add day"}
            </button>
          </div>
        </div>
      )}
    </SectionShell>
  )
}
