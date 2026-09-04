"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { Home, MessageCircle, Camera, Music, Gamepad2 } from "lucide-react"
import type { Message, SpaceState } from "@/lib/types"
import { getSpaceState, heartbeat } from "@/app/actions"
import { getRealtimeClient } from "@/lib/supabase/browser"
import HomeSection from "./sections/home"
import ChatSection from "./sections/chat"
import MemoriesSection from "./sections/memories"
import VibesSection from "./sections/vibes"
import GamesSection from "./sections/games"
import DaysSection from "./sections/days"
import ProfileSection from "./sections/profile"

export type Tab = "home" | "chat" | "memories" | "vibes" | "games" | "days" | "profile"

export type Ctx = {
  state: SpaceState
  online: boolean
  partnerTyping: boolean
  go: (tab: Tab) => void
  refresh: () => Promise<void>
  sync: () => Promise<void>
  pushMessage: (msg: Message) => void
  notifyTyping: () => void
}

const NAV: { tab: Tab; label: string; icon: typeof Home }[] = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "chat", label: "Chat", icon: MessageCircle },
  { tab: "memories", label: "Memories", icon: Camera },
  { tab: "vibes", label: "Vibes", icon: Music },
  { tab: "games", label: "Play", icon: Gamepad2 },
]

export default function AppClient({ initial }: { initial: SpaceState }) {
  const [state, setState] = useState<SpaceState>(initial)
  const [tab, setTab] = useState<Tab>("home")
  const [online, setOnline] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const meId = state.me.id
  const spaceId = state.space.id

  const refresh = useCallback(async () => {
    const next = await getSpaceState()
    if (next) setState(next)
  }, [])

  // Realtime channel: presence (online), broadcast (message / sync / typing)
  useEffect(() => {
    const client = getRealtimeClient()
    const channel = client.channel(`space:${spaceId}`, {
      config: { presence: { key: meId } },
    })
    channelRef.current = channel

    channel
      .on("presence", { event: "sync" }, () => {
        const stateMap = channel.presenceState()
        const keys = Object.keys(stateMap)
        setOnline(keys.some((k) => k !== meId))
      })
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const msg = payload as Message
        if (msg.member_id === meId) return
        setState((prev) =>
          prev.messages.some((m) => m.id === msg.id)
            ? prev
            : { ...prev, messages: [...prev.messages, msg] },
        )
      })
      .on("broadcast", { event: "sync" }, () => {
        void refresh()
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if ((payload as { id: string }).id === meId) return
        setPartnerTyping(true)
        if (typingTimeout.current) clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setPartnerTyping(false), 2500)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ id: meId, at: Date.now() })
        }
      })

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      client.removeChannel(channel)
      channelRef.current = null
    }
  }, [spaceId, meId, refresh])

  // Presence heartbeat so last_seen stays fresh
  useEffect(() => {
    void heartbeat()
    const id = setInterval(() => void heartbeat(), 45_000)
    return () => clearInterval(id)
  }, [])

  const sync = useCallback(async () => {
    await refresh()
    channelRef.current?.send({ type: "broadcast", event: "sync", payload: {} })
  }, [refresh])

  const pushMessage = useCallback((msg: Message) => {
    setState((prev) =>
      prev.messages.some((m) => m.id === msg.id)
        ? prev
        : { ...prev, messages: [...prev.messages, msg] },
    )
    channelRef.current?.send({ type: "broadcast", event: "message", payload: msg })
  }, [])

  const notifyTyping = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { id: meId },
    })
  }, [meId])

  const ctx: Ctx = useMemo(
    () => ({ state, online, partnerTyping, go: setTab, refresh, sync, pushMessage, notifyTyping }),
    [state, online, partnerTyping, refresh, sync, pushMessage, notifyTyping],
  )

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 pb-24">
        {tab === "home" && <HomeSection ctx={ctx} />}
        {tab === "chat" && <ChatSection ctx={ctx} />}
        {tab === "memories" && <MemoriesSection ctx={ctx} />}
        {tab === "vibes" && <VibesSection ctx={ctx} />}
        {tab === "games" && <GamesSection ctx={ctx} />}
        {tab === "days" && <DaysSection ctx={ctx} />}
        {tab === "profile" && <ProfileSection ctx={ctx} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-4">
        <div className="flex items-center justify-around rounded-3xl border border-border bg-card/90 px-2 py-2 shadow-lg shadow-primary/10 backdrop-blur">
          {NAV.map(({ tab: t, label, icon: Icon }) => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                    active ? "scale-105 bg-primary/15" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2} />
                </span>
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
