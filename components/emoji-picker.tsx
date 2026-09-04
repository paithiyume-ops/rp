"use client"

const AVATARS = ["🦊", "🐰", "🐼", "🐨", "🦄", "🐥", "🐸", "🐙", "🦋", "🌸", "⭐️", "🍓"]

export default function EmojiPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map((emoji) => {
        const active = emoji === value
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            aria-label={`Choose ${emoji} avatar`}
            aria-pressed={active}
            className={`flex aspect-square items-center justify-center rounded-2xl text-2xl transition-all ${
              active
                ? "scale-105 bg-primary/15 ring-2 ring-primary"
                : "bg-muted hover:bg-secondary"
            }`}
          >
            <span aria-hidden>{emoji}</span>
          </button>
        )
      })}
    </div>
  )
}
