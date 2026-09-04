"use client"

import { useState } from "react"
import { Dice5, RefreshCw, Check } from "lucide-react"
import type { Ctx } from "../app-client"
import { newGameRound, pickOption } from "@/app/actions"
import { SectionShell } from "./shared"

export default function GamesSection({ ctx }: { ctx: Ctx }) {
  const { state, sync } = ctx
  const { me, partner, round } = state
  const [busy, setBusy] = useState(false)

  const myPick = round?.picks?.[me.id]
  const theirPick = partner ? round?.picks?.[partner.id] : undefined
  const bothPicked = myPick !== undefined && theirPick !== undefined
  const matched = bothPicked && myPick === theirPick

  async function startRound() {
    if (busy) return
    setBusy(true)
    try {
      await newGameRound()
      await sync()
    } finally {
      setBusy(false)
    }
  }

  async function choose(i: number) {
    if (myPick !== undefined || !round || busy) return
    setBusy(true)
    try {
      await pickOption(round.id, i)
      await sync()
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell title="Play" subtitle="Would you rather… together">
      {!round ? (
        <div className="mt-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-4xl">
            🎲
          </div>
          <p className="font-display text-xl font-bold text-foreground">
            Ready to play?
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Start a round of Would You Rather and see if your answers match.
          </p>
          <button
            onClick={startRound}
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95 disabled:opacity-60"
          >
            <Dice5 className="h-5 w-5" />
            Start a round
          </button>
        </div>
      ) : (
        <div>
          <p className="text-center font-display text-xl font-bold text-foreground">
            Would you rather…
          </p>

          <div className="mt-5 space-y-4">
            {round.options.map((opt, i) => {
              const chosenByMe = myPick === i
              const chosenByThem = theirPick === i
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={myPick !== undefined}
                  className={`relative w-full overflow-hidden rounded-[1.5rem] p-5 text-left transition-all active:scale-[0.99] ${
                    chosenByMe
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-card text-foreground ring-1 ring-border"
                  } ${myPick === undefined ? "hover:ring-2 hover:ring-primary/50" : ""}`}
                >
                  <span className="font-display text-lg font-bold leading-snug text-pretty">
                    {opt}
                  </span>
                  <div className="mt-3 flex items-center gap-2">
                    {chosenByMe && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2.5 py-1 text-xs font-bold">
                        <Check className="h-3.5 w-3.5" /> you
                      </span>
                    )}
                    {bothPicked && chosenByThem && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          chosenByMe
                            ? "bg-primary-foreground/20"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        {partner?.emoji} {partner?.nickname}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-muted px-4 py-3 text-center">
            {myPick === undefined ? (
              <p className="text-sm font-semibold text-muted-foreground">
                Pick your answer!
              </p>
            ) : !bothPicked ? (
              <p className="text-sm font-semibold text-muted-foreground">
                Waiting for {partner?.nickname ?? "your bestie"} to pick…
              </p>
            ) : matched ? (
              <p className="font-display font-bold text-primary">
                You matched! 💞
              </p>
            ) : (
              <p className="font-display font-bold text-accent">
                Opposites attract 😆
              </p>
            )}
          </div>

          <button
            onClick={startRound}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-card px-6 py-3.5 font-display text-base font-bold text-foreground ring-1 ring-border transition-transform active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            New question
          </button>
        </div>
      )}
    </SectionShell>
  )
}
