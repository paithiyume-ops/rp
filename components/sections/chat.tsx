"use client"

import { useEffect, useRef, useState } from "react"
import { Send } from "lucide-react"
import type { Ctx } from "../app-client"
import { sendMessage } from "@/app/actions"
import { OnlineDot, clockTime } from "./shared"

export default function ChatSection({ ctx }: { ctx: Ctx }) {
  const { state, online, partnerTyping, pushMessage, notifyTyping } = ctx
  const { me, partner, messages } = state
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastTyped = useRef(0)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length, partnerTyping])

  async function submit() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setText("")
    try {
      const row = await sendMessage(body)
      pushMessage(row)
    } catch {
      setText(body)
    } finally {
      setSending(false)
    }
  }

  function onChange(v: string) {
    setText(v)
    const now = Date.now()
    if (now - lastTyped.current > 1200) {
      lastTyped.current = now
      notifyTyping()
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/80 px-5 py-3 backdrop-blur">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-2xl">
          {partner?.emoji ?? "💌"}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold leading-tight text-foreground">
            {partner?.nickname ?? "Your bestie"}
          </p>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <OnlineDot online={online} />
            {partnerTyping ? "typing…" : online ? "online" : "offline"}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-3xl">
              👋
            </div>
            <p className="font-display text-lg font-bold text-foreground">Say hi!</p>
            <p className="text-sm text-muted-foreground">
              This chat is just for the two of you.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.member_id === me.id
          const prev = messages[i - 1]
          const grouped = prev && prev.member_id === m.member_id
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"} ${
                grouped ? "mt-0.5" : "mt-2.5"
              }`}
            >
              <div
                className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                  mine
                    ? "rounded-br-lg bg-primary text-primary-foreground"
                    : "rounded-bl-lg bg-card text-card-foreground ring-1 ring-border"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p
                  className={`mt-1 text-[10px] font-semibold ${
                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {clockTime(m.created_at)}
                </p>
              </div>
            </div>
          )
        })}

        {partnerTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-3xl rounded-bl-lg bg-card px-4 py-3 ring-1 ring-border">
              <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/90 px-4 pb-24 pt-3 backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                void submit()
              }
            }}
            rows={1}
            placeholder={partner ? "Write something sweet…" : "Waiting for your bestie…"}
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            onClick={() => void submit()}
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-90 disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}
