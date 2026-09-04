"use server"

import { getAdmin } from "@/lib/supabase/admin"
import {
  clearSession,
  getCurrentMember,
  setSessionMemberId,
} from "@/lib/session"
import type { GameRound, Member, SpaceState } from "@/lib/types"

const WYR_PROMPTS: string[][] = [
  ["Only text for a year", "Only call for a year"],
  ["Relive the day we met", "Skip to our next adventure"],
  ["Share a brain", "Share a bank account"],
  ["Always know when the other lies", "Never be able to lie to each other"],
  ["Go on a road trip", "Fly somewhere far"],
  ["Have matching tattoos", "Have matching playlists forever"],
  ["Be neighbors forever", "Travel the world together"],
  ["Swap talents for a week", "Swap wardrobes for a month"],
]

function makeCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let out = ""
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

type OnboardInput = {
  name: string
  nickname: string
  emoji: string
}

function clean(input: OnboardInput) {
  const name = input.name.trim().slice(0, 40)
  const nickname = (input.nickname.trim() || name).slice(0, 40)
  const emoji = input.emoji.trim().slice(0, 8) || "🦊"
  if (!name) throw new Error("Please tell us your name.")
  return { name, nickname, emoji }
}

export async function createSpace(input: OnboardInput) {
  const admin = getAdmin()
  const { name, nickname, emoji } = clean(input)

  let code = makeCode()
  // ensure unique code
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: existing } = await admin
      .from("spaces")
      .select("id")
      .eq("code", code)
      .maybeSingle()
    if (!existing) break
    code = makeCode()
  }

  const { data: space, error: spaceErr } = await admin
    .from("spaces")
    .insert({ code })
    .select("id, code")
    .single()
  if (spaceErr || !space) throw new Error("Could not create your space. Try again.")

  const { data: member, error: memberErr } = await admin
    .from("members")
    .insert({ space_id: space.id, name, nickname, emoji })
    .select("id")
    .single()
  if (memberErr || !member) throw new Error("Could not create your profile. Try again.")

  await setSessionMemberId(member.id as string)
  return { code: space.code as string }
}

export async function joinSpace(input: OnboardInput & { code: string }) {
  const admin = getAdmin()
  const { name, nickname, emoji } = clean(input)
  const code = input.code.trim().toUpperCase()
  if (code.length < 4) throw new Error("That invite code looks too short.")

  const { data: space } = await admin
    .from("spaces")
    .select("id")
    .eq("code", code)
    .maybeSingle()
  if (!space) throw new Error("No space found with that code.")

  const { count } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", space.id)
  if ((count ?? 0) >= 2) {
    throw new Error("This space is already full — it's just for two.")
  }

  const { data: member, error } = await admin
    .from("members")
    .insert({ space_id: space.id as string, name, nickname, emoji })
    .select("id")
    .single()
  if (error || !member) throw new Error("Could not join. Try again.")

  await setSessionMemberId(member.id as string)
  return { ok: true }
}

async function requireMember() {
  const me = await getCurrentMember()
  if (!me) throw new Error("Your session expired. Please sign back in.")
  return me
}

