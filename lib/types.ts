export type Member = {
  id: string
  space_id: string
  name: string
  nickname: string
  emoji: string
  mood: string
}

export type Message = {
  id: string
  space_id: string
  member_id: string
  text: string
  created_at: string
}

export type Memory = {
  id: string
  space_id: string
  member_id: string
  emoji: string
  caption: string
  color: string
  pinned: boolean
  created_at: string
}

export type Status = {
  id: string
  space_id: string
  member_id: string
  text: string
  song_title: string
  song_artist: string
  created_at: string
  expires_at: string
}

export type SpecialDay = {
  id: string
  space_id: string
  label: string
  day: string
  icon: string
  created_at: string
}

export type GameRound = {
  id: string
  space_id: string
  game: string
  prompt: string
  options: string[]
  picks: Record<string, number>
  created_at: string
}

export type Space = {
  id: string
  code: string
  streak: number
  last_active: string
  created_at: string
}

export type SpaceState = {
  space: Space
  me: Member
  partner: Member | null
  messages: Message[]
  memories: Memory[]
  statuses: Status[]
  specialDays: SpecialDay[]
  round: GameRound | null
}
