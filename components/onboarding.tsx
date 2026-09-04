"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, ArrowRight, Copy, Check, Heart, Sparkles } from "lucide-react"
import EmojiPicker from "./emoji-picker"
import { createSpace, joinSpace } from "@/app/actions"

type Step = "splash" | "profile" | "code" | "done"
type Mode = "create" | "join"

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("splash")
  const [mode, setMode] = useState<Mode>("create")
  const [name, setName] = useState("")
  const [nickname, setNickname] = useState("")
  const [emoji, setEmoji] = useState("🦊")
  const [joinCode, setJoinCode] = useState("")
  const [createdCode, setCreatedCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  function start(m: Mode) {
    setMode(m)
    setError("")
    setStep("profile")
  }

  async function submitProfile() {
    setError("")
    if (!name.trim()) {
      setError("Please tell us your name.")
      return
    }
    setBusy(true)
    try {
      if (mode === "create") {
        const { code } = await createSpace({ name, nickname, emoji })
        setCreatedCode(code)
        setStep("done")
      } else {
        if (!joinCode.trim()) {
          setError("Enter the invite code your friend shared.")
          setBusy(false)
          return
        }
        await joinSpace({ name, nickname, emoji, code: joinCode })
        router.replace("/space")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(createdCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <DecorBlobs />
      <div className="relative w-full max-w-md">
        {step === "splash" && (
          <div className="animate-float-in text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/15">
              <Heart className="h-12 w-12 animate-heartbeat fill-primary text-primary" />
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground text-balance">
              Best Friendyyye
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-pretty text-muted-foreground leading-relaxed">
              A tiny private world for two. Talk in realtime, keep memories, trade
              songs and moods, and never miss each other&apos;s special days.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => start("create")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
              >
                <Sparkles className="h-5 w-5" />
                Start a new space
              </button>
              <button
                onClick={() => start("join")}
                className="rounded-2xl bg-card px-6 py-4 font-display text-lg font-bold text-foreground ring-2 ring-border transition-transform active:scale-95"
              >
                Join with a code
              </button>
            </div>
          </div>
        )}

        {step === "profile" && (
          <div className="animate-float-in rounded-[2rem] bg-card p-6 shadow-xl shadow-primary/10">
            <button
              onClick={() => setStep("splash")}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> back
            </button>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {mode === "create" ? "Make your space" : "Join your bestie"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a little avatar and how you want to be known.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Your name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
                />
              </Field>
              <Field label="Nickname (optional)">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="what they call you"
                  className="w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
                />
              </Field>
              <Field label="Your avatar">
                <EmojiPicker value={emoji} onChange={setEmoji} />
              </Field>
              {mode === "join" && (
                <Field label="Invite code">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-center font-display text-2xl font-bold tracking-[0.3em] text-foreground outline-none ring-primary/40 placeholder:tracking-normal placeholder:text-muted-foreground focus:ring-2"
                  />
                </Field>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                {error}
              </p>
            )}

            <button
              onClick={submitProfile}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95 disabled:opacity-60"
            >
              {busy ? "One sec..." : mode === "create" ? "Create space" : "Join space"}
              {!busy && <ArrowRight className="h-5 w-5" />}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="animate-pop rounded-[2rem] bg-card p-6 text-center shadow-xl shadow-primary/10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/15 text-4xl">
              {emoji}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Your space is ready!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Share this invite code with your one best friend. Only one other
              person can join.
            </p>

            <button
              onClick={copyCode}
              className="group mx-auto mt-5 flex items-center gap-3 rounded-2xl bg-muted px-6 py-4 transition-transform active:scale-95"
            >
              <span className="font-display text-3xl font-extrabold tracking-[0.35em] text-primary">
                {createdCode}
              </span>
              {copied ? (
                <Check className="h-5 w-5 text-accent" />
              ) : (
                <Copy className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {copied ? "Copied!" : "tap to copy"}
            </p>

            <button
              onClick={() => router.replace("/space")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
            >
              Enter your space <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-foreground">{label}</span>
      {children}
    </label>
  )
}

function DecorBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-accent/10 blur-2xl" />
    </div>
  )
}