export async function getSpaceState(): Promise<SpaceState | null> {
  const me = await getCurrentMember()
  if (!me) return null
  const admin = getAdmin()

  const [spaceRes, membersRes, messagesRes, memoriesRes, statusesRes, daysRes, roundRes] =
    await Promise.all([
      admin.from("spaces").select("*").eq("id", me.space_id).single(),
      admin
        .from("members")
        .select("id, space_id, name, nickname, emoji, mood")
        .eq("space_id", me.space_id),
      admin
        .from("messages")
        .select("*")
        .eq("space_id", me.space_id)
        .order("created_at", { ascending: true })
        .limit(200),
      admin
        .from("memories")
        .select("*")
        .eq("space_id", me.space_id)
        .order("created_at", { ascending: false }),
      admin
        .from("statuses")
        .select("*")
        .eq("space_id", me.space_id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
      admin
        .from("special_days")
        .select("*")
        .eq("space_id", me.space_id)
        .order("day", { ascending: true }),
      admin
        .from("game_rounds")
        .select("*")
        .eq("space_id", me.space_id)
        .order("created_at", { ascending: false })
        .limit(1),
    ])

  const members = (membersRes.data ?? []) as Member[]
  const partner = members.find((m) => m.id !== me.id) ?? null

  return {
    space: spaceRes.data as SpaceState["space"],
    me,
    partner,
    messages: (messagesRes.data ?? []) as SpaceState["messages"],
    memories: (memoriesRes.data ?? []) as SpaceState["memories"],
    statuses: (statusesRes.data ?? []) as SpaceState["statuses"],
    specialDays: (daysRes.data ?? []) as SpaceState["specialDays"],
    round: ((roundRes.data ?? [])[0] as GameRound) ?? null,
  }
}

export async function heartbeat() {
  const me = await getCurrentMember()
  if (!me) return
  const admin = getAdmin()
  await admin
    .from("members")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", me.id)
}

export async function sendMessage(text: string) {
  const me = await requireMember()
  const body = text.trim().slice(0, 2000)
  if (!body) throw new Error("Message is empty.")
  const admin = getAdmin()

  const { data, error } = await admin
    .from("messages")
    .insert({ space_id: me.space_id, member_id: me.id, text: body })
    .select("*")
    .single()
  if (error) throw new Error("Message failed to send.")

  // daily talk streak
  const today = new Date().toISOString().slice(0, 10)
  const { data: space } = await admin
    .from("spaces")
    .select("last_active, streak")
    .eq("id", me.space_id)
    .single()
  if (space) {
    const last = String(space.last_active).slice(0, 10)
    if (last !== today) {
      const y = new Date()
      y.setDate(y.getDate() - 1)
      const yesterday = y.toISOString().slice(0, 10)
      const nextStreak = last === yesterday ? (space.streak as number) + 1 : 1
      await admin
        .from("spaces")
        .update({ last_active: today, streak: nextStreak })
        .eq("id", me.space_id)
    }
  }

  return data as SpaceState["messages"][number]
}

export async function addMemory(input: {
  emoji: string
  caption: string
  color: string
}) {
  const me = await requireMember()
  const caption = input.caption.trim().slice(0, 200)
  if (!caption) throw new Error("Add a little caption for this memory.")
  const admin = getAdmin()
  const { error } = await admin.from("memories").insert({
    space_id: me.space_id,
    member_id: me.id,
    emoji: input.emoji.trim().slice(0, 8) || "📸",
    caption,
    color: input.color || "coral",
  })
  if (error) throw new Error("Could not save memory.")
}

export async function togglePinMemory(id: string, pinned: boolean) {
  const me = await requireMember()
  const admin = getAdmin()
  await admin
    .from("memories")
    .update({ pinned })
    .eq("id", id)
    .eq("space_id", me.space_id)
}

export async function deleteMemory(id: string) {
  const me = await requireMember()
  const admin = getAdmin()
  await admin.from("memories").delete().eq("id", id).eq("space_id", me.space_id)
}

export async function setStatus(input: {
  text: string
  songTitle: string
  songArtist: string
}) {
  const me = await requireMember()
  const text = input.text.trim().slice(0, 120)
  const songTitle = input.songTitle.trim().slice(0, 120)
  const songArtist = input.songArtist.trim().slice(0, 120)
  if (!text && !songTitle) throw new Error("Share a mood or a song.")
  const admin = getAdmin()
  const { error } = await admin.from("statuses").insert({
    space_id: me.space_id,
    member_id: me.id,
    text,
    song_title: songTitle,
    song_artist: songArtist,
  })
  if (error) throw new Error("Could not update your vibe.")
}

export async function addSpecialDay(input: {
  label: string
  day: string
  icon: string
}) {
  const me = await requireMember()
  const label = input.label.trim().slice(0, 80)
  if (!label) throw new Error("Give this day a name.")
  if (!input.day) throw new Error("Pick a date.")
  const admin = getAdmin()
  const { error } = await admin.from("special_days").insert({
    space_id: me.space_id,
    label,
    day: input.day,
    icon: input.icon || "gift",
  })
  if (error) throw new Error("Could not add this day.")
}

export async function deleteSpecialDay(id: string) {
  const me = await requireMember()
  const admin = getAdmin()
  await admin.from("special_days").delete().eq("id", id).eq("space_id", me.space_id)
}

export async function newGameRound() {
  const me = await requireMember()
  const admin = getAdmin()
  const options = WYR_PROMPTS[Math.floor(Math.random() * WYR_PROMPTS.length)]
  const { data, error } = await admin
    .from("game_rounds")
    .insert({
      space_id: me.space_id,
      game: "wyr",
      prompt: "Would you rather...",
      options,
      picks: {},
    })
    .select("*")
    .single()
  if (error) throw new Error("Could not start a round.")
  return data as GameRound
}

export async function pickOption(roundId: string, optionIndex: number) {
  const me = await requireMember()
  const admin = getAdmin()
  const { data: round } = await admin
    .from("game_rounds")
    .select("picks, space_id")
    .eq("id", roundId)
    .eq("space_id", me.space_id)
    .single()
  if (!round) throw new Error("Round not found.")
  const picks = { ...((round.picks as Record<string, number>) ?? {}) }
  picks[me.id] = optionIndex
  await admin
    .from("game_rounds")
    .update({ picks })
    .eq("id", roundId)
    .eq("space_id", me.space_id)
}

export async function updateProfile(input: {
  nickname: string
  emoji: string
  mood: string
}) {
  const me = await requireMember()
  const admin = getAdmin()
  await admin
    .from("members")
    .update({
      nickname: input.nickname.trim().slice(0, 40) || me.name,
      emoji: input.emoji.trim().slice(0, 8) || "🦊",
      mood: input.mood.trim().slice(0, 80),
    })
    .eq("id", me.id)
}

export async function leaveSpace() {
  await clearSession()
}
