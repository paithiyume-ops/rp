import "server-only"
import { cookies } from "next/headers"
import { getAdmin } from "./supabase/admin"

const COOKIE = "bff_member"

export type SessionMember = {
  id: string
  space_id: string
  name: string
  nickname: string
  emoji: string
  mood: string
}

export async function setSessionMemberId(memberId: string) {
  const store = await cookies()
  store.set(COOKIE, memberId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getSessionMemberId() {
  const store = await cookies()
  return store.get(COOKIE)?.value ?? null
}

// Loads the current member from the httpOnly cookie. Returns null if missing/invalid.
export async function getCurrentMember(): Promise<SessionMember | null> {
  const id = await getSessionMemberId()
  if (!id) return null
  const admin = getAdmin()
  const { data } = await admin
    .from("members")
    .select("id, space_id, name, nickname, emoji, mood")
    .eq("id", id)
    .maybeSingle()
  return (data as SessionMember | null) ?? null
}
